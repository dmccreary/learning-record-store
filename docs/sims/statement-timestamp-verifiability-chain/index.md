---
title: Statement Timestamp and the Verifiability Chain
description: Let the learner apply their understanding of Statement Timestamp and Statement Immutability by tracing how the two combine to produce a verifiable audit trail, and predict what an auditor would flag as suspicious versus ordinary.
status: implemented
library: Mermaid
bloom_level: Apply (L3)
---

# Statement Timestamp and the Verifiability Chain



<iframe src="main.html" width="100%" height="542"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../../chapters/04-standards-governance-ecosystem/index.md).

```text
Type: workflow
**sim-id:** statement-timestamp-verifiability-chain<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, demonstrate

Learning objective: Let the learner apply their understanding of Statement Timestamp and Statement Immutability by tracing how the two combine to produce a verifiable audit trail, and predict what an auditor would flag as suspicious versus ordinary.

Purpose: Show a five-step, top-to-bottom Mermaid flowchart tracing one Statement from the moment its experience occurs to the moment an auditor reviews it.

Steps:

1. "Learner experience occurs" — the real-world moment a Statement will describe
2. "Learning Record Provider sets timestamp" — the `timestamp` field, recording when the experience happened, chosen by the Provider
3. "Learning Record Store sets stored" — the `stored` field, recording when the LRS received the Statement, chosen by the LRS itself and never editable by the Provider
4. "Statement Immutability locks both fields" — neither field can be changed after this point, per Chapter 2's rule
5. "Auditor compares timestamp and stored" — branches to two outcomes: "Small or explainable gap: ordinary" and "Large or implausible gap: flag for review"

Interactive features: Every node has a Mermaid `click` directive. Clicking steps 1-2 opens an infobox distinguishing `timestamp` from `stored`. Clicking step 4 opens an infobox restating Statement Immutability from Chapter 2. Clicking step 5's two branch outcomes opens an infobox with a worked example of each (an offline mobile app syncing an hour later versus a Statement claiming an experience three months before it was stored).

Color coding: The real-world event and Provider-controlled step (1-2) in amber; the LRS-controlled and immutability steps (3-4) in the book's teal accent color; the auditor's two outcome branches in green (ordinary) and red (flagged).

Implementation: Mermaid flowchart, top-to-bottom orientation, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../../chapters/04-standards-governance-ecosystem/index.md)
