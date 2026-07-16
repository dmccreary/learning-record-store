# xAPI Producer Contract v1

**Status:** normative for the MVP. **Version:** 1.0.0. **Last updated:** 2026-07-16.

This pins the statement shape that emitters produce and the LRS consumes. It is the authority for
three things that currently have no authority: the **canonical activity IRI**, the **verb set**, and
the **`object.definition.type` → `object_type` mapping** that `clickhouse.sql`'s materialized views
filter on.

It exists because [`lrs-design-v1.md`](lrs-design-v1.md) §1.3 explicitly defers the producer side, so
the DDL consumes fields nothing is contracted to send.
[`scripts/smoke.sh:89`](https://github.com/dmccreary/learning-record-store/blob/main/scripts/smoke.sh#L89)
already cites "`xapi-producer-contract-v1.md §3`" — the harness was written against this document
before it existed. Where this contract and the harness agree, the agreement is now deliberate.

**Scope.** This is the minimal version the plan calls for: enough to pin the DDL and give `lrs loadgen`
a spec. It closes the first bullet of `TODO.md`'s retrofit item (verbs, activity types, required
`result` fields) and nothing else — emission strategy, batching, throttling, and consent remain open
there.

Each rule below is tagged:
**[RATIFIED]** already true in code, now binding · **[RESOLVED]** a real disagreement, settled with
evidence · **[NEW]** the design was silent; this decides it · **[OPEN]** needs your call.

---

## 1. The canonical activity IRI  **[RESOLVED]**

### The rule

> **`object.id` for a page is `{site_url}` + the page's nav path, with a trailing slash.**
> `site_url` is [`mkdocs.yml`](https://github.com/dmccreary/learning-record-store/blob/main/mkdocs.yml#L9)'s
> `site_url` — `https://dmccreary.github.io/learning-record-store/`.
> It is never `main.html`, never another site, never a bare path.

```
https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/
https://dmccreary.github.io/learning-record-store/sims/sine-wave/
```

### What the sources actually said

The plan (`mvp-plan.md:84`) describes this as three sources disagreeing on the IRI. Having read all
three: **that framing is slightly off, and the correction matters.** `smoke.sh` and the design doc do
not use different *forms* — they use the same form and name a *different page*. That is not a
conflict; a contract governs the rule, not which page emits. The real defects are narrower:

| Source | Value | Verdict |
|---|---|---|
| [`mkdocs.yml:9`](https://github.com/dmccreary/learning-record-store/blob/main/mkdocs.yml#L9) `site_url` | `https://dmccreary.github.io/learning-record-store/` | **Authoritative.** It defines what is actually served. |
| [`scripts/smoke.sh:81`](https://github.com/dmccreary/learning-record-store/blob/main/scripts/smoke.sh#L81) | `…/learning-record-store/sims/lrs-data-model/` | **Correct.** Conforms. Names a different page than sine-wave — not a conflict. |
| [`lrs-design-v1.md:1190`](lrs-design-v1.md) | `…/learning-record-store/sims/lrs-data-model/` | **Correct**, and identical to `smoke.sh`. |
| [`lrs-design-v1.md:1194`](lrs-design-v1.md) (`grouping`) | `https://example.edu/textbook/lrs/v1.0.0` | **Placeholder.** Rejected — see §4. |
| [`sine-wave.js:29`](https://github.com/dmccreary/learning-record-store/blob/main/docs/sims/sine-wave/sine-wave.js#L29) `ACTIVITY_BASE_ID` | `https://dmccreary.github.io/microsims/sims/sine-wave/main.html` | **Wrong twice.** See below. |

So: one genuinely malformed emitter, one placeholder. Not a three-way split.

### Why `sine-wave.js` is wrong twice

1. **Wrong site.** It points at `dmccreary.github.io/microsims/`, a different repo's Pages site. The
   file lives here, and `mkdocs.yml`'s nav serves it from *this* site at `sims/sine-wave/`. The IRI is
   a leftover from wherever the sim was transplanted from.
2. **Wrong page — and this is the load-bearing one.** `main.html` is the **iframe payload**, not a
   navigable page. MkDocs renders `index.md` to `/sims/sine-wave/` and copies `main.html` beside it
   (both files exist in every sim directory). Citing `main.html` mints a *second IRI for one activity*.

   That is not cosmetic. `lrs.student_page_rollup` is `ORDER BY (district_id, student_key, object_id)`.
   Two IRIs for one page put one student's engagement in **two rows that never merge** — so
   `statements_compressed` splits, C-6's compression ratio under-reports, and the graph grows a second
   `PageEngagement` vertex for a page the student visited once. The C-6 assertion in
   `smoke.sh --tier=graph` would be measuring a number corrupted at the producer.

**Action required before `sine-wave` emits anything:** `sine-wave.js:29` must become
`https://dmccreary.github.io/learning-record-store/sims/sine-wave/`. Not fixed here — the plan defers
instrumenting real emitters, and `loadgen` is the MVP's only producer (§9). Nothing durable is at risk
until it emits.

### Rules

- **Trailing slash is significant.** `…/sims/x/` and `…/sims/x` are different strings to
  `ORDER BY object_id`. Always emit the slash.
- **Absolute HTTPS only.** No relative paths, no `http://`, no `localhost`. The IRI is an identifier
  and must be stable across environments — a statement emitted from a local `mkdocs serve` must carry
  the *published* IRI, not `http://127.0.0.1:8000/…`.
- **The IRI is an identifier, not a URL to fetch.** It need not resolve at ingest time. It must not
  change when the site moves; if `site_url` ever changes, that is a migration, not a redeploy.

---

## 2. Question IRIs — the fragment scheme  **[OPEN]**

> **A question's `object.id` is its page IRI + `#q{N}`**, where `N` indexes
> `metadata.json`'s `pedagogical.keyQuestions`.

```
https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/#q2
```

**`N` is zero-based — but confirm this is what you meant.** The evidence is indirect and worth stating
plainly, because the contract cannot be the authority on a fact it guessed:

- `smoke.sh:103` emits `${OBJECT_ID}#q2`.
- `smoke.sh:105` names that question *"How many PageEngagement vertices exist?"*.
- In `lrs-data-model/metadata.json`, `keyQuestions[2]` (zero-based) is *"A student views a page 50
  times. How many PageEngagement vertices exist afterward?"* — a match.
- One-based `q2` would be *"Where do the raw xAPI statements actually live…"* — not a match.

So the only self-consistent reading of the existing harness is zero-based, and this contract pins
zero-based to match it. **If you intended `#q1` to mean the first question, then `smoke.sh:103`/`:105`
carry an off-by-one and both must change together with this section.** Pinning it either way is fine;
pinning it differently in two places is what produces a rollup keyed on a question nobody asked.

---

## 3. Verbs  **[RESOLVED]**

Exactly two verbs are valid in v1. A statement with any other verb is rejected at the gateway.

| Verb IRI | Emitted for | Required `result` |
|---|---|---|
| `http://adlnet.gov/expapi/verbs/answered` | A question attempt | `success` (bool). `score.scaled` when scored. |
| `http://adlnet.gov/expapi/verbs/experienced` | Page or MicroSim engagement | `duration` (ISO-8601) |

**`completed` is not in v1.** It is the only verb appearing anywhere in the design
(`lrs-design-v1.md:1187`), and it is not one of these two. The design's `smoke.sh` used it; the
rewritten `scripts/smoke.sh:100` uses `answered`. That rewrite was correct and this ratifies it —
`completed` carries no `success`, so it cannot feed
`mv_student_concept_rollup`'s `countIf(result_success IS NOT NULL)`, and a rollup fed by `completed`
reports `attempts = 0` for every student. Adding `completed` later means deciding what it means for
mastery first.

**Why `answered` and not `interacted`:** already argued at `smoke.sh:86-88`. `answered` carries the
`result.success` and `result.score.scaled` the concept rollup needs to produce `attempts > 0`.

---

## 4. The textbook version IRI (`grouping[0]`)  **[RESOLVED]**

> **`context.contextActivities.grouping[0].id` = `{site_url}textbook/{textbook_id}/{version_id}`**

```
https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0
   → textbook_id = "lrs"   version_id = "v1.0.0"
```

This is `smoke.sh:82`'s form and it is correct. `lrs-design-v1.md:1194`'s
`https://example.edu/textbook/lrs/v1.0.0` is a placeholder from the design's worked example —
`example.edu` is not a real host and must not reach a durable statement.

`grouping[0]` is **required on every statement.** `textbook_id` and `version_id` are
`LowCardinality(String)` and `NOT NULL` in `lrs.statements`; there is no sensible default, and a
statement that cannot be attributed to a textbook version cannot be replayed against the version of
the content it describes (C-2).

`parent[0]`, when present, is the page IRI a question belongs to (`smoke.sh:109`). Required for
`answered`, meaningless for `experienced` (a page is not its own parent).

---

## 5. `object.definition.type` → `object_type`  **[NEW]**

`lrs.statements.object_type` is `Page | MicroSim | Question | Concept` (`clickhouse.sql:20`), and two
materialized views filter on it — `mv_student_page_rollup` on `'Page'`, `mv_student_question_rollup`
on `'Question'`. **The design never says how the processor derives it.** Without this mapping both
rollups are empty and C-6 has nothing to measure. This table decides it:

| `object.definition.type` | → `object_type` | Notes |
|---|---|---|
| `http://adlnet.gov/expapi/activities/lesson` | `Page` | A prose/textbook page. |
| `http://adlnet.gov/expapi/activities/simulation` | `MicroSim` | An interactive sim page. |
| `http://adlnet.gov/expapi/activities/cmi.interaction` | `Question` | **Ratified** — `smoke.sh:104` already emits this. |
| *(anything else)* | — | **Reject at the gateway.** |

`Concept` is in the DDL enum but **no producer emits it.** Concepts attach via the extension in §6,
never as an object. It stays in the enum for the enrichment path.

> **Note for step 4.** `mv_student_page_rollup` filters `object_type = 'Page'`, so a **MicroSim
> engagement does not reach the page rollup** under this mapping. That is a real consequence: if you
> want `sine-wave` dwell time in `PageEngagement`, either emit `lesson` for sim pages or widen the MV
> to `object_type IN ('Page','MicroSim')`. Flagging rather than deciding — it changes the DDL, and the
> MVP's only producer is `loadgen`.

---

## 6. Concepts: extension vs. enrichment  **[OPEN — a real conflict]**

**The design and the harness disagree, and this is not cosmetic.**

- `lrs-design-v1.md:309` (§5.3 step 3, "Enrich"): the processor attaches `section_id`, `version_id`,
  and **"the `concept_ids` the object covers, from the cached structural graph."** Producers send
  nothing; the LRS knows which concepts a page covers.
- `scripts/smoke.sh:111`: the producer sends
  `context.extensions["https://w3id.org/lrs/ext/concept_id"] = "compression-ratio"`.

These are different architectures. Enrichment scales to unlabeled content and keeps the concept map
server-side; the extension makes the producer authoritative and requires every emitter to know the
concept taxonomy.

**v1 rule (pragmatic, and reversible):**

> Producers **SHOULD** send `https://w3id.org/lrs/ext/concept_id` — a **single concept ID string**.
> When present it is authoritative. When absent, `concept_ids` is `[]` and the statement is excluded
> from `mv_student_concept_rollup` by its own `WHERE notEmpty(concept_ids)`. Graph-based enrichment is
> **deferred**, not rejected: when it lands, it fills the gap when the extension is absent, and the
> extension still wins.

**Why:** no structural graph is seeded in the MVP, so enrichment has nothing to read. If the extension
weren't authoritative, `concept_ids` would be empty for every statement, `mv_student_concept_rollup`
would stay empty, and step 4's mastery join would have nothing to join — the exact null-forever failure
the mastery fix (`clickhouse.sql:72-83`) exists to prevent.

**Note the singular/plural mismatch:** the extension is `concept_id` (one string); the column is
`concept_ids Array(String)`. **The processor wraps it: `concept_ids = [value]`.** Statements covering
multiple concepts are not expressible in v1. If that's needed, add `…/ext/concept_ids` (array) in v1.1
and keep the singular as an alias — do not redefine the singular key.

**This changes the ingest contract relative to design §5.3, which is why it is tagged OPEN** rather
than silently written down.

---

## 7. What producers never send

| Field | Who sets it | Why not the producer |
|---|---|---|
| `district_id` | Gateway, from the auth token | A producer must not be able to claim another district's tenancy. |
| `student_key` | Processor, HMAC of the actor | §5.2's boundary. The producer sends the *real* identity in `actor.account.name`; the pseudonym is derived exactly once, server-side. |
| `stored_at` | Gateway, at receipt | Arrival time. `timestamp` is event time and is the producer's. |
| `section_id` | Processor (enrichment, design:309) | Roster data. **Empty in v1** — nothing seeds the structural graph yet. |
| `voided_by` | The void API (F-3) | Retraction is never deletion. |
| `provisional` | Processor | Set when the object isn't reconciled yet (§5.4 accept-first). |

`actor.account.name` **is PII by design and that is correct** — it is the only place real identity
enters, and the processor rewrites the actor block before the `raw` column is stored
(`clickhouse.sql:34-54`). Producers must not pre-hash it: the salt is per-district and lives in the
vault.

---

## 8. Transport  **[RATIFIED]**

```http
POST /xapi/statements
Content-Type: application/json
X-Experience-API-Version: 1.0.3
Authorization: Bearer <token>
```

- **Body is always a JSON array**, even for one statement (`smoke.sh:95`).
- **All-or-nothing per batch**, per xAPI conformance and `mvp-plan.md:90`. One invalid statement
  rejects the batch; there is no partial success.
- **`id` is optional.** When the producer supplies one it is preserved verbatim — `smoke.sh:96` sends
  `id` and then queries `WHERE statement_id = '${STATEMENT_ID}'`, so round-tripping it is load-bearing
  for the harness. When absent the gateway assigns a UUIDv7 (`mvp-plan.md:90`).
- **`timestamp`** is ISO-8601 UTC, producer-supplied, event time.

> **Interaction with the §7 open question in `mvp-status.md`.** Producer-supplied `id` is what makes
> gateway-side dedup on `statement_id` (candidate (a)) possible at all. A producer that omits `id` gets
> a fresh UUIDv7 per delivery and **cannot be deduplicated** — a retry becomes a distinct statement and
> double-counts in every rollup. If dedup lands, `id` becomes **required**, not optional. Worth knowing
> before that decision, since it is a producer-visible change.

---

## 9. The reference statement

This is `scripts/smoke.sh:95-113` verbatim in shape, and it is the shape `lrs loadgen` must emit
(`mvp-plan.md:94`: "same shape in, nothing downstream changes").

```json
[{
  "id": "0190f8a1-...-7b3c",
  "actor": {
    "objectType": "Agent",
    "account": {"homePage": "https://demo.example.edu", "name": "student-0042"}
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/answered",
    "display": {"en-US": "answered"}
  },
  "object": {
    "objectType": "Activity",
    "id": "https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/#q2",
    "definition": {
      "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
      "name": {"en-US": "How many PageEngagement vertices exist?"}
    }
  },
  "result": {"score": {"scaled": 0.9}, "success": true, "duration": "PT4M12S"},
  "context": {
    "contextActivities": {
      "grouping": [{"id": "https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0"}],
      "parent":   [{"id": "https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/"}]
    },
    "extensions": {"https://w3id.org/lrs/ext/concept_id": "compression-ratio"}
  },
  "timestamp": "2026-07-16T14:22:03Z"
}]
```

`actor.account.homePage` is `https://demo.example.edu` — a **demo tenant**, not a placeholder to purge.
Unlike `example.edu` in `grouping` (§4), it identifies the account namespace rather than a content
version, and real districts supply their own.

## 10. Field → column map

Everything the DDL reads, and where it comes from. If a row here is wrong, a rollup is wrong.

| Statement path | Column | Notes |
|---|---|---|
| `id` | `statement_id` UUID | Or gateway UUIDv7 — §8. |
| `actor.account.name` | → `student_key` | HMAC'd. Never stored raw. |
| `verb.id` | `verb_id` | §3. Exactly two values. |
| `object.definition.type` | → `object_type` | §5. Both page/question MVs filter on this. |
| `object.id` | `object_id` | §1. Trailing slash significant. |
| `grouping[0].id` | → `textbook_id`, `version_id` | §4. Parsed from the IRI. |
| `result.score.scaled` | `result_score` Nullable(Float32) | `0.0`–`1.0`. Null ⇒ not counted in `score_count`. |
| `result.success` | `result_success` Nullable(UInt8) | Null ⇒ not counted in `attempts`. |
| `result.duration` | `duration_ms` Nullable(UInt32) | ISO-8601 → ms. Feeds `dwell_ms_total`. |
| `ext/concept_id` | → `concept_ids` Array(String) | §6. Wrapped to a 1-element array. |
| `timestamp` | `timestamp` DateTime64(3) | Event time. Partition key + rollup min/max. |
| *(whole statement)* | `raw` | Actor block pseudonymized first — `clickhouse.sql:34-54`. |

---

## 11. Open items

1. **§2 — is `#q{N}` zero-based?** Pinned zero-based from `smoke.sh`'s own text. Confirm, or fix
   `smoke.sh:103`/`:105` and this section together.
2. **§6 — extension vs. enrichment.** v1 makes the producer authoritative. This contradicts design
   §5.3 step 3 and should be reflected there, or reversed here.
3. **§5 — MicroSim engagement doesn't reach `student_page_rollup`.** Decide before step 4.
4. **§8 — `id` becomes required if gateway dedup lands** (`mvp-status.md` §7 candidate (a)).
5. **`sine-wave.js:29` still emits a malformed IRI.** Harmless while `loadgen` is the only producer;
   must be fixed before that page is instrumented.
6. **The design doc is not yet amended.** §§1, 3, 4, 5, 6 each correct or fill something in
   `lrs-design-v1.md`. Tracked in the plan's "Amend the docs as we go".
