---
title: The Ingestion Plane Technology Stack
description: Let the learner trace a single xAPI statement's path through the ingestion plane's actual technology stack — FastAPI, Uvicorn, Redpanda/Apache Kafka, and the Confluent-Kafka Library — and explain what each product is responsible for.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# The Ingestion Plane Technology Stack



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 10: Choosing the Technology Stack](../../chapters/10-choosing-technology-stack/index.md).

```text
Type: workflow
**sim-id:** ingestion-plane-technology-stack<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, trace

Learning objective: Let the learner trace a single xAPI statement's path through the ingestion plane's actual technology stack — FastAPI, Uvicorn, Redpanda/Apache Kafka, and the Confluent-Kafka Library — and explain what each product is responsible for.

Purpose: Show a single Mermaid flowchart tracing one statement from an intelligent textbook through the concrete technology stack, mirroring Chapter 5's ingestion-plane diagram but naming products instead of planes.

Nodes: "Intelligent Textbook" leads to "Uvicorn (ASGI server, accepts the HTTP connection)" leads to "FastAPI (routes the request, runs structural validation)" leads to "Redpanda (dev) / Apache Kafka (prod) — durable partitioned queue" leads to "Confluent-Kafka Library (Python client used by Stream Processors to consume the queue)" leads to "Stream Processor (Chapter 9's pseudonymize/resolve/map sequence)".

Interactive features: Every node has a Mermaid click directive. Clicking "Uvicorn" or "FastAPI" opens an infobox distinguishing the ASGI server from the web framework it runs, matching this chapter's prose. Clicking the Redpanda/Kafka node opens an infobox explaining the dev/prod pairing and linking to Chapter 5's Durable Event Queue and Chapter 8's non-blocking ingestion. Clicking "Confluent-Kafka Library" opens an infobox naming it as the Python client used inside the Stream Processor role. A toggle labeled "Show dev environment" / "Show production environment" swaps the queue node's label and color between Redpanda and Apache Kafka without changing the rest of the diagram, reinforcing that the interface is identical either way.

Color coding: The book's teal accent color for every node that is identical in dev and production; a two-tone split fill (teal/amber) on the Redpanda/Apache Kafka node to visually flag it as the one node that differs by environment.

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the chain reflows top-to-bottom instead of left-to-right.
```

## Related Resources

- [Chapter 10: Choosing the Technology Stack](../../chapters/10-choosing-technology-stack/index.md)
