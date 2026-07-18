---
title: From Learning Management Systems to the Experience API
description: How learning technology moved from SCORM/AICC content packages inside a single LMS to the Experience API and the Learning Record Store, and the core vocabulary xAPI statements are built from.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 06:47:40
version: 0.09
---

# From Learning Management Systems to the Experience API

## Summary

This opening chapter traces the line from early Learning Management Systems and content-packaging standards like SCORM and AICC through the Experience API to the Learning Record Store itself. It introduces the core xAPI vocabulary — Actor, Verb, Object, Result, and Context — that every statement in this book is built from. By the end, you will be able to read a plain-language xAPI statement and identify each of its parts.

## Concepts Covered

This chapter covers the following 15 concepts from the learning graph:

1. Learning Management System
2. SCORM
3. AICC
4. Content Packaging
5. Sharable Content Object
6. Experience API
7. Learning Record Store
8. Learning Record Provider
9. Actor
10. Verb
11. Object Activity
12. Activity Type
13. Result
14. Context
15. Statement

## Prerequisites

This chapter assumes only the prerequisites listed in the [course description](../../course-description.md).

---

!!! mascot-welcome "Hi! I'm Rowan."
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Welcome to *Learning Record Store: IEEE Standards, Architecture, and Practice*! I'm **Rowan**, a red panda who keeps a satchel of learning records slung over one shoulder and a pair of teal glasses for reading the fine print in specifications. I'll be popping into the margins all the way through this book, but I do not show up randomly. I have exactly **six jobs**, and you'll learn to recognize me by which one I'm doing:

    1. **Welcome you** at the start of every chapter — that's what I'm doing right now.
    2. **Help you think things through** when an idea is the kind that clicks better once you see the pieces laid side by side.
    3. **Give you tips** — the moves a working learning-technology practitioner would make that nobody writes down in the spec.
    4. **Warn you gently** about the places where smart students and smart projects get into trouble.
    5. **Encourage you** when a concept looks scary on first contact.
    6. **Celebrate with you** at the end of each chapter when you've earned it.

    That's it. If I'm not doing one of those six things, I'm not in the chapter. Let's follow the record.

Every intelligent educational system — a single interactive textbook, a district-wide simulation library, a corporate training catalog — eventually has to answer the same question: *how do we know what a learner actually did?* For three decades, the software industry answered that question with a **Learning Management System**, or **LMS**: a platform that hosts courses, enrolls learners, tracks their progress through those courses, and records completion. An LMS is the single place instructors upload content, students log in to take it, and administrators pull reports. If you have ever logged into a corporate training portal to watch a compliance video and click "Mark Complete," you have used an LMS.

This book cares about that question more than most, because the system it describes is built for **intelligent textbooks** — textbooks instrumented so finely that nearly everything a student does inside them becomes a record. A traditional printed textbook produces no data at all: a student reads a page, and the book learns nothing from the reading. An intelligent textbook is different by design. Every page a student opens, every interactive simulation they run, every practice question they answer becomes an event. Multiply that by a classroom, then a school, then a district, and what starts as a trickle of activity becomes a firehose of evidence. The rest of this chapter, and much of this book, is really one long answer to a single question: what kind of record-keeping can stand in front of that firehose without losing what matters?

The LMS model worked well for a specific shape of problem: one organization, one catalog of courses, one system tracking completion. But it carried a structural assumption that would eventually strain under the weight of modern learning technology — that a learner's entire educational record could live inside a single piece of software. This chapter traces what happened when that assumption broke, and what replaced it.

## The SCORM Era: Packaging Content for Portability

By the late 1990s, a new problem emerged: organizations wanted to buy training content from one vendor and run it inside an LMS from a different vendor. Without a shared format, every course had to be rebuilt for every LMS it ran on. The **Sharable Content Object Reference Model**, universally known by its acronym **SCORM**, solved this by defining a standard way to package and launch e-learning content so it would run inside *any* SCORM-conformant LMS.

SCORM achieved portability through two connected ideas:

- **Content Packaging** — a specification for bundling a course's HTML, images, scripts, and a manifest file (`imsmanifest.xml`) into a single `.zip` file that any conformant LMS could import and understand.
- **Sharable Content Object**, or **SCO** — the smallest unit of content inside that package capable of communicating with the LMS. A SCO reports its own launch, its completion status, and a score back to the LMS using a small JavaScript API defined by SCORM.

Before we look at how SCORM's communication actually worked, it helps to name what it could *not* do. SCORM's `imsmanifest.xml` describes what content exists and how it is organized, which is why we call this piece **Content Packaging** — it is about the shape of the container, not the events happening inside it. A **Sharable Content Object** is deliberately narrow: it can tell the LMS "I started," "I finished," and "the learner scored 82%," and almost nothing else. It cannot describe a learner practicing a skill in a flight simulator, discussing a case study with a mentor, or reading a physical book with a QR code — because SCORM was designed around one specific interaction: a single learner, inside a single browser window, inside a single LMS.

!!! mascot-thinking "Two standards, one gap"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice the shape of the limitation: SCORM's SCO can only talk to the one LMS that launched it. If a learner closes that browser tab and picks up a physical lab kit, or opens a mobile app, or joins a study group, none of that activity has anywhere to go. The record lives and dies inside the LMS session. Keep that gap in mind — everything else in this chapter is the industry's answer to it.

## AICC: A Parallel Path to the Same Goal

SCORM was not the only attempt to standardize communication between content and a launching system. The **Aviation Industry Computer-Based Training Committee**, known by its acronym **AICC**, developed its own specification years earlier, originally for aviation and defense training. AICC used a different technical mechanism — the **HTTP AICC Communication Protocol (HACP)**, which exchanged data through HTTP requests rather than SCORM's in-browser JavaScript calls — but it solved essentially the same problem: letting a course report launch, progress, and completion data back to whatever system launched it.

AICC and SCORM coexisted for years, and many learning platforms supported both to maximize compatibility with the training content their customers already owned. Both shared the same underlying constraint, though: a course could describe *that* it happened and *whether it was completed*, but not the rich, varied texture of *what actually happened* during the learning experience.

The following table summarizes the three standards we have discussed so far, now that each one has been explained in the text above.

| Standard | Era | Communication Mechanism | What It Can Record |
|---|---|---|---|
| SCORM | 1999–2011 | In-browser JavaScript API between a SCO and its launching LMS | Launch, completion status, single score, session time |
| AICC | 1993–2010s | HTTP AICC Communication Protocol (HACP) | Launch, completion status, single score, session time |
| Experience API (xAPI) | 2013–present | RESTful HTTP API to any conformant Learning Record Store | Any actor performing any verb on any object, anywhere, with rich results and context |

#### Diagram: A Timeline of Learning Interoperability Standards

<iframe src="../../sims/learning-standards-timeline/main.html" width="100%" height="402px" scrolling="no"></iframe>

<details markdown="1">
<summary>A Timeline of Learning Interoperability Standards</summary>
Type: timeline
**sim-id:** learning-standards-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/learning-standards-timeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: summarize

Learning objective: Help the learner place SCORM, AICC, and xAPI in chronological order and see that xAPI did not replace the others overnight — it emerged from documented limitations in the SCORM/AICC model.

Time period: 1988–present

Orientation: Horizontal, left to right

Events:

- 1988: AICC formed to standardize aviation computer-based training
- 1999: SCORM 1.0 released by the Advanced Distributed Learning (ADL) Initiative
- 2004: SCORM 2004 adds sequencing and navigation rules
- 2010: ADL begins the "Project Tin Can" research into SCORM's limitations
- 2013: Experience API (xAPI) 1.0 released
- 2019: Stewardship of xAPI begins transitioning to IEEE LTSC
- 2023: IEEE 9274.1.1-2023 published as the formal xAPI core standard
- 2025: Institute for Infrastructure and Interoperable Data in Learning (I2IDL) established

Interactive features: Clicking any milestone opens an infobox with a one-paragraph description of what changed and why, plus a "Related term" link into the chapter glossary.

Visual style: Color-coded by standards family (AICC in one hue, SCORM in a second, xAPI/IEEE/I2IDL in a third) so the learner can visually trace which organization owned each era.

Responsive design: The timeline must resize to the width of its containing element and remain readable on a tablet-width viewport.
</details>

## Why the LMS-Centric Model Broke Down

SCORM and AICC both assumed that a single system — the LMS — was the hub through which every learning interaction had to pass. That assumption held up reasonably well when "learning" meant "click through a slideshow and take a quiz." It stopped holding up as learning technology diversified. Consider a few interactions a modern learner might have that no LMS launches directly: practicing a procedure inside a virtual-reality simulator, working through problems in a mobile app on a bus, running an experiment in a Docker-based coding lab, or exploring an interactive simulation embedded in an intelligent textbook page. None of these fit inside a SCO's narrow "launched, completed, scored" vocabulary, and none of them necessarily run inside an LMS at all. Some are not even a single event to begin with — a student dragging a slider back and forth on an interactive simulation, trying different values to see what changes, produces a whole stream of small events, not one final score. A SCO has no vocabulary for a *stream*; it only knows how to report a launch, a completion flag, and a score.

The Advanced Distributed Learning (ADL) Initiative, the same U.S. Department of Defense-affiliated organization that had originally created SCORM, recognized this gap and began a research effort — nicknamed "Project Tin Can" — to design something more flexible. The result was the **Experience API**, universally abbreviated **xAPI**. Rather than packaging content so it could report back to one specific LMS, xAPI defines a simple, general-purpose sentence format — *someone did something, with some object, optionally producing some result, in some context* — and a RESTful web API for sending and retrieving those sentences from a **Learning Record Store (LRS)**: a dedicated system of record built to store xAPI data, independent of any single LMS, course, or vendor.

!!! mascot-tip "The word 'Experience' is doing real work"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    Don't read "Experience API" as a synonym for "online course API." The whole point of the name is that it covers *any* learning experience — a lab, a conversation, a badge earned, a book chapter read — not just the narrow slice that happens to run inside a browser-based course player. If you catch yourself assuming xAPI only applies to quizzes, that's a sign to re-read this section.

Where a SCO could only talk to the LMS that launched it, any piece of software that can format a valid xAPI sentence and make an HTTP request can talk to *any* conformant LRS. The industry has a name for software that does this: a **Learning Record Provider (LRP)**. An LRP is simply the sender — a MicroSim, a mobile app, a VR simulator, a physical kiosk, or an intelligent textbook page — that constructs xAPI statements and submits them to a Learning Record Store. This project's own LRS, described starting in Part 2 of this book, ingests statements from many different intelligent textbooks acting as Learning Record Providers.

Before comparing the two architectures visually, it is worth being precise about the two systems now on the table. A **Learning Management System** hosts courses and is usually both the place content runs *and* the place completion is recorded — content and record-keeping are bundled together. A **Learning Record Store** does only the second job — recording experiences as statements — and deliberately does not care what software produced them or where that software ran. That separation of concerns is what makes many independent Learning Record Providers able to feed one shared store of record.

#### Diagram: LMS-Centric versus LRS-Centric Architecture

<iframe src="../../sims/lms-vs-lrs-architecture/main.html" width="100%" height="462px" scrolling="no"></iframe>

<details markdown="1">
<summary>LMS-Centric versus LRS-Centric Architecture</summary>
Type: workflow
**sim-id:** lms-vs-lrs-architecture<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/intelligent-textbooks/tree/main/docs/sims/standards-ecosystem<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Let the learner compare a single-hub LMS-centric architecture against a hub-and-spoke LRS-centric architecture, and see structurally why the second scales to many kinds of Learning Record Providers while the first does not.

Purpose: Show two side-by-side diagrams — "Before: LMS-Centric" and "After: LRS-Centric" — as a single Mermaid flowchart with two subgraphs.

Left subgraph "LMS-Centric (SCORM/AICC era)":

- One box: "Learning Management System"
- Three boxes labeled "SCO 1", "SCO 2", "SCO 3" each with an arrow pointing only to the LMS box (one-way, tightly coupled)
- No other system can receive data from the SCOs

Right subgraph "LRS-Centric (xAPI era)":

- One central box: "Learning Record Store"
- Five surrounding boxes, each with an arrow pointing to the LRS box: "Intelligent Textbook", "Mobile App", "VR Simulator", "Coding Lab", "Physical Kiosk" — each labeled with the small tag "Learning Record Provider"
- One additional box below the LRS labeled "Dashboards & Reports" with an arrow FROM the LRS (data flows out for analysis)

Interactive features: Every node in both subgraphs is clickable via a Mermaid `click` directive. Clicking "Learning Management System" opens an infobox defining LMS; clicking any "SCO" node opens an infobox defining Sharable Content Object; clicking "Learning Record Store" opens an infobox defining LRS; clicking any Learning Record Provider node opens an infobox explaining that term generally, then names the specific example (e.g., "VR Simulator — a Learning Record Provider might be flight-training software that emits a statement each time a trainee completes a maneuver").

Color coding: LMS-centric subgraph in a muted gray-blue to signal "legacy"; LRS-centric subgraph in the book's teal accent color to signal "current architecture."

Implementation: Mermaid flowchart with two subgraphs and full click-to-infobox coverage on every node.
</details>

## Anatomy of an xAPI Statement: The First Look

Everything an xAPI-conformant system sends to a Learning Record Store is called a **Statement** — a single, self-contained record of one learning experience. A Statement is built from a small set of required and optional parts. This chapter introduces each part in plain language; [Chapter 2](../02-anatomy-of-xapi-statement/index.md) returns to the full technical structure, including how each part is expressed as JSON.

Every Statement answers, at minimum, three questions: *who* did something, *what* did they do, and *to or with what*. These three required parts have names:

- **Actor** — the person or agent who performed the experience. Almost always a learner, though it can be a group or even a piece of software acting on someone's behalf.
- **Verb** — the action the Actor performed, expressed as a single word or short phrase: *completed*, *attempted*, *answered*, *practiced*, *read*.
- **Object** — the thing the action was performed on. In the simplest and most common case, this is an **Object Activity**: a learning activity such as a specific chapter, quiz question, or simulation. (An Object can also be another Actor or another Statement, but Object Activity is by far the most frequent case, and the only one this chapter covers.)

Every Object Activity carries an **Activity Type** — a URI that classifies *what kind* of thing the activity is, such as "this is a quiz," "this is a simulation," or "this is a reading." The Activity Type is what lets a dashboard later group "all the simulations a class completed" separately from "all the quizzes a class completed," even across statements produced by completely different Learning Record Providers.

Two more parts round out a Statement, and both are optional:

- **Result** — the outcome of the experience: a score, a pass/fail completion flag, a duration, or a free-text response. Not every Statement has a Result — "read chapter 3" might not produce one, while "completed the end-of-chapter quiz" almost always does.
- **Context** — the circumstances surrounding the experience: which course or section it happened in, what platform or app version generated it, or which other Statement it is a follow-up to. Context is what lets an LRS answer questions like "was this attempt part of a graded assignment or a practice run?"

!!! mascot-warning "Actor, Verb, Object is not optional — Result and Context are"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    A common early mistake is assuming every Statement needs a score or a course context to be meaningful. It doesn't. "Maya (Actor) read (Verb) Chapter 3 (Object)" is a complete, valid Statement all by itself — no Result, no Context required. Don't wait for a "big" outcome before recording a Statement; small, frequent statements are exactly what make an LRS useful.

Before looking at the interactive breakdown below, hold onto one more idea: **Statement** is the umbrella term for the whole record, while Actor, Verb, Object, Result, and Context are its components. When people informally call something "an xAPI event," they mean a Statement.

#### Diagram: xAPI Statement Building Blocks

<iframe src="../../sims/xapi-statement-triple/main.html" width="100%" height="382px" scrolling="no"></iframe>

<details markdown="1">
<summary>xAPI Statement Building Blocks</summary>
Type: infographic
**sim-id:** xapi-statement-triple<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://dmccreary.github.io/xapi-course/sims/xapi-statement-triple/<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: exemplify, classify

Learning objective: Give the learner a first, plain-language mental model of the five Statement components (Actor, Verb, Object Activity, Result, Context) using one worked example, before Chapter 2 formalizes the JSON structure.

Purpose: Show a single example Statement broken into its labeled parts, so the reader can see the vocabulary just introduced in the prose applied to one concrete sentence.

Layout: A horizontal sentence strip reading "Maya | completed | the Photosynthesis Quiz" with the words "Actor", "Verb", "Object Activity" as labels beneath each phrase, plus two additional connected boxes below labeled "Result: scored 9/10" and "Context: Biology 101, Section 2".

Data Visibility Requirements:
Stage 1: Show the plain English sentence "Maya completed the Photosynthesis Quiz, scoring 9 out of 10, in Biology 101."
Stage 2: Highlight and label "Maya" as Actor.
Stage 3: Highlight and label "completed" as Verb.
Stage 4: Highlight and label "the Photosynthesis Quiz" as Object Activity, with its Activity Type ("quiz") shown as a small sub-tag.
Stage 5: Reveal the Result box: "scored 9/10."
Stage 6: Reveal the Context box: "Biology 101, Section 2."

Interactive features: Each of the five labeled parts (Actor, Verb, Object Activity, Result, Context) is clickable. Clicking opens an infobox with that term's one-sentence definition, matching the definition given in this chapter's prose, plus the note "Required" or "Optional."

Instructional Rationale: A step-through, data-visible worked example is appropriate for this Understand-level objective because the learner needs to trace one concrete Statement piece by piece before generalizing. Continuous animation or particle effects would obscure exactly which words map to which component.

Implementation: Mermaid diagram (or equivalent static-layout HTML/CSS) with click handlers wired to an infobox panel, matching the reused template's existing interaction pattern.
</details>

## Practice: Matching Terms to Definitions

With five new vocabulary terms introduced in this chapter's final section — Actor, Verb, Object Activity, Activity Type, Result, and Context — it helps to practice recalling them before moving on. The MicroSim below is a low-stakes matching exercise: no scoring pressure, just repetition to help the vocabulary stick before Chapter 2 builds on it.

#### Diagram: xAPI Vocabulary Matching Pairs

<iframe src="../../sims/xapi-vocabulary-matching-pairs/main.html" width="100%" height="442px" scrolling="no"></iframe>

<details markdown="1">
<summary>xAPI Vocabulary Matching Pairs</summary>
Type: microsim
**sim-id:** xapi-vocabulary-matching-pairs<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Remember (L1)
Bloom Taxonomy Verb: recall, identify, match

Learning objective: Reinforce recall of the six terms introduced in this chapter's statement-anatomy section (Actor, Verb, Object Activity, Activity Type, Result, Context) by matching each term to its one-sentence definition.

Canvas layout:

- Left column (six draggable term tiles): Actor, Verb, Object Activity, Activity Type, Result, Context
- Right column (six definition tiles in scrambled order)
- Bottom strip: score readout ("Matched: 0 / 6") and a "Shuffle" button

Visual elements:

- Term tiles in the book's teal accent color
- Definition tiles in a neutral cream color
- A correct match locks both tiles together with a green outline and a brief checkmark animation
- An incorrect match flashes red for half a second and the tiles bounce back to their original position

Interactive controls:

- Drag-and-drop: drag a term tile onto a definition tile to attempt a match
- Button: "Shuffle" — re-randomizes definition tile order and clears progress
- Button: "Reveal All" — shows all correct pairings for review, disabled until at least one attempt has been made

Default parameters:

- All six terms unmatched at start
- Definitions shown in random order (re-randomized via a seeded index, not JavaScript's raw Math.random, so the layout is reproducible for a given session)

Behavior:

- On correct match, increment the "Matched" counter and lock the pair
- When all six are matched, display "All matched! You know the vocabulary." and enable a small "Try Again" reset button
- Track each drag-and-drop attempt (success or failure) as an interaction event

Implementation notes:

- Use p5.js mouse-press and mouse-release events to implement drag-and-drop
- Store term/definition pairs as a simple array of objects so the same MicroSim shell can be reused for future chapters' vocabulary sets
- Responsive design: canvas width tracks the containing element's width; tile size and column layout adjust at narrow (mobile) widths by stacking columns vertically instead of side-by-side
</details>

## Bringing the Vocabulary Together

Every piece introduced in this chapter fits into one coherent story. Learning technology started with the **Learning Management System** as the single hub for hosting and tracking courses. **SCORM** and **AICC** made course content portable between LMS products through **Content Packaging** and the narrow, LMS-bound reporting of a **Sharable Content Object**. When learning moved beyond single-course, single-browser interactions, the **Experience API** replaced content packages with a simple, general **Statement** format — *Actor, Verb, Object Activity*, with optional *Result* and *Context* — and replaced the LMS's built-in tracking with a dedicated **Learning Record Store** that any **Learning Record Provider** can write to.

That is the vocabulary this project's own Learning Record Store is built on top of. Recall the firehose from the start of this chapter: because a single student exploring one intelligent-textbook page can generate many small Statements in a single sitting, most of the rest of this book is about what a Learning Record Store must do to turn that many small sentences into something a district administrator, a teacher, or a textbook author can actually use.

The following list summarizes the chain of reasoning as a set of cause-and-effect steps, useful as a quick self-check before moving to Chapter 2:

1. Organizations needed training content portable across different LMS products → SCORM and AICC defined Content Packaging and SCO-based reporting.
2. SCOs could only report to the one LMS that launched them → learning experiences outside a browser-based course had nowhere to go.
3. ADL's "Project Tin Can" research generalized "reported to an LMS" into "sent as a Statement to an LRS" → the Experience API was born.
4. Any software that can format a Statement is a Learning Record Provider → many different kinds of learning tools can now feed one shared record store.
5. Every Statement is built from Actor, Verb, and Object Activity, with optional Result and Context → this vocabulary is the foundation for the detailed statement structure in Chapter 2.

!!! mascot-encourage "If this still feels like a lot of new vocabulary..."
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    ...that's completely normal for a first chapter. You now have six acronyms (LMS, SCORM, AICC, SCO, xAPI, LRS) and six statement-vocabulary terms in your head at once. You don't need to memorize definitions cold — you need to recognize the *shape* of the story: content-bound reporting gave way to a portable statement format. Everything else in this book adds detail to that one shape.

## Key Takeaways

- A **Learning Management System (LMS)** hosts courses and tracks completion within a single platform.
- **SCORM** and **AICC** are two historical standards that let e-learning content packages run across different LMS products, using **Content Packaging** and a **Sharable Content Object (SCO)** that reports narrowly back to its launching LMS.
- The **Experience API (xAPI)** replaced content-bound reporting with a general-purpose **Statement** format that any software can send over a RESTful HTTP API.
- A **Learning Record Store (LRS)** is a dedicated system of record for xAPI Statements, independent of any single LMS or vendor.
- A **Learning Record Provider (LRP)** is any software — a textbook, an app, a simulator — that constructs and sends Statements to an LRS.
- Every Statement has an **Actor**, a **Verb**, and an **Object** (typically an **Object Activity** with an **Activity Type**), plus optional **Result** and **Context**.

!!! mascot-celebration "You just read your first xAPI statement"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    Seriously — "Maya completed the Photosynthesis Quiz, scoring 9/10, in Biology 101" is a real xAPI Statement in plain English. In [Chapter 2](../02-anatomy-of-xapi-statement/index.md), we'll take that same sentence and turn it into the actual JSON an LRS accepts. What does the evidence show? You're ready to find out.
