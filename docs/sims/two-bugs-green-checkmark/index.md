---
title: Two Bugs Behind a Green Checkmark
description: Analyze why a passing smoke-test script and a graph with mastery scores present can both hide a real defect, by tracing where each verification silently breaks.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# Two Bugs Behind a Green Checkmark



<iframe src="main.html" width="100%" height="642"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 22: Proving the Architecture - the MVP Plan](../../chapters/22-proving-the-architecture-mvp/index.md).

```text
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
```

## Related Resources

- [Chapter 22: Proving the Architecture - the MVP Plan](../../chapters/22-proving-the-architecture-mvp/index.md)
