---
title: System Context and the Five Architectural Planes
description: A tour of this project's own Learning Record Store — the system context diagram, the five architectural planes it decomposes into, and the core components living in each, grounded in the LRS specification and design documents.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 07:36:44
version: 0.09
---

# System Context and the Five Architectural Planes

## Summary

Having established why every intelligent educational system needs an LRS, this chapter turns to the specific one built in this project. It introduces the five architectural planes — ingestion, processing, storage, analytics, and presentation — and the core components living in each: the gateway, the durable queue, the event store, the stream processor, and the four report-serving APIs.

## Concepts Covered

This chapter covers the following 15 concepts from the learning graph:

1. System Context Diagram
2. Ingestion Plane
3. Processing Plane
4. Storage Plane
5. Analytics Plane
6. Presentation Plane
7. Ingestion Gateway
8. Durable Event Queue
9. Event Store
10. Stream Processor
11. Analytics API
12. Admin API
13. Experiment API
14. Roster API
15. Export API

## Prerequisites

This chapter builds on concepts from:

- [Chapter 1: From Learning Management Systems to the Experience API](../01-lms-to-experience-api/index.md)

---

!!! mascot-welcome "Opening the engine room"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Welcome to Part 2! Chapters 1 through 4 taught you the vocabulary and governance that any xAPI-conformant system shares. Starting now, we open up one specific Learning Record Store — the one this book's specifications describe — and trace exactly how it is built. Let's follow the record.

Part 1 answered a general question: why does any intelligent educational system need a Learning Record Store, and what vocabulary and standards govern it? Part 2 answers a narrower, more concrete question: how does *this* Learning Record Store — the one specified in this project's own `lrs-spec-v1.md` and `lrs-design-v1.md` documents — actually work? Every claim from this chapter forward is grounded in those two documents rather than in general industry practice, because from here on the book is describing one particular system, not the field as a whole.

That system exists to solve a scale problem Chapter 1 only gestured at. A single intelligent textbook, instrumented the way Chapter 1 described, can generate a steady stream of xAPI Statements from one student in one sitting. Multiply that by thousands of textbooks running concurrently across many school districts, and the Learning Record Store has to accept, store, and make sense of an enormous, continuous flow of small events without ever losing one or blocking a classroom. This chapter introduces the architecture built to do that: a **System Context Diagram** of the whole system, and the five **architectural planes** — Ingestion, Processing, Storage, Analytics, and Presentation — that the system decomposes into.

## What a System Context Diagram Shows

Before looking at this project's own diagram, it helps to know what kind of diagram it is. A **System Context Diagram** is the highest-level view of a software architecture: it draws the system being described as a single box, shows every external actor and external system that interacts with it, and labels the major flows of data crossing the boundary — without exposing any internal implementation detail. This is a general practice from software architecture (most closely associated with the C4 model for documenting systems), not a term unique to this project, but the diagram below is built from this project's own specification, not a generic template.

The system context for this Learning Record Store has three kinds of participants outside its boundary: the many **intelligent textbooks** submitting xAPI Statements (acting as Learning Record Providers, in Chapter 1's terms), the **instructors** who view dashboards, and the **district and system administrators** who manage the deployment and view administrative reports. Everything between those external participants — every gateway, queue, processor, and store — lives inside the system boundary, organized into the five architectural planes this chapter names.

#### Diagram: This Project's System Context Diagram

<iframe src="../../sims/lrs-system-context-diagram/main.html" width="100%" height="682px" scrolling="no"></iframe>

<details markdown="1">
<summary>This Project's System Context Diagram</summary>
Type: graph-model
**sim-id:** lrs-system-context-diagram<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/xapi-data-flow<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: describe, identify

Learning objective: Let the learner identify the external actors and the five internal planes of this project's Learning Record Store, and describe in one sentence what crosses the system boundary in each direction.

Purpose: Render the system context from the LRS specification's §2 diagram as a single Mermaid flowchart, top to bottom, with the external actors outside a bounding subgraph labeled "Learning Record Store" and the five planes as ordered nodes inside it.

Nodes, top to bottom:

- External: "Intelligent Textbooks (thousands, concurrent)" — sends xAPI statements
- Inside the LRS boundary, in order: "Ingestion Plane", "Processing Plane", "Storage Plane", "Analytics Plane", "Presentation Plane"
- External: "Instructors" — receives dashboards
- External: "District & System Admins" — receives admin reports

Edges: "Intelligent Textbooks" to "Ingestion Plane" labeled "xAPI statements"; each plane to the next labeled with what flows between them ("durably queued statements", "validated + enriched events", "aggregated queries", "rendered reports"); "Presentation Plane" to "Instructors" labeled "dashboards"; "Presentation Plane" to "District & System Admins" labeled "admin UIs".

Interactive features: Every node has a Mermaid `click` directive. Clicking an external-actor node opens an infobox naming its role (Learning Record Provider, dashboard viewer, or administrator). Clicking any plane node opens an infobox with that plane's one-sentence definition and the two or three components it contains, previewing the deep-dive sections later in this chapter.

Color coding: External actors in a neutral gray; the five internal planes in a left-to-right gradient of the book's teal accent color, darkest at Ingestion and lightest at Presentation, so the reader can visually track the direction data flows.

Implementation: Mermaid flowchart, top-to-bottom orientation, one bounding subgraph for the system boundary, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
</details>

## The Five Architectural Planes

A system context diagram tells you what crosses the boundary; it does not tell you how the inside is organized. This Learning Record Store organizes its internals into five **architectural planes** — named groupings of components that share one responsibility in the statement's journey from an intelligent textbook to a finished report. Reading them in the order a statement actually travels:

- The **Ingestion Plane** is where every xAPI Statement first arrives: the conformant endpoint that accepts statements and the durable queue that holds them the instant they are accepted.
- The **Processing Plane** validates, enriches, and pseudonymizes each statement, and runs the pipeline that compresses many statements down into far fewer summary records.
- The **Storage Plane** is where accepted statements and their compressed summaries actually live at rest — an event store holding every statement at full fidelity, plus a property graph holding structure and those summaries.
- The **Analytics Plane** is the set of query and computation services that answer questions about stored data — the plane every report and dashboard is ultimately backed by.
- The **Presentation Plane** is what a human being actually looks at: dashboards for instructors and administrative user interfaces for district and system staff.

!!! mascot-thinking "Five planes, one direction"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice that these five planes are not five arbitrary categories — they are one pipeline, read left to right, from "a statement just happened" to "a person is looking at a chart." Every component you meet for the rest of this book belongs to exactly one plane, and knowing which plane a component lives in tells you most of what you need to know about its job before you read a single implementation detail.

Before moving to any single plane in depth, the table below organizes the five planes side by side, now that each has been defined in the prose above.

| Plane | Primary Responsibility | Core Components (this chapter) |
|---|---|---|
| Ingestion Plane | Accept xAPI statements the instant they arrive | Ingestion Gateway, Durable Event Queue |
| Processing Plane | Validate, enrich, pseudonymize, and compress statements | Stream Processor |
| Storage Plane | Hold statements and summaries at rest | Event Store (plus the property graph, covered in a later chapter) |
| Analytics Plane | Answer queries that back reports | Analytics API, Admin API, Experiment API, Roster API, Export API |
| Presentation Plane | Render results for a human to view | Dash/Plotly dashboards, administrative UIs |

With the five planes named and organized, it is worth testing whether you can place a component correctly before reading the deep-dive sections that follow — that is exactly the skill the sorting activity below is built to reinforce.

#### Diagram: Sort the Component into Its Plane

<iframe src="../../sims/five-architectural-planes-infographic/main.html" width="100%" height="522px" scrolling="no"></iframe>

<details markdown="1">
<summary>Sort the Component into Its Plane</summary>
Type: infographic
**sim-id:** five-architectural-planes-infographic<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: classify, sort

Learning objective: Let the learner apply their understanding of the five architectural planes by sorting eight named components (Ingestion Gateway, Durable Event Queue, Stream Processor, Event Store, Analytics API, Admin API, Experiment API, Roster API, Export API, Dash/Plotly Dashboards) into the correct one of five labeled plane buckets.

Canvas layout:

- Top strip: a shuffled row of small draggable tiles, one per component name
- Middle: five labeled drop zones arranged left to right in pipeline order — "Ingestion Plane", "Processing Plane", "Storage Plane", "Analytics Plane", "Presentation Plane" — each drawn as a wide colored band matching the diagram above
- Bottom strip: score readout ("Sorted: 0 / 10") and a "Check All" button

Visual elements:

- Component tiles in a neutral cream color with the component name printed on them
- Each plane band tinted with the same left-to-right teal gradient used in the System Context Diagram, so the two visuals reinforce the same color language
- A tile dropped in its correct band locks in place with a green outline; a tile dropped in the wrong band bounces back to the top strip with a brief red flash

Interactive controls:

- Drag-and-drop: drag any tile onto any plane band
- Button: "Check All" — validates every placed tile at once and reveals a one-sentence explanation for any incorrect placement
- Button: "Reset" — returns all tiles to the top strip

Default parameters: all ten tiles unplaced at start, shuffled in random left-to-right order using a seeded index so layout is reproducible within a session.

Behavior: on a correct drop, increment "Sorted" and lock the tile; when all ten are correctly sorted, display "All ten components placed correctly — you know the five planes."; clicking any locked tile re-opens an infobox with that component's one-sentence role, matching the definition given earlier in this chapter.

Implementation notes: p5.js mouse-press/mouse-release drag-and-drop, same pattern as other chapter sorting MicroSims in this book. Responsive design: canvas width tracks the containing element's width, and the five bands stack into two rows at narrow (mobile) widths rather than compressing unreadably.
</details>

## The Ingestion Plane: Where a Statement First Lands

The Ingestion Plane's job is narrow and deliberately so: accept a statement the instant it arrives, and do as little else as possible. Two components make up this plane. The **Ingestion Gateway** is the xAPI-conformant endpoint every intelligent textbook sends statements to — it performs only structural validation (is this well-formed JSON, does it have an actor, a verb, and an object, is the timestamp parseable) before durably queuing the statement and responding. It does not wait for the statement to be enriched, pseudonymized, or written anywhere permanent; it waits only long enough to know the statement is safely queued. The **Durable Event Queue** is exactly that: a partitioned, durable queue that holds every accepted statement the moment the Ingestion Gateway hands it off, preserving each learner's statements in the order they occurred so nothing downstream has to guess at sequencing later.

That narrowness is intentional, not an oversight. The Ingestion Gateway's only hard dependency is the Durable Event Queue — every other component in the system can be temporarily unavailable and a classroom's statements still get accepted and safely queued. This is the concrete mechanism behind the non-blocking ingestion promise this project's specification treats as a first design principle: a textbook that starts sending statements never has to wait for anything downstream to catch up, and a brand-new textbook nobody has configured yet is still accepted rather than rejected.

The list below summarizes what the Ingestion Gateway does and does not do on every request, reinforcing the distinction just drawn in prose.

- Does perform structural (tier-1) validation: well-formed JSON, required actor/verb/object fields, a parseable timestamp.
- Does assign a statement identifier if the sender did not supply one, and records the moment of arrival.
- Does hand the statement to the Durable Event Queue and respond as soon as that queue confirms receipt.
- Does not wait for enrichment, pseudonymization, mastery scoring, or any permanent storage write.
- Does not require any other plane's components to be healthy in order to accept a statement.

!!! mascot-tip "One dependency is the whole trick"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    If you remember one architectural fact from this section, make it this one: the Ingestion Gateway depends on the Durable Event Queue and nothing else. Every time you evaluate whether a design choice elsewhere in the system threatens ingestion, ask "does this add a second hard dependency to the gateway?" If the answer is yes, it is working against the whole point of this plane.

## The Processing Plane: Turning Raw Statements into Structure

Statements waiting in the Durable Event Queue are safe, but they are not yet useful for reporting — nobody has resolved which learner sent them, enriched them with the section and textbook version they belong to, or written them anywhere queryable. That work belongs to the **Processing Plane**, and its core component is the **Stream Processor**: a pool of workers that consume statements off the queue, in order, and perform every step between "safely queued" and "durably stored and enriched." Reading a statement's actor field, resolving it to an internal identifier, attaching the section and concept identifiers it relates to, and writing the finished record to permanent storage are all Processing Plane work — none of it happens at the Ingestion Gateway, and none of it blocks a new statement from being accepted while it runs.

Consuming statements *in order* matters enough to call out on its own: because a learner's statements are queued in sequence, the Stream Processor can build correct running conclusions about that learner without waiting for every statement that will ever arrive about them. A later chapter details exactly what those running conclusions look like; for now, the important structural fact is that the Processing Plane is the only place in the system where an individual statement is examined and acted upon one at a time. Once it finishes with a statement, everything downstream works with either the full stored record or a much smaller compressed summary — never the queue entry again.

Before looking at the diagram below, hold the shape of the pipeline so far in mind: a statement crosses the Ingestion Plane in a fraction of a second, waits briefly on the Durable Event Queue, and is then picked up by the Processing Plane's Stream Processor, which is the component responsible for getting it safely into the Storage Plane.

#### Diagram: From Gateway to Event Store — the Ingestion and Processing Pipeline

<iframe src="../../sims/ingestion-processing-storage-pipeline/main.html" width="100%" height="672px" scrolling="no"></iframe>

<details markdown="1">
<summary>From Gateway to Event Store — the Ingestion and Processing Pipeline</summary>
Type: workflow
**sim-id:** ingestion-processing-storage-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/context-graph/tree/main/docs/sims/ingestion-pipeline-architecture<br/>

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, demonstrate

Learning objective: Let the learner trace one xAPI statement's path from an intelligent textbook through the Ingestion Gateway, the Durable Event Queue, and the Stream Processor, into the Event Store, and predict which steps can proceed even if a later step is temporarily unavailable.

Purpose: Show a six-step, left-to-right Mermaid flowchart tracing one statement from submission to durable storage, with a visible branch showing non-blocking behavior.

Steps:

1. "Intelligent Textbook sends statement" — a POST request carrying one xAPI statement
2. "Ingestion Gateway validates structure" — checks actor, verb, object, and timestamp are present and well-formed
3. "Ingestion Gateway queues statement" — hands the statement to the Durable Event Queue and responds immediately
4. "Durable Event Queue holds statement in order" — preserves per-learner sequence until a processor consumes it
5. "Stream Processor consumes and enriches" — resolves the learner, attaches section and concept context, pseudonymizes the actor
6. "Stream Processor writes to Event Store" — the statement becomes part of the durable, queryable log

Branch: from step 3, a dashed arrow to a side node "If the Stream Processor is temporarily down" leading to "Statement waits safely in the Durable Event Queue — the textbook already received its response in step 3."

Interactive features: Every node has a Mermaid `click` directive. Clicking steps 1-3 opens an infobox describing the Ingestion Plane's narrow responsibility. Clicking steps 4-6 opens an infobox describing the Processing Plane's enrichment work and the Storage Plane's role as the destination. Clicking the branch node opens an infobox explaining non-blocking ingestion in one worked sentence.

Color coding: Steps 1-3 (Ingestion Plane) in the darkest teal from the System Context Diagram's gradient; steps 4-5 (Processing Plane) in a mid-teal; step 6 and the Event Store destination (Storage Plane) in the lightest teal, keeping the color language consistent across every diagram in this chapter.

Implementation: Mermaid flowchart, left-to-right orientation, one dashed branch node, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
</details>

## The Storage Plane: Where Statements Come to Rest

The Storage Plane holds two systems of record, and this chapter only introduces the one the Concepts Covered list names directly. The **Event Store** is the durable, queryable, immutable log of every xAPI statement the system has ever accepted, kept at full fidelity — the original statement, unmodified, indexed so it can be retrieved by actor, verb, activity, or time range. Every statement the Processing Plane finishes enriching lands here, and it stays here for as long as the system's retention policy allows. Because the Event Store never discards or edits a statement — only new statements can retract an earlier one, never a direct edit — it is the ultimate source of truth the rest of the system can always fall back on.

The Storage Plane's second system of record is a property graph, holding the tenancy structure, the content hierarchy, and compressed summaries of learner activity rather than individual statements. That graph, and exactly how a flood of statements becomes a small number of summary records inside it, is substantial enough to earn its own later chapter — for now, the important fact is only that the Storage Plane is not one store but two, with the Event Store as the complete record and the graph as a much smaller, structure-and-summary companion to it.

!!! mascot-warning "The queue is not the store"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    A common mix-up at this point is treating the Durable Event Queue and the Event Store as two names for the same thing. They are not. The Durable Event Queue is a temporary holding area in the Ingestion Plane — statements pass through it on their way to being processed, and it is not where anything is queried from later. The Event Store is the permanent, queryable home for every statement, built by the Processing Plane, living in the Storage Plane. If a report needs historical statement data, it reads the Event Store — never the queue.

## The Analytics Plane: Five APIs, One Job Each

Once statements are durably stored and enriched, something has to turn them into answers a person can actually use — that is the Analytics Plane's job, and it does that job through five distinct APIs, each scoped to one kind of question. The **Analytics API** is the workhorse: it backs every instructor and administrator report and dashboard, running the queries and aggregations that turn stored statements and graph summaries into the figures a dashboard renders. The **Admin API** serves every administrative user interface — creating districts, managing rosters, configuring deployments — and every mutation it performs is written to an audit log. The **Experiment API** handles assignment and readout for this project's A/B-testing subsystem, deciding which version of a textbook or MicroSim a given student sees and reporting how each version performed. The **Export API** produces bulk, asynchronous exports of statements or reports for archival or external analysis, so a district can pull its own data out of the system rather than being locked into it.

The fifth API works in the opposite direction from the other four. The **Roster API** is how enrollment data flows *into* the system rather than out of it — ingesting which students belong to which sections from a district's own student information system, so the Learning Record Store always knows the roster context a statement belongs to. Where the Analytics, Admin, Experiment, and Export APIs all answer questions by reading what the system already knows, the Roster API's job is supplying the system with organizational facts it cannot infer from statements alone. A later chapter covers exactly how rosters, multi-tenancy, and pseudonymous student identity fit together; for now, simply note that the Roster API exists, that it is inbound, and that it lives in the Analytics Plane alongside its four outbound siblings because it is administrative infrastructure rather than a place a statement is stored.

Now that each of the five APIs has been described individually, the table below organizes them together by direction and primary audience.

| API | Direction | Primary Audience | What It Answers or Accepts |
|---|---|---|---|
| Analytics API | Outbound (reports) | Instructors, curriculum authors, admins | Every dashboard figure and report in the system |
| Admin API | Outbound + mutation | District/system/school admins | Administrative configuration, with every action audited |
| Experiment API | Outbound (assignment + readout) | Textbook/MicroSim authors, researchers | Which A/B variant a student sees, and how each variant performed |
| Export API | Outbound (bulk) | Districts, external analysts | Asynchronous bulk exports of statements and reports |
| Roster API | Inbound | District administrators (via SIS sync) | Enrollment data flowing into the system |

#### Diagram: Analytics Plane API Map

<iframe src="../../sims/analytics-plane-api-map/main.html" width="100%" height="522px" scrolling="no"></iframe>

<details markdown="1">
<summary>Analytics Plane API Map</summary>
Type: graph-model
**sim-id:** analytics-plane-api-map<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: analyze, relate

Learning objective: Let the learner analyze how the five Analytics Plane APIs relate to the Analytics Plane as a whole and to their primary audiences, correctly distinguishing the four outbound, report-serving APIs from the Roster API's inbound role.

Purpose: Show a hub-and-spoke vis-network graph with "Analytics Plane" as the central hub and the five APIs as spokes, with edge direction visually distinguishing inbound from outbound APIs.

Nodes:

- Center: "Analytics Plane"
- Spoke: "Analytics API" — edge FROM Analytics Plane, labeled "backs every report and dashboard"
- Spoke: "Admin API" — edge FROM Analytics Plane, labeled "serves admin UIs, every mutation audited"
- Spoke: "Experiment API" — edge FROM Analytics Plane, labeled "assignment + readout for A/B tests"
- Spoke: "Export API" — edge FROM Analytics Plane, labeled "bulk async export"
- Spoke: "Roster API" — edge TO Analytics Plane, labeled "enrollment data flows in"

Interactive features: Every node is clickable via vis-network's built-in click event. Clicking the hub opens an infobox restating the Analytics Plane's definition from this chapter. Clicking any spoke opens an infobox with that API's one-sentence purpose and its primary audience, matching the table above.

Color coding: The four outbound APIs (Analytics, Admin, Experiment, Export) in the book's teal accent color; the Roster API in a contrasting amber to visually flag its reversed, inbound edge direction.

Implementation: vis-network graph with physics-based layout (hub at center, five spokes arranged around it), directional arrows on every edge matching inbound/outbound direction, full click-to-infobox coverage on every node. Responsive width and height tracking the containing element, with layout re-stabilizing on resize.
</details>

!!! mascot-encourage "Five new API names in one section"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Five APIs in one section is a lot to hold onto, and it is fine if the names blur together on a first read. The pattern that matters is simpler than the list of names: four of them answer questions by reading what the system already knows, and one of them — Roster — feeds the system a fact it could never infer on its own. If you can sort any of the five into "reads out" or "writes in" correctly, you have the concept even if you have to look the specific name back up.

## The Presentation Plane: Where Evidence Becomes a Picture

The last stop in the pipeline is the **Presentation Plane** — the layer a human being actually looks at. It has two parts: Dash/Plotly dashboards, which render the reports the Analytics API computes into charts, tables, and filters an instructor or curriculum author can explore, and administrative user interfaces, which give district and system administrators a way to manage the deployment through the Admin API rather than through direct database access. Neither part stores anything or computes anything on its own — the Presentation Plane's whole job is turning an API response into something readable, which is exactly why it sits last in the pipeline and depends on every plane before it.

Reading the five planes together as a single story, rather than five separate definitions, is the goal of this whole chapter. The list below traces one statement's complete journey as a self-check before moving to Chapter 6.

1. An intelligent textbook, acting as a Learning Record Provider, sends an xAPI statement to the Ingestion Plane's Ingestion Gateway.
2. The Ingestion Gateway performs structural validation and hands the statement to the Durable Event Queue, then responds immediately — no downstream plane has to be healthy for this step to succeed.
3. The Processing Plane's Stream Processor consumes the statement in order, enriches it, and writes it to the Storage Plane.
4. The Storage Plane's Event Store keeps the full statement permanently; a companion property graph, detailed in a later chapter, holds structure and compressed summaries.
5. The Analytics Plane's five APIs — Analytics, Admin, Experiment, Export, and the inbound Roster API — read from and write structure into the Storage Plane to answer questions and keep the system's organizational facts current.
6. The Presentation Plane's dashboards and administrative UIs turn Analytics Plane and Admin Plane responses into something an instructor or administrator can actually read.

## Key Takeaways

- A **System Context Diagram** is the highest-level architectural view: one system boundary, its external actors, and the major flows crossing that boundary, with no internal detail — this project's own diagram names intelligent textbooks, instructors, and district/system admins as its three external participants.
- This Learning Record Store decomposes internally into five **architectural planes**, read in pipeline order: **Ingestion Plane**, **Processing Plane**, **Storage Plane**, **Analytics Plane**, and **Presentation Plane**.
- The **Ingestion Plane** holds the **Ingestion Gateway** (structural validation only) and the **Durable Event Queue** (ordered, durable holding area) — together the mechanism behind non-blocking ingestion.
- The **Processing Plane**'s **Stream Processor** consumes statements in order and enriches them before they reach permanent storage.
- The **Storage Plane** holds the **Event Store** — the complete, immutable statement log — alongside a property graph of structure and summaries covered in a later chapter.
- The **Analytics Plane** hosts five APIs: the outbound, report-serving **Analytics API**, **Admin API**, **Experiment API**, and **Export API**, plus the inbound **Roster API** that feeds enrollment data into the system.
- The **Presentation Plane**'s Dash/Plotly dashboards and administrative UIs are the final step, rendering Analytics and Admin Plane responses for a human reader.

!!! mascot-celebration "You can now name every plane in the pipeline"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You just traced a statement's entire journey from an intelligent textbook to a rendered dashboard, plane by plane. What does the evidence show? The pipeline holds together — and next we open up who that evidence actually belongs to. In [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md), we look at how this Learning Record Store keeps thousands of districts, schools, and students cleanly separated while still learning from all of them at once.
