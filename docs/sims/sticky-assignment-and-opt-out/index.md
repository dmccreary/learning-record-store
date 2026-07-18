---
title: Deterministic Sticky Assignment and District Opt-Out
description: Let the learner trace a single student's request through the eligibility check, the hash-based assignment formula, and the non-blocking fallback path, applying the deterministic sticky assignment rule to a concrete decision.
status: implemented
library: Mermaid
bloom_level: Apply (L3)
---

# Deterministic Sticky Assignment and District Opt-Out



<iframe src="main.html" width="100%" height="642"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 31: Designing and Reading A/B Experiments](../../chapters/31-designing-ab-experiments/index.md).

```text
Type: workflow
**sim-id:** sticky-assignment-and-opt-out<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, apply

Learning objective: Let the learner trace a single student's request through the eligibility check, the hash-based assignment formula, and the non-blocking fallback path, applying the deterministic sticky assignment rule to a concrete decision.

Purpose: A Mermaid flowchart beginning at "Student requests a page covered by an active experiment," branching first on "Is the student's district opted out of experimentation?" — Yes leads directly to "Serve control arm (excluded from randomization)"; No proceeds to "Is the assignment service reachable?" — No leads to "Serve control arm (non-blocking fallback); statement still recorded"; Yes leads to "Compute variant = hash(experiment_id, unit_id) mod k" which leads to "Look up ASSIGNED_TO edge, or create it on first assignment" and finally to "Serve the assigned variant; assignment is now sticky for this student."

Interactive features: Every node is wired with a Mermaid `click` directive. Clicking the opt-out decision node opens an infobox explaining that eligibility is enforced through the Eligibility Predicate and cannot be overridden by an author. Clicking the hash-formula node opens an infobox restating the formula from this section's prose in plain language. Clicking either "Serve control arm" outcome opens an infobox distinguishing the two reasons a student might land in control: policy exclusion versus a temporary service outage.

Color coding: The two decision (branch) nodes in the book's amber accent color; the two control-arm outcomes in muted gray-blue; the "sticky assignment" terminal node in teal to mark the normal, successful path.

Responsive design: The flowchart resizes to the containing element's width and stacks its branches vertically rather than horizontally on narrow viewports, preserving click targets at mobile widths.
```

## Related Resources

- [Chapter 31: Designing and Reading A/B Experiments](../../chapters/31-designing-ab-experiments/index.md)
