---
title: "Quiz: From Learning Management Systems to the Experience API"
description: Ten review questions covering LMS, SCORM, AICC, Content Packaging, the Experience API, Learning Record Stores and Providers, and the parts of an xAPI Statement.
social:
   cards: false
---
# Quiz: From Learning Management Systems to the Experience API

Test your understanding of the move from LMS-centric standards to the Experience API with these review questions.

---

#### 1. What is a Learning Management System (LMS)?

<div class="upper-alpha" markdown>
1. A file format for packaging e-learning content so it runs on any vendor's platform
2. A dedicated system of record that stores learning statements independent of any vendor
3. A platform that hosts courses, enrolls learners, and records their completion within that one platform
4. A RESTful web API for sending learning records between independent systems
</div>

??? question "Show Answer"
    The correct answer is **C**. An LMS is the single hub where content runs and completion is tracked together — course hosting and record-keeping are bundled into one platform. Option A describes SCORM's Content Packaging, not an LMS itself. Option B describes a Learning Record Store, the system that later separated record-keeping from content hosting. Option D describes xAPI's transport mechanism, not a platform.

    **Concept Tested:** Learning Management System

---

#### 2. AICC solved the same basic problem as SCORM but through a different mechanism. What was that mechanism?

<div class="upper-alpha" markdown>
1. The HTTP AICC Communication Protocol (HACP), exchanging data through HTTP requests
2. An in-browser JavaScript API between a SCO and its launching LMS
3. A RESTful HTTP API to any conformant Learning Record Store
4. A manifest file bundling HTML, images, and scripts into a `.zip` package
</div>

??? question "Show Answer"
    The correct answer is **A**. AICC used the HTTP AICC Communication Protocol (HACP) to exchange launch, progress, and completion data over HTTP requests, rather than SCORM's in-browser JavaScript calls. Option B describes SCORM's own communication mechanism, not AICC's. Option C describes xAPI's later, more general approach. Option D describes SCORM's Content Packaging, a different piece of the SCORM specification.

    **Concept Tested:** AICC

    **See:** [AICC: A Parallel Path to the Same Goal](index.md#aicc-a-parallel-path-to-the-same-goal)

---

#### 3. An xAPI Statement is built around three required parts. What are they?

<div class="upper-alpha" markdown>
1. Subject, Predicate, Complement
2. Result, Context, Timestamp
3. Source, Action, Destination
4. Actor, Verb, Object
</div>

??? question "Show Answer"
    The correct answer is **D**. A Statement is deliberately shaped like an English sentence: Actor–Verb–Object, as in "Maya (Actor) read (Verb) Chapter 3 (Object)." Result and Context are optional additions. Option A names grammatical roles, not the xAPI model. Option B lists real Statement parts, but Result and Context are optional and Timestamp is not one of the three required parts. Option C describes a routing model, not a learning-event model.

    **Concept Tested:** Statement

    **See:** [Anatomy of an xAPI Statement: The First Look](index.md#anatomy-of-an-xapi-statement-the-first-look)

---

#### 4. What makes a Learning Record Store (LRS) structurally different from a Learning Management System?

<div class="upper-alpha" markdown>
1. An LRS only works with SCORM-packaged content, while an LMS works with any content
2. An LRS records experiences as statements and does not care what software produced them, while an LMS bundles content-hosting and record-keeping together
3. An LRS is a browser plugin, while an LMS is a server-side platform
4. An LRS replaces the need for any Learning Record Provider
</div>

??? question "Show Answer"
    The correct answer is **B**. An LRS does only the record-keeping job and deliberately stays agnostic about which software produced a statement or where that software ran — that separation is what lets many independent Learning Record Providers feed one shared store. Option A inverts the relationship: xAPI was designed to move away from SCORM-only compatibility. Option C mischaracterizes both systems as client-side software. Option D is backwards — an LRS depends on Learning Record Providers to send it statements.

    **Concept Tested:** Learning Record Store

    **See:** [Why the LMS-Centric Model Broke Down](index.md#why-the-lms-centric-model-broke-down)

---

#### 5. SCORM achieved portability through two connected ideas. What distinguishes Content Packaging from a Sharable Content Object (SCO)?

<div class="upper-alpha" markdown>
1. Content Packaging and SCO are two names for the exact same mechanism
2. Content Packaging is how AICC bundles content; SCO is how SCORM bundles content
3. Content Packaging describes the shape of the container (a `.zip` with a manifest); a SCO is the unit inside it that reports launch, completion, and score
4. A SCO is the manifest file; Content Packaging is the JavaScript reporting API
</div>

??? question "Show Answer"
    The correct answer is **C**. Content Packaging is about the shape of the container — bundling HTML, images, scripts, and an `imsmanifest.xml` into a `.zip` any conformant LMS can import. A Sharable Content Object is the smallest unit inside that package capable of communicating with the LMS via a small JavaScript API. Option A collapses a meaningful distinction. Option B mixes up which standard owns which term — both are SCORM concepts. Option D reverses the two definitions.

    **Concept Tested:** Content Packaging and Sharable Content Object

    **See:** [The SCORM Era: Packaging Content for Portability](index.md#the-scorm-era-packaging-content-for-portability)

---

#### 6. Why couldn't a Sharable Content Object (SCO) describe a learner practicing a skill in a VR flight simulator?

<div class="upper-alpha" markdown>
1. A SCO's vocabulary was limited to reporting a launch, a completion flag, and a score back to the one LMS that launched it
2. VR simulators are not compatible with any LMS
3. SCORM explicitly banned simulation-based content from being packaged
4. The `imsmanifest.xml` file cannot describe 3D content
</div>

??? question "Show Answer"
    The correct answer is **A**. A SCO could only talk to the LMS that launched it, and its entire reporting vocabulary was "launched," "completed," and "scored" — it had no way to represent the rich, varied texture of a simulated practice session, let alone a stream of many small events. This gap is exactly what the ADL Initiative's "Project Tin Can" research set out to close, leading to xAPI. Options B, C, and D all invent restrictions the chapter does not describe.

    **Concept Tested:** Sharable Content Object Limitation

    **See:** [Why the LMS-Centric Model Broke Down](index.md#why-the-lms-centric-model-broke-down)

---

#### 7. What is a Learning Record Provider (LRP)?

<div class="upper-alpha" markdown>
1. The organization that governs the xAPI specification
2. A dashboard that displays reports generated from an LRS
3. The database engine underneath a Learning Record Store
4. Any software — a MicroSim, mobile app, VR simulator, or intelligent textbook page — that constructs xAPI statements and sends them to an LRS
</div>

??? question "Show Answer"
    The correct answer is **D**. An LRP is simply the sender: any piece of software that can format a valid xAPI statement and submit it over HTTP to a conformant LRS. This project's own LRS, for example, ingests statements from many intelligent textbooks acting as Learning Record Providers. Option A describes a standards body, not a sender of data. Option B describes a consumer of LRS data, not a producer. Option C describes storage infrastructure, unrelated to the LRP role.

    **Concept Tested:** Learning Record Provider

    **See:** [Why the LMS-Centric Model Broke Down](index.md#why-the-lms-centric-model-broke-down)

---

#### 8. What does an Object Activity's Activity Type let a dashboard do?

<div class="upper-alpha" markdown>
1. Verify the Actor's identity before accepting a statement
2. Group activities by kind — for example, all simulations completed by a class separately from all quizzes — even across statements from different Learning Record Providers
3. Calculate the Result score automatically from raw interaction data
4. Determine which LRS should store the statement
</div>

??? question "Show Answer"
    The correct answer is **B**. Activity Type is a URI that classifies what kind of thing an Object Activity is, such as "this is a quiz" or "this is a simulation." That classification is what lets a report group activities by kind consistently, even when completely different Learning Record Providers produced the underlying statements. Option A confuses Activity Type with identity verification, which it does not perform. Option C misattributes score calculation, which belongs to the Result. Option D describes routing, not classification.

    **Concept Tested:** Activity Type

    **See:** [Anatomy of an xAPI Statement: The First Look](index.md#anatomy-of-an-xapi-statement-the-first-look)

---

#### 9. "Maya completed the Photosynthesis Quiz, scoring 9/10, in Biology 101, Section 2." Which parts of this sentence are the Result and the Context?

<div class="upper-alpha" markdown>
1. Result: "scoring 9/10"; Context: "Biology 101, Section 2"
2. Result: "Biology 101, Section 2"; Context: "scoring 9/10"
3. Result: "completed"; Context: "the Photosynthesis Quiz"
4. Result and Context both refer to "Maya"
</div>

??? question "Show Answer"
    The correct answer is **A**. The Result captures the outcome of the experience — here, a score of 9/10 — while the Context captures the surrounding circumstances, such as which course and section the attempt belongs to. Option B swaps the two roles. Option C mislabels the Verb ("completed") and the Object Activity ("the Photosynthesis Quiz"), neither of which is Result or Context. Option D confuses both optional parts with the Actor, which is "Maya."

    **Concept Tested:** Result and Context

    **See:** [Anatomy of an xAPI Statement: The First Look](index.md#anatomy-of-an-xapi-statement-the-first-look)

---

#### 10. What underlying reason does the chapter give for why the LMS-centric model broke down as learning technology diversified?

<div class="upper-alpha" markdown>
1. LMS vendors stopped supporting SCORM and AICC simultaneously
2. Learners began demanding mobile apps, which no LMS could technically run
3. IEEE mandated the retirement of SCORM in 2023
4. Newer learning activities often produced a stream of many small events rather than one final score, which a SCO's narrow launch/complete/score vocabulary could not represent
</div>

??? question "Show Answer"
    The correct answer is **D**. A learner dragging a slider on an interactive simulation, for instance, produces a whole stream of small events rather than a single final score — something a SCO's report-launch-completion-score vocabulary was never built to express. That mismatch, not a vendor or platform limitation, is the structural reason the model broke down. Options A, B, and C all describe plausible-sounding but unsupported claims the chapter does not make.

    **Concept Tested:** LMS-Centric Model Breakdown

    **See:** [Why the LMS-Centric Model Broke Down](index.md#why-the-lms-centric-model-broke-down)
