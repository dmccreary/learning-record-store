# Twelve Graphic-Novel Story Ideas: One Record, Four Points of View

These short graphic-novel ideas follow one fictional district's Learning Record
Store through the eyes of the four people who depend on it:

- **Dr. Priya Anand**, Director of Learning Systems for Meridian Unified School District
- **Ms. Sofia Marín**, an eighth-grade earth-science teacher
- **Theo Lindqvist**, an intelligent-textbook designer
- **Kwame Osei**, a student in Ms. Marín's class

Rowan, the cinnamon-and-cream red panda with teal glasses, a teal neckerchief,
and a compact learning-record satchel, moves between their stories as a quiet
guide, always returning to the same question: **"What does the evidence show?"**

The stories are fictional, but every feedback loop is grounded in a real
capability described in this textbook — accept-first ingestion, statement
compression into summary vertices, Bayesian knowledge tracing, multi-tenant
isolation, producer-contract conformance, A/B experiment design, and
FERPA/COPPA-aware district reporting.

## Selection Criteria

The twelve ideas were chosen so that, together, they:

- **Cover the architecture, not just the dashboards** — several stories dramatize
  ingestion, compression, replay, and cost, not only the persona-facing reports.
- **Give every persona a turn as the protagonist** — no single character carries
  the whole anthology.
- **Treat the record as a starting point, not a verdict** — evidence opens a
  conversation; people still decide what to do next.
- **Vary in scale** — from one quiz question to a whole school board meeting.
- **End the anthology where it began** — the capstone story reunites all four
  characters around the same underlying record.

## Story Ideas

### 1. The Book That Could Finally Speak

| | |
|---|---|
| **Setting** | The night before term starts, as Theo rushes to register a new earth-science MicroSim |
| **Theme** | A new textbook should be able to start reporting evidence on day one, not after weeks of gatekeeping |
| **Connection** | Non-blocking, accept-first ingestion; producer-contract conformance checks; the Textbook Registry |
| **Panels** | **7** — a compact origin story: submission, a near-miss rejection, a self-check, and the first statements flowing in. |

Theo is certain his last-minute submission will sit in a review queue for weeks.
Instead the LRS accepts his textbook's statements immediately, quietly flagging
a handful of malformed events through the conformance checker so he can fix
them before class starts. By Thursday, Sofia's students already show up on a
real activity dashboard.

*Why this inspires:* The first day of class is where trust in a new tool is won or lost.

---

### 2. What the Graph Remembers

| | |
|---|---|
| **Setting** | Winter break, as Theo assembles a grant-renewal report from six months of usage |
| **Theme** | Millions of small events become one useful shape when compressed the right way |
| **Connection** | Statement compression into summary vertices; the property graph model; content-effectiveness rollups |
| **Panels** | **6** — a tight before/after: an overwhelming raw log versus a queryable summary graph. |

Facing a wall of raw xAPI statements, Theo despairs of finding any pattern
before his deadline. Rowan shows him the compressed summary vertices instead —
a handful of graph nodes that already answer which chapters worked. Theo
finishes his report that afternoon, and Priya reuses the same view for her
board presentation.

*Why this inspires:* The right shape for data turns an impossible task into an afternoon's work.

---

### 3. Kwame's Own Copy

| | |
|---|---|
| **Setting** | End of the school year, as Kwame prepares to change schools within the district |
| **Theme** | A student's learning record belongs, in part, to the student — and should travel with them |
| **Connection** | District-scoped student identity; multi-tenant isolation; the Student Progress Overview |
| **Panels** | **8** — room for the fear of losing history, the request, the transfer, and the relief of continuity. |

Kwame worries that switching schools means starting his science record from
zero. Sofia helps him request his own progress overview, and together they
learn the district's design keeps his record intact and portable to his new
school without exposing it to anyone outside his classes.

*Why this inspires:* The record follows the learner, not the building.

---

### 4. The Heatmap That Lied — Almost

| | |
|---|---|
| **Setting** | A stormy Tuesday when a network outage corrupts three class-periods of incoming statements |
| **Theme** | A trustworthy system tells you when it doesn't know something, instead of guessing |
| **Connection** | Data-quality monitoring; ingestion-health checks; the replayable event log |
| **Panels** | **8** — a technical near-miss: false alarm, root cause, and safe recovery. |

Sofia's mastery heatmap suddenly shows half her class regressing overnight,
and she almost reschedules a week of review before Rowan flags the
ingestion-health warning. Priya's team finds a queue backlog from the storm,
replays the durable log once service resumes, and the corrected heatmap shows
nothing was ever wrong with the students.

*Why this inspires:* Good systems earn trust by admitting uncertainty instead of hiding it.

---

### 5. Two Classrooms, One Question

| | |
|---|---|
| **Setting** | Sofia and a colleague disagree over whether a new simulation-first lesson order actually helps |
| **Theme** | An honest experiment settles an argument that opinions alone cannot |
| **Connection** | A/B experiment design; sticky group assignment; the experiment readout dashboard |
| **Panels** | **9** — hypothesis, split assignment, parallel teaching, and a readout that surprises both teachers. |

Sofia thinks students should run the simulation before reading; her colleague
is sure it should come after. Theo builds both paths into the textbook, the
LRS assigns each class consistently to one order, and the readout shows a
modest but real advantage neither teacher expected. Priya adopts the winning
order district-wide.

*Why this inspires:* A friendly disagreement becomes a real answer instead of a standoff.

---

### 6. The Question Only Half the Class Understood

| | |
|---|---|
| **Setting** | A quiz item that quietly fails every time it's given |
| **Theme** | Item-level data can catch a broken question before it damages a semester of grades |
| **Connection** | Quiz item analysis; question-discrimination metrics |
| **Panels** | **6** — a brisk mystery-and-repair suited to one stubborn question. |

Kwame gets a question wrong that he's sure he answered correctly, and Sofia
notices her top students split evenly on it too. The item-analysis view flags
the question's discrimination score as near zero — a sign it measures nothing
useful — and Theo rewrites it that night.

*Why this inspires:* A confused student can be the first honest signal that something else is broken.

---

### 7. The District That Couldn't See Each Other

| | |
|---|---|
| **Setting** | A joint meeting between two neighboring districts sharing the same intelligent-textbook vendor |
| **Theme** | Districts can learn from each other's outcomes without ever seeing each other's students |
| **Connection** | Multi-tenant isolation; aggregation thresholds; cross-district benchmark reporting |
| **Panels** | **8** — a structural mystery, "why can't we compare notes," resolved by design rather than by breaking the rules. |

Priya wants to know whether her district's results on a new chapter are
typical, but tenant isolation means she cannot simply query another
district's data. Rowan shows her a privacy-preserving benchmark report that
surfaces de-identified, aggregated outcomes across willing districts — no
student or classroom ever exposed.

*Why this inspires:* Privacy and insight are not opposites when the system is built for both.

---

### 8. The Server in the Closet

| | |
|---|---|
| **Setting** | A smaller, budget-constrained neighboring district considering its first LRS |
| **Theme** | A well-designed LRS should scale down as gracefully as it scales up |
| **Connection** | Hardware and cost model; dev-tier versus production-tier deployment |
| **Panels** | **7** — a resourceful-underdog arc: constraint, doubt, and a workable solution. |

The smaller district assumes a real learning record store is out of reach on
their budget, until Theo walks them through the same architecture running on
modest hardware for a single-school pilot. Their teacher gets her first
mastery heatmap within a week, and Priya offers to mentor the rollout.

*Why this inspires:* Good evidence shouldn't be a privilege only large budgets can afford.

---

### 9. The Parent Who Asked a Fair Question

| | |
|---|---|
| **Setting** | A parent-teacher conference where Kwame's father asks exactly what data the district keeps on his son |
| **Theme** | A trustworthy system can answer "what do you know about my child" honestly, in plain language |
| **Connection** | FERPA/COPPA compliance; the district privacy-and-access audit |
| **Panels** | **7** — a conversation-driven story: the question, the honest answer, and the reassurance that follows. |

Kwame's father worries that a "learning record store" means a permanent,
secret file on his son. Priya walks the family through exactly what is
collected, who can see it, and how long it is kept, backed by the district's
access-audit log rather than a vague promise.

*Why this inspires:* Transparency turns a worried question into trust.

---

### 10. The Chapter Nobody Finished

| | |
|---|---|
| **Setting** | A content-effectiveness review after a new chapter quietly underperforms for two straight terms |
| **Theme** | A textbook can be well-written and still not work — the data says so before the complaints do |
| **Connection** | Content-effectiveness reports; the completion funnel; page-level engagement |
| **Panels** | **8** — a slow-burn investigation ending in a confident rewrite. |

Theo is proud of a densely written chapter on energy conservation, but the
completion funnel shows most classes stall two pages in, long before any
teacher complains. Sofia confirms students quietly skip ahead rather than push
through it. Theo splits the chapter into shorter sections with a MicroSim
checkpoint, and the next term's funnel shows students finally reaching the end.

*Why this inspires:* Data can surface a problem no one wanted to be the one to report.

---

### 11. The Roster Nobody Wanted to Read

| | |
|---|---|
| **Setting** | Early October, when Sofia's at-risk roster flags Kwame for the first time |
| **Theme** | An early warning is only useful if it leads to a caring conversation, not a label |
| **Connection** | At-risk roster; prerequisite-gap analysis; Bayesian knowledge-tracing mastery estimates |
| **Panels** | **9** — an emotionally careful arc: the flag, the reluctance, the honest conversation, and the turnaround. |

Kwame is embarrassed to appear on the roster and insists he's fine, but the
mastery-tracing model shows his confidence slipping on a prerequisite from two
chapters back — not the current one. Sofia uses that specific detail, not a
vague "you're struggling," to open a low-pressure conversation, and two weeks
later his estimated mastery has recovered.

*Why this inspires:* The best use of an early warning is a private, respectful conversation.

---

### 12. The Night Before the School Board

| | |
|---|---|
| **Setting** | The evening before Priya presents the year's results to the school board |
| **Theme** | The strongest case for a learning record store is the one told by the people it actually helped |
| **Connection** | Cross-persona dashboards synthesizing district, class, content, and student views |
| **Panels** | **10** — a synthesis finale weaving threads from across the anthology into one shared evening. |

Priya, Sofia, Theo, and Kwame gather to choose what evidence to present:
the adoption dashboard, the mastery heatmap, the content-effectiveness report,
and Kwame's own progress record. Kwame decides to speak first, explaining in
his own words what changed after the roster flagged him weeks earlier. The
board approves funding to expand the program — not because of a slide of
numbers, but because the numbers and the story matched.

*Why this inspires:* Evidence earns trust fastest when it's carried by the people who lived it.

## A Shared Visual Language

If these ideas become full graphic novels, use a warm contemporary
educational-comic style with clear expressions, readable dashboard shapes, and
a teal, cinnamon, cream, navy, and amber palette. Keep the four recurring
characters visually consistent across stories. Rowan should point to evidence,
open a conversation, or lower anxiety — he should never announce a decision
the human characters haven't examined themselves.

Recurring visual motifs to bind the anthology together:

- a glowing thread that follows one xAPI statement from Kwame's textbook to
  each role that eventually sees it;
- concept nodes shifting from amber to teal as mastery develops;
- Rowan's satchel opening to reveal records as cards, never as exposed secrets;
- four windows onto the same underlying evidence — student, class, content,
  and district scale — that recur, differently framed, across the collection.

## How to Develop an Idea

To turn an idea into a complete illustrated story, invoke the
`book-media-generator` skill's story route with the title and suggested panel
count. For example:

> book-media-generator (story route): "The Book That Could Finally Speak" --panels 7

The full story should include a cover, the numbered panels, concise
narration, and self-contained 16:9 image prompts. Preserve the central rule of
this collection: **the record supplies evidence, people supply context and
judgment, and the next round of evidence checks whether their decision
actually helped.**
