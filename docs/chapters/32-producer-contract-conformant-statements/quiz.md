---
title: "Quiz: The Producer Contract - Writing Conformant Statements"
description: Review questions on the Canonical Activity IRI, the three-verb set, fragment naming, object type mapping, the Start/Pause dwell pattern, producer-excluded fields, and the transport and field-to-column mapping rules.
social:
   cards: false
---
# Quiz: The Producer Contract - Writing Conformant Statements

Test your understanding of this project's producer contract for writing conformant xAPI statements with these review questions.

---

#### 1. What does the Trailing Slash Rule require, and why does it matter?

<div class="upper-alpha" markdown>
1. object.id for a page must always end in a trailing slash, because ClickHouse's ORDER BY treats a slash and no-slash version of the same URL as different strings, splitting one page's engagement into two rows
2. Every Statement must include a trailing slash in its verb.id field
3. The trailing slash indicates that a Statement has been voided
4. The trailing slash is a stylistic convention with no effect on how statements are stored
</div>

??? question "Show Answer"
    The correct answer is **A**. Because ClickHouse orders rows by `object_id` among other fields, a page IRI with and without a trailing slash sorts as two different strings, silently splitting one page's engagement into two separate rows and a duplicate `PageEngagement` vertex. B misapplies the rule to an unrelated field. C confuses it with the voiding mechanism from an earlier chapter. D directly contradicts the real, measurable data consequence this chapter describes.

    **Concept Tested:** Canonical Activity IRI / Trailing Slash Rule

    **See:** [Naming One Activity for a Lifetime](index.md#naming-one-activity-for-a-lifetime)

---

#### 2. Which of the three valid verbs must carry a result.duration field?

<div class="upper-alpha" markdown>
1. The Answered Verb
2. The Interacted Verb
3. All three verbs require result.duration equally
4. The Experienced Verb
</div>

??? question "Show Answer"
    The correct answer is **D**. The Experienced Verb, emitted for page or MicroSim engagement, must carry `result.duration`. A instead requires `result.success` and, when scored, `result.score.scaled`. B requires no specific result field, since its value travels as a Context Extension. C is false — each verb has its own distinct requirement, not a shared one.

    **Concept Tested:** Experienced Verb

    **See:** [Exactly Three Verbs](index.md#exactly-three-verbs)

---

#### 3. Why does a shuffled quiz need the Randomized Order Naming Rule instead of the ordinal Question IRI Fragment form?

<div class="upper-alpha" markdown>
1. Because ordinal fragments are only valid for MicroSim controls, never for questions
2. Because the Named Sub-Activity Fragment rule only applies to quizzes with fewer than five questions
3. Because when question order changes on every load, the ordinal position stops being a stable identity — a reload, not even an edit, would change which question sits at position 3 — so the question must instead be named by a stable label
4. Because a shuffled quiz cannot emit the Answered Verb at all
</div>

??? question "Show Answer"
    The correct answer is **C**. Once question order shuffles on every load, a position-based fragment no longer identifies the same question reliably, so a stable, named fragment is required instead. A misapplies ordinal fragments to controls, which use a different naming rule entirely. B invents an arbitrary question-count threshold. D is false — shuffled quizzes still emit the Answered Verb, just with a different fragment scheme.

    **Concept Tested:** Randomized Order Naming Rule

    **See:** [Fragments: Questions, Controls, and the Shuffle Problem](index.md#fragments-questions-controls-and-the-shuffle-problem)

---

#### 4. Why does the contract define a separate Control Object Type rather than mapping a slider or button to MicroSim?

<div class="upper-alpha" markdown>
1. Because Control Object Type only exists for backward compatibility with SCORM and carries no functional purpose
2. Because a control's IRI is fragment-qualified, and typing it MicroSim would mint a separate PageEngagement vertex per control, the same kind of failure the Trailing Slash Rule guards against
3. Because a control can never appear on the same page as a MicroSim
4. Because MicroSim is reserved exclusively for graded content, and controls are never graded
</div>

??? question "Show Answer"
    The correct answer is **B**. Because a control's IRI carries a fragment, typing it MicroSim would fragment one page's engagement rollup into a separate vertex per control — the same structural failure the Trailing Slash Rule was designed to prevent. A invents an unfounded historical rationale. C is false — controls commonly live inside MicroSims. D invents an unrelated grading restriction that plays no role in this design choice.

    **Concept Tested:** Control Object Type

    **See:** [What Kind of Object Is This?](index.md#what-kind-of-object-is-this)

---

#### 5. A student drags a slider on a MicroSim to change a simulation's speed. According to the three-verb set, which verb should the producer emit, and what result field is required?

<div class="upper-alpha" markdown>
1. Experienced Verb, with a required result.duration
2. Answered Verb, with a required result.success
3. Completed Verb, with no result field required
4. Interacted Verb, with no specific result field required — the value travels as a Context Extension instead
</div>

??? question "Show Answer"
    The correct answer is **D**. Manipulating a control matches the Interacted Verb exactly, which requires no specific `result` field, since the manipulated value travels as a Context Extension instead. A and B each apply a verb meant for a different kind of activity entirely. C names a verb this contract explicitly excludes as invalid.

    **Concept Tested:** Interacted Verb

    **See:** [Exactly Three Verbs](index.md#exactly-three-verbs)

---

#### 6. A textbook's quiz shuffles its five questions into a new random order every time a student loads the page. According to the fragment-naming rules, how should the producer identify "the question about mitochondria" across different loads?

<div class="upper-alpha" markdown>
1. Using its ordinal position each time, e.g., #q3, regardless of where it appears in the current shuffle
2. Using a randomly generated UUID fragment that changes on every page load
3. Using a stable, prefixed named fragment such as #q-mitochondria, so the same question is recognized as the same object no matter where it lands in the shuffle
4. Using no fragment at all, relying on object.id alone to distinguish the five questions
</div>

??? question "Show Answer"
    The correct answer is **C**. A stable, prefixed named fragment keeps the same question recognized as the same object across every shuffled load, which is exactly what the Randomized Order Naming Rule requires. A would silently merge six different questions into position-keyed rows across loads. B would break the identity needed for a rollup to group correctly at all. D would leave all five questions indistinguishable from each other.

    **Concept Tested:** Question IRI Fragment (randomized order)

    **See:** [Fragments: Questions, Controls, and the Shuffle Problem](index.md#fragments-questions-controls-and-the-shuffle-problem)

---

#### 7. A developer testing a new MicroSim hardcodes `district_id: "demo-district-42"` directly into the Statement body to speed up local testing, planning to remove it before shipping. Why does this violate the producer contract regardless of intent?

<div class="upper-alpha" markdown>
1. Because district_id is a Producer Excluded Field, assigned only by the gateway from the caller's authentication token — a producer claiming any value for it, even temporarily, is exactly the tenancy claim the isolation model exists to prevent
2. Because district_id does not exist as a field in the xAPI specification at all
3. Because hardcoding any field is permitted as long as a comment explains it will be removed later
4. Because district_id must always be supplied by the producer, and omitting it is the actual violation
</div>

??? question "Show Answer"
    The correct answer is **A**. `district_id` is one of the fields the Learning Record Store, not the producer, is the sole authority over, and even a temporary hardcoded value is exactly the kind of tenancy claim the isolation model is built to prevent. B is false — `district_id` is a real, meaningfully used field in this schema. C invents an exception the contract never grants. D reverses the actual rule entirely.

    **Concept Tested:** District ID Server-Assigned (Producer Excluded Field)

    **See:** [What a Producer Must Never Send](index.md#what-a-producer-must-never-send)

---

#### 8. Why does the Start Pause Dwell Pattern emit nothing when a MicroSim is started, waiting instead until Pause to emit a single Experienced Verb statement?

<div class="upper-alpha" markdown>
1. Because the Experienced Verb technically cannot be emitted at the moment a MicroSim starts, only when it stops
2. Because emitting a statement at Start would violate the Canonical Activity IRI rule
3. Because Start events are reserved exclusively for the Answered Verb
4. Because a student who starts a simulation and walks away produces no evidence worth a row, and a "started" statement with no matching "paused" would be an unclosed interval nothing downstream can score — the closed interval itself is the evidence, avoiding an unreliable two-row join under at-least-once delivery
</div>

??? question "Show Answer"
    The correct answer is **D**. Waiting until Pause means the closed interval itself is the evidence, avoiding both an unscoreable unclosed interval from an abandoned session and an unreliable two-row join under at-least-once delivery. A invents a technical impossibility not described anywhere in the chapter. B misapplies an unrelated IRI-naming rule. C invents a verb restriction that has nothing to do with dwell timing.

    **Concept Tested:** Start Pause Dwell Pattern

    **See:** [One Interval, One Statement: the Dwell Pattern](index.md#one-interval-one-statement-the-dwell-pattern)

---

#### 9. Why is the Textbook Version Grouping IRI a required field on every Statement, given that object.id already uniquely identifies the MicroSim or page itself?

<div class="upper-alpha" markdown>
1. Because object.id and the Grouping IRI are actually required to be identical strings, so the Grouping IRI is just a redundant confirmation
2. Because object.id names the activity itself, not which textbook and version a student was reading it through, and because a single MicroSim can be embedded by more than one textbook, a Statement that cannot be attributed to a specific textbook version cannot later be replayed against the content it described
3. Because the Grouping IRI is only required for the Interacted Verb, never for the other two verbs
4. Because ClickHouse cannot store a Statement at all without a Grouping IRI present, regardless of what the activity is
</div>

??? question "Show Answer"
    The correct answer is **B**. Because one MicroSim can be embedded across multiple textbooks, and `object.id` names only the activity itself, the Grouping IRI is the only field that ties a Statement back to a specific textbook version — essential for later replayability. A wrongly claims the two fields must match. C invents an unfounded per-verb restriction; the field is required across all three. D overstates a design requirement into an absolute storage-layer failure.

    **Concept Tested:** Textbook Version Grouping IRI

    **See:** [Tying a Statement to a Textbook Version](index.md#tying-a-statement-to-a-textbook-version)

---

#### 10. The Concept Extension Field's key is singular (`concept_id`), but the destination ClickHouse column is a plural array (`concept_ids`). Why doesn't this mismatch cause a data problem, and what real limitation does it reveal?

<div class="upper-alpha" markdown>
1. Because the mismatch is actually a bug that silently corrupts every Statement's concept_ids column
2. Because concept_id and concept_ids refer to two completely unrelated pieces of data with no connection to each other
3. Because the processor wraps the single extension value into a one-element array on the way into the plural column, which works correctly today but means a producer currently has no way to say that one page covers three concepts at once through this mechanism
4. Because the singular/plural mismatch is resolved by the Concept Enrichment Path immediately, making the extension field obsolete
</div>

??? question "Show Answer"
    The correct answer is **C**. The processor safely wraps the single value into a one-element array, so no data corruption occurs — but this also reveals that a producer currently has no way to attribute one Statement to multiple concepts through this mechanism. A wrongly labels working, intentional behavior as a bug. B falsely denies the direct relationship between the two fields. D overstates the Concept Enrichment Path's status, which the chapter explicitly describes as deferred, not implemented.

    **Concept Tested:** Concept Extension Field

    **See:** [Attaching a Concept Without a Concept Graph](index.md#attaching-a-concept-without-a-concept-graph)

---

#### 11. A developer argues, "the trailing slash on object.id is just a style preference — I'll skip it since it makes the URLs look cleaner without one." Evaluate this reasoning against what this chapter establishes about the Trailing Slash Rule.

<div class="upper-alpha" markdown>
1. The reasoning is sound, since trailing slashes are purely cosmetic and have no effect on how ClickHouse stores or queries data
2. The reasoning is incorrect: ClickHouse's ORDER BY treats a slash and no-slash version of a URL as different strings, so dropping the slash silently splits one page's engagement into two separate rows and mints a duplicate PageEngagement vertex — a real data-integrity consequence, not a cosmetic one
3. The reasoning is sound as long as the developer is consistent and never uses a trailing slash anywhere in the textbook
4. The reasoning is irrelevant, since the gateway automatically adds a trailing slash to every object.id regardless of what a producer sends
</div>

??? question "Show Answer"
    The correct answer is **B**. Far from cosmetic, the trailing slash directly affects how ClickHouse orders and groups rows, so omitting it silently fragments one page's engagement data into two separate, never-merging records. A dismisses a real, measurable consequence as purely stylistic. C wrongly assumes internal consistency alone prevents the splitting problem, when it still occurs regardless. D invents an automatic-correction behavior the gateway does not perform.

    **Concept Tested:** Trailing Slash Rule (evaluated)

    **See:** [Naming One Activity for a Lifetime](index.md#naming-one-activity-for-a-lifetime)

---

#### 12. A textbook author is building a new interactive diagram with an explore mode (students click parts to inspect them) and a quiz mode (students are asked to find a specific part). The diagram has a part labeled "chloroplast." Using this chapter's rules, construct the two object IRIs and their object types this diagram should emit, and explain why they must be two distinct objects rather than one.

<div class="upper-alpha" markdown>
1. Emit a single IRI, #chloroplast, typed Control for both modes, since both interactions happen on the same visual pixel
2. Emit #chloroplast typed Control for the explore-mode inspection (no result.success required) and #q-chloroplast typed Question for the quiz-mode challenge (requires result.success) — two distinct objects because inspecting and answering need different result fields to be honest, even though both concern the same labeled part
3. Emit #q-chloroplast for both modes, since anything involving a quiz must always use the Question type
4. Emit no fragment at all for either mode, relying on the page-level object.id alone to represent both interactions
</div>

??? question "Show Answer"
    The correct answer is **B**. The chapter's own test for splitting an IRI is whether two acts need different `result` fields to be honest — inspecting has no `success` field, answering must have one — so the two modes are correctly modeled as two separate objects sharing the same underlying concept. A wrongly collapses two objects that need different result semantics into one. C wrongly forces the explore-mode inspection into the Question type it does not belong to. D would make the five (or more) parts on the diagram indistinguishable from each other.

    **Concept Tested:** Object Definition Type Map / Control Object Type (design synthesis)

    **See:** [What Kind of Object Is This?](index.md#what-kind-of-object-is-this)

---
