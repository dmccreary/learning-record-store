---
title: "Quiz: What is an Intelligent Textbook LRS?"
description: Ten review questions covering xAPI statements, summary vertices, statement compression, the two-store split, Bayesian Knowledge Tracing, and pseudonymization.
social:
   cards: false
---
# Quiz: What is an Intelligent Textbook LRS?

Test your understanding of xAPI statements, statement compression, and the LRS data
model with these review questions.

---

#### 1. An xAPI statement is built around three required parts. What are they?

<div class="upper-alpha" markdown>
1. Actor, Verb, Object
2. Subject, Predicate, Complement
3. Student, Score, Timestamp
4. Source, Action, Destination
</div>

??? question "Show Answer"
    The correct answer is **A**. An xAPI statement is deliberately shaped like an English
    sentence: Actor–Verb–Object, as in "student-123 answered question-4." Result, Context,
    and Timestamp are optional additions that carry most of the analytical value. Option B
    describes grammatical sentence structure rather than the xAPI model. Option C lists
    fields that appear in statements but are not its required core. Option D describes a
    routing or messaging model, not a learning-event model.

    **Concept Tested:** xAPI Statement Structure

    **See:** [The Statement](index.md#the-statement)

---

#### 2. Which organization publishes and maintains the xAPI specification?

<div class="upper-alpha" markdown>
1. The World Wide Web Consortium (W3C)
2. The Institute of Electrical and Electronics Engineers (IEEE)
3. The International Organization for Standardization (ISO)
4. Advanced Distributed Learning (ADL)
</div>

??? question "Show Answer"
    The correct answer is **D**. Advanced Distributed Learning is the U.S. Department of
    Defense initiative that publishes and maintains xAPI. This matters practically: ADL is
    a standards body, not a piece of software, and conformance is measured against its
    published specification. The W3C, IEEE, and ISO all publish standards relevant to the
    web and to computing generally, but none of them owns xAPI.

    **Concept Tested:** xAPI Provenance

    **See:** [The Statement](index.md#the-statement)

---

#### 3. A textbook sends a statement in error. How does the design correct it?

<div class="upper-alpha" markdown>
1. An administrator edits the statement in place
2. The statement is deleted from the event store
3. A new statement is written that voids the original
4. The statement's timestamp is updated to mark it stale
</div>

??? question "Show Answer"
    The correct answer is **C**. Statements are immutable: the log only ever grows.
    Corrections are expressed as *new* statements that void earlier ones, so the history of
    what was believed and when remains auditable. Options A and B both destroy information
    and would make the record untrustworthy — a record you can quietly rewrite is a record
    nobody can audit. Option D would mutate a statement, which is equally prohibited.

    **Concept Tested:** Statement Immutability

    **See:** [The Statement](index.md#the-statement)

---

#### 4. Every summary vertex carries a `statements_compressed` property. What does it record?

<div class="upper-alpha" markdown>
1. The disk space saved by compression, measured in bytes
2. The number of statements the vertex represents
3. The name of the compression algorithm used
4. The number of times the vertex has been rebuilt from the log
</div>

??? question "Show Answer"
    The correct answer is **B**. `statements_compressed` counts the statements a summary
    stands for. It does two jobs at once: it makes the compression ratio directly
    observable in the graph, and it gives every dashboard figure an explicit evidence
    count. A mastery score of 0.9 backed by three attempts is a different claim than one
    backed by ninety, and this property is what lets a report tell them apart.

    **Concept Tested:** Summary Vertex Properties

    **See:** [Compress Before You Materialize](index.md#the-central-idea-compress-before-you-materialize)

---

#### 5. Why does the design prohibit storing one graph vertex per xAPI statement?

<div class="upper-alpha" markdown>
1. Graph databases are technically incapable of storing more than a few million vertices
2. The xAPI specification forbids storing statements in a graph database
3. Per-statement vertices would make the immutable event log unnecessary
4. It would add roughly 144 million vertices per day to serve reports that are all aggregates anyway
</div>

??? question "Show Answer"
    The correct answer is **D**. At the target rate of 10,000 statements per second,
    one-vertex-per-statement adds about 144 million vertices per day and demands on the
    order of 50,000 graph writes per second at peak — and buys nothing, because every
    report a teacher asks for is an aggregate. Option A overstates a real limit as an
    absolute one. Option B invents a rule xAPI does not contain. Option C reverses the
    relationship: the log remains the system of record regardless.

    **Concept Tested:** Statement Compression Rationale

    **See:** [The Numbers Are Brutal](index.md#the-problem-the-numbers-are-brutal)

---

#### 6. Which best describes the division of labour between the event store and the graph?

<div class="upper-alpha" markdown>
1. The event store holds every statement and is the system of record; the graph holds structure and summaries
2. The event store holds recent statements; the graph holds older, archived ones
3. The graph is the system of record; the event store is a backup of it
4. Both stores hold the same statements, kept in sync for redundancy
</div>

??? question "Show Answer"
    The correct answer is **A**. The event store's job is events; the graph's job is
    structure and summary. Nothing is discarded — the detail is always one query away.
    Option B invents a tiering scheme the design does not use. Option C inverts the
    relationship: a summary is never a source of truth, and if it disagrees with the log,
    the log wins. Option D describes duplication, which is exactly the cost compression
    exists to avoid.

    **Concept Tested:** Two-Store Architecture

    **See:** [Two Stores, Two Jobs](index.md#two-stores-two-jobs)

---

#### 7. Bayesian Knowledge Tracing models mastery as a probability. Which two possibilities does it explicitly account for?

<div class="upper-alpha" markdown>
1. Cheating and collaboration
2. Reading speed and dwell time
3. Guessing and slipping
4. Prerequisites and corequisites
</div>

??? question "Show Answer"
    The correct answer is **C**. BKT accounts for *guessing* — a right answer without
    knowledge, which happens 25% of the time by chance on four-option multiple choice — and
    *slipping*, a wrong answer despite genuine knowledge. Modelling both is what separates
    a mastery estimate from a raw score. Option B names engagement signals the LRS does
    collect, but they are not part of the BKT model. Options A and D are not modelled by
    BKT at all.

    **Concept Tested:** Bayesian Knowledge Tracing

    **See:** [From Evidence to Mastery](index.md#from-evidence-to-mastery)

---

#### 8. During a burst, ingest jumps 5× but the graph write rate stays flat. What explains this?

<div class="upper-alpha" markdown>
1. The gateway sheds excess statements once a burst threshold is crossed
2. The burst increases the statement count within each grain, not the number of distinct grains
3. The graph database automatically batches writes when it detects high load
4. Summary vertices are written only once per day, regardless of ingest rate
</div>

??? question "Show Answer"
    The correct answer is **B**. Graph writes are a function of *distinct active grains per
    sync window*, not statements per second. A burst does not cause students to acquire new
    concepts — the same students generate more evidence about the same grains, so the
    compressor absorbs it and the graph never feels it. Option A would lose data the design
    promises to keep. Options C and D describe mechanisms this system does not rely on.

    **Concept Tested:** Compression and Burst Absorption

    **See:** [Why This Survives the Burst](index.md#why-this-survives-the-burst)

---

#### 9. A student visits one page 50 times across a term. How many `PageEngagement` vertices exist for that student and that page?

<div class="upper-alpha" markdown>
1. Exactly one, with `dwell_ms_total` summed and `statements_compressed` recording 50
2. Fifty — one vertex per visit
3. None — page views are not summarized in the graph
4. Two — one recording `first_seen` and one recording `last_seen`
</div>

??? question "Show Answer"
    The correct answer is **A**. The grain of `PageEngagement` is (student, page), so all
    50 visits compress into a single vertex whose `dwell_ms_total` is the sum and whose
    `statements_compressed` is 50. Option B is precisely the per-statement materialization
    the design prohibits. Option C is wrong because the visits are summarized, not
    discarded. Option D misreads `first_seen` and `last_seen` as separate vertices rather
    than properties of one.

    **Concept Tested:** Analytical Grain

    **See:** [Compress Before You Materialize](index.md#the-central-idea-compress-before-you-materialize)

---

#### 10. A MicroSim emits statements naming its page by a URL other than the page's published address. Why is this more serious than an ordinary broken link?

<div class="upper-alpha" markdown>
1. The gateway will reject the statements as malformed and the data will be lost
2. The student's real identity can be reverse-engineered from an incorrect URL
3. The event store will exhaust its storage keeping duplicate copies of the URL
4. One activity now has two names, so every count that groups by object silently splits
</div>

??? question "Show Answer"
    The correct answer is **D**. Objects are identified by URL, which makes a textbook's
    published addresses the vocabulary its analytics are written in. Two names for one page
    produce two summary vertices that never merge, so engagement counts and compression
    ratios are quietly halved. The failure is silent, which is what makes it dangerous.
    Option A is wrong because a well-formed statement with an unexpected URL is accepted —
    the design deliberately accepts unknown activities rather than rejecting them. Options
    B and C describe consequences that do not follow.

    **Concept Tested:** Activity Identification by IRI

    **See:** [The Statement](index.md#the-statement)
