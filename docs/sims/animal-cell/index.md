---
title: Animal Cell
description: A labeled, interactive diagram of an animal cell and its organelles for exploring cell structure.
hide:
    toc
---
# Animal Cell MicroSim

<iframe src="main.html" height="960px" width="100%" scrolling="no"></iframe>

[View the Animal Cell MicroSim Fullscreen](main.html)

---

## What this MicroSim emits

Every statement conforms to the [xAPI Producer Contract v1](../../specs/xapi-producer-contract-v1.md).
Nothing is sent to a server — statements render in the panel below the diagram so you can read the
wire format directly. This sim is the reference emitter for three things nothing else in the textbook
does.

### Two verb families from one artifact

The same six hotspots are **two different sets of activities**, depending on what the student is
being asked to do with them:

| Mode | The student's act | `object.id` | Verb | Type |
|---|---|---|---|---|
| Explore | inspect the nucleus | `…/sims/animal-cell/#nucleus` | `interacted` | `Control` |
| Quiz | answer "where is the nucleus?" | `…/sims/animal-cell/#q-nucleus` | `answered` | `Question` |

They are **not** one object whose type changes with the mode. Inspecting a structure and being asked
to find it are different acts — an inspection has no `success` to report, and an answer must have one
— so they get different IRIs. They re-converge where relatedness belongs: both carry
`concept_id: cell-nucleus`, and the concept rollup applies no type filter, so both count as evidence
about the nucleus in one `ConceptMastery` vertex.

### The quiz produces a *sequence*, and that is the point

A wrong click does not end the question — the sim says "Not quite, try again" and the student
retries. So one question emits `success: false, false, true` against a single IRI, which the rollup
reads as `attempts = 3, successes = 1`.

Emitting the failures is the honest choice rather than the noisy one. With six hotspots a student can
brute-force the answer by clicking every marker. If only the success were emitted, that student would
be **indistinguishable from one who knew it instantly** — both would read `attempts = 1,
successes = 1`, and the graph would report mastery that the interaction plainly disproves. The full
sequence reports `attempts = 6, successes = 1`, which is exactly what a guessing model is for. For a
click-to-identify quiz, the sequence *is* the signal.

### Why hover and click count as one act here

Explore mode emits one statement per inspection, whether the student hovered or clicked, gated at
0.6s of dwell. The gate matters: without it, a mouse crossing the label list would emit six
statements for one meaningless movement. Sweeping all twelve targets in 40ms emits **nothing**; a
deliberate 0.7s pause emits **one**.

Both paths carry `concept_id`, and that is a deliberate departure from how
[Scientific Method Workflow](../scientific-method/index.md) treats hover. There, clicking *pins* the
infobox — a separate, stronger act, so weighting it differently is defensible. Here `diagram.js`
wires hover and click to the same function: there is no pin, and **click is simply what hover is
called on a touchscreen**. Discounting hover would not filter weak evidence; it would count tablet
users and discard laptop users for the identical act — device-correlated bias, which in schools
correlates with funding.

The generalisable rule: **weight hover against click only where clicking is a separate designed act.
Where click is the touch fallback for hover, they are one act and must be counted once.**

### What it cannot tell you

Explore mode cannot measure understanding. Only `answered` carries `result.success`, so every
`interacted` statement contributes `attempts = 0`, forever, by design. Quiz mode is where this
diagram earns a mastery signal. Per-hotspot dwell is recorded but reaches no rollup — it lives in
`lrs.statements` only (contract §12 item 9).

---

## Lesson Plan: Exploring the Animal Cell

**Audience:** college placement Biology or advanced high-school biology students  
**Duration:** 45–60 minutes  
**Materials:** Animal Cell MicroSim (embedded above), student notebooks or digital lab journal, projector (optional)

### Learning Objectives

By the end of this lesson, students will be able to:

1. Identify the nucleus, cell membrane, cytoplasm, ribosomes, mitochondria, and endoplasmic reticulum on a schematic animal cell.
2. Explain how structure supports function for each organelle, citing at least one specific detail (e.g., cristae of mitochondria, pores of the nuclear envelope).
3. Trace the movement of a newly synthesized protein through the endomembrane system using the MicroSim annotations.
4. Connect each organelle to a relevant college placement Biology concept or exam tip (e.g., selective permeability, endosymbiotic theory, glycolysis location).

### Lesson Flow

#### 1. Engage (5 minutes)

- Project the MicroSim and hide callout labels (click the “i” icons off) to display the cell diagram without text. Ask: “If a virus wanted to take over this cell, which structure would it target first and why?” Discuss initial guesses to surface prior knowledge.

#### 2. Explore (15 minutes)

Students work in pairs with laptops:

- Click each hotspot to reveal the organelle description and college placement tip.  
- Record two facts per organelle in a T-chart: **Structure Detail** vs. **Function/Process Supported**.  
- Prompt questions:
  - Nucleus: How do nuclear pores support rapid transcription-response cycles?
  - Cell membrane: Which molecules move freely vs. require a transport protein?
  - Mitochondria: Where exactly do the Krebs cycle and electron transport chain occur?
  - Cytoplasm: Which reactions stay here rather than moving into organelles?
  - Ribosomes: How do free vs. bound ribosomes decide a protein’s destination?
  - Endoplasmic Reticulum: What differentiates rough and smooth ER roles?

#### 3. Explain (15 minutes)

Facilitate a class discussion anchored in the MicroSim:

- **Mini whiteboard share-out:** Each pair chooses one organelle and sketches it quickly, labeling one key structural feature from the sim (e.g., folded cristae).  
- **Protein journey walkthrough:** Use the callouts to narrate the path of a hormone protein: transcription in the nucleus → ribosome on rough ER → ER lumen processing → transport vesicle → Golgi (describe even if not shown) → plasma membrane secretion. Emphasize the college placement exam “endomembrane system” terminology noted in the ER callout.
- Highlight college placement tips embedded in the data (e.g., endosymbiotic evidence in mitochondria, glycolysis location in cytoplasm) and connect them to past FRQs or MCQ distractors.

#### 4. Elaborate (10 minutes)

Assign quick synthesis tasks:

- **Option A:** Students write a 4–5 sentence “cell diary” entry from the perspective of an organelle, referencing at least one fact from the MicroSim callout.  
- **Option B:** Challenge learners to design a mutation or toxin that disrupts one structure shown, predicting downstream impacts on the cell.

#### 5. Evaluate (Exit Ticket)

- Prompt: “Match each process to its correct location: glycolysis, electron transport chain, mRNA translation for secreted proteins, lipid detoxification, selective permeability.” Students submit a short response citing at least three organelles.  
- Alternatively, use a quick auto-graded form with image hotspots derived from the sim.

### Differentiation & Extensions

- **Support:** Provide a printed diagram with labels for students who need scaffolding; allow them to annotate directly while others use the interactive version.  
- **Extension:** Have advanced students compare the animal cell MicroSim to a plant cell diagram, listing which structures are unique and hypothesizing how the MicroSim could be expanded.  
- **Cross-topic tie-ins:** Link mitochondria to the cellular respiration chapter, ribosomes to molecular genetics, and cell membrane concepts to membrane transport simulations elsewhere in the course.

### Assessment Ideas

- Short quiz asking students to drag labels onto the correct organelles (screenshots from the sim).  
- FRQ practice: “Explain how defects in the rough ER or mitochondria would differentially impact ATP production and protein secretion.”  
- Peer teaching: students create a brief screencast walking through three organelles using the MicroSim, graded with a rubric focusing on accuracy and explanatory clarity.

### Teacher Notes

- The MicroSim callouts include AP-specific reminders (e.g., ribosome size differences, endosymbiotic theory). Encourage students to capture these in their notebooks as “exam traps to avoid.”  
- If bandwidth is limited, download the `main.html` bundle locally so each group can run the simulation offline.  
- Reinforce vocabulary precision: nucleus vs. nucleolus, cytoplasm vs. cytosol, rough vs. smooth ER. These distinctions often appear in college placement free-response questions.
