---
title: Proving the Architecture - the MVP Plan
description: The project's own minimum-viable build plan for testing the falsifiable claim that graph write rates stay flat under a 5x ingest burst, including the bugs found in its own proof harness and the five build steps to a measured result.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 12:47:22
version: 0.09
---

# Proving the Architecture: the MVP Plan

## Summary

This chapter covers the project's own minimum-viable build plan: the falsifiable claim it exists to prove, real defects it found in its own test harness along the way, and the five build steps that take the architecture from a cold clone to a measured, burst-insensitive graph write rate.

## Concepts Covered

This chapter covers the following 15 concepts from the learning graph:

1. MVP Architecture Proof
2. Burst Insensitivity Claim
3. Smoke Harness Decorative Check
4. Mastery Path Disconnection
5. Lift Vs Rewrite Decision
6. Raw Column PII Hole
7. Last Seen Type Fix
8. Mastery Join Fix
9. MVP Step 1 Foundation
10. MVP Step 2 Ingest Path
11. MVP Step 3 Loadgen Contract
12. MVP Step 4 Compression Graph
13. MVP Step 5 Burst Proof
14. Vault Net Isolation
15. MVP Deferred Scope

## Prerequisites

This chapter builds on concepts from:

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 11: Architecture Decision Records and the Capacity Model](../11-adrs-and-capacity-model/index.md)
- [Chapter 12: Bayesian Knowledge Tracing for Mastery](../12-bayesian-knowledge-tracing/index.md)
- [Chapter 13: Component Design in Depth](../13-component-design-in-depth/index.md)
- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../14-kafka-clickhouse-graph-schema/index.md)
- [Chapter 16: The Container Image and the Role Dispatcher CLI](../16-container-image-and-cli/index.md)

---

!!! mascot-welcome "The Budget Is Set. Now We Test the Claim."
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 21 closed with a development host sized for exactly one measurement. This chapter is that measurement: the project's own minimum-viable build plan, the bugs it found hiding inside its own proof harness, and the five steps that turn a cold clone into a chart. Let's follow the record.

Every chapter before this one has described the Learning Record Store's design — the graph model, the compression pipeline, the twelve core functions, the hardware it needs to run. None of it has run. As of this project's own history, `docs/specs/` holds a mature functional specification and a matching design document, and every commit in the repository is documentation. The Dockerfile, the Compose file, the ClickHouse schema, and the graph constraints exist only as code blocks embedded inside prose. This chapter covers the plan that closes that gap: not by building the whole system end to end, but by building just enough of it to test the one claim the entire architecture rests on.

## Proving the Architecture Before Chasing a User

The design document's own roadmap lays out a twenty-six-week, layer-by-layer build that does not reach a real user until week twenty-one, because the dashboards a teacher or district administrator would look at need a roster, a signed district agreement, and privacy consent in place first — none of which code alone can produce. Waiting twenty-one weeks to learn whether the central architectural bet even works is a long time to be wrong.

The **MVP Architecture Proof** is the alternative: a minimum-viable build plan that deliberately skips the user-facing layers and drives straight at the one design decision every other decision in this book depends on. It does not try to reach a classroom. It tries to reach a measurement. Every other choice in this chapter — which files to reuse, which bugs to fix first, which steps to build in what order — exists in service of getting to that one chart as fast as honestly possible.

## The Claim the Architecture Rests On

Chapter 11 introduced the capacity model's central distinction: some parts of this system scale with *event rate* (statements per second) and some scale with *population* (distinct students and concepts). The compression pipeline from Chapter 8 turns the first into the second — collapsing many small statements about one student and one concept into a single summary vertex, updated in place rather than appended to.

The **Burst Insensitivity Claim** is what that mechanism predicts, stated as a number: at the design's default sixty-second summarization cadence, the graph write rate holds at roughly 2,500 upserts per second regardless of how hard ingest is pushed, because a burst means each already-active student emits more events, not that five times as many students appear. Distinct active (student, concept) pairs per sync window barely move even when statement volume quintuples, and write rate tracks distinct active pairs, not statement count.

That is a **falsifiable** claim: multiply the ingest rate by five, and watch what the graph write rate does. Two outcomes are possible, and only one is good news.

- **If graph writes stay flat under a 5× ingest burst**, the compression architecture works as designed — the graph tier never has to scale with statement volume, and every downstream conclusion in this book (the $10,300/month production estimate, the Neo4j licensing question, the constraint that forbids one graph vertex per statement) is standing on solid ground.
- **If graph writes climb roughly in step with ingest**, the architecture does not work as designed — compression is not decoupling the graph from the event stream, and the constraints and cost model built on top of it need to be revisited before anything else is built.

!!! mascot-thinking "A Claim That Can Fail Is Worth More Than One That Can't"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice the shape of this claim: a specific number (~2,500 upserts/sec), a specific stress test (5× ingest), a specific pass/fail line (flat versus climbing). A design document that only says "the architecture should scale well" cannot be wrong in any way anyone could catch. This one can — which is exactly what makes it worth testing rather than trusting.

Before this MVP plan existed, that claim had never been executed against real code — only reasoned about on paper. The table below restates the full set of claims this build tests, not just the headline one.

| Claim | What it means | How it is tested |
|---|---|---|
| Burst insensitivity | Graph writes decouple from ingest rate | Run `loadgen` at rate N and 5N; graph upserts/sec stays flat |
| No per-statement vertices | The graph never grows one vertex per event | Query for statement-shaped nodes; count must be zero, enforced by a constraint |
| Idempotent materialization | Running the summarizer twice produces the same graph | Run it twice; compare the graph byte-for-byte |
| Observable compression ratio | The statements-to-vertex ratio can be measured, not assumed | Compute the ratio on seeded data; assert it clears 20:1 |
| Reproducibility from the log | The graph can be rebuilt from the durable event log alone | Rebuild the graph from a replay and compare to the original |
| Non-blocking ingest | A dead graph store never stops statements from being recorded | Kill the graph database; confirm the ingest endpoint still returns success |

## Two Bugs Hiding Behind a Green Checkmark

Before writing a line of new code, the MVP plan audited the design document's own proof harness — and found two problems that made testing this claim urgent rather than academic, because the harness meant to prove the architecture could not be trusted to prove anything.

The first is a **Smoke Harness Decorative Check**: a step inside the design's own `smoke.sh` script that looks like a pass/fail test but cannot actually fail. The script chains commands with `&&`, and in a shell script that pattern silently swallows a failing check unless every command in the chain is the final one — so a line written as "query the store, grep for the expected result, print a checkmark" prints the checkmark whether or not the grep found anything. One step has no assertion at all: it prints a compression ratio to the screen and falls straight through to an unconditional "smoke passed" message, regardless of that ratio's value. A script structured this way is decorative in the most literal sense — it renders the appearance of verification without performing it.

The second is the **Mastery Path Disconnection**: the route a student's Bayesian Knowledge Tracing mastery score — the number Chapter 12 built an entire probabilistic update rule around — is supposed to take from computation to the graph does not actually exist end to end in the design as written. The component that reads recent statements and produces mastery-relevant aggregates does not select the mastery column the graph-writing step expects, the materialized view that is supposed to compute it does not, and the store the design names as the processor's only durable write does not include the table that would carry it forward. Three independent pieces of evidence, one missing connection.

The following list makes the shared shape of both findings explicit.

- A **Smoke Harness Decorative Check** produces a passing signal disconnected from the thing it claims to check — the script says "verified," the underlying assertion never ran.
- A **Mastery Path Disconnection** produces a graph that looks complete but is missing mastery, the number the rest of the product treats as its central output.
- Both share one property: running the pipeline once, casually, would never reveal either. Both needed someone to trace the actual data flow and compare it against what the code claimed to do.

!!! mascot-warning "A Green Checkmark Is a Claim, Not a Fact"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    An architecture proof that ends in a green checkmark and a null mastery score is worse than no proof — it tells you the system works when it does not. Before trusting any test harness, read what it actually asserts, not just what it prints. A passing test suite is only as honest as its weakest assertion.

The diagram below lays the two findings side by side, so you can trace exactly where each one breaks — the decorative check inside the shell script's control flow, and the missing column inside the mastery data path.

#### Diagram: Two Bugs Behind a Green Checkmark

<iframe src="../../sims/two-bugs-green-checkmark/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Two Bugs Behind a Green Checkmark</summary>
Type: infographic
**sim-id:** two-bugs-green-checkmark<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, examine

Learning objective: Analyze why a passing smoke-test script and a graph with mastery scores present can both hide a real defect, by tracing where each verification silently breaks.

Purpose: Two parallel Mermaid flowcharts stacked vertically, each tracing one bug from "looks fine" to "the actual break."

Top panel "Smoke Harness Decorative Check": "Run check: query store, grep result" -> "grep fails to match (real problem exists)" -> "`&&` chaining means `set -e` does not apply here" -> "Script prints checkmark anyway" -> "Exit code 0: harness reports success." Short branch: "Print compression ratio" -> "No assertion follows" -> "Falls through to 'smoke passed'."

Bottom panel "Mastery Path Disconnection": "BKT computes P(L) update" -> "Mastery-aggregation query does not select a mastery column" -> "Materialized rollup does not compute one either" -> "Durable store has the column, nothing writes to it" -> "Graph write step sets mastery from a value never produced" -> "Result: mastery score is null, no error raised."

Interactive features: Every node has a Mermaid click directive; clicking opens an infobox explaining why that step's signal diverges from reality, naming the file/layer it corresponds to.

Color coding: Steps that look correct shaded calm teal; the step where signal and reality diverge shaded warning amber with a break-in-the-chain icon.

Responsive design: Panels stack vertically and stay full-width on narrow viewports; click targets stay tap-sized.
</details>

## Lift Where You Can, Rewrite Where You Must

With those findings in hand, the MVP plan needed a working principle for the code already sitting inside the design document. Rewriting everything would waste work the design had already gotten right; lifting everything unexamined would carry both bugs straight into a fresh codebase.

The **Lift Vs Rewrite Decision** is that principle, applied file by file: reuse an artifact verbatim when it is correct as written, reuse it with named fixes when it is close but has a specific defect, and rewrite it entirely when its core logic cannot be trusted. This produces a short, decisive list rather than a vague "review everything" instruction, which matters because "review everything" rarely gets built.

The table below organizes that decision across the design's major artifacts.

| Artifact | Verdict | Why |
|---|---|---|
| Dockerfile | Lift verbatim | Correct as written; add one image-source label for traceability |
| Compose file | Lift, with three fixes | Correct shape, but network isolation, a healthcheck dependency, and a startup ordering gap need fixing |
| ClickHouse schema | Lift, with two fixes | Correct tables, but one PII exposure and one column type are wrong |
| Cypher constraints | Lift, verify on Community edition | Correct as written, but the licensing tier that runs them was never confirmed |
| Kafka topics | Lift, resized | Correct topic design; partition count scaled down for MVP volume |
| `smoke.sh` | Rewrite entirely | The decorative-check bug above means the control flow itself cannot be trusted, not just its content |

## Three Fixes That Ride Along With the Lift

Three of those "lift, with fixes" verdicts deserve their own explanation, because each is a real defect that would have shipped silently if the MVP plan had lifted the design's code without reading it first.

The **Raw Column PII Hole** is a privacy leak inside a column the design document calls "the full original JSON, verbatim... kept forever." That raw, unmodified copy of every incoming statement includes the learner's original account name — exactly what the pseudonymization boundary from Chapter 6 exists to strip out. Because the raw column sits in the analytics store, any reader with query access to analytics, not just the identity vault, can extract the name and re-identify a supposedly de-identified learner, contradicting the design's own claim that nothing downstream of ingestion sees more than a derived, salted key. The fix must land before any statement becomes durable: strip the identifying field before writing it, or move the column behind the same restricted access the vault already enforces. Fixing it after the store is live and append-only is far more expensive.

The **Last Seen Type Fix** repairs a type mismatch in the schema tracking when a student last engaged with a concept. The design declares that column as an aggregate-function type meant to be merged across rows, but a downstream query filters on it directly — a comparison a pre-merged aggregate type cannot support without a type error or a full table scan that defeats the "only touch changed rows" design the column exists to enable. Declaring it as a plain, filterable value resolves both problems.

The **Mastery Join Fix** is the concrete repair for the Mastery Path Disconnection: rather than one query computing mastery directly, the processor writes mastery evidence to its own durable table alongside the statement log, and the summarizer joins that table against its rollup when materializing the graph — the difference between a graph with a mastery column and a graph where that column is ever populated.

!!! mascot-tip "Read the Design Line by Line Before You Trust It"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    All three fixes were found the same way: tracing one column from where it is written to where it is read, across every file that touches it. None would show up from running the stack once and eyeballing the output. When you inherit a design document, trace the data, don't just read the prose.

One more fix belongs in this group, though it addresses isolation rather than a data defect. **Vault Net Isolation** is a Compose-level network boundary: the identity service's vault database — the only place the mapping from a real learner identity to a pseudonymous key is stored — sits on its own private network no other service can reach, with no published host port. Every other service, including the summarizer and the graph store, sees only the derived, salted key Chapter 6 introduced, never the mapping that could reverse it. The design calls this "a compliance boundary, not a scale-driven one" — it exists because privacy regulation demands it, not because vault traffic needs its own network segment for throughput.

#### Diagram: Vault Network Isolation in the Compose Topology

<iframe src="../../sims/vault-net-isolation-workflow/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Vault Network Isolation in the Compose Topology</summary>
Type: workflow
**sim-id:** vault-net-isolation-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: explain, justify

Learning objective: Explain why the vault database is reachable only by the identity service on an isolated network, and identify which services can and cannot see a real learner identity.

Purpose: A Mermaid flowchart with two subgraphs on one canvas, showing which services sit on the general application network versus the isolated vault network.

Left/general subgraph "Application Network": nodes "Gateway", "Stream Processor", "Summarizer", "Graph Store (Neo4j)", "Analytics Store (ClickHouse)" — connected only as the real data flow requires (Gateway -> Processor -> Analytics Store; Processor -> Graph Store via structural stub only; Summarizer -> Graph Store).

Right/isolated subgraph "vault-net (no published host port)": nodes "Identity Service" and "Vault Database", connected only to each other.

One crossing edge: "Stream Processor" -> "Identity Service" labeled "resolves salted key only — never the raw mapping."

Interactive features: Every node has a Mermaid click directive. "Vault Database" opens an infobox on why this is the only place the identity-to-key mapping exists. Any Application Network node opens an infobox confirming "sees only the derived student_key." The crossing edge opens an infobox recapping Chapter 6's HMAC derivation in one sentence.

Color coding: Application Network in the book's teal accent color; vault-net outlined in amber with a padlock icon, matching Chapter 21's visual language for compliance boundaries.

Responsive design: Subgraphs stack vertically on narrow viewports with the crossing edge redrawn to remain visible; click targets stay tap-sized.
</details>

## Five Steps From a Cold Clone to a Measurement

With the audit complete and the fixes named, the MVP plan lays out five sequential build steps, each with its own exit criterion — a specific, checkable condition that must hold before the next step begins. Each step produces something the next depends on, so skipping ahead means building on an unverified foundation.

**MVP Step 1 Foundation** stands up the project skeleton and the honest version of the test harness rewritten above. It lifts the Dockerfile, Compose file, schema, and constraints with their fixes applied, defines a small producer contract pinning exactly which xAPI verbs and fields the rest of the build assumes, and confirms two things worth learning on day one rather than month six: every service's healthcheck goes healthy on the pinned container versions, and the graph database's uniqueness constraint — enforcing that no student-concept pair is ever duplicated — actually works on the free Community licensing tier the MVP runs on. Exit: a clean boot from a freshly cloned repository, plus a smoke check that correctly reports failure before any real component exists to pass it.

**MVP Step 2 Ingest Path** builds the two services that get a statement from an HTTP request into durable storage: the gateway that validates and queues it, and the stream processor that pseudonymizes the actor, resolves what activity it refers to, and writes it to the analytics store — landing the Raw Column PII Hole fix along the way. Exit: the same smoke check, now green for the right reason, and provably red again when the processor is deliberately broken.

**MVP Step 3 Loadgen Contract** builds a load generator that emits statements in exactly the shape Step 1's producer contract defined — the real shape an intelligent-textbook page would send, not a placeholder. Whatever gets measured against synthetic load has to be shaped like the real traffic it stands in for. Exit: sustaining at least 200 statements per second with the analytics store's row count matching the emitted count exactly.

**MVP Step 4 Compression Graph** is where the compression pipeline from Chapter 8 gets built for real: the summarizer running on its periodic cycle, landing the Mastery Join Fix, and writing the graph edges connecting a student to the concepts, pages, and questions they engaged with. Exit: the constraint against per-statement graph nodes holds at zero, running the summarizer twice produces an identical graph, the compression ratio clears its target and is asserted rather than printed, and mastery scores are no longer null.

**MVP Step 5 Burst Proof** is the payoff: replaying the durable log to confirm the graph rebuilds from scratch, then running the load generator at a low rate and again at five times that rate while measuring the graph write rate across the transition, plus one chaos check — stopping the graph database mid-run to confirm ingestion keeps accepting statements while the graph merely falls behind. Exit: the chart this chapter has been building toward — ingest rising five-fold while the graph write rate stays flat, the Burst Insensitivity Claim proven or falsified on real code instead of paper.

#### Diagram: The Five MVP Build Steps

<iframe src="../../sims/five-mvp-build-steps/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Five MVP Build Steps</summary>
Type: timeline
**sim-id:** five-mvp-build-steps<br/>
**Library:** vis-timeline<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, match

Learning objective: Sequence the five MVP build steps and match each to its exit criterion, recognizing each step's output as a precondition for the next.

Time period: Not calendar time — five sequential build steps rendered as contiguous blocks in build order.

Orientation: Horizontal, left to right, each block labeled with its step number and headline task.

Events:

- Step 1: Foundation + an honest harness — exit: clean boot from a cold clone; smoke check correctly red before anything real exists
- Step 2: Ingest path (gateway, stream processor) — exit: smoke check green for the right reason, provably red when broken
- Step 3: Loadgen at the producer-contract shape — exit: sustains 200 stmt/sec; store row count matches emitted count exactly
- Step 4: Compression and graph (summarizer, mastery join) — exit: zero per-statement nodes, identical graph on a second run, ratio asserted, mastery non-null
- Step 5: The burst proof (replay, 5x load, chaos test) — exit: a chart showing ingest 5x while graph writes stay flat

Interactive features: Clicking a step block opens an infobox with its full description and exit criterion. A "Show dependency arrows" toggle overlays arrows from each step to the one it depends on.

Visual style: Steps 1-4 shaded calm teal; step 5 shaded amber as the step the MVP exists to reach.

Responsive design: Resizes to its container's width; on narrow viewports labels abbreviate to step number and expand on tap.
</details>

## What This MVP Deliberately Leaves Out

A build plan this focused stays focused by refusing things that feel productive but would not move the central measurement forward. The **MVP Deferred Scope** names those refusals explicitly.

- The full A/B experimentation framework from later chapters — a controlled experiment on a handful of synthetic students would produce noise, not evidence, so it waits for a real rostered population.
- Every admin-facing user interface — district, teacher, and author dashboards all need a roster and consent first, the same twenty-one-week dependency that motivated proving the architecture before chasing a user.
- The reconciler background worker that resolves auto-provisioned activity stubs — the MVP keeps the accept-first stub-writing behavior that proves ingestion never blocks on the graph, but cleaning those stubs up later isn't needed to test burst insensitivity.
- Managed-infrastructure tooling — autoscaling, orchestration beyond Compose, and the supply-chain scanning from Chapter 17 — none of which changes whether the compression math holds.
- The privacy threshold that would blank an instructor's dashboard when too few students have consented — deferred for free, since synthetic test students were never rostered, but named as the next thing to resolve the day a real teacher logs in.

!!! mascot-encourage "Saying No to Good Ideas Is Part of the Plan"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Every item on that deferred list is a legitimate, eventually-necessary piece of this system — none are bad ideas. Deferring them isn't cutting corners; it protects the one measurement this MVP exists to produce from getting buried under work that doesn't inform it. Saying no to good ideas on purpose is usually a sign the plan knows what it's trying to prove.

## Reading the Proof

Step 5's chart is the destination this chapter has been walking toward, so it is worth being precise about what a passing and a failing version look like before you run it. In the passing case, the ingest-rate line rises in a clean five-fold step while the graph-write-rate line barely moves — the "insensitivity" the claim predicts, because the burst adds events per already-active student rather than adding new students. In the failing case, the graph-write-rate line climbs in step with ingest, meaning compression is not actually decoupling the two, and every downstream conclusion resting on that decoupling — the production hardware estimate from Chapter 21, the prohibition on one graph vertex per statement from Chapter 7 — would need to be revisited.

#### Diagram: Burst Insensitivity — Graph Write Rate vs. Ingest Rate

<iframe src="../../sims/burst-insensitivity-chart/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Burst Insensitivity — Graph Write Rate vs. Ingest Rate</summary>
Type: chart
**sim-id:** burst-insensitivity-chart<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: judge, justify

Learning objective: Evaluate a burst-test result by comparing an ingest-rate line against a graph-write-rate line across a 5x load increase, and judge whether the pattern confirms or falsifies the burst insensitivity claim.

Chart type: Dual-line chart over a shared time axis (seconds, 0-600s), left y-axis "Ingest rate (statements/sec)" 0-1200, right y-axis "Graph write rate (upserts/sec)" 0-1200.

Default state ("Passing result"): Ingest-rate line steps from 200 to 1,000 statements/sec at t=300s and holds. Graph-write-rate line stays essentially flat around 60-70 upserts/sec (scaled to this MVP's smaller population) through the step change, with minor jitter.

Toggle — "Show failing (hypothetical) result": redraws the graph-write-rate line climbing in step with ingest after t=300s, so the learner can contrast both outcomes on the same axes.

Toggle — "Show test parameters": overlays an annotation panel listing baseline rate, burst rate, ratio (5x), and the 60s sync cadence.

Interactive features: Hovering any point shows its value and timestamp. Clicking the dashed line at t=300s (burst onset) opens an infobox on what changes at that moment. A caption below updates per toggle: "Flat graph writes under 5x ingest: the architecture holds" versus "Climbing graph writes: the architecture does not decouple as designed."

Color scheme: Ingest-rate line in the book's teal accent color; graph-write-rate line in a contrasting warm color; the failing line renders in warning amber.

Responsive design: Resizes to its container's width; legend and toggles stack below on narrow viewports; touch targets stay tap-sized.
</details>

## From Measurement Back to the Docs

A proof that stays in a terminal window and never reaches the specification is a proof only the person who ran it can trust. The MVP plan's last instruction is to fold every finding back into the documents this book draws from: rewrite the smoke harness's description, correct the last-seen column's declared type, document the mastery join, resolve the raw-column exposure, and pin down the activity identifier convention that three parts of the existing code disagreed about. Left unamended, the next reader inherits a copy of the design already proven wrong in places.

## Key Takeaways

- The **MVP Architecture Proof** skips the twenty-one-week path to a real user and drives straight at testing the architecture's central bet with the smallest honest build.
- The **Burst Insensitivity Claim** is a falsifiable, numeric prediction — graph writes stay roughly flat under a 5x ingest burst — not a vague promise the system "should scale well."
- A **Smoke Harness Decorative Check** looks like a passing test while never running its assertion, because shell command chaining silently swallows failures.
- The **Mastery Path Disconnection** shows a schema can have the right column and still never populate it, if no step actually writes to it.
- The **Lift Vs Rewrite Decision** applies one rule file by file: lift what's correct, lift-with-fixes what's close, rewrite what can't be trusted.
- The **Raw Column PII Hole**, **Last Seen Type Fix**, and **Mastery Join Fix** are three defects found by tracing data end to end, not by running the stack once and eyeballing the result.
- **Vault Net Isolation** keeps the identity-to-key mapping reachable only by the identity service, on a network no other component can see.
- **MVP Step 1 Foundation** through **MVP Step 5 Burst Proof** form a strictly sequential build, each exit criterion becoming the next step's precondition, ending in the chart that proves or falsifies the claim.
- The **MVP Deferred Scope** — experiments, admin UIs, the reconciler worker, managed infrastructure, the consent threshold — is a deliberate list of good ideas set aside so they don't dilute the one measurement this build exists to produce.

!!! mascot-celebration "The Architecture Just Met Its First Real Test"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    From a cold clone to a chart showing ingest climbing five-fold while graph writes barely move — that's not a diagram anymore, that's measured evidence. What does the evidence show? The compression architecture holds under the exact stress it was designed for. One event at a time, this book has been building toward that chart since Chapter 8. In [Chapter 23: Production Infrastructure and Cloud Services](../23-production-infrastructure-cloud/index.md), we take this proven MVP and figure out what it takes to run it for real.
