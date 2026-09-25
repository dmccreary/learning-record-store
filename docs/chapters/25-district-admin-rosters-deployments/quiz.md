---
title: "Quiz: District Administrator - Rosters, Deployments, and Registries"
description: Review questions on the District Management UI, School Course Section UI, and Textbook Deployment UI — roster configuration, retention and legal holds, enrollment, term rollover, and content deployment.
social:
   cards: false
---
# Quiz: District Administrator - Rosters, Deployments, and Registries

Test your understanding of this project's District Management UI, School Course Section UI, and Textbook Deployment UI with these review questions.

---

#### 1. What does Roster Source Configuration let a district connect to the LRS?

<div class="upper-alpha" markdown>
1. A OneRoster REST or CSV endpoint, or a direct Student Information System connector, along with the credentials that connection needs
2. A direct database connection allowing the LRS to write student names into a third-party system
3. A payment processor for collecting district subscription fees
4. A content delivery network for serving MicroSim assets faster
</div>

??? question "Show Answer"
    The correct answer is **A**. Roster Source Configuration connects the LRS to a district's OneRoster feed or direct SIS connector, along with the credentials that connection needs, since the LRS never becomes the authoritative source of student identity. B reverses the actual direction of data flow. C and D each invent an unrelated function this screen does not perform.

    **Concept Tested:** Roster Source Configuration

    **See:** [The District Management UI: Standing Up and Configuring a District](index.md#the-district-management-ui-standing-up-and-configuring-a-district)

---

#### 2. What is the key difference between the Retention Policy and the Legal Hold Toggle?

<div class="upper-alpha" markdown>
1. Retention Policy and the Legal Hold Toggle are two names for the same control, shown twice on the same screen for convenience
2. The Legal Hold Toggle permanently deletes the retention schedule once activated
3. Retention Policy only applies to Neo4j, while the Legal Hold Toggle only applies to ClickHouse
4. Retention Policy is the everyday, scheduled rule governing how long data is kept; the Legal Hold Toggle is an exception switch that suspends that schedule for specific records without altering the underlying policy
</div>

??? question "Show Answer"
    The correct answer is **D**. Retention Policy is the ordinary scheduled rule, while the Legal Hold Toggle is a separate exception mechanism that pauses that schedule for specific records without changing the policy itself. A wrongly conflates two distinct controls. B misdescribes what turning on a hold actually does — it pauses purging, not deletes the schedule. C invents a store-specific restriction neither control actually has.

    **Concept Tested:** Retention Policy / Legal Hold Toggle

    **See:** [The District Management UI: Standing Up and Configuring a District](index.md#the-district-management-ui-standing-up-and-configuring-a-district)

---

#### 3. Why does every manual override in the Enrollment Editor require a logged reason?

<div class="upper-alpha" markdown>
1. Because the Enrollment Editor cannot function at all without a reason field being filled in first
2. Because logged reasons are automatically forwarded to the district's legal counsel
3. Because roster-driven enrollment handles the overwhelming majority of cases correctly, so a manual override is an exception that needs an auditable, defensible record rather than an untracked change
4. Because manual overrides are disabled by default and the reason field is what re-enables them
</div>

??? question "Show Answer"
    The correct answer is **C**. Because automated roster sync handles most enrollment correctly, the reason field turns the rare manual exception into an auditable, defensible decision rather than an untracked change. A and D each invent a functional gate the reason field does not actually serve as. B fabricates an automatic legal escalation the chapter never describes.

    **Concept Tested:** Enrollment Editor

    **See:** [The School / Course / Section UI: Running the Building Day to Day](index.md#the-school-course-section-ui-running-the-building-day-to-day)

---

#### 4. What does a Term / Academic-Year Rollover actually do to a course's prior-term sections?

<div class="upper-alpha" markdown>
1. It deletes the prior term's sections entirely to make room for the new term
2. It archives the prior term's sections, preserving their historical data intact, and rolls section templates forward into the new term
3. It merges the prior term's sections into the new term's sections, combining their enrollment data
4. It leaves prior-term sections active and simply adds new sections alongside them with no archival step
</div>

??? question "Show Answer"
    The correct answer is **B**. Rollover archives prior-term sections with their historical data intact and rolls section templates forward, so a course keeps its shape year to year without manual rebuilding. A wrongly destroys historical data the mechanism is built to preserve. C invents a data-merging behavior that would corrupt distinct terms' records. D omits the archival step that is central to the mechanism.

    **Concept Tested:** Term Academic Year Rollover

    **See:** [The School / Course / Section UI: Running the Building Day to Day](index.md#the-school-course-section-ui-running-the-building-day-to-day)

---

#### 5. A district wants to move a section from its current textbook version to a newer one, but not until the start of next month, so students don't change textbooks mid-lesson. Which tool handles this, and how?

<div class="upper-alpha" markdown>
1. The Provisional Reconcile Queue, by promoting the new version's provisional stub immediately
2. The Enrollment Editor, by re-enrolling every student in a new section
3. The MicroSim Registry View, by changing the MicroSim's status to approved
4. The Deployment Editor, which can schedule a version rollover for a chosen future date rather than switching instantly
</div>

??? question "Show Answer"
    The correct answer is **D**. The Deployment Editor is specifically built to schedule a version rollover for a chosen date, letting a district avoid switching a section's textbook version mid-lesson. A confuses this with an unrelated reconciliation task. B invents an unnecessary re-enrollment step. C confuses deployment scheduling with an unrelated MicroSim status field.

    **Concept Tested:** Deployment Editor

    **See:** [The Textbook Deployment UI: Binding Content to Classrooms](index.md#the-textbook-deployment-ui-binding-content-to-classrooms)

---

#### 6. A new textbook version's provisional stub appears in the Provisional Reconcile Queue, and the Reconciliation Worker has not found a confident candidate match for it. What should the administrator do, according to this chapter?

<div class="upper-alpha" markdown>
1. Wait indefinitely, since an entry with no confident match can never be promoted
2. Delete the stub entirely, since an unmatched stub is assumed to be invalid
3. Open Manual Mapping and select the correct published Textbook, TextbookVersion, MicroSim, or Concept themselves
4. Ignore it, since unmatched stubs do not affect any statement's queryability
</div>

??? question "Show Answer"
    The correct answer is **C**. For the rarer no-confident-match case, the queue offers a manual mapping path where the administrator points the stub at the correct published metadata themselves. A wrongly assumes no path forward exists. B wrongly treats an unmatched stub as invalid rather than simply unresolved. D understates the consequence — an unreconciled stub is not yet richly queryable by title, concept coverage, or version.

    **Concept Tested:** Provisional Reconcile Queue

    **See:** [The Textbook Deployment UI: Binding Content to Classrooms](index.md#the-textbook-deployment-ui-binding-content-to-classrooms)

---

#### 7. A MicroSim shows a `provisional: true` flag alongside a `built` status. Why aren't these two fields contradictory, given that "provisional" and "scaffold" might both sound like "not finished yet"?

<div class="upper-alpha" markdown>
1. Because provisional describes how a node entered the graph — auto-created because a statement mentioned it, awaiting reconciliation — while a status like built or scaffold describes the content's actual build maturity; a fully finished MicroSim can still be freshly provisional if its first statement just arrived
2. Because provisional and built are actually the same field displayed under two different names for legacy reasons
3. Because a MicroSim can only be provisional if its status is also scaffold; built and provisional together indicate a data-entry error
4. Because provisional refers to Neo4j while built refers to ClickHouse, so the two never appear on the same record
</div>

??? question "Show Answer"
    The correct answer is **A**. Provisional answers how a record entered the graph, while a build-maturity status answers how finished the content itself is — two entirely different questions that can coexist on the same MicroSim in any combination. B wrongly collapses two distinct fields into one. C invents a dependency between the two fields that does not exist. D fabricates an unrelated store-specific restriction.

    **Concept Tested:** MicroSim Registry View (provisional vs. status distinction)

    **See:** [The Textbook Deployment UI: Binding Content to Classrooms](index.md#the-textbook-deployment-ui-binding-content-to-classrooms)

---

#### 8. Why is the District Management UI reserved for the System Administrator role rather than being delegated to the District Administrator who will actually manage the district day to day?

<div class="upper-alpha" markdown>
1. Because District Administrators are not trusted to configure a roster source correctly
2. Because creating a district is the one action that establishes the tenant boundary itself, and the chapter is explicit that even a District Administrator cannot create the district they will go on to manage — that authority sits one level above, with the role that has global, cross-district scope
3. Because the System Administrator personally performs every roster sync for every district in the system
4. Because the District Management UI does not actually exist as a real screen; it is only a specification placeholder
</div>

??? question "Show Answer"
    The correct answer is **B**. Establishing the tenant boundary itself is reserved one level above the role that will manage it day to day, consistent with the chapter's explicit statement that not even a District Administrator can create their own district. A invents a trust-based rationale the chapter never states. C overstates the System Administrator's ongoing involvement, which is limited to district creation, not routine roster syncs. D contradicts the chapter, which describes this UI in concrete detail.

    **Concept Tested:** District Management UI

    **See:** [The District Management UI: Standing Up and Configuring a District](index.md#the-district-management-ui-standing-up-and-configuring-a-district)

---

#### 9. A district administrator, under time pressure before the first day of school, considers skipping the dry-run diff preview and applying a roster sync directly, reasoning that "the SIS export is always correct anyway." Evaluate this reasoning against what this chapter establishes about the dry-run mechanism's purpose.

<div class="upper-alpha" markdown>
1. The reasoning is sound, since the dry-run preview only exists to slow administrators down unnecessarily
2. The reasoning is sound as long as the sync has succeeded at least once before, since past success guarantees future correctness
3. The reasoning is risky: the dry-run preview exists precisely to catch the rare but real case where a SIS export glitches — such as dropping half a grade level — and roster data seeds enrollments, sections, and every SectionRollup computed from them, so an unreviewed bad sync propagates broadly before anyone notices
4. The reasoning is irrelevant, since the dry-run preview cannot be skipped under any circumstances regardless of administrator preference
</div>

??? question "Show Answer"
    The correct answer is **C**. The dry-run preview exists precisely for the rare-but-real glitch case, and because roster data seeds so much downstream structure, skipping review lets a bad sync propagate widely before anyone notices. A dismisses the preview's real, stated purpose. B wrongly assumes past reliability guarantees future correctness, which the chapter's own "read every removal line" advice directly contradicts. D overstates the mechanism as unbypassable, when the scenario describes an administrator actively considering skipping it.

    **Concept Tested:** District Management UI (dry-run diff preview, evaluated)

    **See:** [The District Management UI: Standing Up and Configuring a District](index.md#the-district-management-ui-standing-up-and-configuring-a-district)

---

#### 10. A district administrator notices an unusually high count of an unrecognized verb arriving from a specific textbook's statements, alongside a growing number of dead-lettered statements from that same textbook around the same time period. Design a reasonable investigative workflow using the tools this chapter describes to determine whether these two signals are related and what to do about them.

<div class="upper-alpha" markdown>
1. Rotate the textbook's ingest key immediately without further investigation, since any anomaly warrants an automatic credential reset
2. Use the Verb Vocabulary Browser to inspect the unrecognized verb's usage count and context, and the Dead-Letter Inspector to review the redacted malformed statements from the same textbook and time window — comparing whether the same upstream change (e.g., a new field or verb introduced by a textbook update) explains both signals, then decide whether to canonicalize the verb, fix the textbook's producer code, or both
3. Delete all statements from that textbook to avoid further data quality issues
4. Ignore both signals, since unrecognized verbs and dead-lettered statements are unrelated by design and never worth correlating
</div>

??? question "Show Answer"
    The correct answer is **B**. Correlating the Verb Vocabulary Browser's unknown-verb data with the Dead-Letter Inspector's redacted malformed statements, both scoped to the same textbook and time window, is exactly the kind of investigative use these two tools were designed to support, letting the administrator distinguish a legitimate new verb from a producer-side bug. A jumps to an unrelated, disruptive action — key rotation — without investigating the actual signals. C is a drastic, data-destroying overreaction. D wrongly assumes the two signals cannot be related, when a single upstream change could plausibly explain both.

    **Concept Tested:** Verb Vocabulary Browser / Dead-Letter Inspector

    **See:** [Rounding Out the Surface: Credentials, Vocabulary, and Experiments at a Glance](index.md#rounding-out-the-surface-credentials-vocabulary-and-experiments-at-a-glance)

---
