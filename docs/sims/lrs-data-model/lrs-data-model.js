// LRS Graph Data Model Explorer - vis-network
// Click any node label or relationship to see its properties and enumerated metadata.
// Source of truth: docs/specs/lrs-spec-v1.md sections 4.1-4.3 and 5.6.
//
// NOTE ON THE MODEL: there is deliberately no `Statement` vertex. Spec 5.6 (C-1)
// prohibits per-statement vertices; statements live in the event store and are
// compressed into one summary vertex per analytical grain. The dashed red
// "Event Store" element on the canvas is NOT a graph vertex — it is drawn to
// show where the statements actually are.
// CANVAS_HEIGHT: 640

// ===========================================
// CATEGORY STYLING
// ===========================================
const CATEGORY = {
  tenancy:    { label: 'Tenancy',              bg: '#e3f2fd', border: '#1976d2', badge: '#1976d2' },
  content:    { label: 'Content',              bg: '#e8f5e9', border: '#388e3c', badge: '#388e3c' },
  summary:    { label: 'Summary (compressed)', bg: '#fff3e0', border: '#f57c00', badge: '#f57c00' },
  vocab:      { label: 'Vocabulary',           bg: '#eceff1', border: '#607d8b', badge: '#607d8b' },
  experiment: { label: 'Experiment',           bg: '#f3e5f5', border: '#7b1fa2', badge: '#7b1fa2' },
  store:      { label: 'Event store — not in the graph', bg: '#ffffff', border: '#c62828', badge: '#c62828' }
};

// ===========================================
// NODE DEFINITIONS (spec 4.1 + 4.3)
// Each: id, label?, category, x, y, desc, props[], enums[]
// Summary vertices additionally carry: grain, compresses, ratio
// prop: [name, type, note];  enum: {prop, values[]}
// ===========================================
// LAYOUT NOTE: physics is disabled and every node is hand-placed, in bands that
// follow the data flow rather than the alphabet:
//   top     — content tree
//   middle  — the summary band, each vertex directly under the object it summarizes
//             (so SUMMARIZES / OF_CONCEPT are short vertical hops)
//   bottom  — the event store, fanning UP into the summary band (the compression
//             pipeline), and Student, fanning up-right into the same band
//   far left— the tenancy chain
const NODES = [
  { id: 'District', category: 'tenancy', x: -1500, y: -420,
    desc: 'Tenant root and the hard isolation boundary. No query crosses districts except de-identified admin benchmarks above the privacy threshold.',
    props: [['district_id','string','Primary key'], ['name','string',''], ['state','string','US state'], ['timezone','string','IANA tz, drives class-period time buckets']] },
  { id: 'School', category: 'tenancy', x: -1500, y: -300,
    desc: 'A school within a district.',
    props: [['school_id','string','Primary key'], ['name','string',''], ['grade_band','string','e.g. K-5, 6-8, 9-12']] },
  { id: 'Course', category: 'tenancy', x: -1500, y: -180,
    desc: 'A course offered by a school.',
    props: [['course_id','string','Primary key'], ['title','string',''], ['subject','string','']] },
  { id: 'Section', category: 'tenancy', x: -1500, y: -60,
    desc: 'A class cohort (one period / one term). The unit that a textbook version is deployed to.',
    props: [['section_id','string','Primary key'], ['period','string',''], ['term','string',''], ['academic_year','string','']] },
  { id: 'Student', category: 'tenancy', x: -1180, y: 270,
    desc: 'The learner. Pseudonymous only — no PII is stored on this node; identity lives in the separate PII vault. Every summary vertex hangs off this node.',
    props: [['student_key','string','Pseudonymous key (not PII)'], ['grade_level','string','']] },
  { id: 'Instructor', category: 'tenancy', x: -1690, y: -60,
    desc: 'A teacher or co-teacher of a section.',
    props: [['instructor_key','string','Pseudonymous key'], ['role','enum','See enumerated values']],
    enums: [{prop:'role', values:['lead','co-teacher','substitute']}] },

  { id: 'Textbook', category: 'content', x: -1010, y: -430,
    desc: 'A textbook definition, independent of any district. Deployed to many districts via its versions.',
    props: [['textbook_id','string','Primary key'], ['title','string',''], ['repo_url','string','Source repository']] },
  // Placed between Section and the summary band: it is the target of DEPLOYS from
  // the left and of three IN_CONTEXT_OF edges from the right, so the middle is
  // where it earns its keep.
  { id: 'TextbookVersion', category: 'content', x: -880, y: -70,
    desc: 'A published version of a textbook. The unit of A/B testing, and the context summary vertices are attributed to via IN_CONTEXT_OF.',
    props: [['version_id','string','Primary key'], ['semver','string','e.g. 2.4.0'], ['git_sha','string','Exact build'], ['published_at','datetime','']] },
  { id: 'Chapter', category: 'content', x: -810, y: -430,
    desc: 'A chapter within a textbook.',
    props: [['chapter_id','string','Primary key'], ['order','integer','Sequence within textbook'], ['title','string','']] },
  { id: 'Page', category: 'content', x: -620, y: -180,
    desc: 'A page within a chapter. May embed MicroSims and quizzes and covers concepts.',
    props: [['page_id','string','Primary key'], ['path','string','URL path'], ['title','string',''], ['word_count','integer','']] },
  { id: 'MicroSim', category: 'content', x: -380, y: -180,
    desc: 'An interactive, embeddable simulation. Its build status is tracked with the scaffold/built/approved vocabulary.',
    props: [['microsim_id','string','Primary key'], ['type','string','p5.js, vis-network, Chart.js, ...'], ['title','string',''], ['status','enum','See enumerated values']],
    enums: [{prop:'status', values:['scaffold — spec only, red','built — implemented, awaiting review, orange','approved — author-tested, green']}] },
  { id: 'MicroSimVersion', category: 'content', x: -380, y: -330,
    desc: 'A published version of a MicroSim. The A/B unit for interactive content.',
    props: [['msv_id','string','Primary key'], ['semver','string',''], ['git_sha','string','']] },
  { id: 'Quiz', category: 'content', x: -620, y: -400,
    desc: 'A quiz embedded in a page; contains questions.',
    props: [['quiz_id','string','Primary key'], ['title','string','']] },
  { id: 'Question', category: 'content', x: -140, y: -180,
    desc: 'A single quiz question, tagged with a Bloom level and the concept it assesses.',
    props: [['question_id','string','Primary key'], ['bloom_level','enum','See enumerated values'], ['concept_ref','string','Concept it assesses']],
    enums: [{prop:'bloom_level', values:['Remember','Understand','Apply','Analyze','Evaluate','Create']}] },
  { id: 'Concept', category: 'content', x: 120, y: -330,
    desc: 'A node of the learning graph. Concepts depend on prerequisite concepts via DEPENDS_ON.',
    props: [['concept_id','string','Primary key'], ['label','string','Display name'], ['taxonomy_category','enum','Learning-graph category']],
    enums: [{prop:'taxonomy_category', values:['foundational','core','applied','advanced']}] },

  // ---- The event store: NOT a graph vertex (spec 5.6) ----
  { id: 'EventStore', label: 'Event Store', category: 'store', x: -250, y: 310,
    notAVertex: true,
    desc: 'The immutable, append-only log of every xAPI statement — the system of record. It is drawn here to show you where the statements are, but it is NOT part of the graph. Spec 5.6 (C-1) prohibits per-statement vertices: at 10,000 statements/sec, materializing one vertex per event would add ~144 million vertices per day and demand ~50,000 graph writes/sec. Instead a compression pipeline distills the log into the orange summary vertices, at roughly 100:1.',
    props: [['statement_id','UUID','Idempotency key'], ['verb_id','string','Resolves to the Verb vocabulary'], ['timestamp','datetime','Event time — drives every projection'], ['result_score','float','0.0–1.0, optional'], ['result_success','boolean','Optional'], ['duration_ms','integer','Optional'], ['raw','JSON','The full original statement, verbatim']] },

  { id: 'Verb', category: 'vocab', x: 90, y: 310,
    desc: 'The controlled vocabulary of xAPI verbs. Unknown verbs are accepted (schema-on-read) and surfaced for later canonicalization. Statements in the event store reference this vocabulary by verb_id; nothing in the graph edges to it.',
    props: [['verb_id','string','Primary key'], ['iri','string','xAPI verb IRI'], ['display','string','Human label']],
    enums: [{prop:'display (common verbs)', values:['experienced','interacted','answered','completed','progressed','voided']}] },

  { id: 'Experiment', category: 'experiment', x: -900, y: 430,
    desc: 'An A/B test definition: hypothesis, primary outcome metric, unit of randomization, and guardrails.',
    props: [['experiment_id','string','Primary key'], ['hypothesis','string','Free text'], ['status','enum','See enumerated values']],
    enums: [{prop:'status', values:['draft','running','paused','concluded']}] },
  { id: 'Variant', category: 'experiment', x: -1180, y: 430,
    desc: 'One arm of an experiment, bound to a specific TextbookVersion or MicroSimVersion. Assignment is sticky per student.',
    props: [['variant_id','string','Primary key'], ['arm_label','string','e.g. control, B'], ['allocation','float','Traffic share 0.0–1.0']] },

  // ---- Summary vertices (spec 4.3) — the only event-derived vertices ----
  { id: 'PageEngagement', category: 'summary', x: -620, y: 60,
    grain: 'one vertex per (Student, Page)',
    compresses: 'Every view, scroll, and dwell ping a student ever sends about one page.',
    ratio: '~40:1',
    desc: 'Compressed engagement summary for one student on one page. A student who visits a page 50 times over a term still has exactly one of these — the 50th visit updates it rather than adding to the graph.',
    props: [['student_key','string','Grain key part'], ['page_id','string','Grain key part'], ['dwell_ms_total','integer','Total time on page'], ['revisit_count','integer','Distinct days visited'], ['scroll_depth_max','float','0.0–1.0'], ['first_seen','datetime',''], ['last_seen','datetime','Drives the summarizer watermark'], ['statements_compressed','integer','How many statements this vertex represents']] },
  { id: 'MicroSimEngagement', category: 'summary', x: -380, y: 60,
    grain: 'one vertex per (Student, MicroSim)',
    compresses: 'Every interaction event a student ever sends about one MicroSim.',
    ratio: '~60:1',
    desc: 'Compressed interaction summary for one student on one MicroSim. Backs MicroSim utilization (R-207) and MicroSim impact (R-302).',
    props: [['student_key','string','Grain key part'], ['microsim_id','string','Grain key part'], ['interaction_count','integer',''], ['dwell_ms_total','integer',''], ['completed','boolean',''], ['last_seen','datetime',''], ['statements_compressed','integer','How many statements this vertex represents']] },
  { id: 'ConceptMastery', category: 'summary', x: 120, y: 60,
    grain: 'one vertex per (Student, Concept)',
    compresses: 'Every piece of evidence — quiz results, MicroSim interactions, dwell time — a student ever produces for one concept.',
    ratio: '~100:1',
    desc: 'The heart of the model: how likely one student is to have mastered one concept. mastery_score is a Bayesian Knowledge Tracing posterior, updated incrementally from ordered evidence. Reproducible at any time by replaying the statement log.',
    props: [['student_key','string','Grain key part'], ['concept_id','string','Grain key part'], ['mastery_score','float','0.0–1.0 — P(learned), from BKT'], ['evidence_count','integer',''], ['attempts','integer',''], ['successes','integer',''], ['first_seen','datetime',''], ['last_seen','datetime','Drives the summarizer watermark'], ['statements_compressed','integer','How many statements this vertex represents']] },
  { id: 'QuestionResponse', category: 'summary', x: -140, y: 60,
    grain: 'one vertex per (Student, Question)',
    compresses: 'Every attempt a student ever makes at one question.',
    ratio: '~3:1',
    desc: 'Compressed response summary. The lowest compression ratio in the model, because students rarely attempt one question more than a handful of times — a reminder that the ratio is a property of the grain, not a constant.',
    props: [['student_key','string','Grain key part'], ['question_id','string','Grain key part'], ['attempts','integer',''], ['successes','integer',''], ['mean_score','float','0.0–1.0'], ['first_success_attempt','integer','Which attempt first succeeded'], ['last_seen','datetime',''], ['statements_compressed','integer','How many statements this vertex represents']] },
  { id: 'LearningSession', category: 'summary', x: -860, y: 60,
    grain: 'one vertex per (Student, Session)',
    compresses: 'Every statement in one contiguous burst of learner activity (a gap of ~30 min ends a session).',
    ratio: '~60:1',
    desc: 'A learning episode. This is the one summary that preserves time structure rather than collapsing it, which is what makes the time-on-task timeline (R-103) possible without per-statement vertices.',
    props: [['session_id','string','Primary key'], ['student_key','string','Grain key part'], ['started_at','datetime',''], ['ended_at','datetime',''], ['duration_ms','integer',''], ['event_count','integer',''], ['objects_touched','integer','']] },
  { id: 'SectionRollup', category: 'summary', x: 380, y: 60,
    grain: 'one vertex per (Section, Concept)',
    compresses: 'Every student\'s evidence for one concept across a whole class — a rollup of rollups.',
    ratio: '~3,000:1',
    desc: 'The class aggregate that backs the mastery heatmap (R-201). The highest compression in the model: it summarizes an entire cohort, and it is built from ConceptMastery rather than directly from the log.',
    props: [['section_id','string','Grain key part'], ['concept_id','string','Grain key part'], ['mastery_distribution','histogram','Per-class distribution'], ['mean_score','float',''], ['student_count','integer','Also the privacy-threshold check (spec 12.3)'], ['last_computed','datetime','']] }
];

// ===========================================
// EDGE / RELATIONSHIP DEFINITIONS (spec 4.2)
// kind: 'rel' (typed relationship, solid)
//     | 'compress' (the 5.6 compression pipeline, dashed orange — NOT a graph edge)
//     | 'ref' (property reference, dashed grey — NOT a graph edge)
// ===========================================
const EDGES = [
  // ---- Tenancy ----
  { id: 'HAS_SCHOOL',    type: 'HAS_SCHOOL',    from: 'District', to: 'School',  kind:'rel',
    desc: 'A district has many schools.', props: [] },
  { id: 'OFFERS',        type: 'OFFERS',        from: 'School', to: 'Course',    kind:'rel',
    desc: 'A school offers many courses.', props: [] },
  { id: 'HAS_SECTION',   type: 'HAS_SECTION',   from: 'Course', to: 'Section',   kind:'rel',
    desc: 'A course has many sections (class cohorts).', props: [] },
  { id: 'ENROLLED_IN',   type: 'ENROLLED_IN',   from: 'Student', to: 'Section',  kind:'rel',
    desc: 'A student is enrolled in a section.',
    props: [['enrolled_at','datetime','When the enrollment began'], ['status','enum','active | withdrawn | completed']] },
  { id: 'TEACHES',       type: 'TEACHES',       from: 'Instructor', to: 'Section', kind:'rel',
    desc: 'An instructor teaches a section (supports co-teachers).', props: [] },
  { id: 'DEPLOYS',       type: 'DEPLOYS',       from: 'Section', to: 'TextbookVersion', kind:'rel',
    desc: 'A section is deployed a specific textbook version — the exact version a cohort actually sees.', props: [] },

  // ---- Content ----
  { id: 'VERSION_OF',    type: 'VERSION_OF',    from: 'TextbookVersion', to: 'Textbook', kind:'rel',
    desc: 'A version belongs to one textbook definition.', props: [] },
  { id: 'CONTAINS_TC',   type: 'CONTAINS',      from: 'Textbook', to: 'Chapter', kind:'rel',
    desc: 'Structural containment: a textbook contains ordered chapters.', props: [] },
  { id: 'CONTAINS_CP',   type: 'CONTAINS',      from: 'Chapter', to: 'Page',     kind:'rel',
    desc: 'Structural containment: a chapter contains pages.', props: [] },
  { id: 'CONTAINS_QQ',   type: 'CONTAINS',      from: 'Quiz', to: 'Question',    kind:'rel',
    desc: 'Structural containment: a quiz contains questions.', props: [] },
  { id: 'EMBEDS_PM',     type: 'EMBEDS',        from: 'Page', to: 'MicroSim',    kind:'rel',
    desc: 'A page embeds one or more MicroSims.', props: [] },
  { id: 'EMBEDS_PQ',     type: 'EMBEDS',        from: 'Page', to: 'Quiz',        kind:'rel',
    desc: 'A page embeds one or more quizzes.', props: [] },
  { id: 'HAS_VERSION',   type: 'HAS_VERSION',   from: 'MicroSim', to: 'MicroSimVersion', kind:'rel',
    desc: 'A MicroSim has many published versions (the A/B unit).', props: [] },
  { id: 'COVERS_PC',     type: 'COVERS',        from: 'Page', to: 'Concept',     kind:'rel',
    desc: 'Content-to-concept mapping: a page covers concepts.', props: [] },
  { id: 'COVERS_MC',     type: 'COVERS',        from: 'MicroSim', to: 'Concept', kind:'rel',
    desc: 'Content-to-concept mapping: a MicroSim covers concepts.', props: [] },
  { id: 'COVERS_QC',     type: 'COVERS',        from: 'Question', to: 'Concept', kind:'rel',
    desc: 'Content-to-concept mapping: a question covers (assesses) a concept.', props: [] },
  { id: 'DEPENDS_ON',    type: 'DEPENDS_ON',    from: 'Concept', to: 'Concept',  kind:'rel',
    desc: 'The learning-graph DAG edge: a concept depends on prerequisite concepts. Prerequisite-gap analysis (R-105) walks these upstream. Must stay acyclic.', props: [] },

  // ---- Experiments ----
  { id: 'ASSIGNED_TO',   type: 'ASSIGNED_TO',   from: 'Student', to: 'Variant',  kind:'rel',
    desc: 'Sticky experiment assignment: a student is assigned to one variant per experiment, and never moves for the life of the experiment.', props: [] },
  { id: 'HAS_VARIANT',   type: 'HAS_VARIANT',   from: 'Experiment', to: 'Variant', kind:'rel',
    desc: 'An experiment has two or more variants (arms).', props: [] },

  // ---- Student -> summary vertices (spec 4.2) ----
  { id: 'HAS_MASTERY',   type: 'HAS_MASTERY',   from: 'Student', to: 'ConceptMastery', kind:'rel',
    desc: 'One edge per concept the student has produced evidence for. This is the edge R-101 (Student Progress Overview) traverses.', props: [] },
  { id: 'OF_CONCEPT',    type: 'OF_CONCEPT',    from: 'ConceptMastery', to: 'Concept', kind:'rel',
    desc: 'Ties the mastery summary back into the learning graph, so a concept node can answer "how is my class doing on this?".', props: [] },
  { id: 'ENGAGED_WITH_PE', type: 'ENGAGED_WITH', from: 'Student', to: 'PageEngagement', kind:'rel',
    desc: 'A student\'s compressed engagement summary for a page.', props: [] },
  { id: 'ENGAGED_WITH_ME', type: 'ENGAGED_WITH', from: 'Student', to: 'MicroSimEngagement', kind:'rel',
    desc: 'A student\'s compressed engagement summary for a MicroSim.', props: [] },
  { id: 'RESPONDED_TO',  type: 'RESPONDED_TO',  from: 'Student', to: 'QuestionResponse', kind:'rel',
    desc: 'A student\'s compressed response summary for a question.', props: [] },
  { id: 'HAD_SESSION',   type: 'HAD_SESSION',   from: 'Student', to: 'LearningSession', kind:'rel',
    desc: 'A contiguous burst of learner activity. Sessions are what preserve time structure after compression.', props: [] },

  // ---- Summary vertices -> content (spec 4.2) ----
  { id: 'SUMMARIZES_PE', type: 'SUMMARIZES',    from: 'PageEngagement', to: 'Page', kind:'rel',
    desc: 'The content object this summary is about.', props: [] },
  { id: 'SUMMARIZES_ME', type: 'SUMMARIZES',    from: 'MicroSimEngagement', to: 'MicroSim', kind:'rel',
    desc: 'The content object this summary is about.', props: [] },
  { id: 'SUMMARIZES_QR', type: 'SUMMARIZES',    from: 'QuestionResponse', to: 'Question', kind:'rel',
    desc: 'The content object this summary is about.', props: [] },
  { id: 'TOUCHED_P',     type: 'TOUCHED',       from: 'LearningSession', to: 'Page', kind:'rel',
    desc: 'An object visited during the session.',
    props: [['event_count','integer','Statements about this object in this session'], ['dwell_ms','integer','Time on this object in this session']] },
  { id: 'TOUCHED_M',     type: 'TOUCHED',       from: 'LearningSession', to: 'MicroSim', kind:'rel',
    desc: 'An object visited during the session.',
    props: [['event_count','integer',''], ['dwell_ms','integer','']] },
  { id: 'TOUCHED_Q',     type: 'TOUCHED',       from: 'LearningSession', to: 'Question', kind:'rel',
    desc: 'An object visited during the session.',
    props: [['event_count','integer',''], ['dwell_ms','integer','']] },

  // ---- Version attribution, preserved through compression ----
  { id: 'IN_CONTEXT_OF_CM', type: 'IN_CONTEXT_OF', from: 'ConceptMastery', to: 'TextbookVersion', kind:'rel',
    desc: 'Version-level attribution: which textbook version this evidence came from. Compression preserves it, which is what keeps A/B analysis (spec 8) possible without per-statement vertices.', props: [] },
  { id: 'IN_CONTEXT_OF_PE', type: 'IN_CONTEXT_OF', from: 'PageEngagement', to: 'TextbookVersion', kind:'rel',
    desc: 'Version-level attribution for page engagement.', props: [] },
  { id: 'IN_CONTEXT_OF_ME', type: 'IN_CONTEXT_OF', from: 'MicroSimEngagement', to: 'TextbookVersion', kind:'rel',
    desc: 'Version-level attribution for MicroSim engagement.', props: [] },

  // ---- Class rollup ----
  { id: 'ROLLS_UP_TO',   type: 'ROLLS_UP_TO',   from: 'ConceptMastery', to: 'SectionRollup', kind:'rel',
    desc: 'Every student\'s ConceptMastery for a concept feeds the class aggregate — a rollup of rollups, and the highest compression in the model.', props: [] },
  { id: 'FOR_SECTION',   type: 'FOR_SECTION',   from: 'SectionRollup', to: 'Section', kind:'rel',
    desc: 'The cohort this rollup aggregates.', props: [] },

  // ---- The compression pipeline (spec 5.6) — NOT graph edges ----
  { id: 'CMP_PE', type: 'compresses ~40:1',    from: 'EventStore', to: 'PageEngagement', kind:'compress',
    desc: 'The compression pipeline (spec 5.6). A ClickHouse rollup aggregates every page statement at the (Student, Page) grain; a summarizer writes the absolute values onto one vertex every 60 seconds. This is not a graph edge — it is a data pipeline, drawn so you can see where the vertex comes from.', props: [] },
  { id: 'CMP_ME', type: 'compresses ~60:1',    from: 'EventStore', to: 'MicroSimEngagement', kind:'compress',
    desc: 'The compression pipeline (spec 5.6) at the (Student, MicroSim) grain. Not a graph edge.', props: [] },
  { id: 'CMP_CM', type: 'compresses ~100:1',   from: 'EventStore', to: 'ConceptMastery', kind:'compress',
    desc: 'The compression pipeline (spec 5.6) at the (Student, Concept) grain — roughly 100 evidence statements become one vertex. Not a graph edge.', props: [] },
  { id: 'CMP_QR', type: 'compresses ~3:1',     from: 'EventStore', to: 'QuestionResponse', kind:'compress',
    desc: 'The compression pipeline (spec 5.6) at the (Student, Question) grain. The ratio is low here because students rarely retry a question many times. Not a graph edge.', props: [] },
  { id: 'CMP_LS', type: 'compresses ~60:1',    from: 'EventStore', to: 'LearningSession', kind:'compress',
    desc: 'The compression pipeline (spec 5.6) at the (Student, Session) grain. Not a graph edge.', props: [] },

  // ---- Property reference ----
  { id: 'VERB_REF', type: 'verb_id (ref)', from: 'EventStore', to: 'Verb', kind:'ref',
    desc: "Reference: each statement's verb_id resolves to a node in the controlled Verb vocabulary. This is a property lookup, not a graph edge — which is why Verb has no relationships of its own.", props: [] }
];

// ===========================================
// BUILD LEGEND
// ===========================================
function buildLegend() {
  const el = document.getElementById('legend');
  let html = '';
  Object.keys(CATEGORY).forEach(k => {
    const c = CATEGORY[k];
    const dashed = (k === 'store') ? 'border-style:dashed;' : '';
    html += `<div class="legend-item"><div class="legend-swatch" style="background:${c.bg};border-color:${c.border};${dashed}"></div><span>${c.label}</span></div>`;
  });
  el.innerHTML = html;
}

// ===========================================
// NETWORK
// ===========================================
let network, nodesDS, edgesDS;
const nodeById = {};
const edgeById = {};

function initNetwork() {
  const visNodes = NODES.map(n => {
    nodeById[n.id] = n;
    const c = CATEGORY[n.category];
    const node = {
      id: n.id, label: n.label || n.id, x: n.x, y: n.y,
      color: { background: c.bg, border: c.border,
               highlight: { background: c.bg, border: c.badge } },
      font: { color: '#12263a', size: 15, face: 'Arial' }
    };
    // The event store is drawn as a dashed-border database to signal that it is
    // storage, not a vertex (spec 5.6 C-1).
    if (n.notAVertex) {
      node.shape = 'database';
      node.shapeProperties = { borderDashes: [6, 4] };
      node.borderWidth = 3;
      node.margin = 14;
      node.font = { color: '#c62828', size: 15, face: 'Arial' };
    }
    return node;
  });

  const visEdges = EDGES.map(e => {
    edgeById[e.id] = e;
    const isCompress = (e.kind === 'compress');
    const dashed = isCompress || (e.kind === 'ref');
    return {
      id: e.id, from: e.from, to: e.to,
      label: e.type,
      dashes: dashed,
      font: { size: 10, color: isCompress ? '#e65100' : (dashed ? '#78909c' : '#546e7a'),
              strokeWidth: 4, strokeColor: '#f0f8ff', align: 'middle' },
      color: { color: isCompress ? '#fb8c00' : (dashed ? '#b0bec5' : '#90a4ae'), highlight: '#f57c00' },
      width: isCompress ? 2 : (dashed ? 1 : 2),
      arrows: { to: { enabled: true, scaleFactor: 0.8 } },
      smooth: { type: 'dynamic' },
      selfReference: { size: 22, angle: Math.PI / 4 }
    };
  });

  nodesDS = new vis.DataSet(visNodes);
  edgesDS = new vis.DataSet(visEdges);

  const container = document.getElementById('network');
  const options = {
    layout: { improvedLayout: false },
    physics: { enabled: false },
    interaction: {
      selectConnectedEdges: true,
      hover: true,
      // This diagram is dense (25 nodes, 42 edges) and is used fullscreen, not
      // in an iframe — so scroll-to-zoom and drag-to-pan are enabled. They are
      // normally switched off in an embedded MicroSim only because scroll-zoom
      // inside an iframe hijacks the host page's scrolling.
      zoomView: true,
      dragView: true,
      dragNodes: true,           // let learners pull nodes apart to declutter
      navigationButtons: true,
      keyboard: { enabled: true, bindToWindow: true }
    },
    nodes: {
      shape: 'box', margin: 10, borderWidth: 2,
      shadow: { enabled: true, color: 'rgba(0,0,0,0.15)', size: 4, x: 2, y: 2 }
    },
    edges: { width: 2 }
  };

  network = new vis.Network(container, { nodes: nodesDS, edges: edgesDS }, options);

  // Auto-fit keeps the graph whole until the learner takes control of the view.
  //
  // Fitting only once on first draw leaves the graph clipped, because the
  // container is not yet at its final size when the first frame renders. But
  // refitting on every resize would yank the view back from under a learner who
  // has zoomed in to read a label — so once they zoom, pan, or drag, we stop.
  //
  // The three flags below are set only by genuine user gestures. network.fit()
  // itself fires 'zoom', so listening for that would disable auto-fit
  // immediately after the first fit; wheel, dragStart, and nav-button clicks
  // are never emitted by fit().
  let userOwnsView = false;
  const takeOver = function () { userOwnsView = true; };

  container.addEventListener('wheel', takeOver, { passive: true });
  network.on('dragStart', takeOver);
  container.addEventListener('click', function (ev) {
    if (ev.target.closest && ev.target.closest('.vis-navigation')) takeOver();
  });

  const refit = function () {
    if (!userOwnsView) network.fit({ animation: false });
  };

  network.once('afterDrawing', refit);
  if (window.ResizeObserver) {
    new ResizeObserver(refit).observe(container);
  } else {
    window.addEventListener('resize', refit);
  }

  network.on('click', function (params) {
    if (params.nodes.length > 0) {
      showNode(params.nodes[0]);
    } else if (params.edges.length > 0) {
      showEdge(params.edges[0]);
    } else {
      showPlaceholder();
    }
  });
}

// ===========================================
// INFO PANEL RENDERING
// ===========================================
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function propsList(props) {
  if (!props || props.length === 0) return '<p class="pnote">No stored properties.</p>';
  let html = '<ol class="props">';
  props.forEach(p => {
    const note = p[2] ? ` — <span class="pnote">${esc(p[2])}</span>` : '';
    html += `<li><code>${esc(p[0])}</code> <span class="ptype">${esc(p[1])}</span>${note}</li>`;
  });
  html += '</ol>';
  return html;
}

function enumBlocks(enums) {
  if (!enums || enums.length === 0) return '';
  let html = '';
  enums.forEach(en => {
    html += `<div class="enum"><strong>${esc(en.prop)}</strong> — allowed values:<ol>`;
    en.values.forEach(v => { html += `<li>${esc(v)}</li>`; });
    html += '</ol></div>';
  });
  return html;
}

function showNode(id) {
  const n = nodeById[id];
  if (!n) return;
  const c = CATEGORY[n.category];
  const panel = document.getElementById('panel');

  const kindLabel = n.notAVertex ? 'Storage — not a graph vertex'
                  : (n.grain ? 'Summary vertex' : 'Node label');
  let html = `<div class="kind">${kindLabel}</div>`;
  html += `<h2>${esc(n.id)}</h2>`;
  html += `<span class="badge" style="background:${c.badge}">${c.label}</span>`;

  if (n.notAVertex) {
    html += `<div class="warn"><strong>This is not in the graph.</strong> Spec &sect;5.6 (C-1) prohibits per-statement vertices. The statements live in the event store; the graph gets only the compressed orange summaries. Follow an orange arrow to see what each one compresses.</div>`;
  }

  if (n.grain) {
    html += `<div class="compress">` +
            `<span class="ratio">${esc(n.ratio)}</span> <strong>compression</strong><br>` +
            `<strong>Grain:</strong> ${esc(n.grain)}<br>` +
            `<strong>Compresses:</strong> ${esc(n.compresses)}` +
            `</div>`;
  }

  html += `<p class="desc">${esc(n.desc)}</p>`;
  html += `<h3>Properties</h3>${propsList(n.props)}`;

  const enumsHtml = enumBlocks(n.enums);
  if (enumsHtml) { html += `<h3>Enumerated metadata</h3>${enumsHtml}`; }

  // list its relationships
  const outRel = EDGES.filter(e => e.from === id);
  const inRel = EDGES.filter(e => e.to === id);
  html += `<h3>Relationships</h3><div class="endpoints">`;
  outRel.forEach(e => { html += `${esc(e.type)} <span class="arrow">&rarr;</span> ${esc(e.to)}<br>`; });
  inRel.forEach(e => { html += `${esc(e.from)} <span class="arrow">&rarr;</span> ${esc(e.type)} (in)<br>`; });
  if (outRel.length === 0 && inRel.length === 0) html += 'None';
  html += `</div>`;

  panel.innerHTML = html;
  panel.scrollTop = 0;
}

function showEdge(id) {
  const e = edgeById[id];
  if (!e) return;
  const panel = document.getElementById('panel');
  const kindLabel = e.kind === 'rel'      ? 'Relationship'
                  : e.kind === 'compress' ? 'Compression pipeline — not a graph edge'
                  : 'Property reference — not a graph edge';
  const badgeColor = e.kind === 'compress' ? '#f57c00' : (e.kind === 'ref' ? '#607d8b' : '#546e7a');
  const badgeText  = e.kind === 'rel' ? 'Edge' : (e.kind === 'compress' ? 'Pipeline' : 'Reference');

  let html = `<div class="kind">${kindLabel}</div>`;
  html += `<h2>${esc(e.type)}</h2>`;
  html += `<span class="badge" style="background:${badgeColor}">${badgeText}</span>`;
  html += `<div class="endpoints"><strong>${esc(e.from)}</strong> <span class="arrow">&rarr;</span> <strong>${esc(e.to)}</strong></div>`;
  html += `<p class="desc">${esc(e.desc)}</p>`;
  html += `<h3>Edge properties</h3>${propsList(e.props)}`;
  panel.innerHTML = html;
  panel.scrollTop = 0;
}

function showPlaceholder() {
  const panel = document.getElementById('panel');
  panel.innerHTML =
    `<div class="kind">Inspector</div>` +
    `<h2>LRS Data Model</h2>` +
    `<p class="placeholder">This graph shows the Learning Record Store data model from the specification (&sect;4).<br><br>` +
    `<strong>There is no Statement vertex.</strong> At 10,000 statements/sec, one vertex per event would add ~144 million vertices a day. Instead the statements stay in the <span style="color:#c62828">event store</span> (dashed, red — not part of the graph), and a compression pipeline distills them into the <span style="color:#f57c00">orange summary vertices</span> at roughly 100:1.<br><br>` +
    `<strong>Click a summary vertex</strong> to see its grain, its compression ratio, and the <code>statements_compressed</code> count that records how much evidence it stands for.<br><br>` +
    `<strong>Click any node</strong> for its stored properties and enumerated metadata (e.g. MicroSim <code>status</code>, Question <code>bloom_level</code>).<br><br>` +
    `<strong>Click a relationship</strong> to see what it connects and any edge properties.<br><br>` +
    `Solid grey arrows are graph relationships. Dashed orange arrows are the compression pipeline; dashed grey is a property reference — neither is stored in the graph.<br><br>` +
    `<strong>Scroll to zoom</strong> and drag the background to pan — this diagram is dense, so zoom in to read the relationship labels. Drag a node to pull it out of the cluster, or use the navigation buttons (lower left).</p>`;
}

// ===========================================
// INIT
// ===========================================
document.addEventListener('DOMContentLoaded', function () {
  buildLegend();
  initNetwork();
  showPlaceholder();
});
