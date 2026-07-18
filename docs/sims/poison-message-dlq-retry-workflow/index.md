---
title: Poison Message Retry and Dead-Letter Queue Workflow
description: Trace a single malformed statement through three consumption attempts and its landing in the dead-letter queue, and explain why the consumer keeps processing other messages throughout.
status: scaffold
library: Mermaid
bloom_level: Apply (L3)
---

# Poison Message Retry and Dead-Letter Queue Workflow



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 19: Failure Modes and Verification](../../chapters/19-failure-modes-and-verification/index.md).

```text
Type: workflow
**sim-id:** poison-message-dlq-retry-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, apply

Learning objective: Trace a single malformed statement through three consumption attempts and its landing in the dead-letter queue, and explain why the consumer keeps processing other messages throughout.

Purpose: A Mermaid flowchart showing one message moving through the processor's retry logic, with a loop-back arrow for retries and a terminal branch to the dead-letter queue.

Nodes: "Message consumed" -> "Processing attempt" -> decision "Succeeded?" -> (yes) "Offset committed, consumer continues"; (no) -> "Attempt count += 1" -> decision "Attempts = 3?" -> (no, loop back to) "Processing attempt"; (yes) -> "Routed to Dead-Letter Queue (DLQ)" -> "Offset committed, consumer continues".

A parallel track shown alongside: "Next message in partition" -> "Processing attempt" -> "Offset committed" — showing the poison message's retries do not block the rest of the stream.

Interactive features: Every node has a Mermaid click directive opening an infobox. "Attempt count += 1" explains the three-attempt limit. "Routed to Dead-Letter Queue (DLQ)" defines a DLQ and links its inspection to Chapter 18's diagnostics UI. The parallel track explains that per-partition processing is sequential, but the DLQ hand-off keeps one bad message from blocking it indefinitely.

Color coding: Retry loop amber ("in progress"); DLQ terminal node muted red ("quarantined, not lost"); successful-commit nodes teal.

Responsive design: The flowchart stacks the retry track above the parallel track on narrow viewports, preserving click handlers and loop direction.
```

## Related Resources

- [Chapter 19: Failure Modes and Verification](../../chapters/19-failure-modes-and-verification/index.md)
