---
title: Scientific Method Workflow
description: An interactive flowchart of the scientific method — question, hypothesis, experiment, analysis, and conclusion — as used across scientific disciplines.
quality_score: 67
---

# Scientific Method Workflow

## Overview

The scientific method is the systematic process that scientists use to investigate phenomena, acquire new knowledge, and correct or integrate existing knowledge. This interactive flowchart visualizes each step of the scientific method as used in physics and all scientific disciplines.

## Interactive Diagram

<iframe src="main.html" width="100%" height="1600px" scrolling="no"></iframe>
[View Fullscreen](./main.html)

```html
<iframe src="main.html" width="100%" height="1600px" scrolling="no"></iframe>
```
## Process Steps

1. **Observe Phenomenon or Ask Question** - Notice something interesting about the physical world—like why objects fall, why the sky is blue, or how magnets work
1. **Background Research** - Review existing scientific literature and previous experiments to understand what's already known
1. **Formulate Hypothesis** - Create a testable statement predicting the relationship between variables (e.g., "If mass increases, then falling time decreases")
1. **Design Experiment** - Plan controlled procedures, identify independent and dependent variables, consider controls and constants
1. **Conduct Experiment & Collect Data** - Carefully follow procedures, make accurate measurements, record all observations systematically
1. **Analyze Data** - Create graphs, calculate statistics, look for patterns and relationships in the measurements
1. **Does Data Support Hypothesis?** - Compare experimental results to predictions—do they match within experimental error?
1. **Accept Hypothesis** (if Yes) - Hypothesis is supported by evidence, but remains open to future testing and refinement
1. **Revise or Reject Hypothesis** (if No) - Modify hypothesis based on findings or develop an entirely new hypothesis
1. **Communicate Results** - Share findings through lab reports, presentations, or scientific papers using standard formats
1. **New Questions Raised?** - Scientific investigation often leads to new questions and avenues for research

## Understanding the Process

The scientific method is not a rigid linear process but rather a flexible, iterative approach to investigation. The flowchart illustrates several key features:

### Core Steps

1. **Observation & Question** - Scientific inquiry begins with curiosity about the natural world. In physics, this might involve noticing patterns in motion, energy, or forces.

2. **Background Research** - Before conducting experiments, scientists review existing knowledge to understand what has already been discovered and to refine their questions.

3. **Hypothesis Formation** - A hypothesis is a testable prediction about the relationship between variables. In physics, hypotheses often take the form of mathematical relationships (e.g., "acceleration is inversely proportional to mass").

4. **Experimental Design** - Careful planning identifies independent variables (what you change), dependent variables (what you measure), and controlled variables (what you keep constant).

5. **Data Collection** - Systematic observation and measurement following established procedures. Accuracy, precision, and reproducibility are essential.

6. **Data Analysis** - Raw data is processed using graphs, statistical analysis, and mathematical models to identify patterns and relationships.

### Decision Points

The diagram includes two critical decision points:

- **Does Data Support Hypothesis?** - If experimental results match predictions within acceptable error margins, the hypothesis is supported. If not, it must be revised or rejected.

- **New Questions Raised?** - Scientific investigation typically generates new questions, leading to additional cycles of inquiry.

### The Iterative Nature

Notice the feedback loops in the diagram:
- Failed hypotheses loop back to reformulation based on experimental evidence
- Successful investigations often reveal new questions, restarting the cycle
- Each iteration builds on previous knowledge, advancing scientific understanding

## Key Concepts

- **Controlled Experiment**: An investigation where one variable is changed while others are held constant
- **Independent Variable**: The factor deliberately manipulated by the experimenter
- **Dependent Variable**: The factor measured in response to changes in the independent variable
- **Hypothesis**: A testable prediction about the relationship between variables
- **Reproducibility**: The ability of an experiment to yield consistent results when repeated
- **Peer Review**: The process of scientists evaluating each other's work before publication

## Connection to Physics Learning

Throughout this course, you will apply the scientific method to explore:

- **Kinematics**: Investigating relationships between position, velocity, and acceleration
- **Dynamics**: Testing Newton's laws through force and motion experiments
- **Energy**: Analyzing energy transformations and conservation principles
- **Waves & Optics**: Examining wave behaviors and light phenomena

Each physics concept in this textbook was discovered and refined through countless iterations of this process.

## Related Concepts

These links do not exist!
- `[Experimental Error and Uncertainty](../../chapters/01/index.md)` - Understanding measurement limitations
- `[Graphing and Data Analysis](../../chapters/01/index.md)` - Visualizing experimental results
- `[Significant Figures](../../chapters/01/index.md)` - Reporting measurements accurately

## Further Exploration

Try applying the scientific method to these physics questions:

1. Does the angle of a ramp affect how fast an object slides down?
2. How does the length of a pendulum affect its period?
3. What factors influence the range of a projectile?

For each question, work through the flowchart: formulate a hypothesis, design an experiment, and predict what data analysis might show.

## What This Diagram Records — and What It Cannot

This MicroSim emits xAPI statements to the panel below the diagram (nothing is sent to a
server). It conforms to the
[xAPI Producer Contract v1](../../specs/xapi-producer-contract-v1.md), and it is the
reference **non-p5** emitter — every other instrumented sim here is p5.js, so this one is
what proves the contract is not tied to a single rendering library.

### It cannot tell you whether a student understands the scientific method

This is worth stating plainly, because it is the thing people most want from a diagram like
this and it is the thing hover data cannot give.

**Hovering is not knowing.** Only the `answered` verb carries `result.success`, and
`result.success` is the sole input to `attempts`/`successes` and therefore to Bayesian
Knowledge Tracing. Every statement this diagram emits is `interacted` or `experienced`, so
it contributes `statements_compressed` at **`attempts = 0`** — permanently, by design. A
student can pause on all twelve steps and understand nothing; a student who already knows
the method may pause on none.

What it *does* give is **engagement evidence**, which is genuinely useful and is not the
same claim:

- **Coverage** — which steps were studied, and which were never opened.
- **Dwell** — how long each step held attention.
- **Order** — the sequence steps were explored in.
- **Intensity** — a `hover` is passing attention; a `pinned` click is deliberate study.

To measure understanding, this diagram needs questions. `metadata.json` has no
`pedagogical.keyQuestions` yet; adding them, and wiring them the way the
[chapter quiz](../../chapters/01-what-is-an-ibook-lrs/quiz.md) is wired, is what would
produce `answered` statements and a real mastery signal.

### Prior exposure: the same diagram lives in more than one textbook

This workflow appears in physics and chemistry courses too. That has a consequence worth
understanding before reading any number this produces.

A statement's `object.id` is the activity's **canonical published URL** (contract §1) — so
it is the **same IRI** no matter which textbook embeds the diagram. Only `grouping[0]`, the
textbook version IRI (§4), differs between books.

Now look at how the data is aggregated. Every rollup in `clickhouse.sql` is keyed
`(district_id, student_key, concept_id)` or `(district_id, student_key, object_id)` —
**none of them key on `textbook_id`.** So a student's physics exposure and their chemistry
exposure **merge into a single vertex**, with dwell summed across both. The rollup cannot
tell you the two visits happened in different courses.

That is not a bug. It is the two-store split working as designed: `lrs.statements` keeps
`textbook_id` and `version_id` on **every** statement, so the question *"had this student
already met this diagram elsewhere?"* is answerable from the immutable log. It is simply not
answerable from `ConceptMastery`, because the graph deliberately holds compressed summaries
rather than events.

**The interpretation trap:** a student who moves through this quickly because they met the
scientific method in physics looks **identical** to a student who could not be bothered. Low
engagement here is *not* evidence of low mastery — it may be evidence of prior mastery. The
two are distinguishable only by asking the log whether earlier statements for these concepts
exist under a different `textbook_id`.

### How each interaction maps

| You do this | It emits | Why |
|---|---|---|
| Sweep the mouse down the diagram | **nothing** | A crossing is not evidence. A hover must exceed **0.6s** to count — otherwise a single mouse movement down a tall workflow would fabricate twelve statements. |
| Pause on a step (>0.6s) | one `interacted`, `engagement-mode: hover` | Transient attention, with the step's dwell time. |
| Click a step to pin it | one `interacted`, `engagement-mode: pinned` | Unambiguous intent — pinning is a decision, so it counts regardless of dwell. |
| Leave the page / hide the tab | one `experienced` with `result.duration` | Page-level dwell (contract §7). This diagram has no Start/Pause control, so the interval is simply time on the page. |

**Why steps are `Control` and the page is `MicroSim`:** the page-level statement's object is
the page IRI with no fragment, so it becomes exactly **one** `PageEngagement` vertex. Each
step's object is fragment-qualified (`…/scientific-method/#hypothesis`) and typed `Control`,
which keeps it out of `mv_student_page_rollup` — that view groups by `object_id`, so
`MicroSim`-typed steps would produce **twelve** PageEngagement vertices for a page visited
once.

**Twelve steps, nine concepts.** Several steps share a concept — `Does Data Support
Hypothesis?`, `Accept Hypothesis`, and `Revise or Reject Hypothesis` all carry
`hypothesis-testing`. They compress into one `ConceptMastery` vertex, which is precisely
what the (student, concept) grain exists to do.
