---
title: Course Description for Course Learning Record Store
description: A detailed course description for Learning Record Store including overview, topics covered and learning objectives in the format of the 2001 Bloom Taxonomy
quality_score: 96
---

# Learning Record Store

**Title:** Learning Record Store: IEEE Standards for Interoperable Learning Data

**Target Audience:** Professional development for software engineers, learning-technology architects, and standards-compliance specialists; also suitable for upper-level undergraduate and graduate students in computer science, instructional design, or educational technology.

**Prerequisites:** Working familiarity with JSON and RESTful HTTP APIs; basic exposure to e-learning concepts (an LMS, a course, a learner record). No prior exposure to xAPI, IEEE standards, or the Advanced Distributed Learning (ADL) Initiative's specifications is assumed — those are introduced from first principles.

## Course Overview

A Learning Record Store (LRS) is the system of record for a learner's experiences — every statement of the form "someone did something, with some object, in some context" that a training system, simulation, game, or classroom tool chooses to record. What makes an LRS useful across organizations and vendors, rather than a one-off silo, is that its data format and its API are standardized. This course is about that standardization: the IEEE Learning Technology Standards Committee (LTSC) family of specifications that define the Experience API (xAPI) and the Learning Record Store it targets, and the ecosystem of profiles, conformance tests, and governance bodies that keep independently built LRS implementations interoperable.

Students will trace the data model and API surface defined by IEEE 9274.1.1-2023 (the published core xAPI standard), the in-development IEEE 9274.2.1 Profile Standard for JSON-LD Application Profiles, and the Total Learning Architecture (TLA) that frames how an LRS fits into a larger learning-data ecosystem. The course also covers the standards-governance story itself: how stewardship of these specifications moved from the Advanced Distributed Learning (ADL) Initiative to IEEE LTSC in 2019, and how the Institute for Infrastructure and Interoperable Data in Learning (I2IDL) — a nonprofit established in late 2025 — now operates the open source conformance test suites, the xAPI Profile Server, and TLA reference implementations that let implementers check their work against the standard.

This matters because learning data is increasingly the input to analytics, credentialing, and AI-driven systems that make decisions about learners — decisions that are only trustworthy if the underlying records are transparent, verifiable, and portable between systems. Understanding the standards, not just one vendor's implementation of them, is what lets an engineer or architect build (or evaluate) an LRS with confidence that it will interoperate with the rest of the field.

## Main Topics Covered

- Foundations of learning-technology interoperability, and why the field moved from LMS-centric models (SCORM, AICC) toward the Experience API and the Learning Record Store
- The xAPI data model: Actors, Verbs, Objects, Results, Context, Attachments, and Statements
- IEEE 9274.1.1-2023: the published core xAPI standard and its RESTful web-service API
- The Learning Record Store: required endpoints, responsibilities, and conformance expectations
- IEEE 9274.2.1: the in-development Profile Standard and JSON-LD Application Profiles
- The IEEE Learning Technology Standards Committee (LTSC): structure, working groups, and the standardization lifecycle
- Total Learning Architecture (TLA): the reference architecture that situates the LRS among other learning-ecosystem components
- Standards governance and stewardship: the transition of xAPI/TLA specifications from the Advanced Distributed Learning (ADL) Initiative to IEEE LTSC in 2019
- I2IDL: mission, xAPI conformance test suites, the xAPI Profile Server, and TLA reference implementations
- cmi5: a widely adopted xAPI Profile for LMS-launched content
- Conformance testing and certification for LRS and content-provider implementations
- Security, authentication, and privacy considerations for storing and exchanging learner records
- Querying, filtering, and reporting learner experience data through the xAPI Statement API
- Comparing xAPI/LRS interoperability with adjacent standards (SCORM, AICC, IMS/1EdTech Caliper Analytics, Learning Object Metadata)
- Emerging directions: data verifiability and transparency requirements as learning records feed AI-driven systems

## Topics Not Covered

- Hands-on production deployment and operation of a specific LRS backend (event-store schema design, ingestion pipelines, database tuning) — that is the subject of this project's companion engineering specs, not this standards-focused course
- Vendor-specific LMS administration or configuration guides
- Full historical implementation detail of SCORM/AICC beyond the context needed to explain why xAPI emerged
- Learning-data interoperability standards from outside the education sector (e.g., healthcare or financial-services data exchange standards)
- Machine-learning model design or adaptive-learning algorithms, beyond the data-verifiability motivations they create for better record-keeping

## Learning Outcomes

After completing this course, students will be able to:

### Remember
*Retrieving, recognizing, and recalling relevant knowledge from long-term memory.*

- List the core components of an xAPI Statement (Actor, Verb, Object, Result, Context, Attachments)
- Identify the standard numbers and titles that define the xAPI ecosystem (IEEE 9274.1.1-2023 for the core standard, IEEE 9274.2.1 for the Profile Standard)
- Name the organizations involved in xAPI/TLA governance (IEEE LTSC, I2IDL, the Advanced Distributed Learning Initiative) and each one's current role
- Recall the required endpoints of the xAPI RESTful API (Statements, Activities, Agents, About)

### Understand
*Constructing meaning from instructional messages, including oral, written, and graphic communication.*

- Explain why the field moved from SCORM/AICC's LMS-centric model toward xAPI and the Learning Record Store
- Describe how an xAPI Profile constrains and extends the base xAPI standard for a specific use case
- Summarize the 2019 transition of xAPI/TLA stewardship from the Advanced Distributed Learning Initiative to IEEE LTSC, and I2IDL's present-day role sustaining the open source infrastructure
- Explain how the Total Learning Architecture situates an LRS relative to content providers, competency registries, and analytics consumers

### Apply
*Carrying out or using a procedure in a given situation.*

- Construct a valid xAPI Statement that conforms to the IEEE 9274.1.1-2023 data model for a given learning scenario
- Use the xAPI Statement API to store and retrieve learner experience records against a test LRS
- Apply an existing xAPI Profile (such as cmi5) to structure statements for a specific delivery context
- Configure authentication (OAuth or Basic Auth) for a client communicating with an LRS

### Analyze
*Breaking material into constituent parts and determining how the parts relate to one another and to an overall structure or purpose.*

- Compare xAPI/LRS interoperability with legacy standards (SCORM, AICC) and adjacent frameworks (IMS/1EdTech Caliper Analytics)
- Analyze a set of xAPI Statements for conformance against a given Profile's validation rules
- Break down the IEEE standardization lifecycle and identify where a given specification sits within it (working draft, balloted, published)
- Evaluate a sample LRS implementation against the conformance requirements of IEEE 9274.1.1-2023

### Evaluate
*Making judgments based on criteria and standards through checking and critiquing.*

- Judge whether a given xAPI Profile is complete enough to guarantee interoperability between independently built systems
- Assess the trade-offs between defining custom xAPI extensions versus adopting a published Profile
- Critique a proposed LRS architecture for standards compliance, security, and scalability
- Evaluate the production readiness of an in-development specification (such as IEEE 9274.2.1) versus a published one

### Create
*Putting elements together to form a coherent or functional whole; reorganizing elements into a new pattern or structure.*

- Design a new xAPI Profile (as JSON-LD) for a novel learning domain, including its verbs, activity types, and validation rules
- Draft a conformance test plan for validating an LRS implementation against IEEE 9274.1.1-2023
- Produce an adoption brief proposing how an organization should migrate from an LMS-only model to an xAPI/LRS-based Total Learning Architecture
- **Capstone:** Architect and document an end-to-end interoperable learning-data pipeline — producer, LRS, and downstream analytics consumer — showing how each stage satisfies the relevant IEEE standard or profile
