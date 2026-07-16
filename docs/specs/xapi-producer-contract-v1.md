# xAPI Producer Contract v1

**Status:** normative for the MVP. **Version:** 1.0.0. **Last updated:** 2026-07-16.

This pins the statement shape that emitters produce and the LRS consumes. It is the authority for four
things that previously had no authority: the **canonical activity IRI**, the **verb set**, the
**`object.definition.type` → `object_type` mapping** that `clickhouse.sql`'s materialized views filter
on, and the **Start/Pause dwell pattern** every MicroSim needs (§7).

It exists because [`lrs-design-v1.md`](lrs-design-v1.md) §1.3 explicitly defers the producer side, so
the DDL consumes fields nothing is contracted to send.
[`scripts/smoke.sh`](https://github.com/dmccreary/learning-record-store/blob/main/scripts/smoke.sh)
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
> `site_url` is [`mkdocs.yml`](https://github.com/dmccreary/learning-record-store/blob/main/mkdocs.yml)'s
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
| [`mkdocs.yml`](https://github.com/dmccreary/learning-record-store/blob/main/mkdocs.yml) `site_url` | `https://dmccreary.github.io/learning-record-store/` | **Authoritative.** It defines what is actually served. |
| [`scripts/smoke.sh`](https://github.com/dmccreary/learning-record-store/blob/main/scripts/smoke.sh) | `…/learning-record-store/sims/lrs-data-model/` | **Correct.** Conforms. Names a different page than sine-wave — not a conflict. |
| [`lrs-design-v1.md:1190`](lrs-design-v1.md) | `…/learning-record-store/sims/lrs-data-model/` | **Correct**, and identical to `smoke.sh`. |
| [`lrs-design-v1.md:1194`](lrs-design-v1.md) (`grouping`) | `https://example.edu/textbook/lrs/v1.0.0` | **Placeholder.** Rejected — see §4. |
| [`sine-wave.js`](https://github.com/dmccreary/learning-record-store/blob/main/docs/sims/sine-wave/sine-wave.js) `ACTIVITY_BASE_ID` | *was* `https://dmccreary.github.io/microsims/sims/sine-wave/main.html` | **Was wrong twice.** **Fixed 2026-07-16** — see below. |

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

### Fixed 2026-07-16 — and it was never one line

`ACTIVITY_BASE_ID` is now `https://dmccreary.github.io/learning-record-store/sims/sine-wave/`.

Worth recording *why this took more than a one-line edit*, because the original note in
`mvp-plan.md:84` described it as a single bad IRI. Fixing it surfaced **five more wrong URLs in the
same file**, none of which that note mentions:

| What | Was | Now |
|---|---|---|
| `ACTIVITY_BASE_ID` | `…/microsims/sims/sine-wave/main.html` | `…/learning-record-store/sims/sine-wave/` |
| `actor.account.homePage` | `https://dmccreary.github.io/microsims/` | `https://demo.example.edu` (§10) — it names an account namespace, not a website |
| `result.extensions` ×2 | `…/microsims/xapi/ext/value`, `…/previous-value` | `https://w3id.org/lrs/ext/…` (§6) |
| **`grouping[0]`** | `…/microsims/sims/sine-wave/` — *a page URL* | the textbook **version IRI** (§4) |
| `metadata.json` `identifier` | `…/microsims/sims/sine-wave/` | `…/learning-record-store/sims/sine-wave/` |

The `grouping[0]` one is the interesting failure: it was not merely pointing at the wrong host, it was
holding **the wrong kind of thing entirely** — this sim's own page URL where the textbook version
belongs. `parent` is where a page URL goes. A host-only search-and-replace would have "fixed" the URL
and left `textbook_id`/`version_id` unparseable, which is worse than the original, because it looks
correct.

The statement also gained `parent[0]` and the `concept_id` extension it needs to reach
`mv_student_concept_rollup` at all.

sine-wave never POSTs — the statements render in a log panel. But it is the artifact students read to
learn what an xAPI statement *is*, so a shape the gateway would reject is a teaching bug, not a
harmless one.

### Rules

- **Trailing slash is significant.** `…/sims/x/` and `…/sims/x` are different strings to
  `ORDER BY object_id`. Always emit the slash.
- **Absolute HTTPS only.** No relative paths, no `http://`, no `localhost`. The IRI is an identifier
  and must be stable across environments — a statement emitted from a local `mkdocs serve` must carry
  the *published* IRI, not `http://127.0.0.1:8000/…`.
- **The IRI is an identifier, not a URL to fetch.** It need not resolve at ingest time. It must not
  change when the site moves; if `site_url` ever changes, that is a migration, not a redeploy.

---

## 2. Question IRIs — the fragment scheme  **[RESOLVED 2026-07-16]**

> **A question's `object.id` is its page IRI + `#q{N}`, where `N` is the question's ONE-BASED ordinal
> as presented to the student.** `#q1` is the first question. This holds for every source — a
> MicroSim's `keyQuestions` array and a chapter quiz's numbered list alike.

```
https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/#q3
https://dmccreary.github.io/learning-record-store/chapters/01-what-is-an-ibook-lrs/quiz/#q1
```

**One rule, not two.** The tempting alternative was to let the fragment follow each source's own
natural indexing — a zero-based array index for `keyQuestions` (it *is* an array), a one-based ordinal
for a chapter quiz (it *is* a displayed number). That was rejected: it would give one field two
meanings, and every reader of a statement would have to know which kind of source produced it before
they could interpret the IRI.

**Why one-based.** The fragment should mean what the student and a debugger both see on the page.
`#q0` denoting "Question 1" is a permanent footgun — every future reader has to remember the offset,
and a chapter quiz that visibly numbers itself 1–10 would emit IRIs disagreeing with its own headings.

### The off-by-one this exposed, and how it was found

The first draft of this contract pinned **zero-based**, inferred from the only evidence available:

- `smoke.sh` emitted `${OBJECT_ID}#q2` while naming that question *"How many PageEngagement vertices
  exist?"* — which is `keyQuestions[2]` **zero-based**, i.e. the **third** question. A one-based `q2`
  would have been *"Where do the raw xAPI statements actually live…"*, which does not match the name.

So the harness was self-consistent only under a zero-based reading, and the contract followed it. That
inference was flagged as needing confirmation rather than presented as fact — correctly, because it
was wrong. What the evidence actually showed was a **latent off-by-one**: the fragment was being
written as a zero-based array index while the name beside it was chosen by counting questions the way
a human does. The two conventions were already in conflict inside a single statement; nobody had
noticed because nothing consumed it.

**Fixed:** `smoke.sh` now emits `#q3` for that question, matching its name and this rule.

> **Method note.** Building the first chapter quiz is what forced this. A four-question sim can hide an
> off-by-one; a quiz that prints "1." through "10." beside its own emitted IRIs cannot. A second,
> differently-shaped emitter is worth more than more reasoning about the first one.

---

## 3. Verbs  **[RESOLVED]**

Exactly three verbs are valid in v1. A statement with any other verb is rejected at the gateway.

| Verb IRI | Emitted for | Required `result` |
|---|---|---|
| `http://adlnet.gov/expapi/verbs/answered` | A question attempt | `success` (bool). `score.scaled` when scored. |
| `http://adlnet.gov/expapi/verbs/experienced` | Page or MicroSim engagement | `duration` (ISO-8601). See §7. |
| `http://adlnet.gov/expapi/verbs/interacted` | A control being manipulated — a slider, a button | none required; `result.extensions` carry the value |

**`interacted` was added 2026-07-16**, widening `mvp-plan.md:82`'s "2 verbs" scope. The reason is that
the plan's two verbs could not express what this repo's own MicroSims already do: `sine-wave.js`
emits `interacted` and `docs/sims/sine-wave/index.md` discusses it at length in the emission-strategy
trade-off. A slider drag is neither an answer (no `success`) nor dwell (no interval), so forcing it
into `answered` or `experienced` would make the verb carry a meaning it does not have. `interacted`
statements are still real evidence: they carry `concept_id`, so they feed
`mv_student_concept_rollup`'s `statements_compressed` — which *is* the C-6 compression signal — even
though they contribute `attempts = 0`.

**`completed` is not in v1.** It is the only verb appearing anywhere in the design
(`lrs-design-v1.md:1187`), and it is none of these three. The design's `smoke.sh` used it; the
rewritten `scripts/smoke.sh` uses `answered`. That rewrite was correct and this ratifies it —
`completed` carries no `success`, so it cannot feed
`mv_student_concept_rollup`'s `countIf(result_success IS NOT NULL)`, and a rollup fed by `completed`
reports `attempts = 0` for every student. Adding `completed` later means deciding what it means for
mastery first.

**Why `answered` and not `interacted` for a question:** already argued at `smoke.sh`. `answered`
carries the `result.success` and `result.score.scaled` the concept rollup needs to produce
`attempts > 0`. The two verbs coexist; they are not alternatives.

---

## 4. The textbook version IRI (`grouping[0]`)  **[RESOLVED]**

> **`context.contextActivities.grouping[0].id` = `{site_url}textbook/{textbook_id}/{version_id}`**

```
https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0
   → textbook_id = "lrs"   version_id = "v1.0.0"
```

This is `smoke.sh`'s form and it is correct. `lrs-design-v1.md:1194`'s
`https://example.edu/textbook/lrs/v1.0.0` is a placeholder from the design's worked example —
`example.edu` is not a real host and must not reach a durable statement.

`grouping[0]` is **required on every statement.** `textbook_id` and `version_id` are
`LowCardinality(String)` and `NOT NULL` in `lrs.statements`; there is no sensible default, and a
statement that cannot be attributed to a textbook version cannot be replayed against the version of
the content it describes (C-2).

`parent[0]`, when present, is the page IRI a question belongs to (`smoke.sh`). Required for
`answered`, meaningless for `experienced` (a page is not its own parent).

---

## 5. `object.definition.type` → `object_type`  **[NEW]**

`lrs.statements.object_type` is `Page | MicroSim | Question | Concept` (`clickhouse.sql`), and two
materialized views filter on it — `mv_student_page_rollup` on `'Page'`, `mv_student_question_rollup`
on `'Question'`. **The design never says how the processor derives it.** Without this mapping both
rollups are empty and C-6 has nothing to measure. This table decides it:

| `object.definition.type` | → `object_type` | Notes |
|---|---|---|
| `http://adlnet.gov/expapi/activities/lesson` | `Page` | A prose/textbook page. |
| `http://adlnet.gov/expapi/activities/simulation` | `MicroSim` | An interactive sim **page**. Object is the page IRI, no fragment. |
| `http://adlnet.gov/expapi/activities/cmi.interaction` | `Question` | **Ratified** — `smoke.sh` already emits this. |
| `http://adlnet.gov/expapi/activities/interaction` | `Control` | A slider or button **within** a page. Object IRI is fragment-qualified. |
| *(anything else)* | — | **Reject at the gateway.** |

Note `cmi.interaction` (Question) and `interaction` (Control) differ by four characters and mean
entirely different things. That is an unfortunate inheritance from the ADL vocabulary, not a choice
made here — but it is exactly the sort of thing a gateway validator should be strict about.

`Concept` is in the enum but **no producer emits it.** Concepts attach via the extension in §6, never
as an object. It stays for the enrichment path.

### Why `Control` exists, and why it is not `MicroSim`  **[RESOLVED 2026-07-16]**

`mv_student_page_rollup` is `GROUP BY (district_id, student_key, object_id)`. A control's IRI is
fragment-qualified (`…/sims/bouncing-ball/#speed-slider`). So if a slider were typed `MicroSim`,
**every control on a page would become its own `PageEngagement` vertex** for a page the student visited
once — the same defect as naming `main.html` in §1, arriving by a different road. Controls are
therefore excluded from the page rollup by type, and land in the concept rollup instead, which is where
their evidence belongs.

`object_type` is a `LowCardinality(String)`, not an `ENUM`, so adding `Control` needed no migration.

### The MicroSim rollup gap — closed

The first draft of this contract flagged that `mv_student_page_rollup` filtered `object_type = 'Page'`,
so a MicroSim's dwell was stored in `lrs.statements` and then **silently dropped** at the rollup —
PageEngagement would report zero dwell for every sim in the textbook while the evidence sat in the log.
The bouncing ball made this concrete rather than theoretical: dwell is its *entire* output.

**Resolved:** `clickhouse.sql`'s `mv_student_page_rollup` now filters
`object_type IN ('Page', 'MicroSim')`. Verified against a live ClickHouse with the statements the
bouncing ball actually emitted — the MicroSim's `PT26.12S` reaches `dwell_ms_total` as `26120`, exactly
one rollup row is produced, and the `#speed-slider` Control does not leak in. Changed while nothing is
durable; the same change against a populated rollup would need a backfill.

---

## 6. Concepts: extension vs. enrichment  **[OPEN — a real conflict]**

**The design and the harness disagree, and this is not cosmetic.**

- `lrs-design-v1.md:309` (§5.3 step 3, "Enrich"): the processor attaches `section_id`, `version_id`,
  and **"the `concept_ids` the object covers, from the cached structural graph."** Producers send
  nothing; the LRS knows which concepts a page covers.
- `scripts/smoke.sh`: the producer sends
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
the mastery fix (`clickhouse.sql`) exists to prevent.

**Note the singular/plural mismatch:** the extension is `concept_id` (one string); the column is
`concept_ids Array(String)`. **The processor wraps it: `concept_ids = [value]`.** Statements covering
multiple concepts are not expressible in v1. If that's needed, add `…/ext/concept_ids` (array) in v1.1
and keep the singular as an alias — do not redefine the singular key.

**This changes the ingest contract relative to design §5.3, which is why it is tagged OPEN** rather
than silently written down.

---

## 7. Start/Pause: the dwell pattern  **[NEW 2026-07-16]**

Nearly every MicroSim has a Start/Pause control, and it is the interaction the verb set could not
express until this section existed. The reference implementation is
[`docs/sims/bouncing-ball/`](../sims/bouncing-ball/index.md).

> **A Start/Pause pair is ONE run interval, and a run interval is ONE `experienced` statement,
> emitted on Pause, carrying the elapsed time as `result.duration`.**

| Event | Emit | Why |
|---|---|---|
| **Start** | **Nothing.** Record the wall clock. | A student who starts a sim and walks away has produced no evidence. A `started` with no matching `paused` is an unclosed interval nothing can score, and it would inflate `statements_compressed` with rows that carry no duration. |
| **Pause** | **One** `experienced`, `result.duration` = elapsed. | The interval *is* the evidence. `result.duration` is the only field feeding `dwell_ms_total`, and one statement carries it as well as two do. |
| **Tab hidden while running** | The same `experienced`, flushed. | Start-it-and-close-the-tab is the **common** case, not the edge case. Without a flush the modal student emits nothing at all. Use `visibilitychange`, not `beforeunload` — it is the only one that fires reliably on mobile Safari. |
| **Run < 250 ms** | **Nothing.** | A mis-click is not engagement. Emitting it puts `PT0S` rows into `dwell_ms_total` and pollutes the C-6 ratio with noise. |

**The object is the page, not the button.** `object.id` is the sim's page IRI with no fragment, typed
`simulation` → `MicroSim` (§5). The Start/Pause button is *not* its own activity: what is being
measured is engagement with the simulation, and the button is merely how the student expressed it. A
button-fragment IRI here would land the dwell in a `PageEngagement` vertex named after a button.

**Why not two statements.** The literal instrumentation — `started` on Start, `paused` on Pause — is
more xAPI-idiomatic and is what most LRS integrations do. It is rejected here because it doubles
statement volume for zero additional information, requires the reader to reconstruct duration by
pair-joining statements at read time (ordering under at-least-once delivery makes that unreliable), and
produces unclosed intervals whenever a student never pauses. The pattern above degrades gracefully:
the worst case is a *missing* interval, never a *wrong* one.

**Paused-by-default is load-bearing.** The MicroSim standard requires every sim to load paused. That
is primarily pedagogical — a sim animating as a student scrolls past is a distraction. But it is also a
data rule here: an auto-running sim would emit dwell the student never chose to spend, and every
downstream engagement number would be inflated by however long the page happened to sit in a viewport.

**Repeated cycles are repeated statements.** Start→Pause→Start→Pause emits two `experienced`
statements, and `mv_student_page_rollup` sums them into one `PageEngagement` row via
`sum(duration_ms)`. That is the intended compression: N intervals → 1 vertex.

## 8. What producers never send

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
(`clickhouse.sql`). Producers must not pre-hash it: the salt is per-district and lives in the
vault.

---

## 9. Transport  **[RATIFIED]**

```http
POST /xapi/statements
Content-Type: application/json
X-Experience-API-Version: 1.0.3
Authorization: Bearer <token>
```

- **Body is always a JSON array**, even for one statement (`smoke.sh`).
- **All-or-nothing per batch**, per xAPI conformance and `mvp-plan.md:90`. One invalid statement
  rejects the batch; there is no partial success.
- **`id` is optional.** When the producer supplies one it is preserved verbatim — `smoke.sh` sends
  `id` and then queries `WHERE statement_id = '${STATEMENT_ID}'`, so round-tripping it is load-bearing
  for the harness. When absent the gateway assigns a UUIDv7 (`mvp-plan.md:90`).
- **`timestamp`** is ISO-8601 UTC, producer-supplied, event time.

> **Interaction with the §7 open question in `mvp-status.md`.** Producer-supplied `id` is what makes
> gateway-side dedup on `statement_id` (candidate (a)) possible at all. A producer that omits `id` gets
> a fresh UUIDv7 per delivery and **cannot be deduplicated** — a retry becomes a distinct statement and
> double-counts in every rollup. If dedup lands, `id` becomes **required**, not optional. Worth knowing
> before that decision, since it is a producer-visible change.

---

## 10. The reference statement

This is `scripts/smoke.sh` verbatim in shape, and it is the shape `lrs loadgen` must emit
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

## 11. Field → column map

Everything the DDL reads, and where it comes from. If a row here is wrong, a rollup is wrong.

| Statement path | Column | Notes |
|---|---|---|
| `id` | `statement_id` UUID | Or gateway UUIDv7 — §9. |
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
| *(whole statement)* | `raw` | Actor block pseudonymized first — `clickhouse.sql`. |

---

## 12. Open items

**Still open:**

1. **§6 — extension vs. enrichment.** v1 makes the producer authoritative. This contradicts design
   §5.3 step 3 and should be reflected there, or reversed here.
2. **§9 — `id` becomes required if gateway dedup lands** (`mvp-status.md` §7 candidate (a)).
3. **The design doc is not yet amended.** §§1, 3, 4, 5, 6, 7 each correct or fill something in
   `lrs-design-v1.md`. Tracked in the plan's "Amend the docs as we go".
4. **`smoke.sh` does not yet exercise `interacted` or the §7 dwell pattern.** Its one statement is an
   `answered`. Neither new path has a tier asserting it.
5. **Multi-concept statements are not expressible** (§6). `concept_id` is one string. If a page covers
   three concepts, v1 cannot say so.
6. **Repeat attempts are not modelled.** `quiz-xapi.js` emits at most one `answered` per question per
   page load, and never for an answer chosen after the explanation was revealed. That is the right
   *default* — a peeked answer is not evidence of knowledge, and emitting `success: true` for one would
   teach BKT exactly the false mastery it exists to detect. But BKT's value comes from a *sequence* of
   attempts, and nothing currently produces one. Retry-after-failure needs a decision before F-7 can be
   demonstrated on real data.
7. **Every emitter hardcodes `demo-student`.** One actor means the §8 pseudonymization boundary has
   never been exercised by a producer. That is `loadgen`'s job, not a sim's.

**Closed 2026-07-16:**

- ~~**§2 — is `#q{N}` zero-based?**~~ **Resolved: ONE-based**, one rule for every source. The
  zero-based pin was an inference from `smoke.sh` that turned out to be reading a **latent off-by-one**
  rather than an intent. `smoke.sh` now emits `#q3` for the question it names. See §2.

**Closed 2026-07-16:**

- ~~**§5 — MicroSim engagement doesn't reach `student_page_rollup`.**~~ **Fixed.** MV widened to
  `object_type IN ('Page','MicroSim')`, verified against live ClickHouse with real emitted statements.
- ~~**`sine-wave.js` emits a malformed IRI.**~~ **Fixed**, along with five *other* wrong URLs in the
  same file that the original note missed — `actor.account.homePage`, two `result.extensions`
  namespaces, `grouping[0]` (which held a page URL where the version IRI belongs), and
  `metadata.json`'s `identifier`. The lesson generalizes: the malformed IRI was never one line, and
  "fix the URI" was not a one-line job.
- ~~**Start/Pause has no contracted representation.**~~ Now §7, with
  [`bouncing-ball`](../sims/bouncing-ball/index.md) as the reference emitter.
