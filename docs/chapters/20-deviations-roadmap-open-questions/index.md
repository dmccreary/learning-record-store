---
title: Spec Deviations, the Delivery Roadmap, and Open Questions
description: Where the design deliberately departs from the specification and why, the six milestones from a walking skeleton to production scale, and the seven questions the design specification admits it has not yet answered.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 12:21:26
version: 0.09
---

# Spec Deviations, the Delivery Roadmap, and Open Questions

## Summary

This chapter covers where the design deliberately diverges from the specification and why, the six milestones of the delivery roadmap from a walking skeleton to full production scale, and the seven open questions — like Neo4j licensing — still awaiting a decision.

## Concepts Covered

This chapter covers the following 16 concepts from the learning graph:

1. D-3 Partition Key Deviation
2. D-4 Privacy Threshold Deviation
3. D-5 Complementary Suppression
4. M0 Walking Skeleton
5. M1 Ingestion Complete
6. M2 Compression Graph Mastery
7. M3 Analytics Dashboards
8. M4 Admin Experiments
9. M5 Scale Production
10. Neo4j Licensing Question
11. ClickHouse Cloud Vs Self-Hosted
12. Gateway Language Trigger
13. BKT Parameter Fitting
14. Retention Vs Research Value
15. Multi-Region Question
16. MicroSim BKT Mapping Gap

## Prerequisites

This chapter builds on concepts from:

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 11: Architecture Decision Records and the Capacity Model](../11-adrs-and-capacity-model/index.md)
- [Chapter 12: Bayesian Knowledge Tracing for Mastery](../12-bayesian-knowledge-tracing/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)
- [Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../17-compose-makefile-supply-chain/index.md)

---

!!! mascot-welcome "The Spec's Own Confession"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 19 closed with a system that names its failures precisely and tests them deliberately. This chapter turns that same honesty on the design itself: three places where the implementation deliberately departs from what the specification says, six milestones between an empty repository and a production system, and seven questions the design specification admits it has not yet answered. Let's follow the record.

Every long-lived software project accumulates a gap between what its specification promises and what its design actually does. Most projects let that gap live in commit messages and chat threads, where it eventually becomes tribal knowledge nobody can point to. This project's design specification, `lrs-design-v1.md`, takes a different approach: it keeps a numbered table of every place its design diverges from the functional specification, `lrs-spec-v1.md`, together with the rationale for the divergence and a proposed amendment, written down in the same document. That table currently lists five rows. Two are closed — the specification was amended to match the design, and the divergence stopped being a divergence. Three remain open, and each is a live decision with a real consequence, not a rounding error.

- **Closed — D-1 and D-2.** Both concerned an early draft of the graph data model that treated a Statement as its own graph vertex, connected by edges like `PERFORMED` and `ABOUT`. Chapters 7 and 8 already covered why that model does not survive real ingest volume. The specification itself now prohibits per-statement vertices outright, and the summary-vertex model Chapter 8 walked through is the specification's current, adopted design.
- **Open — D-3, D-4, D-5.** Each still names a real difference between what the functional specification says and what the design does, and each carries a proposed amendment that has not yet been adopted into the spec text.

This ordering matters for how to read the rest of the chapter: a deviation is not automatically a defect to be fixed in the code. D-1 and D-2 show that the honest response can just as easily be *the spec was wrong — fix the spec.* D-3 through D-5 are still waiting for that same conversation to finish.

## D-3: Partitioning by Learner, Not Just by District

The functional specification's section on durability and ordering says the ingestion queue should be partitioned by `district_id`, sub-keyed by `student_key`. Read literally, every statement from a given district lands on one Kafka partition, which guarantees that statements about a single district process in strict relative order. The **D-3 Partition Key Deviation** replaces that single-field key with a composite one — `{district_id}:{student_key}` — and enforces per-tenant throughput limits separately, through Kafka client quotas.

The reasoning is capacity, not taste. A large district can enroll tens of thousands of students writing statements concurrently. Keying by `district_id` alone routes every one of those statements onto a single physical partition — precisely the write hotspot the specification's own scale-and-availability targets rule out elsewhere in the same document. A composite key spreads a large district's traffic across every partition the topic has, while a **Kafka client quota** — the rate-limiting mechanism Chapter 19 already introduced as the fix behind District Queue Flood containment — still keeps one noisy tenant from starving the others. The composite key buys something else too: it keeps every statement about the same learner on the same partition in strict order, which is the exact ordering guarantee Chapter 12's Bayesian Knowledge Tracing update depends on. Two out-of-order attempts from the *same* learner would corrupt a sequential probability update; two out-of-order attempts from two *different* learners in the same district would not, so only per-learner ordering needs to be guaranteed.

#### Diagram: District-Keyed versus Composite-Keyed Partitioning

<iframe src="../../sims/district-vs-composite-partition-key/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>District-Keyed versus Composite-Keyed Partitioning</summary>
Type: workflow
**sim-id:** district-vs-composite-partition-key<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Compare a Kafka queue partitioned by `district_id` alone against one keyed by `{district_id}:{student_key}`, and explain why the composite key avoids a write hotspot while still preserving the per-learner ordering that Bayesian Knowledge Tracing requires.

Purpose: Show two side-by-side Mermaid subgraphs, mirroring the "Before/After" pattern from Chapter 1's LMS-versus-LRS diagram, so the learner can directly compare partition placement under each keying scheme.

Left subgraph "district_id only (spec as written)": one box "Large District (40,000 students)" with arrows from five sample students all converging on a single box "Partition 0"; a second, smaller box "Small District (200 students)" with an arrow to "Partition 1." Annotate Partition 0 with a warning tag "Hotspot."

Right subgraph "{district_id}:{student_key} (design as built)": the same ten sample students, now fanned out across four partition boxes ("Partition 0" through "Partition 3") by a hash of the composite key, with the large district's students spread evenly across all four and the small district's students spread across two. Annotate with a tag "Load balanced; quota still caps the large district's total rate."

Interactive features: Every node has a Mermaid click directive. Clicking a partition box opens an infobox naming which failure this arrangement would trigger if unmitigated (referencing District Queue Flood from Chapter 19). Clicking a student node opens an infobox stating that all of that student's own statements always land on the same partition in both schemes, which is what preserves BKT's required per-learner ordering. Clicking the "Hotspot" tag explains that this is the exact condition the specification's scale-and-availability targets forbid.

Color coding: The hotspot partition shaded warning amber; the load-balanced partitions shaded the book's calm teal.

Responsive design: Both subgraphs stack vertically on narrow viewports, preserving all click handlers and the hotspot annotation.
</details>

!!! mascot-thinking "A Deviation Can Be Stricter Than the Spec"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice what D-3's proposed amendment actually asks for: not "ignore the ordering requirement," but "require per-learner ordering and tenant quotas, not district-level partitioning." The design still delivers everything the original rule was trying to protect — it just protects it with a mechanism that scales. A good deviation report reads less like a confession and more like a stricter, more specific version of the rule it replaces.

## D-4 and D-5: The Threshold That Would Blank Every Dashboard

The next two deviations both live in the functional specification's privacy-compliance section, and their proposed fixes are tightly coupled — D-5's amendment folds directly into D-4's. Read the specification's threshold rule literally: "no report may reveal a disaggregated result for a group smaller than the threshold," with a default threshold of 10 students. Applied without qualification, that single sentence breaks two of the report requirements Chapter 15 already covered: R-101, the Student Detail report a teacher pulls up for one learner at a time — a group of exactly one — and R-201, a Class Detail report for a section that might enroll eight or fifteen students, on either side of ten. A literal reading would suppress both reports for every teacher, on day one, regardless of section size.

The **D-4 Privacy Threshold Deviation** narrows the rule's scope rather than discarding it. The threshold still applies in full to cross-group comparisons, de-identified aggregate views, and benchmark reports — any view consumed by someone without a pre-existing relationship to the students it describes. It does not apply to a role's own directly-rostered scope: a teacher who already has a legal, contractual relationship with every student on their own class roster is not re-identifying anyone by viewing that roster's own data, because they already know exactly who is on it. The threshold's real purpose is stopping re-identification by a party who does *not* already have that relationship — not blocking a teacher from seeing their own class.

Narrowing the rule this way opens a second, subtler hole, and closing it is the whole content of **D-5 Complementary Suppression**. Suppose a cross-group report shows nine category counts, each above the group-size threshold, alongside a published row total. If exactly one of those nine cells is small enough to trigger suppression, hiding that cell alone accomplishes nothing — any reader can recover its exact value by subtracting the other eight visible cells from the published total. D-5 requires suppressing at least one additional, larger cell alongside the small one, so the withheld value cannot be reconstructed by arithmetic. This is the same **differencing attack** family Chapter 19's Privacy Adversarial Suite exists to catch: comparing two views of the same underlying data to recover a value that neither view discloses on its own.

The table below draws together all three open deviations now that each has been explained in the prose above.

| # | Spec Says | Design Does | Why | Proposed Amendment |
|---|---|---|---|---|
| D-3 Partition Key Deviation | Queue partitioned by `district_id`, sub-keyed by `student_key` | Key = `{district_id}:{student_key}`; noisy-neighbor protection via Kafka client quotas | District-level keying creates the exact write hotspot the scale targets forbid; the composite key still preserves per-learner ordering for BKT | Require per-learner ordering and tenant quotas, not district-level partitioning |
| D-4 Privacy Threshold Deviation | No report may reveal a group smaller than the threshold (default 10) | Threshold applies to cross-group, de-identified, and benchmark views; a role's directly-rostered scope is exempt | Read literally, R-101 breaks for every student (n=1) and R-201 for any class under 10; a teacher already knows their own roster | Scope the threshold to non-rostered views; add complementary suppression explicitly |
| D-5 Complementary Suppression | Threshold suppression | Adds complementary suppression | Suppressing one cell in a row that publishes its total suppresses nothing — the value is recoverable by subtraction | Fold into the D-4 amendment |

#### Diagram: Complementary Suppression Attack

<iframe src="../../sims/complementary-suppression-attack/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Complementary Suppression Attack</summary>
Type: chart
**sim-id:** complementary-suppression-attack<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: demonstrate, justify

Learning objective: Demonstrate how a single suppressed small-group value in a published table can be recovered by subtraction from the row's published total, and justify why complementary suppression — hiding a second, larger cell — is required to actually protect it.

Chart type: Grouped bar chart with a toggle control, showing nine category counts (e.g., "reading level bands" across a grade) plus their published total.

Default state: All nine bars visible with real values; total bar shown alongside, correct and summing to the nine visible bars.

Toggle 1 — "Threshold suppression only": the one bar below the group-size threshold (value 4, threshold 10) is redrawn as a hatched "Suppressed" bar with no numeric label; the total bar is unchanged. An automatically computed "Recovered value" readout beneath the chart subtracts the eight visible bars from the total and displays the exact suppressed value, labeled in red: "Recovered by subtraction: 4 — suppression failed."

Toggle 2 — "Complementary suppression (D-5)": the same small bar is hidden, and a second, larger bar (chosen automatically as the smallest bar still above threshold) is also redrawn as hatched "Suppressed." The "Recovered value" readout now shows "Cannot be recovered — two unknowns, one equation," in teal, because subtracting seven known bars from the total leaves two suppressed values and one equation, which is not solvable.

Interactive features: Clicking either toggle animates the transition and updates the readout live. Hovering any bar shows a tooltip with its category label and value (or "Suppressed" if hidden). A small annotation links this scenario to Chapter 19's Privacy Adversarial Suite and its differencing-attack tests.

Color scheme: Visible bars in the book's teal accent color; suppressed bars in a hatched pattern over muted gray; the "Recovered" readout text in warning red when the attack succeeds and teal when it fails.

Responsive design: Chart and readout stack vertically on narrow viewports; toggle controls remain full-width and tappable.
</details>

!!! mascot-warning "This Is Not a Theoretical Bug"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    The design specification is blunt about D-4: it is "the one worth acting on before M3" — the milestone that ships the first teacher-facing dashboards. Ship M3 without D-4's fix, and the literal threshold rule would suppress a teacher's own class roster on their very first login. A deviation that only affects an edge case is easy to defer. A deviation that blanks the product's first screen is not.

## Six Milestones from an Empty Repository to Production Scale

The design specification's delivery roadmap breaks a 26-week build into six milestones, each adding a working layer to a stack that already runs rather than building every layer in parallel and integrating them at the end. The philosophy is stated plainly in the roadmap's own closing line: **M0 Walking Skeleton** exists to make the deployment story real on week three rather than week twenty, and everything after it is added to infrastructure that is already up.

**M0 Walking Skeleton** (3 weeks) delivers the Docker Compose stack, the container image, the CLI, the bootstrap command, and a straight-line path from the ingestion gateway through Kafka into ClickHouse — proven by nothing more than a smoke test. Its exit criterion is `make up && make smoke` passing from a cold clone, the same Compose stack and Makefile Chapter 17 walked through in detail.

**M1 Ingestion Complete** (4 weeks) adds pseudonymization, the credential vault, accept-first provisioning of new textbooks, the reconciler, the dead-letter queue, and replay — the identity and durability mechanics Chapter 6 and Chapter 19 both covered. Its exit criterion is the ADL Conformance Test Suite passing, plus the specification's non-blocking-onboarding guarantee for new textbooks verified by the smoke test.

**M2 Compression Graph Mastery** (5 weeks) is the milestone this book's middle chapters are built around: the Neo4j graph structure from Chapter 7, ClickHouse rollup materialized views, the summarizer from Chapter 8, the BKT engine from Chapter 12, and roster ingestion via OneRoster. Its exit criterion is strict — replay must reproduce mastery scores bit-for-bit, the C-1/C-3/C-4/C-6 compression test suite from Chapter 19 must pass, and graph lag under load must stay under 90 seconds.

**M3 Analytics Dashboards** (5 weeks) delivers the analytics API, the privacy filter — which is exactly where D-4 and D-5's fix must land — the named report requirements R-101, R-102, R-104, R-201, R-202, and R-209, and the first two dashboard views, My Classes and Student Detail. Its exit criterion is a latency budget: 95th-percentile response under two seconds for a 40-student section.

**M4 Admin Experiments** (5 weeks) adds the administrative API and UI, role-based access control, an audit log, and the experiment service with its readout — a preview of the A/B-testing machinery Chapter 31 covers in full. Its exit criterion requires assignment stickiness to hold across an allocation ramp and a sample-ratio mismatch check to stay green.

**M5 Scale Production** (4 weeks) is the final milestone: Helm charts, Kubernetes-based autoscaling, managed data stores, a disaster-recovery drill, and the full report catalog. Its exit criterion is a load test sustaining 10,000 statements per second and absorbing a 50,000-statement burst without falling over, plus a passing restore drill.

#### Diagram: Delivery Roadmap Timeline

<iframe src="../../sims/delivery-roadmap-m0-to-m5-timeline/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Delivery Roadmap Timeline</summary>
Type: timeline
**sim-id:** delivery-roadmap-m0-to-m5-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/computer-science/tree/main/docs/sims/software-development-lifecycle<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, summarize

Learning objective: Sequence the six delivery milestones by duration and cumulative week number, and recall each milestone's headline deliverable and exit criterion.

Time period: Week 0 through week 26, shown as six contiguous, non-overlapping ranges rather than calendar dates.

Orientation: Horizontal, left to right, each milestone rendered as a block whose width is proportional to its duration in weeks.

Events:

- Weeks 0–3: M0 Walking Skeleton — Compose stack, image, CLI, bootstrap, gateway to Kafka to ClickHouse; exit: `make up && make smoke` passes cold
- Weeks 3–7: M1 Ingestion Complete — pseudonymization, vault, accept-first provisioning, reconciler, DLQ, replay; exit: ADL conformance suite passes
- Weeks 7–12: M2 Compression Graph Mastery — Neo4j structure, rollup views, summarizer, BKT engine, roster ingest; exit: replay reproduces mastery bit-for-bit, C-1/C-3/C-4/C-6 pass, graph lag under 90s
- Weeks 12–17: M3 Analytics Dashboards — analytics API, privacy filter, R-101/102/104/201/202/209, My Classes + Student Detail; exit: P95 under 2s for a 40-student section
- Weeks 17–22: M4 Admin Experiments — admin API/UI, RBAC, audit, experiment service and readout; exit: assignment stickiness holds, SRM check green
- Weeks 22–26: M5 Scale Production — Helm, autoscaling, managed stores, DR drill, full report catalog; exit: loadgen sustains 10k/sec, absorbs 50k burst, restore drill passes

Interactive features: Clicking any milestone block opens an infobox with its full deliverable list and exit criterion, worded exactly as in the chapter's prose. A "Cumulative week" readout above the timeline updates as the learner hovers each block, so the learner can see at a glance that M3 (dashboards) does not complete until week 17 of 26.

Visual style: Each block shaded a distinct hue along a single teal-to-amber gradient, running cooler for earlier, more foundational milestones and warmer for later, user-facing ones, so color alone hints at "infrastructure" versus "product."

Responsive design: The timeline resizes to the width of its containing element; on narrow viewports, milestone labels abbreviate to their M-number and expand on tap.
</details>

!!! mascot-tip "Read the Exit Criterion, Not the Deliverable List"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    A deliverable list tells you what got built. An exit criterion tells you what got *proven*. M2's deliverable list is a lot of infrastructure — a graph, some views, an engine — but its exit criterion is the sharper claim: replay reproduces mastery bit-for-bit. That is the same discipline Chapter 19's testing layers were built around, applied one milestone at a time instead of one test suite at a time.

## Seven Questions the Design Specification Leaves Open

The deviations table names disagreements that already have a proposed resolution, even if the specification text has not yet been amended to match. The open-questions section names something different: decisions nobody has made yet, each assigned an owner and, where one exists, a milestone deadline.

- **Neo4j Licensing Question.** Neo4j Community cannot cluster, so it has no high-availability story on its own; Neo4j Enterprise and its managed offering Aura both carry real cost at this project's scale. Memgraph is a credible drop-in alternative with an Apache-2 core. The decision changes nothing in the code and everything in the budget, which is why it is owned by architecture and due before M2.
- **ClickHouse Cloud Vs Self-Hosted.** At roughly 28 terabytes and seven years of retention, this is a six-figure decision either way. It needs a total-cost-of-ownership model weighed against an S3 tiering plan, owned by infrastructure, due before M5.
- **Gateway Language Trigger.** The ingestion gateway stays written in Python unless real batch sizes trend toward one statement per batch — the point at which Python's per-request overhead, rather than raw throughput, becomes the bottleneck. M1 instruments the batch-size distribution so the eventual M5 decision has real data behind it rather than an opinion.
- **BKT Parameter Fitting.** Chapter 12's per-concept Expectation-Maximization fit runs nightly over the ClickHouse log. Its cold-start priors, borrowed from a concept's taxonomy category until that concept accumulates enough of its own data, are a guess until real data arrives — revisited after M3 with an accuracy evaluation against held-out quiz outcomes.
- **Retention Vs Research Value.** The specification's privacy section wants a FERPA-aligned purge; its future-work section wants longitudinal predictive models. Those two goals conflict directly, and resolving them needs a de-identification policy that survives purge — likely irreversible aggregation at the 13-month retention-tier boundary. Owned jointly by privacy and research.
- **Multi-Region Question.** Out of scope for version one, but district data-residency requirements will eventually force the question. The same district-keyed partitioning behind D-3 makes regional sharding tractable later; nothing in the current design forecloses it.
- **MicroSim BKT Mapping Gap.** The most architecturally unresolved of the seven, covered in its own section below.

The table below reinforces the seven questions just introduced, ordered from narrowest scope to widest.

| Open Question | What's Undecided | Owner | Decide By |
|---|---|---|---|
| Gateway Language Trigger | Whether real batch sizes justify a faster gateway language than Python | Architecture | Instrument in M1; decide at M5 |
| BKT Parameter Fitting | Whether taxonomy-category cold-start priors hold up against real accuracy data | Data science | Revisit after M3 |
| Neo4j Licensing Question | Community (no clustering) vs. Enterprise/Aura (real cost) vs. Memgraph | Architecture | Before M2 |
| ClickHouse Cloud Vs Self-Hosted | Six-figure infrastructure decision needing a TCO model | Infrastructure | Before M5 |
| Retention Vs Research Value | FERPA-aligned purge vs. longitudinal predictive modeling | Privacy + research | Unscheduled |
| Multi-Region Question | Data-residency-driven regional sharding | Architecture | Unscheduled |
| MicroSim BKT Mapping Gap | Where soft-correctness scoring for continuous interactions lives | Architecture + MicroSim tooling | Unscheduled retrofit spec |

## The Deepest Open Question: Mapping MicroSim Evidence into Mastery

Chapter 12 introduced Bayesian Knowledge Tracing's update rule and mentioned, briefly, that non-binary evidence — dwell time, interaction depth — gets mapped to a soft-correctness value between 0 and 1 before it blends into a concept's mastery update, at a lower evidence weight than a graded response. The design specification is candid that this section names the mapping without yet assigning it an owner or a location — Open Question 7, the **MicroSim BKT Mapping Gap**.

The gap is concrete, not hand-wavy. The event schema's `result_score` and `result_success` columns assume the *emitting client* already computed a per-statement score, which fits a graded multiple-choice question naturally but does not fit a continuous, exploratory control like a slider or a drag target. No single `interacted` statement from a physics MicroSim's slider has a "correct" value to report — the signal that matters lives in the shape of the whole session: how much of the parameter range the learner explored, how many times they reversed direction, how long they dwelled before moving on. That session-shaped signal is exactly what the `MicroSimEngagement` grain, one of Chapter 8's summary vertices, already captures. Nothing today feeds that grain's fields into `ConceptMastery`, the mastery-tracking vertex Chapter 12 walked through.

Two candidate designs sit on the table, and the open question is which one wins, not whether the gap gets closed. A **stream-side mapping** would add a component that computes soft correctness from raw interaction facts using a mapping registered per MicroSim — keeping scoring logic entirely server-side, at the cost of needing a registry that every new MicroSim has to be added to. A **client-side mapping** would instead have authoring tooling compute the soft-correctness proxy itself and embed it directly in `result.score` on each statement a MicroSim emits — a simpler ingestion pipeline, but one that reopens a two-codebases problem: the same scoring logic then has to be authored once inside the MicroSim's own client code and again wherever it is reviewed and versioned for the LRS, with no mechanism keeping the two copies in sync.

#### Diagram: MicroSim Evidence to BKT Mapping Gap

<iframe src="../../sims/microsim-bkt-mapping-gap-workflow/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>MicroSim Evidence to BKT Mapping Gap</summary>
Type: workflow
**sim-id:** microsim-bkt-mapping-gap-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/spec-quality-checklist<br/>

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: compare, critique

Learning objective: Trace two candidate designs for turning raw MicroSim interaction facts into a soft-correctness value that feeds a concept's Bayesian Knowledge Tracing update, and critique the trade-off each one makes.

Purpose: A Mermaid flowchart starting from one shared source node and branching into two competing designs, so the learner can compare them side by side rather than read about them only in prose.

Shared start: "MicroSim emits `interacted` statements (dwell time, range covered, direction reversals)" -> "MicroSimEngagement grain (Chapter 8 summary vertex)" -> decision node "Where does soft-correctness get computed?"

Branch A "Stream-side mapping": "MicroSimEngagement grain" -> "New stream-side component" -> "Looks up mapping in a per-MicroSim registry" -> "Computes soft-correctness in [0,1]" -> "Feeds ConceptMastery's BKT update". Tag: "Pro: scoring logic stays server-side. Con: needs a registry every new MicroSim must be added to."

Branch B "Client-side mapping": "MicroSim authoring tooling" -> "Computes soft-correctness proxy at authoring time" -> "Embeds value in `result.score` on each emitted statement" -> "Feeds ConceptMastery's BKT update directly, no new component". Tag: "Pro: no new pipeline component. Con: reopens a two-codebases problem — the same scoring logic must be authored and kept in sync in both the MicroSim's client code and wherever it is reviewed for the LRS."

Interactive features: Every node has a Mermaid click directive. Clicking either branch's final tag node opens an infobox with the full pro/con text from the prose above. Clicking the shared decision node opens an infobox stating this is Open Question 7, owned jointly by architecture and MicroSim tooling, tracked as an open retrofit-specification task.

Color coding: Branch A shaded teal; Branch B shaded amber; the shared start and decision nodes in neutral gray.

Responsive design: The two branches stack vertically below the shared start node on narrow viewports, preserving all click handlers and tag text.
</details>

!!! mascot-encourage "An Open Question Is Not a Failure"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Seven unresolved questions in a specification this detailed might look like a gap in the work. Read it the other way instead: a spec that names its own unknowns, assigns each one an owner, and pins most of them to a milestone deadline has done the hard part already. The dangerous specification is not the one with open questions — it is the one that never wrote them down.

## Bringing the Three Threads Together

Deviations, milestones, and open questions are three views of the same underlying discipline: write down what you don't yet know, and revisit it on a schedule rather than by accident. D-3 through D-5 are deviations because someone already found the disagreement and proposed a fix — they are waiting on a specification edit, not a decision. The seven open questions are earlier in that same process: someone has named the tension and assigned an owner, but no fix has been proposed yet. And the roadmap is what turns both into a schedule — D-4 has to land by M3 or the first dashboards ship blank, the Neo4j Licensing Question has to resolve by M2 or the graph has no home, and the MicroSim BKT Mapping Gap carries no deadline at all yet, which is itself an honest admission that architecture has not decided how urgent it is.

## Key Takeaways

- **D-3 Partition Key Deviation** replaces district-only Kafka partitioning with a composite `{district_id}:{student_key}` key plus tenant quotas, avoiding a write hotspot while preserving the per-learner ordering Bayesian Knowledge Tracing requires.
- **D-4 Privacy Threshold Deviation** scopes the group-size suppression threshold to non-rostered views only, so a teacher's own class roster is not blanked by a rule meant to stop re-identification by outsiders.
- **D-5 Complementary Suppression** closes the arithmetic hole D-4 would otherwise leave open, by suppressing a second, larger cell whenever one small cell is hidden in a row that publishes its total.
- The delivery roadmap's six milestones — **M0 Walking Skeleton**, **M1 Ingestion Complete**, **M2 Compression Graph Mastery**, **M3 Analytics Dashboards**, **M4 Admin Experiments**, and **M5 Scale Production** — each add a working layer to infrastructure that already runs, and each ships against a strict, falsifiable exit criterion rather than a deliverable checklist alone.
- The **Neo4j Licensing Question** and **ClickHouse Cloud Vs Self-Hosted** are the two open questions with the largest budget consequences, decided before M2 and M5 respectively.
- The **Gateway Language Trigger** and **BKT Parameter Fitting** are both instrumented-then-revisited questions — decided with real operational data rather than upfront guesswork.
- **Retention Vs Research Value** and the **Multi-Region Question** are both structural tensions with no scheduled deadline, flagged early so the eventual decision does not surprise anyone.
- The **MicroSim BKT Mapping Gap** is the specification's most architecturally open question: whether soft-correctness scoring for continuous MicroSim interactions belongs in a new stream-side component or in client-side authoring tooling, with neither option yet chosen.

!!! mascot-celebration "You've Read the Spec the Way Its Authors Meant It"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You can now separate a resolved deviation from an open one, place any of the six milestones on the roadmap by its exit criterion rather than its deliverable list, and name which of the seven open questions still needs a decision before which milestone. What does the evidence show? A design this honest about what it doesn't know yet is one worth building on top of — and building on top of it means knowing what it costs and where it runs. In [Chapter 21: Hardware Sizing, Cost, and the Development Environment](../21-hardware-cost-dev-environment/index.md), we turn from open questions to the concrete budget and machine you would actually need to bring this design to life.
