---
title: xAPI Endpoint and HTTP Verbs
description: Let the learner apply their knowledge of HTTP Verbs and Statement Query Parameters by tracing three concrete requests against one xAPI Endpoint and predicting what each returns.
status: implemented
library: Mermaid
bloom_level: Apply (L3)
---

# xAPI Endpoint and HTTP Verbs



<iframe src="main.html" width="100%" height="482"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 2: The Anatomy of an xAPI Statement](../../chapters/02-anatomy-of-xapi-statement/index.md).

```text
Type: workflow
**sim-id:** xapi-endpoint-http-verbs<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: demonstrate, apply

Learning objective: Let the learner apply their knowledge of HTTP Verbs and Statement Query Parameters by tracing three concrete requests against one xAPI Endpoint and predicting what each returns.

Purpose: Show a base endpoint box `https://lrs.example.org/xapi/` with three outgoing request arrows to a `/statements` resource box, each labeled with a full example request.

Requests to show:

1. `PUT /statements?statementId=abc-123` with a JSON body — labeled "Store one Statement at a known ID"
2. `POST /statements` with a JSON array body — labeled "Store multiple Statements; LRS assigns IDs"
3. `GET /statements?agent={Maya's account}&verb=completed&since=2026-01-01` — labeled "Query Maya's completions since New Year"

Response box: A fourth box showing an abbreviated JSON response for request 3, containing a `statements` array with one entry and a `more` field for pagination.

Interactive features: Every request arrow and the response box are clickable via Mermaid `click` directives. Clicking a request arrow opens an infobox explaining which HTTP Verb is used and why. Clicking the response box explains the `more` field's role in paging through large result sets.

Color coding: `GET` requests in blue, `PUT` in teal, `POST` in green — consistent with a legend shown beside the diagram.

Implementation: Mermaid flowchart with click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 2: The Anatomy of an xAPI Statement](../../chapters/02-anatomy-of-xapi-statement/index.md)
