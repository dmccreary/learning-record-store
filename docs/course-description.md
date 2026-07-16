---
title: Course Description for Course Learning Record Store
description: A detailed course description for Learning Record Store including overview, topics covered and learning objectives in the format of the 2001 Bloom Taxonomy
quality_score: 98
---

# Learning Record Store

**Title:** Learning Record Store: IEEE Standards, Architecture, and Practice

**Target Audience:** Three operational personas who will use this project's Learning Record Store day-to-day — **district administrators**, **classroom teachers**, and **intelligent-textbook authors** — plus the software engineers, learning-technology architects, and standards-compliance specialists who build or evaluate it. Also suitable for upper-level undergraduate and graduate students in computer science, instructional design, or educational technology. Every persona chapter is written to be readable without a software-engineering background.

**Prerequisites:** None to begin Part 1 beyond general computer literacy. Part 2 (this project's architecture) assumes working familiarity with JSON and RESTful HTTP APIs. Part 3 (the persona chapters) assumes only the vocabulary introduced in Parts 1–2 — no additional technical background is required to read the district-administrator, teacher, or textbook-author chapters. No prior exposure to xAPI, IEEE standards, or the Advanced Distributed Learning (ADL) Initiative's specifications is assumed anywhere in the book; those are introduced from first principles.

## Course Overview

A Learning Record Store (LRS) is the system of record for a learner's experiences — every statement of the form "someone did something, with some object, in some context" that a training system, simulation, game, or classroom tool chooses to record. **Part 1 of this book is a general case for why that matters**: what makes an LRS useful across organizations and vendors rather than a one-off silo is that its data format and its API are standardized, and every intelligent educational system today — from a single interactive textbook to a district-wide rollout — depends on that standardization to turn scattered learner interactions into trustworthy, portable evidence of learning. This part covers the IEEE Learning Technology Standards Committee (LTSC) family of specifications that define the Experience API (xAPI) and the Learning Record Store it targets, the Total Learning Architecture (TLA) that frames how an LRS fits into a wider ecosystem, and the governance story behind them: how stewardship of these specifications moved from the Advanced Distributed Learning (ADL) Initiative to IEEE LTSC in 2019, and how the Institute for Infrastructure and Interoperable Data in Learning (I2IDL) — a nonprofit established in late 2025 — now operates the open source conformance test suites, the xAPI Profile Server, and TLA reference implementations that let implementers check their work against the standard.

Having established *why* every intelligent educational system needs an LRS, the rest of the book turns to *a specific one*: the graph-database-backed LRS being built in this project, which ingests xAPI event streams from intelligent textbooks, stores the full statement log in an event store, and compresses it into summary vertices in a property graph for analytics. Part 2 walks through that architecture — the ingestion gateway, the durable queue, non-blocking onboarding of new textbooks, and the compression pipeline that keeps the graph's write rate insensitive to ingestion bursts — grounded in this repository's own specification and its in-progress implementation, not a hypothetical system.

Part 3 puts that architecture to work through the eyes of the three people who actually rely on it. The **district administrator** uses adoption dashboards, deployment inventories, and privacy/compliance controls to run a rollout across schools. The **teacher** uses classroom mastery heatmaps, at-risk rosters, and prerequisite-gap analysis to decide who needs help and when. The **textbook author** uses content-effectiveness reports and controlled experiments to learn whether a chapter, a MicroSim, or a sequencing change actually improved learning. Each persona draws on the same underlying statement log, filtered through a different lens — which is the point: one standards-based store of record, three very different decisions.

This matters because learning data is increasingly the input to analytics, credentialing, and AI-driven systems that make decisions about learners — decisions that are only trustworthy if the underlying records are transparent, verifiable, and portable between systems. Understanding both the standards and a concrete, working implementation of them is what lets an administrator trust a rollout, a teacher trust a dashboard, an author trust an experiment, and an engineer build (or evaluate) an LRS with confidence that it will interoperate with the rest of the field.

## Main Topics Covered

**Part 1 — Foundations: why every intelligent educational system needs an LRS**

- Foundations of learning-technology interoperability, and why the field moved from LMS-centric models (SCORM, AICC) toward the Experience API and the Learning Record Store
- The xAPI data model: Actors, Verbs, Objects, Results, Context, Attachments, and Statements
- IEEE 9274.1.1-2023: the published core xAPI standard and its RESTful web-service API
- IEEE 9274.2.1: the in-development Profile Standard and JSON-LD Application Profiles
- The IEEE Learning Technology Standards Committee (LTSC), I2IDL, and the Advanced Distributed Learning (ADL) Initiative: standards governance and stewardship
- Total Learning Architecture (TLA): the reference architecture that situates an LRS among other learning-ecosystem components
- Why every intelligent textbook — not just a single course — needs a shared, standards-based Learning Record Store

**Part 2 — This project's LRS: architecture**

- System context: the ingestion, processing, storage, analytics, and presentation planes of this project's LRS
- Multi-tenancy: districts, schools, courses, sections, and the isolation guarantees between them
- Non-blocking, accept-first ingestion: onboarding a new textbook or MicroSim without a registration bottleneck
- Statement compression: turning millions of xAPI events into a small set of queryable summary vertices, and why the graph never stores one vertex per statement
- Producer contracts and conformance: how an intelligent textbook emits valid, IEEE 9274.1.1-2023-conformant statements this LRS can ingest

**Part 3 — Using the LRS: three personas**

- The district administrator: adoption dashboards, roster and deployment management, and privacy/compliance oversight (FERPA/COPPA)
- The teacher: classroom mastery heatmaps, student-progress reports, at-risk rosters, and prerequisite-gap analysis
- The textbook author: content-effectiveness reports, MicroSim-impact analysis, and controlled A/B experiments on textbook versions
- Cross-persona workflows: how administrator, teacher, and author decisions draw on the same statement log through different reports

## Topics Not Covered

- Line-by-line operational runbooks for deploying, scaling, or upgrading the LRS infrastructure (container orchestration, database tuning) — covered by this project's own engineering specs and MVP plan, not by this course
- Writing production code for the ingestion gateway, processor, or summarizer services — the course explains what these components do and why, not how to implement them
- Vendor-specific Learning Management System (LMS) or Student Information System (SIS) administration and configuration guides
- Full historical implementation detail of SCORM/AICC beyond the context needed to explain why xAPI emerged
- Learning-data interoperability standards from outside the education sector (e.g., healthcare or financial-services data exchange standards)
- Machine-learning model design for at-risk prediction or adaptive learning, beyond the motivations they create for better record-keeping

## Learning Outcomes

After completing this course, students will be able to:

### Remember
*Retrieving, recognizing, and recalling relevant knowledge from long-term memory.*

- List the core components of an xAPI Statement (Actor, Verb, Object, Result, Context, Attachments)
- Identify the standard numbers that define the xAPI ecosystem (IEEE 9274.1.1-2023, IEEE 9274.2.1) and the organizations that steward them (IEEE LTSC, I2IDL, the ADL Initiative)
- Name this project's five architectural planes (ingestion, processing, storage, analytics, presentation) and the role each plays
- Identify the three operational personas this book addresses — district administrator, teacher, and textbook author — and the reports each one relies on

### Understand
*Constructing meaning from instructional messages, including oral, written, and graphic communication.*

- Explain why the field moved from SCORM/AICC's LMS-centric model toward xAPI and the Learning Record Store
- Describe why this project's LRS compresses statements into summary vertices rather than storing one graph vertex per event
- Summarize how non-blocking, accept-first ingestion lets a new textbook start emitting statements without a pre-registration step
- Explain how a district administrator's adoption view, a teacher's classroom view, and an author's content-effectiveness view all draw from the same underlying statement log

### Apply
*Carrying out or using a procedure in a given situation.*

- Construct a valid xAPI Statement that conforms to IEEE 9274.1.1-2023 and this project's producer contract
- Use the xAPI Statement API to submit and retrieve learner experience records against a running LRS instance
- Read a district-adoption dashboard to answer a concrete deployment question (e.g., which schools are behind on rollout)
- Use a class-level mastery heatmap and at-risk roster to identify which students need instructor intervention

### Analyze
*Breaking material into constituent parts and determining how the parts relate to one another and to an overall structure or purpose.*

- Compare this project's compress-then-summarize architecture with a naive one-vertex-per-statement design and explain the throughput consequence
- Analyze a struggling student's prerequisite gaps by tracing the concept-dependency graph upstream from a weak concept
- Break down a content-effectiveness report to judge whether a MicroSim or a page revision is more likely responsible for a mastery gap
- Evaluate a sample LRS implementation against the conformance requirements of IEEE 9274.1.1-2023

### Evaluate
*Making judgments based on criteria and standards through checking and critiquing.*

- Judge whether a district's privacy and retention policy configuration meets FERPA/COPPA requirements for its student population
- Assess the trade-offs between broader cross-section visibility for a teacher and the tenancy model's isolation guarantees
- Critique a proposed textbook rollout plan using the district administrator's adoption and deployment-inventory reports
- Evaluate whether an observed mastery improvement from a MicroSim A/B test is a genuine effect or a confounded observational artifact

### Create
*Putting elements together to form a coherent or functional whole; reorganizing elements into a new pattern or structure.*

- Design a new xAPI Profile (as JSON-LD) for a novel learning domain, including its verbs, activity types, and validation rules
- Draft a conformance test plan for validating an LRS implementation against IEEE 9274.1.1-2023
- Produce a rollout plan for a district administrator that sequences roster onboarding, textbook deployment, and privacy-policy configuration
- **Capstone:** Design an end-to-end persona-facing report or dashboard — for a district administrator, teacher, or textbook author — that traces from a raw xAPI statement to the decision it informs
