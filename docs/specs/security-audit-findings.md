# LRS Security Audit — 2026-07-18

## 1. Scope, method, and deployment assumption

**Read-only** static audit of the implemented MVP surfaces: gateway (`src/lrs/gateway/*`),
config, seeder, catalog, CLI/bootstrap, the three Dash dashboards (`dashboards/`), and the
deploy artifacts (`deploy/docker-compose.yml`, `Dockerfile`, `.env.example`, `scripts/smoke.sh`).
Judged against the authoritative trust model in design §5.2 / §7.1–§7.2 and spec §12.2–§12.3.

**Deployment judged against:** the intended MVP target — a single-node **laptop / loopback demo**.
Findings are rated for that target and annotated with the deployment change that would escalate
them. Nothing here was executed; every finding cites `file:line`.

Deferred-by-design components (identity service, per-district HMAC vault, processor, summarizer,
RBAC/OIDC/TenantContext, threshold suppression) are **not** filed as findings — see §6. The seam
question for each is answered in §5.

## 2. Findings triage table

| ID | Severity | Component | Title | file:line |
|----|----------|-----------|-------|-----------|
| H-1 | High | Dashboards | Werkzeug debugger shipped enabled (`debug=True`) → source/RCE exposure | `dashboards/teacher_app.py:458` |
| H-2 | High | Deploy | Datastores published on `0.0.0.0` with weak default creds → LAN-reachable PII & event log | `deploy/docker-compose.yml:116` |
| M-1 | Medium | Gateway | Unbounded request body / batch size → memory & CPU DoS | `src/lrs/gateway/app.py:133` |
| M-2 | Medium | Config | Guessable default credentials in code fallbacks (`neo4j`/`neo4j`) | `src/lrs/config.py:47` |
| L-1 | Low | Gateway/Tenancy | Cross-district statement claim never flagged (processor seam) | `src/lrs/gateway/app.py:173` |
| L-2 | Low | Gateway | Attacker-controlled strings logged unescaped (log injection) | `src/lrs/gateway/app.py:145` |
| L-3 | Low | Deploy | Secrets in env URLs / Redis `--requirepass` argv → process-list & log exposure | `deploy/docker-compose.yml:28` |
| L-4 | Low | Deploy | Mutable image tags + runtime APOC plugin fetch → supply-chain drift | `deploy/docker-compose.yml:113` |
| I-1 | Info | Gateway | Non-constant-time dev-token comparison (prod seam) | `src/lrs/gateway/app.py:67` |
| I-2 | Info | Gateway | `/health` discloses producer `queue_depth` unauthenticated | `src/lrs/gateway/app.py:106` |
| I-3 | Info | Catalog | Unbounded parse of untrusted sibling-repo CSV/JSON | `src/lrs/catalog.py:236` |

## 3. Findings (detailed)

### H-1 · High · Dashboards · Werkzeug debugger shipped enabled · CWE-489
**Evidence** — all three dashboards:
```python
dashboards/teacher_app.py:458  app.run(debug=True, port=8052)
dashboards/admin_app.py:264    app.run(debug=True, port=8051)
dashboards/author_app.py:382   app.run(debug=True, port=8053)
```
**Impact** (PII protection, property 2). `debug=True` enables the Werkzeug interactive debugger
and renders full tracebacks — including local variables and Cypher — to the browser. These
dashboards connect with full Neo4j credentials and return per-student rows (`student_key`, names,
mastery) with no auth layer, so any traceback is a PII/creds disclosure. If the debugger console
is reachable and its PIN is derivable/disabled, it is remote code execution.
**Exploit sketch.** On the intended loopback deploy: local user or any process opens
`http://127.0.0.1:8052`, triggers an exception (malformed picker state), reads source + data from
the traceback. If an operator sets `host="0.0.0.0"` (common for "let me view it from my phone"),
the debugger is LAN-exposed → RCE via the console.
**Fix.** `debug=False` in all three `app.run(...)`; gate any debug on an env flag that defaults
off. This is shipped misconfiguration, **not** part of the deferred auth work.
**Confidence.** Confirmed.

### H-2 · High · Deploy · Datastores on `0.0.0.0` with weak default creds · CWE-1188/CWE-798
**Evidence.**
```yaml
deploy/docker-compose.yml:116  ports: ["7474:7474", "7687:7687"]   # neo4j (also 8123/9000 CH, 6379 redis, 9092 redpanda)
.env.example:8                 NEO4J_PASSWORD=change-me-neo4j
```
**Impact** (property 2 & 4). Docker `ports:` with no host IP binds to `0.0.0.0`, so Neo4j (student
PII graph), ClickHouse (raw event log), and Redis are reachable from the LAN. Paired with the
`change-me-*` example values and the code fallbacks in M-2, an operator who copies `.env.example`
verbatim or forgets to fill it exposes the full learner dataset to anyone on the network.
**Exploit sketch.** `cypher-shell -a bolt://<laptop-ip>:7687 -u neo4j -p change-me-neo4j` from the
same coffee-shop Wi-Fi dumps every `Student`/`ConceptMastery` node.
**Fix.** Bind published ports to loopback (`"127.0.0.1:7687:7687"`, etc.) for the demo profile;
require non-default secrets (fail fast if a password still equals its `change-me-*` value).
The vault-db does this correctly (no host port) — apply the same posture to the analytics stores.
**Confidence.** Confirmed (static); LAN reachability assumes default Docker publishing.

### M-1 · Medium · Gateway · Unbounded request body → DoS · CWE-400/CWE-770
**Evidence.**
```python
src/lrs/gateway/app.py:133  raw = await request.body()
src/lrs/gateway/app.py:135  body = json.loads(raw)
```
**Impact** (property 3, availability — spec targets 99.95% ingest). No `Content-Length` cap and no
max batch length: the whole body is buffered into memory then fully parsed and every statement is
validated into an in-memory `violations` list. A single large or deeply-nested POST can OOM or
CPU-starve the gateway, dropping a classroom's telemetry.
**Exploit sketch.** Authenticated holder of any ingest token POSTs a multi-hundred-MB JSON array
(or a deeply nested object) → gateway RSS spikes / event loop stalls. In prod, ingest tokens are
distributed to every textbook, widening the attacker set (→ High there).
**Fix.** Enforce a max body size (reverse proxy limit + explicit `Content-Length` check) and a max
statements-per-batch before `json.loads`; reject oversize with 413.
**Confidence.** Confirmed (no limit present in code or compose).

### M-2 · Medium · Config · Guessable default credentials · CWE-1392
**Evidence.**
```python
src/lrs/config.py:47              neo4j_password: str = Field(default="neo4j", ...)
dashboards/lrsdash/db.py:45-46    password = os.environ.get("NEO4J_PASSWORD", "neo4j")
```
**Impact** (property 4). When the env/`.env` is absent or partial, the stack and dashboards
silently run with `neo4j`/`neo4j` — the enabler for H-2. **Positive contrast:** the ingest token
`dev_ingest_token` defaults to `None` (`config.py:38`), so auth fails *closed* — replicate that
pattern here.
**Fix.** Default secret-bearing fields to `None` and fail fast with a clear message when unset;
never embed a working password as a default.
**Confidence.** Confirmed.

### L-1 · Low · Tenancy · Cross-district statement claim not flagged · CWE-284 (seam)
**Evidence.** The gateway keys and envelopes on the token's district only; the statement body is
stored verbatim and never checked for a conflicting district/actor claim:
```python
src/lrs/gateway/app.py:173  actor_identity = raw_actor_identity(statement["actor"])
src/lrs/gateway/app.py:176  messages.append((key, Envelope(district_id, stored_at, statement).to_json()))
```
**Impact** (property 1). Benign *today* — `district_id` is authoritative from the token
(`envelope.py:33-35`, body cannot override it) and no consumer reads the actor's claimed domain
yet. Design §7.1 nonetheless requires a mismatching claim be "rewritten to the token's district
and flagged." Risk is at the **processor seam** (§5): pseudonymization must derive `student_key`
from the *token's* district salt, never from `actor.account.homePage`, or a producer can smuggle a
foreign district's namespace into the log.
**Fix.** When the processor lands, assert token-district == any claimed district (flag + rewrite);
add a gateway-side flag now if cheap.
**Confidence.** Confirmed (no such check exists); impact is seam-conditional.

### L-2 · Low · Gateway · Unescaped attacker input in logs · CWE-117
**Evidence.** Validation messages embed caller-supplied `iri`/`gid`/`id` (e.g.
`validation.py:131-135`, `:343`) and are logged / returned:
```python
src/lrs/gateway/app.py:145  log.info("rejected batch of %d: %d violations", size, len(violations))
```
Plus `log.exception("produce failed")` on paths carrying request-derived context. The **JSON
response** is safe (JSONResponse escapes; values are `!r`-quoted), but log sinks receive
raw/`repr`'d attacker strings → forged or newline-injected log lines.
**Impact.** Low: log forgery / monitoring confusion; no direct data exposure.
**Fix.** Log via structured fields, not interpolation of raw values; strip control chars.
**Confidence.** Confirmed.

### L-3 · Low · Deploy · Secrets in URLs / argv · CWE-214/CWE-532
**Evidence.**
```yaml
deploy/docker-compose.yml:28   CLICKHOUSE_URL: http://lrs:${CLICKHOUSE_PASSWORD}@clickhouse:8123/lrs
deploy/docker-compose.yml:149  command: ["redis-server", ..., "--requirepass", "${REDIS_PASSWORD}"]
```
Also `VAULT_DB_DSN` (`:169`, `:187`). Passwords in connection URLs and on the command line are
visible via `docker inspect`, `ps`, and frequently land in tracebacks/logs.
**Fix.** Prefer file/secret-mounted credentials; for Redis use `requirepass` via a config file or
`REDISCLI_AUTH`-style env consumed at runtime, not argv.
**Confidence.** Confirmed.

### L-4 · Low · Deploy · Mutable image tags + runtime plugin fetch · CWE-1104
**Evidence.**
```yaml
deploy/docker-compose.yml:113  NEO4J_PLUGINS: '["apoc"]'          # runtime download
deploy/docker-compose.yml:88   image: clickhouse/clickhouse-server:24.8   # also redis:7-alpine, neo4j:5.26-community, redpanda:v24.3.6
```
`Dockerfile:33` also pulls `ghcr.io/astral-sh/uv:0.5` (mutable minor). Tags are mutable → image
drift; APOC is fetched over the network at start → integrity + availability dependency.
**Fix.** Pin images by digest (`@sha256:…`); bake APOC into the image or vendor+checksum it.
**Confidence.** Confirmed.

### I-1 · Info · Gateway · Non-constant-time token compare
`src/lrs/gateway/app.py:67  if token == cfg.dev_ingest_token:` — plaintext `==`. Negligible for a
single laptop dev token; the prod seam (HMAC verify) **must** use `hmac.compare_digest`. Seam note.

### I-2 · Info · Gateway · `/health` leaks `queue_depth`
`src/lrs/gateway/app.py:106` returns `queue_depth` unauthenticated — minor backpressure-state leak.
Acceptable for liveness; drop the field or gate it if the endpoint is ever exposed.

### I-3 · Info · Catalog · Unbounded untrusted-file parse
`src/lrs/catalog.py:236` (`csv.DictReader`) and `:203/:262/:270` (`json.loads`) read sibling-repo
files into memory with no size bound. Operator-controlled, offline seeder → low likelihood; note
for hardening if `LRS_TEXTBOOK_ROOT` ever points at untrusted content.

**Checked, no issue:**
- **Cypher injection (dashboards):** every user/pick value is passed as `$param` via `db.q(**params)`;
  the lone f-string query `queries_common.schools():20` interpolates a *constant* `WHERE` fragment
  with the value still parameterized (`$district_id`) — not injectable. `queries_author.py:271` f-strings
  are display text, not Cypher. Full `q(...)` sweep across admin/author/teacher confirmed parameterized.
- **Cypher injection (seeder):** `seed.py` `_WRITES`/`_COVERS` are static label strings; rows passed as
  `execute_query(cypher, rows=…)` (`:944/:949`). `clear()` scoped to `{seeded: true}` (`:896`).
- **Tenancy binding:** `district_id` comes only from the token; body cannot set it (`envelope.py:33-35`).
- **Ingest fails closed:** `dev_ingest_token` defaults `None`; gateway depends on Redpanda only.
- **Vault isolation (compose):** `vault-net` `internal: true`, `vault-db` has no host port, `identity`
  is the only dual-network service — all as designed.
- **Container:** `Dockerfile` runs non-root (uid 10001), multi-stage, no secrets/build-tooling in runtime.
- **Dangerous sinks:** no `eval/exec/pickle/yaml.load/shell=True/subprocess/os.system/verify=False/md5`
  anywhere in `src`, `dashboards`, `scripts`.
- **Secrets in git:** `.env` git-ignored (`.gitignore:17`) and not tracked; `smoke.sh` sources `.env`,
  embeds no secret.
- **Bootstrap stubs:** `--apply-ddl`/`--apply-constraints` raise `typer.Exit(2)` — inert, not privileged.

## 4. Property assessment

**District isolation — adequate for MVP, seam-fragile.** Tenancy is bound from the token, not the
body (good). The one gap (L-1) is inert until the processor exists, but the processor **must** key
pseudonymization on the token's district. Top risk: a future processor trusting `actor.homePage`.

**PII protection — weakest area.** In the MVP, learner PII lives in Neo4j (`student_key` + names) and
is served by three unauthenticated dashboards, one traceback (H-1) or one exposed port (H-2) away
from disclosure. The pseudonymization boundary (§5.2) that would protect it is deferred. **Safe only
on loopback with non-default creds — and nothing enforces that.** Top risk: H-1 + H-2 together.

**Ingestion integrity & availability — solid, one hole.** All-or-nothing Tier-1 validation is strict
and well-reasoned; `acks=all` + idempotence preserve ordering. The gap is M-1 (no body/batch cap):
availability is a single large POST away from degradation.

**Secret hygiene — mixed.** Ingest token fails closed (good); datastore passwords fail *open* to
`neo4j`/`neo4j` (M-2) and travel in URLs/argv (L-3). No secret is committed to git (good).

## 5. Seam review (deferred controls — do they have a safe landing spot?)

| Deferred control | Safe seam? | Why |
|---|---|---|
| Identity service / HMAC vault | **Yes** | `resolve_district()` is isolated and documented; must adopt constant-time verify (I-1) and Redis+LRU fallback so auth can't become an ingest dependency. |
| Processor pseudonymization | **Conditional** | Must derive `student_key` from the **token** district, not the claimed actor domain (L-1). Envelope already carries the authoritative `district_id`. |
| RBAC / OIDC / TenantContext | **Yes, but not started** | Dashboards query Neo4j directly today; the query layer (`db.q`) is a natural chokepoint to inject a tenant predicate later, but nothing forces it yet. |
| Threshold / complementary suppression | **Yes** | A single filter over `db.q` results is the intended spot; absent today (see appendix). |
| Bootstrap DDL/constraints | **Yes** | Stubs fail loudly (`Exit(2)`), so `--verify` can't report green for unapplied work. Note: this makes the compose `bootstrap` service exit non-zero, so `depends_on: service_completed_successfully` gates identity/processor/summarizer — irrelevant while those are deferred, but a startup blocker to remember. |

## 6. Accepted-risk appendix (known, not findings)

| Deferral | Promotes to a finding when… |
|---|---|
| No RBAC/OIDC/auth on dashboards | the dashboards are bound to anything but loopback, or `debug=True` (H-1) is left on off-loopback. **Do not deploy dashboards off `127.0.0.1` until RBAC + threshold suppression land.** |
| No threshold/complementary suppression (spec §12.3, ≥10) | any dashboard serves a user without a legitimate roster relationship (cross-district/benchmark views). |
| Identity service / vault / per-district salt unbuilt | a real (non-dev) token scheme ships without HMAC storage + constant-time verify. |
| Processor & summarizer unbuilt; summaries seeded with `seeded:true` | live ingestion is wired to graph writes without re-checking L-1. |
| MVP partition/grain reductions | promoted to prod scale without restoring the §6.1 partition count. |

## 7. Prioritized remediation

1. **Set `debug=False`** in all three `dashboards/*_app.py` `app.run(...)` (H-1).
2. **Bind published datastore ports to `127.0.0.1`** and fail startup if any password still equals its
   `change-me-*` default (H-2).
3. **Cap request body + batch length** at the gateway (proxy limit + explicit check → 413) (M-1).
4. **Default secret fields to `None`, fail fast when unset**; remove `neo4j`/`neo4j` fallbacks (M-2).
5. **Add token-district vs. claimed-district assertion** before the processor is wired (L-1).
6. **Move secrets out of URLs/argv**; pin images by digest and vendor APOC (L-3, L-4).
7. **Structure logs / strip control chars** on caller-supplied fields; drop `queue_depth` from `/health` (L-2, I-2).
