---
title: "Quiz: Privacy Enforcement and Dashboard Mechanics"
description: Review questions on Tenant Context Injection, threshold and complementary suppression, audit and trace logging, idempotent replay, and the Dash/Plotly dashboard component vocabulary.
social:
   cards: false
---
# Quiz: Privacy Enforcement and Dashboard Mechanics

Test your understanding of this project's privacy filter, replay mechanics, and dashboard component vocabulary with these review questions.

---

#### 1. What does Tenant Context Injection guarantee about every Analytics API query?

<div class="upper-alpha" markdown>
1. Every query is built through a request-scoped TenantContext object, and the query builder is structured so a query without one simply cannot compile
2. Every query is manually reviewed by a district administrator before execution
3. Every query automatically applies Complementary Suppression regardless of group size
4. Every query is cached for 24 hours regardless of tenant
</div>

??? question "Show Answer"
    The correct answer is **A**. Tenant Context Injection makes an unscoped query structurally impossible to write, rather than relying on every engineer remembering to add a tenant filter. B invents a manual review step the chapter never describes. C conflates tenant scoping with a separate, distinct suppression mechanism. D fabricates a fixed caching rule unrelated to tenant scoping.

    **Concept Tested:** Tenant Context Injection

    **See:** [Tenant Context Injection: The First Gate](index.md#tenant-context-injection-the-first-gate)

---

#### 2. What triggers Threshold Suppression to hide a report cell?

<div class="upper-alpha" markdown>
1. The cell contains a negative mastery score
2. The cell was computed more than 24 hours ago
3. The cell references a voided statement
4. The cell's underlying group size falls below the district's configured minimum, 10 students by default
</div>

??? question "Show Answer"
    The correct answer is **D**. Threshold Suppression hides any cell built from fewer students than the district's configured minimum group size, to prevent re-identification by elimination. A, B, and C each invent a trigger condition — score sign, staleness, or voiding — that plays no role in this specific suppression rule.

    **Concept Tested:** Threshold Suppression

    **See:** [The Privacy Filter's Three Jobs](index.md#the-privacy-filters-three-jobs)

---

#### 3. Why does Threshold Suppression alone fail to protect a small group, even when the small cell itself is hidden?

<div class="upper-alpha" markdown>
1. Because Threshold Suppression only applies to KPI tiles, not to tables
2. Because a reader can subtract every visible cell from a published row total and recover the hidden cell's value by arithmetic — which Complementary Suppression exists to prevent
3. Because Threshold Suppression is only enforced client-side, not server-side
4. Because the threshold value itself is visible to any reader, defeating the purpose
</div>

??? question "Show Answer"
    The correct answer is **B**. If a row publishes its total alongside every cell except the suppressed one, a reader can recover the hidden value by simple subtraction — exactly the gap Complementary Suppression closes by hiding a second cell. A wrongly restricts suppression to one component type. C is false; suppression is enforced server-side, inside the Analytics API. D mischaracterizes the threshold value itself as the vulnerability, when the real gap is arithmetic recoverability.

    **Concept Tested:** Complementary Suppression

    **See:** [The Privacy Filter's Three Jobs](index.md#the-privacy-filters-three-jobs)

---

#### 4. How does a Privacy Audit Write differ from Trace ID Propagation?

<div class="upper-alpha" markdown>
1. They are two names for the exact same log entry written to the same topic
2. A Privacy Audit Write tracks statement processing latency; Trace ID Propagation tracks which students were suppressed
3. A Privacy Audit Write records who queried PII-adjacent data and when, for compliance review; Trace ID Propagation records how one statement moved through the pipeline's plumbing, for engineering debugging
4. Trace ID Propagation only runs during a Replay Command; Privacy Audit Write only runs during normal ingestion
</div>

??? question "Show Answer"
    The correct answer is **C**. A Privacy Audit Write is a compliance record of who accessed PII-adjacent data and when, while Trace ID Propagation is an operational record of one statement's technical path through the pipeline — two different mechanisms serving two different audiences. A wrongly conflates them. B swaps their actual purposes. D invents an unrelated restriction on when each mechanism runs.

    **Concept Tested:** Privacy Audit Write / Trace ID Propagation

    **See:** [Watching the Choke Point Do Its Job](index.md#watching-the-choke-point-do-its-job)

---

#### 5. What is a Paged Metric Threshold?

<div class="upper-alpha" markdown>
1. The minimum group size a report cell must have before Threshold Suppression allows it to display
2. The maximum number of dashboard pages a single Dash app may serve
3. The retention window, in days, for the Audit Feed Topic
4. A numeric trigger point that, once crossed, pages a System Admin automatically rather than waiting for someone to notice a problem on a dashboard
</div>

??? question "Show Answer"
    The correct answer is **D**. A Paged Metric Threshold automatically pages a System Admin the moment a monitored figure — processing lag, dead-letter rate, gateway error rate, or reconciliation backlog growth — crosses a line worth acting on. A confuses it with the unrelated Threshold Suppression group-size rule. B invents an unrelated page-count limit. C confuses it with the Audit Feed Topic's retention policy from an earlier chapter.

    **Concept Tested:** Paged Metric Threshold

    **See:** [Watching the Choke Point Do Its Job](index.md#watching-the-choke-point-do-its-job)

---

#### 6. A teacher opens their own class's progress report and sees an individual score for a specific student in their roster, even though that "group" is technically a group of one. Why isn't this blocked by Threshold Suppression?

<div class="upper-alpha" markdown>
1. Because the teacher viewing their own rostered section already knows those students by name from the classroom, so the disclosure exemption applies — cross-group, de-identified, and benchmark views still receive full suppression
2. Because Threshold Suppression only applies to cross-district reports, never to any single-section view
3. Because the teacher's account automatically bypasses the entire privacy filter once authenticated
4. Because individual student scores are stored outside the Analytics API entirely
</div>

??? question "Show Answer"
    The correct answer is **A**. A teacher already knows their own rostered students by name, so showing their own students' progress discloses nothing new — the exemption applies only to that already-established relationship, while cross-group and benchmark views still receive full suppression. B overstates the exemption's scope. C wrongly implies full bypass rather than a narrow, role-scoped exemption. D is false — scores are read through the same Analytics API as every other figure.

    **Concept Tested:** Threshold Suppression (rostered exemption)

    **See:** [A Necessary Exemption, Not a Loophole](index.md#a-necessary-exemption-not-a-loophole)

---

#### 7. What property of statement processing makes it safe to run the Replay Command against live traffic more than once?

<div class="upper-alpha" markdown>
1. The fact that Replay Command always runs during a scheduled maintenance window
2. The fact that Replay Command only reads from Redis, never from the immutable log
3. Idempotency By Statement ID — because statement_id is the deduplication key everywhere a statement lands, reprocessing the same statement twice produces the same final state as processing it once
4. The fact that every replay automatically pages a System Admin before running
</div>

??? question "Show Answer"
    The correct answer is **C**. Because `statement_id` is the deduplication key everywhere a statement lands, reprocessing the same evidence twice always produces the same final state, which is what turns replay from a dangerous operation into a routine one. A invents a scheduling restriction not described in the chapter. B is false — replay specifically reads from the immutable Kafka log, not Redis. D fabricates an unrelated alerting requirement.

    **Concept Tested:** Idempotency By Statement ID / Replay Command

    **See:** [Making Every Rebuild Safe: Idempotency and Replay](index.md#making-every-rebuild-safe-idempotency-and-replay)

---

#### 8. While a Replay Command is rebuilding a ClickHouse projection for a district, another user queries the same report. What do they see, and what mechanism guarantees it?

<div class="upper-alpha" markdown>
1. A live view of the rebuild in progress, showing partially updated rows as they are written
2. Either the old, complete data or the new, complete data — never a half-rebuilt mix — guaranteed by the Shadow Table Swap building the output in a separate table before an atomic rename makes it live
3. An error message stating the report is temporarily unavailable during any replay
4. A cached response from before the replay started, regardless of when the replay finishes
</div>

??? question "Show Answer"
    The correct answer is **B**. The Shadow Table Swap builds the rebuilt output entirely inside a temporary table invisible to live queries, and only an atomic rename ever makes it the live table — so a reader always sees a complete version, old or new, never a partial mix. A directly contradicts the whole purpose of the shadow table. C invents an unavailability window the design avoids by design. D wrongly assumes the cache never updates after the swap.

    **Concept Tested:** Shadow Table Swap

    **See:** [Making Every Rebuild Safe: Idempotency and Replay](index.md#making-every-rebuild-safe-idempotency-and-replay)

---

#### 9. Why does the Rebuild Graph Command need no dedicated rebuild code path of its own, unlike the Replay Command?

<div class="upper-alpha" markdown>
1. Because it only affects a single ConceptMastery vertex at a time, making a dedicated path unnecessary
2. Because Neo4j automatically rebuilds itself from ClickHouse on a nightly schedule regardless of any command
3. Because the Rebuild Graph Command delegates entirely to the Reconciliation Worker instead of the summarizer
4. Because resetting the summarizer's watermark to zero makes the ordinary 60-second sync loop treat every rollup as unsynced, so the exact same code that runs every minute in production rewrites the whole graph, guarded by the Grain Uniqueness Constraint against duplication
</div>

??? question "Show Answer"
    The correct answer is **D**. Resetting the watermark to zero makes the summarizer's normal sync loop believe everything is unsynced, so the same production code path rewrites the entire graph, with the Grain Uniqueness Constraint preventing duplication — no separate, untested rebuild script needed. A understates its scope, which is the whole graph, not one vertex. B invents an automatic nightly process the chapter never describes. C misattributes the mechanism to the Reconciliation Worker, an unrelated component.

    **Concept Tested:** Rebuild Graph Command

    **See:** [Making Every Rebuild Safe: Idempotency and Replay](index.md#making-every-rebuild-safe-idempotency-and-replay)

---

#### 10. A dashboard needs to show, for one student, how their mastery compares across five different concepts at once, so a viewer can see strengths and weaknesses simultaneously. Which component is built for this?

<div class="upper-alpha" markdown>
1. Funnel Chart Component
2. Sankey Chart Component
3. Radar Chart Component
4. Data Table Component
</div>

??? question "Show Answer"
    The correct answer is **C**. A Radar Chart Component plots several concept-mastery scores as spokes around a center point, comparing a student's strengths and weaknesses simultaneously. A shows narrowing stages of attrition, not comparative scores. B shows flows of varying width between stages, an unrelated shape. D renders sortable row-level detail, not a multi-dimensional comparison.

    **Concept Tested:** Radar Chart Component

    **See:** [The Component Vocabulary](index.md#the-component-vocabulary)

---

#### 11. Why does Server-Side Aggregation matter for a chart summarizing forty students' activity?

<div class="upper-alpha" markdown>
1. It ensures the chart requests already-aggregated data from the Analytics API rather than pulling forty students' worth of raw rows into the browser, keeping the response inside the performance budget
2. It ensures every student's raw statement is sent to the browser for maximum transparency
3. It replaces the need for the Privacy Filter Choke Point entirely
4. It only applies to KPI Tile Components, not to heatmaps or tables
</div>

??? question "Show Answer"
    The correct answer is **A**. Server-Side Aggregation keeps figures requesting already-summarized data rather than raw rows, which is what keeps every view inside its latency budget regardless of how many students it summarizes. B describes the opposite of what this mechanism prevents. C wrongly claims it replaces an unrelated, separate privacy mechanism. D wrongly restricts it to one component type when it applies across the whole dashboard.

    **Concept Tested:** Server-Side Aggregation

    **See:** [How a Click Becomes a New Query](index.md#how-a-click-becomes-a-new-query)

---

#### 12. Why does a dashboard export to PDF carry the same suppression rules as the live screen it was generated from, rather than risking a leak through a separate export path?

<div class="upper-alpha" markdown>
1. Because export files are automatically deleted after 24 hours, limiting any potential exposure
2. Because Dashboard Export runs through the same Analytics API and the same privacy filter as the live view, so there is no separate, less-guarded path a suppressed cell could leak through
3. Because PDF exports are encrypted with a district-specific key that only an administrator can unlock
4. Because export requests are routed through the Admin API instead of the Analytics API, adding an extra layer of review
</div>

??? question "Show Answer"
    The correct answer is **B**. Because export runs through the identical Analytics API call and privacy filter as the live view, there is no separate export-only code path that could accidentally skip suppression. A invents an unrelated deletion policy. C fabricates an encryption mechanism the chapter never describes. D misroutes export through the wrong API, contradicting the chapter's description.

    **Concept Tested:** Dashboard Export

    **See:** [How a Click Becomes a New Query](index.md#how-a-click-becomes-a-new-query)

---
