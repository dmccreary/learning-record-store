// Neo4j constraints and indexes — structure and summary grains only.
// Lifted verbatim in spirit from lrs-design-v1.md §6.3 (design lines 528-569).
// Applied by `lrs bootstrap --apply-constraints`, which is idempotent.
//
// UNVERIFIED ASSUMPTION — check this first on a running neo4j:5.26-community.
// The composite `REQUIRE (a, b) IS UNIQUE` constraints below ARE the enforcement
// mechanism for spec C-1 (design line 571) — not a performance hint. They sit
// adjacent to `IS NODE KEY`, which is Enterprise-only. Both the compose stack
// and the hardware §8 pilot tier run Community. If composite uniqueness turns
// out to need Enterprise, C-1 is unenforced in dev AND in the pilot, and
// `bootstrap --verify`'s :Statement check becomes the only thing standing
// between us and a graph growing by a billion nodes a month.

// ---- Tenancy and identity ----
CREATE CONSTRAINT district_id  IF NOT EXISTS FOR (d:District)  REQUIRE d.district_id  IS UNIQUE;
CREATE CONSTRAINT school_id    IF NOT EXISTS FOR (s:School)    REQUIRE s.school_id    IS UNIQUE;
CREATE CONSTRAINT section_id   IF NOT EXISTS FOR (s:Section)   REQUIRE s.section_id   IS UNIQUE;
CREATE CONSTRAINT student_key  IF NOT EXISTS FOR (s:Student)   REQUIRE s.student_key  IS UNIQUE;

// ---- Content ----
CREATE CONSTRAINT textbook_id  IF NOT EXISTS FOR (t:Textbook)        REQUIRE t.textbook_id IS UNIQUE;
CREATE CONSTRAINT version_id   IF NOT EXISTS FOR (v:TextbookVersion) REQUIRE v.version_id  IS UNIQUE;
CREATE CONSTRAINT page_id      IF NOT EXISTS FOR (p:Page)            REQUIRE p.page_id     IS UNIQUE;
CREATE CONSTRAINT microsim_id  IF NOT EXISTS FOR (m:MicroSim)        REQUIRE m.microsim_id IS UNIQUE;
CREATE CONSTRAINT question_id  IF NOT EXISTS FOR (q:Question)        REQUIRE q.question_id IS UNIQUE;
CREATE CONSTRAINT concept_id   IF NOT EXISTS FOR (c:Concept)         REQUIRE c.concept_id  IS UNIQUE;

// The reconciliation work queue (spec §5.4, §10.4) is an index, not a scan.
// The design indexed only :Textbook, but §5.4 auto-provisions TextbookVersion,
// Page, MicroSim, Question and Concept stubs too — each of which the reconciler
// must be able to find without a label scan.
CREATE INDEX provisional_textbook IF NOT EXISTS FOR (n:Textbook)        ON (n.provisional);
CREATE INDEX provisional_version  IF NOT EXISTS FOR (n:TextbookVersion) ON (n.provisional);
CREATE INDEX provisional_page     IF NOT EXISTS FOR (n:Page)            ON (n.provisional);
CREATE INDEX provisional_microsim IF NOT EXISTS FOR (n:MicroSim)        ON (n.provisional);
CREATE INDEX provisional_question IF NOT EXISTS FOR (n:Question)        ON (n.provisional);
CREATE INDEX provisional_concept  IF NOT EXISTS FOR (n:Concept)         ON (n.provisional);

// ---- Summary vertices (spec §4.3) — one per analytical grain, never per statement ----
// The composite key IS the grain. The constraint is what makes the summarizer's
// MERGE an upsert rather than an insert, and it is what physically prevents a
// second vertex from ever existing for the same grain. A bug that tried to write
// per-statement vertices violates the constraint and fails loudly at the first
// write, rather than quietly growing the graph by a billion nodes a month.
CREATE CONSTRAINT mastery_grain IF NOT EXISTS
  FOR (m:ConceptMastery)      REQUIRE (m.student_key, m.concept_id)  IS UNIQUE;
CREATE CONSTRAINT page_engagement_grain IF NOT EXISTS
  FOR (p:PageEngagement)      REQUIRE (p.student_key, p.page_id)     IS UNIQUE;
CREATE CONSTRAINT question_response_grain IF NOT EXISTS
  FOR (q:QuestionResponse)    REQUIRE (q.student_key, q.question_id) IS UNIQUE;

// Deferred grains — spec C-7 permits materializing fewer than §4.3 defines.
// Their constraints are created anyway: they cost nothing on an empty label and
// they mean a premature write fails loudly instead of silently creating a
// second vertex per grain.
//
//   MicroSimEngagement — blocked on design §13.7. Nothing owns the mapping from
//     continuous interaction evidence to a soft-correctness value in [0,1], so
//     the grain has no defined contents.
//   SectionRollup — needs a roster, which needs OneRoster (M2).
//   LearningSession — UNBUILDABLE AS SPECIFIED. The grain is (student, session)
//     but neither document defines a sessionization rule. "A contiguous burst of
//     learner activity" is the only definition given, and no gap threshold
//     appears anywhere in the spec or the design. No constraint is created for
//     it because there is no key to constrain.
CREATE CONSTRAINT microsim_engagement_grain IF NOT EXISTS
  FOR (m:MicroSimEngagement)  REQUIRE (m.student_key, m.microsim_id) IS UNIQUE;
CREATE CONSTRAINT section_rollup_grain IF NOT EXISTS
  FOR (r:SectionRollup)       REQUIRE (r.section_id, r.concept_id)   IS UNIQUE;

// ---- Experiments (M4, deferred) ----
CREATE CONSTRAINT experiment_id IF NOT EXISTS FOR (e:Experiment) REQUIRE e.experiment_id IS UNIQUE;
CREATE CONSTRAINT variant_id    IF NOT EXISTS FOR (v:Variant)    REQUIRE v.variant_id    IS UNIQUE;

// There is deliberately NO :Statement constraint and no :Statement label.
// Spec §5.6 C-1 prohibits per-statement vertices; `lrs bootstrap --verify`
// fails the deployment if any :Statement node is found in the graph.
