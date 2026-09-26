// lrs-config.js — this textbook's identity in every xAPI statement it emits.
//
// ONE PER TEXTBOOK. The runtime (lrs-xapi.js, lrs-lite-sim.js, lrs-sim.js) is identical in
// every book; only this file differs. book-installer generates it from mkdocs.yml; load it
// BEFORE lrs-xapi.js, in each sim's main.html and in mkdocs.yml `extra_javascript`.
window.LRS_CONFIG = {
  // mkdocs.yml `site_url`, with the trailing slash. Every activity IRI starts with it
  // (contract §1), so a wrong value here mislabels every statement the book emits.
  siteUrl: 'https://dmccreary.github.io/learning-record-store/',
  // The textbook version in grouping[0] (contract §4): {siteUrl}textbook/{textbookId}/{version}
  textbookId: 'lrs',
  version: 'v1.0.0',
  // Learning-graph ConceptIDs are 1..N per book, so they collide across books. The seeder
  // (src/lrs/catalog.py) namespaces them as {repo-slug}-{ConceptID}; LRS.conceptId() does the same.
  conceptPrefix: 'learning-record-store',
  // The xAPI policy for EVERY MicroSim in this book. A sim's metadata.json `xapi` block
  // overrides any of these keys for that one sim (lrs-lite-sim.js, loadPolicy).
  //   compact   true  -> LRS-Lite: one summary statement per session
  //             false -> the full per-interaction stream (full LRS)
  //   teaching  true  -> show the statement log, Full/Compact switch, Simulate Done, and
  //             View Formatted JSON. Only for sims that TEACH xAPI; production sims stay silent.
  xapi: { compact: true, teaching: false },
  // Chapter quizzes (quiz-xapi.js). A quiz page has no metadata.json, so its policy lives
  // here. Every quiz statement is an answer, and answers pass through in both modes, so
  // `compact` changes nothing on a quiz; only `teaching` matters:
  //   teaching  true -> show the statement log and View Formatted JSON under each quiz.
  // This book teaches xAPI, so its quizzes show what they emit.
  quizzes: { teaching: true }
};
