---
title: The Five MVP Build Steps
description: Sequence the five MVP build steps and match each to its exit criterion, recognizing each step's output as a precondition for the next.
status: scaffold
library: vis-timeline
bloom_level: Understand (L2)
---

# The Five MVP Build Steps



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 22: Proving the Architecture - the MVP Plan](../../chapters/22-proving-the-architecture-mvp/index.md).

```text
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
```

## Related Resources

- [Chapter 22: Proving the Architecture - the MVP Plan](../../chapters/22-proving-the-architecture-mvp/index.md)
