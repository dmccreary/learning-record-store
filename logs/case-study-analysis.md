# Production LRS case-study analysis

**Date:** 2026-07-18  
**Status:** Complete  
**Detailed report:** [`docs/case-studies/summary.md`](../docs/case-studies/summary.md)

## Prompt

Investigate the observation that the US Department of Defense has formal Learning Record Store
deployments for learning and task performance, such as technical maintenance training, while
public examples from colleges and universities appear scarce. Find genuine case studies of LRS
systems used in production environments around the world.

## Research approach

The investigation searched for named institutions and services that documented all or most of the
following:

- use by real learners in normal teaching or support operations;
- an xAPI LRS or a clearly identified learning-record warehouse;
- a described data source and downstream use;
- evidence of live operation, maintained documentation, results, or routine support; and
- enough scope information to distinguish a course deployment from institution-wide adoption.

Institutional sources and peer-reviewed publications were preferred. Vendor case studies were
included only when they identified the institution, use case, data flow, and outcome. Proposed
architectures, demonstrations, and papers that merely explained xAPI were excluded from the main
production list.

## Main result

The initial observation was validated with an important qualification: higher-education LRS use is
real, but most deployments are narrower than the DoD model.

The strongest publicly documented production examples were:

- **UW-Madison:** centrally supported Learning Locker service for xAPI-enabled Storyline, H5P,
  Pressbooks, WordPress/GrassBlade, and Canvas content; documentation maintained through 2025.
- **University of San Diego:** LRS analytics in several management and sustainability courses and
  a MOOC, used for engagement, leaderboards, support, and personalized feedback.
- **Fielding Graduate University:** learner records and automated nudges in a credit-bearing online
  master's program.
- **Jisc, University of Greenwich, and University of South Wales:** multi-institution learning
  analytics infrastructure with an xAPI/Learning Records Warehouse lineage, student and staff
  dashboards, interventions, attendance, and compliance workflows.
- **University of Electro-Communications:** UEC-LAP entered production in 2024, combining five
  years of data from three LMSs and the academic system in an LRS.
- **University of Tokyo:** xAPI/LRS infrastructure operating with the production LMS since 2019,
  initially emphasizing comprehensive event accumulation for later analytics.
- **Kyoto University LEAF:** xAPI records of fine-grained BookRoll reading and annotation behavior,
  with analysis spanning 243 university courses and operational use in other educational settings.
- **Oklahoma State University Libraries:** GrassBlade LRS used for library e-learning, tutorials,
  and open educational resources, disclosed in the institutional student-data inventory.

Credible but more limited deployments included the University of Twente, Notre Dame, the
Australian Connected Learning Analytics Toolkit, the European Data Science Academy, and the 2026
ISILA deployment at the University of Leon. These were classified as bounded rollouts, large
pilots, or project deployments instead of mature institution-wide production.

Taiwan's national **eduLRS** was retained as adjacent school-sector evidence of a public education
system operating a standardized central learning-record service.

## Key distinctions preserved in the report

### Production is not the same as university-wide adoption

A live LRS supporting a graduate program or course family is a production deployment. It is not
evidence that every learner and learning system at the university uses the LRS. Several vendor
case studies blur this distinction, so the report labels scope explicitly.

### An LRW is not necessarily a conformant xAPI LRS

Jisc and Notre Dame describe Learning Records Warehouses that accept xAPI events but also combine
Caliper and ordinary institutional data. These systems occupy the LRS's architectural position but
may not implement every endpoint required by the xAPI conformance suite. They were included with
that caveat because they are important production evidence for the broader learning-record-store
pattern.

### Current operation cannot be inferred from an old successful pilot

Notre Dame's 2,000-student deployment is strong evidence of a serious implementation, but its
principal sources date from 2017-2018. It was not represented as current university-wide production
without newer operational documentation.

### Collection is not the same as effective analytics

The University of Tokyo clearly implemented production xAPI/LRS infrastructure, but its case study
described several analytic and personalization uses as future goals. The report distinguishes a
production event store from demonstrated use of derived insight.

## Cross-case findings

1. University deployments are usually tied to courses, programs, content pipelines, libraries, or
   student-engagement services rather than lifelong competency records.
2. The strongest systems connect records to an action: dashboards, personalized feedback,
   instructor intervention, attendance, course redesign, automated nudges, or compliance.
3. Higher education often favors a hybrid warehouse that combines events with grades, enrolments,
   demographics, and attendance instead of a pure xAPI-only store.
4. Semantic consistency is harder than event transport. Shared concept identifiers, verbs,
   activity definitions, contexts, and evidence rules are necessary for meaningful aggregation.
5. Identity resolution, roster history, privacy, access controls, retention, and transparency are
   central production requirements.
6. Public evidence has competing biases: institutions disclose little about sensitive back-end
   systems, while vendors can overstate the breadth of a bounded success.

## Relevance to this project

The case studies support the project's decision to connect learning evidence to a stable graph of
concepts rather than treat the LRS as an undifferentiated statement archive. They also reinforce
the need to:

- keep raw statements replayable;
- label compressed mastery and graph summaries as derived projections;
- use a producer contract across textbooks, quizzes, and MicroSims;
- namespace concepts and resolve learner and roster identities explicitly;
- build teacher, learner, author, and administrative consumers of the evidence; and
- treat governance and honest deployment-scope reporting as part of the system design.

## Limitations

This was a review of public web evidence through July 18, 2026, not a survey of institutions or
vendors. It cannot establish how many private deployments exist. Some strong cases rely on vendor
accounts, non-English sources, or older architecture publications. The detailed report identifies
those limitations at the point of each claim instead of treating all case studies as equally
strong evidence.
