---
title: IEEE Standardization of xAPI and cmi5
description: How stewardship of xAPI moved from the ADL Initiative to IEEE LTSC and I2IDL, how xAPI Profiles and cmi5 keep independent implementations consistent, and how the Total Learning Architecture frames an LRS within a wider ecosystem.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 07:20:51
version: 0.09
---

# IEEE Standardization of xAPI and cmi5

## Summary

This chapter covers the IEEE Learning Technology Standards Committee's stewardship of xAPI: the published core standard IEEE 9274.1.1-2023, the in-development Profile Standard IEEE 9274.2.1, and the JSON-LD Application Profiles built on top of it. It introduces cmi5 as a widely adopted profile and the Total Learning Architecture that frames how an LRS fits into a larger ecosystem.

## Concepts Covered

This chapter covers the following 16 concepts from the learning graph:

1. IEEE LTSC
2. IEEE 9274.1.1-2023
3. IEEE 9274.2.1
4. xAPI Profile Standard
5. JSON-LD
6. Application Profile
7. Determining Property
8. cmi5
9. cmi5 Assignable Unit
10. cmi5 Launch Method
11. Total Learning Architecture
12. ADL Initiative
13. I2IDL
14. xAPI Conformance Suite
15. xAPI Profile Server
16. TLA Reference Implementation

## Prerequisites

This chapter builds on concepts from:

- [Chapter 1: From Learning Management Systems to the Experience API](../01-lms-to-experience-api/index.md)

---

!!! mascot-welcome "Who's minding the standard?"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Welcome back! Chapters 1 and 2 gave you the vocabulary and the wire format of an xAPI Statement. This chapter answers a question those chapters left open: who actually decides what counts as a valid Statement, who tests whether a Learning Record Store implements it correctly, and how does one flexible sentence format stay consistent across thousands of independent textbooks, apps, and simulators? Let's follow the record.

Chapter 1 introduced the **ADL Initiative** — the Advanced Distributed Learning Initiative, a research and standards program affiliated with the U.S. Department of Defense — as the organization that built SCORM and later ran the "Project Tin Can" research effort that produced the Experience API. For xAPI's first several years, that single fact was also its biggest structural risk: ADL alone wrote the specification text, decided what changed between versions, and had no independent body reviewing or balloting those decisions. A specification that only one organization controls can serve that organization well, but it gives every other implementer a reason to worry: what happens if ADL's priorities shift, its funding changes, or a future revision breaks something a district's Learning Record Store already depends on?

## From One Organization's Spec to a Formal Standard

The learning-technology field had already seen this risk play out once, with SCORM: a specification useful enough to become an industry default, but never balloted by an independent standards body the way electrical, networking, or safety standards are. xAPI's stewards chose a different path. In 2019, responsibility for the specification's ongoing development began transitioning from the ADL Initiative to the **IEEE Learning Technology Standards Committee**, universally abbreviated **IEEE LTSC** — a standing committee within the Institute of Electrical and Electronics Engineers (IEEE) responsible for developing formal, openly balloted standards for learning technology, the same organization that produces standards governing everything from Wi-Fi to floating-point arithmetic.

That handoff mattered because IEEE standards go through a process ADL's internal spec never did: a working group drafts the text, a broad pool of qualified voters balloted by IEEE reviews and comments on it, and the result is published only after that review resolves. The outcome of that process for xAPI's core specification is **IEEE 9274.1.1-2023** — the formally balloted and published standard that now defines the Statement structure from Chapter 1, the extended fields and RESTful mechanics from Chapter 2, and the conformance requirements every xAPI-compliant Learning Record Store must meet. The number itself follows IEEE's own numbering scheme for its technical standards; "9274" identifies the standards family, "1.1" identifies this particular document within it, and "2023" is the year of publication.

Publishing a standard is not the same as operating the tools implementers need to check their work against it. In late 2025, a new nonprofit organization, the **Institute for Infrastructure and Interoperable Data in Learning**, abbreviated **I2IDL**, was established to take on that operational role. I2IDL does not write or ballot standard text — that remains IEEE LTSC's job — but it hosts and maintains the practical infrastructure implementers rely on: the automated conformance test suite, the registry where reusable vocabularies are published, and reference implementations of the wider architecture this chapter closes with. Three organizations, three distinct jobs — a pattern worth holding onto before the details pile up.

!!! mascot-thinking "Three names, three jobs"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    It is easy to blur the ADL Initiative, IEEE LTSC, and I2IDL into one vague "the people in charge of xAPI." Keep them separate: ADL Initiative is where xAPI and cmi5 originated as a research and specification effort. IEEE LTSC is the body that turns specification text into a formally balloted, numbered standard. I2IDL is the newest of the three, and it runs the operational tools — test suites, registries, reference code — that let an implementer check its work against what the other two have published.

Before comparing the three side by side, notice what each one actually produces: the ADL Initiative produced the original xAPI specification and still develops cmi5; IEEE LTSC produces the balloted standard documents; I2IDL produces and operates the tooling. The table below organizes that distinction now that each organization has been introduced in the prose above.

| Organization | Type | What It Provides |
|---|---|---|
| ADL Initiative | U.S. Department of Defense-affiliated research and specification program | Originated xAPI (Project Tin Can) and continues to develop cmi5 |
| IEEE LTSC | Standing committee of the IEEE, a formal international standards body | Balloted, published standard text — IEEE 9274.1.1-2023 and the in-development IEEE 9274.2.1 |
| I2IDL | Nonprofit institute established in late 2025 | Operates the xAPI Conformance Suite, the xAPI Profile Server, and the Total Learning Architecture Reference Implementation |

The diagram below traces the same handoff as a sequence, so you can see not just who does what but when responsibility moved from one organization to the next.

#### Diagram: Standards Governance Handoff

<iframe src="../../sims/xapi-governance-handoff/main.html" width="100%" height="402px" scrolling="no"></iframe>

<details markdown="1">
<summary>Standards Governance Handoff</summary>
Type: workflow
**sim-id:** xapi-governance-handoff<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/learning-standards-timeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: summarize, sequence

Learning objective: Let the learner trace how stewardship of xAPI moved across three organizations over time, and correctly attribute each organization's distinct role rather than treating "the standard" as owned by one undifferentiated group.

Purpose: Show a left-to-right Mermaid flowchart with four stages, each a labeled node, connected by arrows annotated with the year the handoff occurred.

Nodes:

- "ADL Initiative" — originates xAPI via Project Tin Can, publishes xAPI 1.0 (2013)
- "IEEE LTSC" — stewardship transition begins (2019), leading to a balloted standard
- "IEEE 9274.1.1-2023" — the published core standard (2023), shown as a document icon
- "I2IDL" — established (2025), takes over operational tooling, branching to three child nodes: "xAPI Conformance Suite," "xAPI Profile Server," "TLA Reference Implementation"

Interactive features: Every node has a Mermaid `click` directive. Clicking "ADL Initiative," "IEEE LTSC," or "I2IDL" opens an infobox with that organization's one-sentence role definition, matching the chapter's governance table. Clicking "IEEE 9274.1.1-2023" opens an infobox explaining what the standard covers (Statement structure, RESTful API, conformance requirements). Clicking any of the three I2IDL child nodes opens an infobox naming what that tool does and linking conceptually to where it is covered later in this chapter.

Color coding: ADL Initiative in amber (legacy/origin), IEEE LTSC and IEEE 9274.1.1-2023 in the book's teal accent color (formal standard), I2IDL and its three child nodes in green (active operational tooling).

Implementation: Mermaid flowchart, left-to-right orientation, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
</details>

## Proving an Implementation Actually Conforms

A published standard only prevents fragmentation if implementers can check their work against it. The **xAPI Conformance Suite** is an automated test suite, operated by I2IDL, that a Learning Record Store implementation runs against to verify it correctly implements the behavior IEEE 9274.1.1-2023 requires — everything from Chapter 2's HTTP Verb behavior on the `/statements` resource to whether a malformed Statement is correctly rejected. Passing the suite is how an implementer can credibly claim "this Learning Record Store is conformant" rather than "this Learning Record Store works for the cases we happened to test."

Much of what the suite checks should already sound familiar, because Chapter 2 covered the rules it enforces before this chapter named the tool that enforces them.

- Correct `GET`, `PUT`, and `POST` behavior on the Statement resource, including the required rejection of a `PUT` that targets an already-used Statement ID
- Statements missing a required Actor, Verb, or Object are rejected rather than silently accepted
- Statement Immutability holds: no route exists that edits or deletes a stored Statement
- Statement Query Parameters — `agent`, `verb`, `activity`, `since`, `until`, `limit`, and others — are supported and filter results correctly
- Both Basic Authentication and OAuth Authentication are accepted where the Learning Record Store advertises support for them

A Learning Record Store that has never run against the Conformance Suite might behave correctly for every Statement its own team happened to write, and still fail the moment a textbook publisher it has never worked with sends a Statement shaped slightly differently than expected. The suite exists precisely to surface that gap before a real Learning Record Provider does.

## The Trouble With Being Too Flexible

xAPI's flexibility is also, unmanaged, a liability. Recall from Chapter 1 that a Verb is just a URI a Learning Record Provider chooses — nothing in the core standard stops one textbook from using a Verb URI it calls "completed" while a second textbook uses a differently-spelled URI it also happens to call "completed," or a third invents an entirely private URI no other system recognizes. Multiply that across thousands of independently built intelligent textbooks, and a district's simple question — "how many students completed a quiz this week?" — quietly breaks, because a query that filters on one specific Verb URI silently misses every Statement that used a different one to mean the same thing.

The **xAPI Profile Standard** is the field's answer to that risk: a specification, developed alongside IEEE LTSC and expected to be formally balloted as IEEE 9274.2.1, that defines how to publish a shared, reusable vocabulary and set of validation rules that multiple independent Learning Record Providers can agree to follow for a given domain. A Profile does not replace the core Statement format from Chapters 1 and 2 — it constrains and documents how that format should be used consistently within one subject area, so Statements produced by unrelated software remain comparable.

Profiles are written in **JSON-LD** — JSON for Linked Data, a format layered on top of the ordinary JSON syntax you saw in Chapter 2's extended Statement example. JSON-LD adds an explicit `@context` mapping so a short, convenient key used inside a document — say, `completed` — resolves unambiguously to one specific, globally unique IRI (Internationalized Resource Identifier) published on the web, such as `https://w3id.org/xapi/adl/verbs/completed`. That mapping is what lets two teams who have never spoken to each other both import the same Profile and end up emitting Statements that genuinely mean the same thing, rather than merely looking similar.

A concrete, published JSON-LD document that follows the rules of the xAPI Profile Standard for one specific domain is called an **Application Profile**. Where the xAPI Profile Standard is the general rulebook for how any Profile must be structured, an Application Profile is one actual, usable document — a vocabulary of Verbs and Activity Types, plus one or more Statement Templates describing exactly which fields a conformant Statement in that domain must include. cmi5, covered later in this chapter, is the best-known Application Profile in the entire ecosystem.

An Application Profile's Statement Templates need a mechanical way to route an incoming Statement to the correct template, since a Profile can define several. A **Determining Property** is the field within a Statement Template — most often the Verb or the Activity Type — that a validator or reporting tool checks first to decide which template's rules apply to a given Statement. Without a Determining Property, a Learning Record Store checking a Statement against a Profile with five templates would have no principled way to know which of the five to compare it against.

!!! mascot-tip "Check the registry before you write your own vocabulary"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    A working practitioner's move that the specification text never quite says out loud: before defining new Verbs or Activity Types for a textbook or district, check whether an existing Application Profile already covers the interaction you're trying to record. Reusing a published vocabulary — rather than inventing a private one — is exactly what keeps your Statements comparable to everyone else's, which is the entire point of a Profile in the first place.

Once an Application Profile exists, other implementers need a reliable way to find it rather than a link buried in a PDF or a wiki page. The **xAPI Profile Server**, operated by I2IDL, is a hosted registry where Profile authors publish, version, and share their JSON-LD Profile documents, so implementers can fetch a canonical, machine-readable copy directly rather than re-typing definitions by hand from a document. cmi5's own vocabulary, and many domain-specific Profiles beyond it, are published there.

The diagram below pulls the profile-related terms just introduced — xAPI Profile Standard, JSON-LD, Application Profile, Determining Property, and the Profile Server that hosts them — into one explorable structure.

#### Diagram: Anatomy of an xAPI Profile

<iframe src="../../sims/xapi-profile-anatomy/main.html" width="100%" height="482px" scrolling="no"></iframe>

<details markdown="1">
<summary>Anatomy of an xAPI Profile</summary>
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
</details>

Three related terms have now been introduced at three different levels of abstraction, and it helps to see them side by side before moving to a concrete example. The table below organizes them from most general to most specific.

| Term | What It Is | Concrete Example |
|---|---|---|
| xAPI Profile Standard | The general specification for how any Profile must be structured (soon IEEE 9274.2.1) | Not itself an example — it is the rulebook every Application Profile follows |
| Application Profile | One published JSON-LD document defining a vocabulary and Statement Templates for a domain | cmi5's vocabulary of launch and completion Verbs |
| Determining Property | One field inside a Statement Template used to route a Statement to that template | cmi5's `completed` Verb identifying which cmi5 template applies |

The xAPI Profile Standard itself is still working through the IEEE balloting process described earlier in this chapter, under the number **IEEE 9274.2.1**. Unlike IEEE 9274.1.1-2023, it has not yet been formally published as a finished standard — the Application Profile mechanism it will govern is already in active, real-world use through documents like cmi5, but the umbrella standard that formalizes the rules for writing any Profile is still in development.

!!! mascot-warning "9274.2.1 is not published yet — cite it carefully"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    Don't cite IEEE 9274.2.1 the way you'd cite IEEE 9274.1.1-2023. The core Statement and API standard is finished, balloted, and published — you can point to it as settled. The Profile Standard is still in development. Application Profiles like cmi5 work today because the underlying JSON-LD and Statement Template mechanisms are already well understood and widely deployed, not because IEEE has finished balloting the umbrella document that will eventually formalize them.

## cmi5: A Profile Everyone Already Uses

The clearest way to see an Application Profile in action is through the one nearly every district and LMS vendor already supports. Recall Chapter 1's account of SCORM's Sharable Content Object: it could report launch, completion, and a score, but only to the one LMS that launched it, because its reporting mechanism was a proprietary in-browser JavaScript call rather than a portable web API. **cmi5** is the Application Profile, developed by the ADL Initiative, that keeps the part of SCORM that instructors and LMS vendors still rely on — an LMS assigning and launching a specific piece of content to a specific learner — while replacing SCORM's narrow, LMS-bound reporting with real xAPI Statements sent to a Learning Record Store. cmi5 is, in effect, the bridge between the LMS-centric world Chapter 1 described and the LRS-centric world the rest of this book assumes.

Where SCORM's smallest launchable unit was a Sharable Content Object, cmi5's is a **cmi5 Assignable Unit**, abbreviated **AU**. An Assignable Unit is the smallest piece of content an LMS can assign to a learner and launch under cmi5, tracked entirely through xAPI Statements rather than SCORM's in-browser reporting API. Because an AU communicates over the same RESTful xAPI Endpoint from Chapter 2 rather than a SCORM-specific JavaScript library, it can be built with any web technology capable of making an HTTP request — there is no dependency on a SCORM runtime being present in the browser.

An Assignable Unit still needs to know, the moment it launches, which learner is using it, which Learning Record Store to write to, and how to prove it is authorized to write there. The **cmi5 Launch Method** is the standardized process a cmi5-conformant LMS uses to answer all three questions at once: the LMS opens the Assignable Unit's URL in the learner's browser, appending required query-string parameters that include an `endpoint` (the xAPI Endpoint the AU should write to), a short-lived `fetch` URL the AU calls immediately to obtain an authorization token, an `actor` object identifying the learner (built from the Actor Account concept in Chapter 2), and a `registration` UUID (Chapter 2's Registration concept) that groups every Statement this particular launch produces into one attempt. Because all of that arrives in the launch URL itself, the AU can begin sending conformant Statements the instant it loads, with no separate configuration step.

The diagram below traces one complete cmi5 launch from assignment through the Statements it produces, so the Launch Method's parameters can be seen driving real, sequential behavior rather than sitting as an abstract list.

#### Diagram: cmi5 Launch Sequence

<iframe src="../../sims/cmi5-launch-sequence/main.html" width="100%" height="662px" scrolling="no"></iframe>

<details markdown="1">
<summary>cmi5 Launch Sequence</summary>
Type: workflow
**sim-id:** cmi5-launch-sequence<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: demonstrate, trace

Learning objective: Let the learner apply their understanding of the cmi5 Launch Method by tracing a full launch sequence from LMS assignment through the Assignable Unit's xAPI Statements, predicting which Launch Method parameter enables each step.

Purpose: Show an eight-step, top-to-bottom Mermaid flowchart tracing one learner's complete cmi5 session.

Steps:

1. "LMS assigns the AU to a learner" — the LMS knows which Assignable Unit and which learner
2. "LMS launches the AU URL" — query parameters attached: `endpoint`, `fetch`, `actor`, `registration`
3. "AU calls the fetch URL" — exchanges the short-lived reference for an authorization token
4. "AU sends an 'initialized' Statement" — first Statement of the session, tagged with the launch's Registration
5. "Learner interacts with the AU" — a stream of Statements using domain Verbs (for example, "experienced," "answered")
6. "AU sends a 'completed' or 'passed'/'failed' Statement" — the outcome of this attempt
7. "AU sends a 'terminated' Statement" — signals the session has ended
8. "LMS queries the LRS" — using the `agent` and `registration` Statement Query Parameters from Chapter 2 to display the learner's current status

Interactive features: Every node has a Mermaid `click` directive. Clicking steps 1-2 opens an infobox listing each Launch Method query parameter and what it supplies. Clicking steps 4, 6, and 7 opens an infobox showing that Statement's Actor/Verb/Object in miniature, reusing the visual pattern from Chapter 1's statement-anatomy diagram. Clicking step 8 opens an infobox explaining how the Registration groups every Statement from one launch into a single queryable attempt.

Color coding: Launch and authorization steps (1-3) in amber; the session's own Statements (4-7) in the book's teal accent color; the LMS's read-back (step 8) in green.

Implementation: Mermaid flowchart, top-to-bottom orientation, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
</details>

## The Bigger Picture: Total Learning Architecture

Everything so far in this chapter has made one Learning Record Store more trustworthy and more consistent with others like it. But a single LRS, however conformant, is not the whole picture a large organization — or a learner moving between organizations over an entire career — actually needs. The **Total Learning Architecture**, abbreviated **TLA**, is a reference architecture originating from the same Department of Defense lineage as SCORM and xAPI: not a piece of software you install, but a documented set of components and the interfaces between them, describing how a Learning Record Store fits alongside other systems — a competency and skills registry, a content recommendation engine, additional federated LRS instances — so that a learner's record can, in principle, follow that learner across schools, employers, and years, not just across one course or one district.

A reference architecture is only useful if implementers can check that their own components actually satisfy it, which is precisely the gap the **TLA Reference Implementation** closes. Maintained by I2IDL, it is an open-source, runnable implementation of TLA's core components, including a reference Learning Record Store, that an organization building its own piece of the ecosystem can test its interfaces against directly. Where the xAPI Conformance Suite from earlier in this chapter checks one Learning Record Store's Statement API in isolation, the TLA Reference Implementation checks whether a whole constellation of interoperating systems — Learning Record Stores, registries, recommendation engines — actually plugs together the way the architecture's documentation claims it should.

!!! mascot-encourage "You don't need to memorize every acronym today"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    This chapter introduced a genuinely large number of organizations and standard numbers — ADL Initiative, IEEE LTSC, I2IDL, 9274.1.1, 9274.2.1, TLA. That's a lot to hold at once, and it's fine if the acronyms blur on a first read. What matters is the shape underneath them: one organization originates a specification, a second formally standardizes it, a third operates the tooling that proves implementations follow it — and the whole thing exists inside a still-larger architecture that this project's own LRS is only one component of.

The diagram below situates this project's own Learning Record Store within that wider TLA ecosystem, so the abstract architecture description above has a concrete shape.

#### Diagram: Total Learning Architecture Ecosystem Map

<iframe src="../../sims/tla-ecosystem-map/main.html" width="100%" height="522px" scrolling="no"></iframe>

<details markdown="1">
<summary>Total Learning Architecture Ecosystem Map</summary>
Type: graph-model
**sim-id:** tla-ecosystem-map<br/>
**Library:** vis-network<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/ed-tech-ecosystem<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: analyze, relate

Learning objective: Let the learner analyze how a Learning Record Store relates to the other named components of the Total Learning Architecture, and locate this project's own LRS within that wider ecosystem rather than treating it as a standalone system.

Purpose: Show a central "Learner" node surrounded by connected component nodes representing the Total Learning Architecture, with this project's own LRS visually distinguished.

Nodes:

- Center: "Learner" — the person whose record moves across the whole ecosystem
- "This Project's LRS" — visually highlighted (thicker border, teal accent color) with an edge to "Learner" labeled "stores Statements about"
- "Competency and Skills Registry" — edge to LRS labeled "maps mastered concepts to skills"
- "Content Recommendation Engine" — edge to LRS labeled "reads Statement history to recommend next content"
- "Federated LRS (another organization)" — edge to LRS labeled "may exchange records for a learner who moves between organizations"
- "TLA Reference Implementation" — dashed-outline node connected to all of the above, labeled "the working demo of this whole map, maintained by I2IDL"

Interactive features: Every node is clickable via vis-network's built-in click event. Clicking any component node opens an infobox with its one-sentence role and, where relevant, which chapter concept it corresponds to (for example, clicking "This Project's LRS" reiterates the Learning Record Store definition from Chapter 1). Clicking "TLA Reference Implementation" opens an infobox distinguishing it from the xAPI Conformance Suite, reinforcing the distinction drawn earlier in this chapter.

Color coding: This project's LRS in the book's teal accent color; other TLA components in neutral gray-blue; the TLA Reference Implementation node with a dashed border to signal "reference/testing artifact" rather than a production system.

Implementation: vis-network graph with physics-based layout (learner at center, components arranged around it), full click-to-infobox coverage on every node. Responsive width and height tracking the containing element, with layout re-stabilizing on resize.
</details>

## Bringing the Governance Story Together

Every piece of this chapter answers the same underlying question from a different angle: how does a specification stay trustworthy and consistent once thousands of independent organizations are building against it? The chain of reasoning below is a quick self-check before moving to Chapter 4, which widens the lens further to the rest of the interoperability ecosystem xAPI now sits inside.

1. A single organization controlling a specification is a structural risk → stewardship of xAPI moved from the ADL Initiative to IEEE LTSC in 2019, producing the formally balloted IEEE 9274.1.1-2023.
2. A published standard still needs operational tooling to test implementations against it → I2IDL, established in 2025, now operates the xAPI Conformance Suite, the xAPI Profile Server, and the TLA Reference Implementation.
3. Free-text Verbs and Activity Types make cross-implementation comparison unreliable → the xAPI Profile Standard (soon IEEE 9274.2.1), expressed in JSON-LD, lets independent teams share one Application Profile's vocabulary.
4. An Application Profile can define several Statement Templates → a Determining Property mechanically routes an incoming Statement to the correct one.
5. Content still needs an LMS to assign and launch it, but SCORM's narrow reporting was too limited → cmi5 is the Application Profile that keeps LMS-based launch while reporting through real xAPI Statements, using its own cmi5 Assignable Unit and cmi5 Launch Method.
6. One Learning Record Store is not the whole picture → the Total Learning Architecture frames how an LRS fits among registries and recommendation engines across an entire career, with a TLA Reference Implementation to prove the pieces actually interoperate.

## Key Takeaways

- The **ADL Initiative** originated xAPI and continues to develop cmi5, but no longer solely governs the specification's formal text.
- The **IEEE LTSC** balloted and published **IEEE 9274.1.1-2023**, the formal core standard defining the Statement structure and RESTful API from Chapters 1 and 2.
- The **I2IDL**, established in 2025, operates the practical tooling — the **xAPI Conformance Suite**, the **xAPI Profile Server**, and the **TLA Reference Implementation** — that lets implementers check their work.
- The **xAPI Conformance Suite** automatically tests whether a Learning Record Store correctly implements IEEE 9274.1.1-2023's required behavior.
- The **xAPI Profile Standard**, expected to be balloted as **IEEE 9274.2.1**, defines how to publish a shared, reusable vocabulary — an **Application Profile** — expressed in **JSON-LD**.
- A **Determining Property** routes an incoming Statement to the correct Statement Template within an Application Profile.
- **cmi5** is the Application Profile that replaces SCORM's LMS-bound reporting with real xAPI Statements, launching content as a **cmi5 Assignable Unit** through the **cmi5 Launch Method**.
- The **Total Learning Architecture** frames how a Learning Record Store fits among competency registries, recommendation engines, and other systems across a learner's whole career.

!!! mascot-celebration "You now know who's minding the standard"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    From ADL's original research to IEEE's balloted standard to I2IDL's conformance tools, cmi5's launch mechanics, and the Total Learning Architecture's wider map — you can now place any piece of this ecosystem in context. What does the evidence show? In [Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../04-standards-governance-ecosystem/index.md), we widen the lens even further, to the standards bodies and neighboring specifications xAPI shares the field with.
