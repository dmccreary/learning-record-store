---
title: Gateway Request Pipeline
description: Let the learner trace one xAPI statement batch through the gateway's five-step request path — token cache lookup, structural validation, statement ID assignment, durable-queue produce with acks=all, and response — and explain what each step protects against.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# Gateway Request Pipeline



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md).

```text
Type: workflow
**sim-id:** gateway-request-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace one xAPI statement batch through the gateway's five-step request path — token cache lookup, structural validation, statement ID assignment, durable-queue produce with acks=all, and response — and explain what each step protects against.

Purpose: Show a single Mermaid flowchart tracing one POST request through the gateway's internal steps in order, ending at two possible outcomes.

Nodes: "Textbook sends POST /xapi/statements (batch)" leads to "AuthN Token Cache lookup (Redis, 60s TTL; falls back to local LRU on Redis failure)" leads to "Tier-1 structural validation (all-or-nothing per batch)" leads to "Assign UUIDv7 Statement ID where missing" leads to "Produce to Kafka: Kafka Producer Acks All, key = district:student" then splits into two outcomes: "Broker acks → 200 with statement IDs" and "Gateway Backpressure Queue full AND broker unreachable → 503 with Retry-After + page alert".

Interactive features: Every node has a Mermaid click directive opening an infobox with that step's one-sentence definition (cache fallback, UUIDv7 sortability, acks=all latency tradeoff, or the outcome condition). A toggle labeled "Show durability boundary" highlights every node before the Kafka produce step in one color and every node after it in another, reinforcing that the response happens only after the queue acknowledges.

Color coding: Steps before the durability boundary (queue ack) in a neutral gray-blue; the Kafka produce node and everything after it in the book's teal accent color; the 503 outcome branch in amber to flag it as the exceptional path.

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the chain reflows top-to-bottom.
```

## Related Resources

- [Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md)
