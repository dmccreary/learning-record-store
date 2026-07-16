---
title: What is an Intelligent Textbook LRS?
description: An introduction to the Learning Record Store — what xAPI statements are, why an intelligent textbook generates so many of them, and the single design idea that makes storing them tractable.
social:
   cards: false
---
# What is an Intelligent Textbook LRS?

A **Learning Record Store** (LRS) is a system that records what learners *did*, and turns
that record into something a teacher can act on.

That sounds modest. The difficulty is entirely in the volume. A traditional textbook
produces no data at all — a student reads it, and the book learns nothing about the
reading. An **intelligent textbook** is instrumented: every page view, every simulation a
student runs, every question they answer produces an event. Multiply that by a class, then
a school, then a district, and the trickle becomes a firehose. The LRS is the thing that
stands in front of that firehose and turns it into a sentence like *"Maria understands
sine waves but is guessing at phase."*

This chapter explains what the LRS stores, what it refuses to store, and why that refusal
is the most important decision in the whole design.

## The Statement

The LRS does not invent its own event format. It uses **xAPI** — the Experience API, a
specification published by
[Advanced Distributed Learning](../../glossary.md#advanced-distributed-learning-adl) (ADL),
the U.S. Department of Defense body that maintains it.

An xAPI event is called a **statement**, and its shape is deliberately close to an English
sentence:

> **Actor** — **Verb** — **Object**

*"student-123 answered question-4."* That is a complete statement. Three more parts are
optional but carry most of the analytical value:

| Part | What it holds | Example |
|---|---|---|
| **Actor** | Who did it | `student-123` |
| **Verb** | What they did | `answered`, `experienced`, `interacted` |
| **Object** | What they did it to | a page, a MicroSim, a quiz question |
| **Result** | How it went | `success: true`, `score.scaled: 0.9`, `duration: PT4M12S` |
| **Context** | What it belonged to | which textbook version, which concept |
| **Timestamp** | When it happened | an [ISO 8601](../../glossary.md#iso-8601) instant |

Two properties of statements matter more than the rest.

**Statements are immutable.** Once written, a statement is never edited and never deleted.
This is not fussiness — it is what makes the record trustworthy. If a statement was sent in
error, the correction is a *new* statement that voids the old one. The log only ever grows.
A record you can quietly rewrite is a record nobody can audit.

**Objects are named by [IRI](../../glossary.md#internationalized-resource-identifier-iri)**,
which in practice means a URL. The page a student read is identified by the address it is
published at. This is why an intelligent textbook's URLs are not merely navigation — they
are the vocabulary the analytics are written in. Get a URL wrong and you have not broken a
link; you have created a second name for one thing, and every count that depends on it
silently splits in half.

## What Makes It an *Intelligent Textbook* LRS

A generic LRS accepts statements from anything — a
[Learning Management System](../../glossary.md#learning-management-system-lms), a video
player, a compliance course. This one is built around three assumptions that a general
LRS cannot make.

**The content is instrumented at a fine grain.** An intelligent textbook does not just
report "chapter complete." It contains **MicroSims** — small, embeddable, interactive
simulations. A student dragging a slider on a sine-wave simulation produces a stream of
events, not one. The interesting evidence is in the interaction, not the completion.

**There is a learning graph.** The textbook's concepts form a
[Directed Acyclic Graph](../../glossary.md#directed-acyclic-graph-dag) (DAG): phase
depends on period, period depends on frequency. Because the LRS knows the prerequisite
structure, it can answer a question a generic LRS cannot — not just *"did she get it
wrong?"* but *"is she stuck here because she never got the thing underneath it?"*

**The unit of interest is the concept, not the course.** Teachers do not want a grade. They
want to know which idea to reteach on Tuesday. Every design decision below follows from
wanting to answer that.

## The Problem: The Numbers Are Brutal

Here is where intuition fails. Consider a district at the scale this system targets:
**10,000 statements per second sustained, bursting to 50,000.**

The obvious design is to store each statement as a vertex in the graph database and connect
it to the student and the object it concerns. It is obvious, it is wrong, and it is worth
seeing exactly how wrong.

At 10,000 statements per second, one-vertex-per-statement adds roughly **144 million
vertices per day** and demands on the order of **50,000 graph writes per second** at peak.
No property graph sustains that. And the punchline: **no report needs it.** Every report a
teacher actually asks for is an aggregate — *how many attempts, what mastery, how much
time*. You would pay the full cost of storing the event log a second time, in the most
expensive store you own, and buy nothing with it.

## The Central Idea: Compress Before You Materialize

The design's answer is a rule stated as a prohibition:

> **The graph MUST NOT store one vertex per statement.**

Instead, many statements are compressed into a **single summary vertex per analytical
grain**. A *grain* is the key a summary is computed at: (student, concept), (student,
page), (section, concept).

So a student who visits a page fifty times does not produce fifty vertices. She produces
**one** `PageEngagement` vertex, whose `dwell_ms_total` is the sum and whose
`statements_compressed` is 50. A student's entire evidence for one concept — every
question, every simulation run, every hint — collapses into **one** `ConceptMastery`
vertex.

The compression ratios are not marginal:

| Summary vertex | Grain | Typical compression |
|---|---|---|
| `QuestionResponse` | (student, question) | ~3:1 |
| `PageEngagement` | (student, page) | ~50:1 |
| `SectionRollup` | (section, concept) | **~3,000:1** |

Every summary vertex carries a `statements_compressed` count. That number does two jobs at
once: it makes the compression ratio directly observable, and it gives every figure on a
dashboard an explicit evidence count — so a report can always say *how much* evidence a
number rests on. A mastery score of 0.9 backed by three attempts is a different claim than
one backed by ninety.

### Why This Survives the Burst

Compression is not just a storage saving. It is what makes the burst target survivable, and
the reason is worth stating precisely:

**Graph writes are a function of the number of *distinct active grains* per sync window —
not of statements per second.**

Read that again, because it is the load-bearing sentence in this book. When ingest bursts
5×, students do not suddenly acquire five times as many concepts. The same students are
generating more evidence about the *same* grains. The burst increases the statement count
*within* each grain; it does not increase the *number* of grains. So the compressor absorbs
the burst, and the graph never feels it.

This is a falsifiable claim, and it is the one the whole architecture rests on. If you 5×
the ingest rate and graph writes stay flat, the design works. If graph writes climb with
ingest, it does not — and no amount of hardware will save it.

## Two Stores, Two Jobs

Compression raises an obvious worry: *if the graph only holds summaries, is the detail
gone?*

No — and this is why the system has two stores rather than one.

**The event store holds every statement, forever, at full fidelity.** It is the **system of
record**. Nothing is discarded. The detail is always one query away.

**The graph holds structure and summaries, and never raw events.** Districts, schools,
students, concepts, prerequisites — plus the compressed summary vertices above.

The division of labour is clean: *the event store's job is events; the graph's job is
structure and summary.* Every summary vertex is a **projection** — always reproducible by
replaying the log. A summary is never a source of truth. If a summary ever disagrees with
the log, the log wins and the summary is rebuilt from scratch. That property is what makes
it safe to compress aggressively: you are never destroying information, only choosing not
to materialize it twice.

## From Evidence to Mastery

Counting attempts is easy. Deciding whether a student *understands* something is not.

Three correct answers in a row might mean mastery — or might mean three easy questions, or
lucky guessing on four-option multiple choice, where random guessing is right 25% of the
time. The LRS uses
[Bayesian Knowledge Tracing](../../glossary.md#bayesian-knowledge-tracing-bkt) (BKT), which
models mastery as a probability, P(L), updated with each new piece of evidence. BKT
explicitly accounts for **guessing** (right answer, no knowledge) and **slipping** (wrong
answer despite knowledge).

P(L) is the number the product exists to produce. Everything else in this book — the
ingestion, the compression, the graph — is machinery for computing it honestly.

## Privacy Is Not a Feature

Student data is regulated —
[FERPA](../../glossary.md#family-educational-rights-and-privacy-act-ferpa) in U.S. schools,
[COPPA](../../glossary.md#childrens-online-privacy-protection-act-coppa) for children under
13 — and the design treats privacy as structural rather than as a setting.

Real student identity enters the system exactly once, at ingestion. It is immediately
replaced by a pseudonym derived with an
[HMAC](../../glossary.md#hash-based-message-authentication-code-hmac) using a per-district
secret. Everything downstream — every processor, every rollup, every dashboard — sees only
the pseudonym. The real identity lives behind a separate access boundary.

The consequence is deliberate and severe: delete a district's secret and its students'
identities become permanently underivable. That is not a bug in the design; it is how
erasure is implemented.

## What You Will Build

The rest of this book builds this system, in the order the risk demands: the ingestion
path, then the compression pipeline, then the graph projection, then the mastery model —
and finally the measurement that proves the central claim, by driving ingest 5× and
watching the graph write rate refuse to move.

---

## Key Takeaways

- An **xAPI statement** is Actor–Verb–Object, plus optional Result, Context, and Timestamp.
  It is **immutable**: corrections are new statements, never edits.
- Objects are identified by **URL**, which makes a textbook's published addresses the
  vocabulary its analytics are written in.
- One-vertex-per-statement is the obvious design and it fails: ~144M vertices/day and ~50k
  graph writes/sec at the target scale, to serve reports that are all aggregates anyway.
- The graph therefore stores **one summary vertex per analytical grain**, never per
  statement. Ratios run from ~3:1 up to ~3,000:1.
- **Graph writes scale with distinct active grains, not with statements/sec.** This is why
  an ingest burst never reaches the graph — and it is the claim the architecture must prove.
- The **event store** keeps every statement forever and is the system of record. The
  **graph** holds structure and summaries, and is always rebuildable from the log.
- **BKT** turns counts of evidence into P(L), a probability of mastery that accounts for
  guessing and slipping.
- Student identity is **pseudonymized at ingestion** with a per-district HMAC secret;
  nothing downstream ever sees the real actor.
