# TODO

## Open specification work

- **Retrofit specification for existing intelligent textbooks.** Write a new
  specification covering how *existing* intelligent textbooks — which already
  contain interactive MicroSims (p5.js simulations, etc.) and interactive
  infographics — get retrofitted to emit xAPI statements and integrate with
  this LRS. Neither [`docs/specs/lrs-spec-v1.md`](docs/specs/lrs-spec-v1.md)
  nor [`docs/specs/lrs-design-v1.md`](docs/specs/lrs-design-v1.md) currently
  addresses the *producer* side of the system — both are scoped to the LRS
  backend itself (see `lrs-design-v1.md` §1.3, "What This Document Decides,
  and What It Defers"). Candidate topics for the new spec:
  - A contract for MicroSim/infographic authors: which xAPI verbs and
    activity types to use, and required vs. optional `result` fields.
  - Client-side emission strategy guidance — when to send an event
    immediately, batch, or throttle by a threshold/deadband (see the
    Architecture Trade-off discussion in
    [`docs/sims/sine-wave/index.md`](docs/sims/sine-wave/index.md) for a
    worked example: send-every-interaction vs. summary-on-blur vs.
    threshold-triggered sending).
  - How a continuous, exploratory interaction (a slider, a drag target) with
    no single "correct" per-event value supplies evidence to
    `ConceptMastery`'s BKT update — this is currently an explicit open
    question in `lrs-design-v1.md` §13, item 7.
  - A migration/rollout plan for MicroSims and infographics that predate the
    LRS and were never instrumented, including versioning so that changing a
    MicroSim's scoring logic doesn't silently reinterpret historical
    evidence.
  - Where the "two-codebases problem" gets resolved: whether scoring logic is
    duplicated between the client and the LRS's compression pipeline, shared
    via a declarative per-MicroSim descriptor, or deliberately kept as two
    independent implementations (fast local feedback vs. authoritative
    server truth).
