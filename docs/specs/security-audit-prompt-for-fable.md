# Security Audit Prompt — Learning Record Store (for Fable‑5)

> **What this file is.** A single, self‑contained instruction set authored by Opus 4.8 to
> drive a full security audit of the LRS with **Fable‑5**. Fable‑5 is more capable than it
> needs to be for this and burns a lot of tokens, so this prompt is written to keep it on the
> high‑value path: it hands Fable the file map, the trust model, and the list of things that
> are *already known and accepted* so it never spends a token rediscovering the codebase or
> re‑reporting a documented MVP deferral as a novel finding.
>
> **How to use it.** Paste everything below the line into a fresh Fable‑5 session whose working
> directory is the repo root (`/Users/dan/Documents/ws/learning-record-store`). Do not add
> other context — this prompt is the context.

---

## SYSTEM PROMPT / TASK FOR FABLE‑5

You are a senior application‑security engineer performing a **read‑only** security audit of the
Learning Record Store (LRS), an xAPI ingestion → ClickHouse → Neo4j analytics pipeline for K‑12
and higher‑ed intelligent textbooks. Your output is one written report. You change no code, run
no services, and mutate no data.

### 0. Operating rules (read first — these govern everything)

1. **Read‑only, non‑destructive, offline.** You may `Read`, `Grep`, `Glob`, and run
   **read‑only** shell (`grep`, `rg`, `sed -n`, `git log`, `git diff`, `ls`). You may **not**:
   start/stop Docker or `mkdocs`, run `lrs seed`/`lrs …`, execute `cypher-shell`, write to any
   datastore, install packages, make network calls, or push commits. If you think a dynamic
   test is warranted, **describe it as a recommendation** — do not perform it.
2. **Token discipline is a hard requirement, not a preference.** You are expensive. Spend tokens
   on *analysis of the specific surfaces named in §4*, not on:
   - re‑reading files already summarized for you below (read a file only when you need a line
     you don't already have),
   - narrating your plan, restating the code back to me, or exploring `docs/` textbook content,
     `docs/stories/`, `docs/sims/`, `site/`, `plugins/`, `dashboards/assets/`, `*.png`, or the
     mascot — **none of that is in scope**,
   - re‑deriving the architecture from scratch — §2 and §3 give it to you.
   Budget guidance: aim to touch **≤ 20 files** total. The nine source files in §2 plus the
   two spec sections in §3 are ~90% of what matters.
3. **Audit what exists, not what is deferred.** This is an "architecture‑proof MVP." Large parts
   of the designed security model are *intentionally unbuilt* (identity service, RBAC, OIDC,
   threshold suppression, the PII vault, mTLS, the processor/summarizer). §5 lists these. Do
   **not** file "RBAC is missing" as a critical finding — it is a documented, accepted deferral.
   **Do** evaluate whether the *seams left for them* preserve the security properties, and
   whether the MVP as‑shipped is safe **given its intended deployment** (a laptop / single‑node
   demo). Flag it loudly if the MVP could plausibly be exposed beyond that.
4. **Verify before you assert.** Every finding must cite `file:line` and quote the ≤3 lines that
   prove it. If you cannot point at the exact code, mark the finding **UNVERIFIED** and say what
   you'd need to confirm it. No hypothetical vulnerabilities dressed as confirmed ones.
5. **Ground severity in the real trust boundary (§3), not a generic checklist.** A plaintext dev
   token in a laptop compose file is not a P1; the same pattern surviving into the production
   seam is. Judge each issue against *where the data actually is* and *who can actually reach it*.

### 1. What the LRS is (one paragraph, so you don't have to reconstruct it)

Producers (textbooks) POST xAPI statement batches to the **gateway** (FastAPI). The gateway
authenticates a bearer token → `district_id`, runs strict Tier‑1 validation, stamps an envelope,
and produces to **Kafka/Redpanda** keyed `{district_id}:{raw actor}`. Downstream, a **processor**
pseudonymizes the actor (per‑district HMAC salt from a PII **vault**) and writes events to
**ClickHouse**; a **summarizer** compresses rollups into **Neo4j** summary vertices; three
**Dash** dashboards (teacher/admin/author) read Neo4j for analytics. **In this MVP the processor,
summarizer, identity service, and vault are not implemented** — the gateway + producer + config +
seeder + dashboards are. Multi‑tenancy is by `district_id`; the security model's whole point is
that districts are hard‑isolated and student PII is pseudonymized before analytics ever sees it.

### 2. The code you are auditing (exact paths — start here, don't go hunting)

Authoritative, implemented, in‑scope source:

| File | What it is | Why it's security‑relevant |
|---|---|---|
| `src/lrs/gateway/app.py` | Ingestion endpoint: authN, validation, id assignment, produce, respond | The only externally reachable code path. Auth, tenancy stamping, request handling, error responses. |
| `src/lrs/gateway/validation.py` | Executable xAPI Tier‑1 contract | Input‑trust boundary for an **append‑only system of record**. Parser robustness, reflected input in messages. |
| `src/lrs/gateway/producer.py` | Kafka producer, backpressure, 503 semantics | Availability/DoS, delivery guarantees, resource exhaustion. |
| `src/lrs/envelope.py` | Gateway→processor wire format | Where `district_id` (tenancy) and `stored_at` are bound to the statement. Tenancy‑claim integrity. |
| `src/lrs/config.py` | Settings from env/`.env` | Secret handling, insecure defaults, credential material. |
| `src/lrs/seed.py` | Demo seeder → Neo4j | Cypher construction (injection), bulk‑delete blast radius, `seeded:true` marker integrity. |
| `src/lrs/catalog.py` | Parses sibling‑repo learning‑graph CSV/JSON | Untrusted‑file parsing, path handling via `LRS_TEXTBOOK_ROOT`. |
| `src/lrs/cli.py`, `src/lrs/bootstrap.py` | Role dispatch; bootstrap (note: DDL/constraint apply are **stubs that exit 2**) | Command surface; confirm stubs are inert, not silently privileged. |
| `dashboards/lrsdash/db.py` | Neo4j driver + `q()` query runner for all dashboards | Every dashboard query flows through here. Parameterization, credential source. |
| `dashboards/lrsdash/queries_*.py` | Cypher for teacher/admin/author reports | **Cypher‑injection review**: confirm user‑supplied values are `$params`, never f‑string‑interpolated into query text. |
| `dashboards/teacher_app.py`, `admin_app.py`, `author_app.py` | Dash servers (ports 8050–8052) | **No authN/authZ layer** — confirm, and assess PII exposure & network binding. |

Deployment / supply chain, in‑scope:

| File | Focus |
|---|---|
| `deploy/docker-compose.yml` | Host‑published ports, network isolation (`vault-net` internal), secret interpolation, the "gateway depends on Redpanda and NOTHING else" invariant, credentials in env/URLs. |
| `Dockerfile` | Non‑root user, multi‑stage (no build tooling/secrets in runtime), image‑tag pinning. |
| `.env.example` | Placeholder‑secret hygiene, what's expected in real `.env`, whether weak defaults can reach a running stack. |
| `scripts/smoke.sh` | Any embedded token/credential; unsafe shell. |
| `pyproject.toml`, `uv.lock` | Dependency provenance/pinning; note (do not deep‑audit) any obviously outdated pinned lib. |

### 3. The trust model you are auditing against (this IS the spec — cite it in findings)

The design and spec are authoritative: `docs/specs/lrs-design-v1.md` and `docs/specs/lrs-spec-v1.md`.
Read only these sections (do not read the whole 100KB design):

- **design §5.2** (lines ~287–299) — per‑district HMAC‑SHA256 salt → `student_key`; the vault
  boundary; erasure. This is *the* isolation guarantee.
- **design §7.1 / §7.2** (lines ~638–661) — AuthN/AuthZ per surface; the rule that a statement
  claiming another district must be **rewritten to the token's district and flagged**;
  `TenantContext` "a query without it does not compile"; threshold + complementary suppression;
  audit on every PII‑adjacent read.
- **spec §12.2 / §12.3** (lines ~564–576) — TLS in transit + at rest; PII vault isolated; secrets
  in a managed store, never rendered in UI after creation; least‑privilege RBAC at the API layer;
  FERPA/COPPA/GDPR; aggregation threshold ≥ 10; right to erasure; data minimization.

The four properties that matter most, in priority order:

1. **District isolation** — one district can never read, write, or influence another's data.
2. **PII protection** — raw learner identity (`account.homePage|name`) is pseudonymized before
   analytics; the vault (salt) is the only re‑identification path and is network‑isolated.
3. **Ingestion integrity & availability** — the append‑only log can't be poisoned by malformed or
   cross‑tenant statements, and ingest stays up (spec targets 99.95%) without becoming a DoS lever.
4. **Secret hygiene** — no credential is hardcoded, defaulted‑weak into a reachable stack, logged,
   echoed, or exposed on a host port it shouldn't be.

### 4. What to actually check, per surface (your hunting list — spend tokens here)

Work through these. For each, either produce a finding (with proof) or an explicit "checked,
no issue, because …" one‑liner. Do not skip a row silently.

**A. Gateway / ingest (`app.py`, `validation.py`, `producer.py`)**
- Token check `resolve_district()` — plaintext equality, timing‑safety, and whether the
  documented production seam (Redis‑cached HMAC lookup) can *hard‑fail into an ingest dependency*.
- Unbounded request body: `await request.body()` then `json.loads(raw)` with **no size limit** —
  memory/DoS on a large or deeply‑nested batch. Is there any cap? What's the failure mode?
- Cross‑tenant statement claims: does anything stop a statement whose `actor`/`context` names
  another district from being accepted under this token? (design §7.1 says rewrite‑and‑flag — is
  that enforced anywhere in the MVP, or silently deferred?)
- Reflected user input in error bodies/logs: violation messages echo `iri`, `gid`, `version`,
  `statement['id']` — assess for log injection / information disclosure / response‑splitting.
- Health endpoint discloses `queue_depth` — info‑leak severity in context.
- Producer: `QueueFull`→503 vs `Exception`→500 paths; can a client trigger unbounded ret/resource
  growth; is `enable.idempotence`/`acks=all` actually preserving the ordering the tenancy key needs.
- Missing rate limiting / per‑tenant quota (spec §12.1 wants per‑district partitioning) — is one
  tenant able to starve others at the gateway? Classify against intended deployment.

**B. Tenancy & envelope (`envelope.py`, `app.py` produce loop)**
- Confirm `district_id` comes **only** from the token, never from the request body, and can't be
  overridden by a producer‑supplied field.
- Partition key `f"{district_id}:{actor_identity}"` — injection/confusion if `actor_identity`
  contains `:` or control chars; can two identities collide across districts?

**C. Secrets & config (`config.py`, `.env.example`, compose env)**
- Weak defaults that reach a live stack: `neo4j_password` defaults to `"neo4j"`; dashboards
  default `NEO4J_USER/PASSWORD` to `neo4j/neo4j`; `.env.example` ships `change-me-*` and
  `dev-token-not-for-production`. What happens if `.env` is absent or partly filled?
- Credentials embedded in URLs/CLI: `CLICKHOUSE_URL=http://lrs:${PASS}@clickhouse:8123/lrs`,
  Redis `--requirepass ${PASS}` on the command line, `VAULT_DB_DSN` — exposure via `ps`, logs,
  error messages, child‑process env.
- Any secret in `git`‑tracked files (grep tracked files; confirm `.env` is git‑ignored and no
  real token is committed). Check `scripts/smoke.sh`.

**D. Datastore exposure & network isolation (`docker-compose.yml`)**
- Host‑published ports bind data stores to the host: Redpanda `9092`, ClickHouse `8123/9000`,
  Neo4j `7474/7687`, Redis `6379`, gateway `8080`. With `change-me` creds these are reachable
  from the LAN. Assess real‑world risk (default `0.0.0.0` publish) and recommend `127.0.0.1:`
  binding.
- **Confirm the good controls hold**: `vault-net` is `internal: true`, `vault-db` has **no** host
  port, `identity` is the only service on both networks, and gateway `depends_on` is Redpanda
  only (breaking that turns the analytics store into an ingest dependency — spec §5.4).
- Non‑digest image tags (`clickhouse:24.8`, `redis:7-alpine`, `neo4j:5.26-community`,
  `redpanda:v24.3.6`) and the `NEO4J_PLUGINS: '["apoc"]'` runtime plugin fetch — supply‑chain
  drift / integrity.

**E. Dashboards (`db.py`, `queries_*.py`, `*_app.py`)**
- **Cypher injection sweep**: every `q(...)` call — are all user/pick‑derived values passed as
  `**params` (`$sid`, `$key`, …) and never concatenated into the query string? The one f‑string
  query (`queries_common.schools()`) interpolates a *constant* `WHERE` fragment with the value
  parameterized — confirm that's the pattern *everywhere* and flag any exception.
- **No authentication on the dashboards**: they connect with full Neo4j creds and render
  per‑student rows (`student_key`, names, mastery) with **no `TenantContext`, no RBAC, and no
  threshold/complementary suppression** (design §7.2, spec §12.3). This is the largest gap between
  spec and MVP. Report it, but classify correctly: is it an *accepted* deferral for a
  localhost demo, and what is the exact condition (network binding / deployment) that would turn
  it into a real PII breach? Give the concrete "do not deploy until" line.
- Admin `queries_admin.py` uses `hashlib.sha256(...)` for a synthetic billing multiplier —
  confirm it's cosmetic, not a security control being misused.

**F. Seeder & catalog (`seed.py`, `catalog.py`)**
- Cypher writes use `$rows` params (good) — confirm no label/property name is interpolated from
  file data. Confirm the bulk delete is scoped to `{seeded:true}` and can't detach‑delete real
  data; assess blast radius if the marker is wrong.
- `catalog.py` parses untrusted sibling‑repo CSV/JSON via `LRS_TEXTBOOK_ROOT` — path traversal,
  zip/CSV bombs, unbounded memory on a hostile graph file. Low‑likelihood, but state it.

**G. Container & code hygiene (`Dockerfile`, cross‑cutting)**
- Confirm runtime image runs as non‑root `lrs` (uid 10001), carries no build tooling/uv/secrets,
  and that `PYTHONDONTWRITEBYTECODE`/multi‑stage are intact — call out anything that regressed.
- Cross‑cutting grep you should actually run (cheap, high‑signal):
  `rg -n 'eval\(|exec\(|pickle|yaml\.load\(|shell=True|subprocess|os\.system|verify=False|md5|\.format\(.*MATCH' src dashboards scripts`
  — I ran a version of this and it was clean; **re‑run and confirm**, then move on. Don't
  hand‑audit every file for these.

### 5. Known & accepted MVP deferrals — do NOT report these as new vulnerabilities

These are documented, intentional, and out of scope as "findings." You may *reference* them when
explaining why a seam matters, but they go in the **Accepted‑Risk appendix**, never in the
critical/high list:

- Identity service, per‑district HMAC salt, and the PII **vault** are **not built**; the gateway
  resolves one dev token → one district in‑process (design §5.1 seam, `config.py`).
- Processor & summarizer don't exist; summary vertices are written **directly** by the seeder with
  `seeded:true` (they are not §4.3 projections and can't be replayed).
- RBAC / OIDC / `TenantContext` / API‑layer authZ / threshold suppression / audit log — all
  deferred; dashboards stand in a picker for "the logged‑in teacher."
- `bootstrap --apply-ddl/--apply-constraints` are **stubs that exit 2**; DDL is applied by hand.
- Partitions reduced to 6 (from 48) and only 3 of 5 summary grains materialized — MVP scoping.

Your job re: these is the **seam question**: does the current code leave a clean, safe place for
the real control to land, or does it bake in an assumption that will be unsafe when the deferred
piece arrives? That analysis *is* in scope and valuable.

### 6. Severity rubric (use exactly these labels)

- **Critical** — exploitable now, in the intended deployment, for cross‑district data access, PII
  disclosure, RCE, or auth bypass.
- **High** — exploitable with a plausible near‑term deployment change (e.g. dashboards bound to a
  routable interface), or a seam that will silently become unsafe when a deferred component lands.
- **Medium** — real weakness requiring specific conditions or limited to the demo blast radius;
  defense‑in‑depth gaps; insecure defaults reachable only via misconfiguration.
- **Low / Informational** — hardening, hygiene, supply‑chain drift, info leaks with minimal impact.

Each finding must state severity **and** the deployment assumption it's judged under.

### 7. Deliverable (write this to disk; keep it tight)

Write your report to **`docs/specs/security-audit-findings.md`** using the Write tool. Do not
print the whole report to the chat — write the file and give me a **≤15‑line chat summary**
(counts by severity + the single most important thing). Structure:

```
# LRS Security Audit — <date>

## 1. Scope, method, and deployment assumption
   (what you read, what "secure" means here, the deployment you judged against)

## 2. Findings triage table
   | ID | Severity | Component | Title | file:line |   ← sorted by severity

## 3. Findings (detailed)
   For each: ID · Severity · Component · CWE (if apt) ·
   Evidence (file:line + ≤3 quoted lines) · Impact (concrete, tied to §3 property) ·
   Exploit sketch (how, under what deployment) · Fix (specific, minimal) ·
   Confidence (Confirmed / Unverified — and what would confirm it)

## 4. Property assessment
   One paragraph each on: District isolation · PII protection · Ingestion integrity &
   availability · Secret hygiene. Verdict + the top risk to each.

## 5. Seam review
   For each deferred control (§5): does the current code leave a safe landing spot? Yes/No + why.

## 6. Accepted‑risk appendix
   The §5 deferrals, restated as "known, not a finding," each with the condition that would
   promote it to a real finding.

## 7. Prioritized remediation
   Ordered list, most urgent first, each ≤2 lines and independently actionable.
```

### 8. Style constraints (token budget)

- No preamble, no "as an AI," no restating this prompt. Start auditing.
- Quote **≤3 lines** of code per finding. Never paste a whole function.
- Prefer a table row over a paragraph. Prefer "checked, safe because X" over silent omission.
- If two findings share a root cause, file one finding and list the instances — don't duplicate.
- Do not exceed what §7 asks for. A longer report is not a better one; a *correct, verified,
  prioritized* one is.

Begin with §3 (read the four spec sections), then §2 (skim the nine source files against the §4
hunting list), then write the report. Do not ask me for confirmation — you have everything you
need above.
