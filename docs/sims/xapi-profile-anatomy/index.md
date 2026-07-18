---
title: Anatomy of an xAPI Profile
description: Let the learner classify how the xAPI Profile Standard, JSON-LD, an Application Profile, a Determining Property, and the xAPI Profile Server relate to one another, distinguishing the general rulebook from one concrete published document.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# Anatomy of an xAPI Profile



<iframe src="main.html" width="100%" height="482"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 3: IEEE Standardization of xAPI and cmi5](../../chapters/03-ieee-standardization-xapi-cmi5/index.md).

```text
Type: infographic
**sim-id:** xapi-profile-anatomy<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/vocabulary-profile-architecture<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: classify, differentiate

Learning objective: Let the learner classify how the xAPI Profile Standard, JSON-LD, an Application Profile, a Determining Property, and the xAPI Profile Server relate to one another, distinguishing the general rulebook from one concrete published document.

Purpose: Show a hierarchical Mermaid flowchart with the xAPI Profile Standard at the top as the general rulebook, branching down to a concrete example.

Nodes:

- "xAPI Profile Standard (IEEE 9274.2.1, in development)" — top node, the general rules for any Profile
- "JSON-LD" — connected as "expressed using," the format Profiles are written in
- "Application Profile (example: cmi5)" — connected as "one instance of," a concrete published document
- "Statement Template" — child of Application Profile
- "Determining Property" — child of Statement Template, labeled "routes a Statement to this template"
- "xAPI Profile Server (operated by I2IDL)" — connected to Application Profile as "hosted at"

Interactive features: Every node has a Mermaid `click` directive. Clicking "xAPI Profile Standard" opens an infobox distinguishing it from a single Application Profile. Clicking "JSON-LD" opens an infobox with the `@context`/IRI example from the chapter prose (`completed` resolving to a full IRI). Clicking "Statement Template" and "Determining Property" together opens a two-part infobox showing how a Determining Property routes one incoming Statement to one Template within a Profile that defines several. Clicking "xAPI Profile Server" opens an infobox naming it as I2IDL-operated infrastructure.

Color coding: The general rulebook (xAPI Profile Standard, JSON-LD) in the book's teal accent color; the concrete document layer (Application Profile, Statement Template, Determining Property) in amber; the hosting infrastructure (xAPI Profile Server) in green to match I2IDL's color from the governance diagram.

Implementation: Mermaid flowchart, top-to-bottom orientation, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 3: IEEE Standardization of xAPI and cmi5](../../chapters/03-ieee-standardization-xapi-cmi5/index.md)
