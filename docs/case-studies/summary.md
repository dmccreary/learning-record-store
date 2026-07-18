# Learning Record Stores in Production Education Environments

## Executive summary

Learning Record Stores (LRSs) are used in real production education environments, including
colleges and universities in the United States, United Kingdom, the Netherlands, Japan, and
Australia. Public evidence of these deployments is nevertheless much thinner than evidence from
the United States Department of Defense and corporate training.

The evidence supports three conclusions:

1. **Higher-education LRS adoption is real but usually bounded.** Most documented deployments
   serve a collection of courses, an online degree, a library, a particular content pipeline, or a
   student-engagement service. Few are comprehensive, lifelong, institution-wide records of
   concept or competency mastery.
2. **The LRS creates value as part of a feedback system, not as an isolated repository.** The
   strongest deployments connect event collection to dashboards, instructor intervention,
   personalized messages, course improvement, or attendance and regulatory workflows.
3. **Many institutions use an LRS-like warehouse without insisting on a strict xAPI-only
   architecture.** Production learning analytics commonly combines xAPI or Caliper events with
   student-information-system records, assessment results, attendance, and batch data.

The closest publicly documented examples to a broad institutional learning-data infrastructure
are the United Kingdom's Jisc learning analytics service, Kyoto University's LEAF ecosystem, the
University of Electro-Communications' UEC-LAP, and the University of Tokyo's xAPI/LRS-enabled LMS.
Even these do not demonstrate the full DoD-style vision of a persistent record organized around
concepts, competencies, simulations, assessments, and observed real-world performance.

## Research question and method

This investigation began with the observation that the US DoD has several projects using formal
LRS infrastructure to record learning and performance in domains such as equipment maintenance,
while colleges and universities appear to have few comparable production systems.

The research looked for named deployments in which:

- learners generated records during normal teaching, training, or student-support operations;
- the records were stored in a named LRS or learning-record warehouse;
- the source described an operational use of the records, not merely a proposed architecture;
- the deployment could be connected to a real institution, course, program, or service; and
- public documentation provided enough detail to distinguish implementation from aspiration.

Institutional documentation and peer-reviewed publications were preferred. Vendor case studies
were retained when they named the institution, learning context, data flow, and operational use.
Vendor claims are identified as such because they are useful implementation evidence but are not
independent evaluations.

The following labels are used throughout the report:

- **Institutional production:** supported infrastructure serving multiple courses, systems, or
  university functions.
- **Bounded production:** a live, recurring deployment within a program, course family, content
  pipeline, or organizational unit.
- **Large pilot or research deployment:** real learners and operational data, but limited evidence
  of durable service ownership or continued production use.
- **Strict xAPI LRS:** a store intended to implement the xAPI LRS interface.
- **Learning-record warehouse:** a broader repository that may accept xAPI, Caliper, student
  records, and non-event data. It performs the central architectural role of an LRS but may not
  implement every xAPI LRS endpoint.

This is a review of publicly available evidence, not an exhaustive census. Evidence was reviewed
through July 18, 2026.

## Documented production deployments

### University of Wisconsin-Madison, United States

**Classification:** institutional service with content-by-content adoption  
**Technology:** Learning Locker, xAPI, Storyline, H5P, Pressbooks, WordPress/GrassBlade, Canvas

UW-Madison provides one of the clearest publicly documented operational LRS services in US higher
education. Its Learn@UW documentation explains how school, college, and departmental
instructional technologists obtain Learning Locker accounts and how instructors request activity
reports for xAPI-enabled Storyline modules. The captured records include module duration and
fine-grained learner interaction data.

Related documentation describes the wider authoring pipeline: Storyline or H5P content can be
delivered through WordPress and Canvas while statements are sent to Learning Locker. Staff can
export the resulting records and receive assistance interpreting or cleaning them.

The service has been documented since 2017, and the principal operating guide was updated in
August 2025. That combination of central account provisioning, help-desk support, instructor
reporting procedures, and maintained documentation is strong evidence of production operation.
It does not show that every Canvas course emits xAPI; adoption occurs where instructors use the
supported content pipeline.

Sources:

- [Requesting student activity data from Learning Locker](https://kb.wisc.edu/learning-analytics/76536)
- [Interpreting a standard Learning Locker export](https://kb.wisc.edu/luwmad/page.php?id=79906)

### University of San Diego, United States

**Classification:** bounded production across several courses  
**Technology:** Learning Pool Platform and Learning Pool LRS

The University of San Diego uses an LRS as part of a social and online learning environment.
Its first reported use was a Sustainable Supply Chain Management course whose faculty needed to
curate web pages, news articles, videos, and other learning objects because no suitable textbook
existed. Students view, comment on, share, and contribute learning objects.

The LRS gives lecturers engagement analytics, identifies students who may need support, and
supports a points system and leaderboard visible to learners. Faculty report using the analytics
to provide personalized feedback. The platform subsequently expanded to Service Management,
Operations Management, and Sustainability courses, and it supported a MOOC reported to have an
approximately 50 percent completion rate.

The case study says the university's relationship with earlier versions of the platform extends
back more than twelve years. This is credible evidence of durable course-level production, though
not evidence that the LRS covers all 8,000 students or the entire university. The source is the
platform vendor and should be read as an implementation account rather than an independent impact
evaluation.

Source:

- [University of San Diego case study](https://learningpool.com/case-studies/university-of-san-diego)

### Fielding Graduate University, United States

**Classification:** bounded production in a credit-bearing graduate program  
**Technology:** Learning Pool Platform, Learning Pool Authoring, and Learning Pool LRS

Fielding Graduate University uses a digital learning ecosystem for its online MA in Organization
Development and Leadership. Learners work through six masterclasses, interact with subject-matter
experts and peers, and submit assignments for formal assessment.

Activity from the learning platform is sent to an LRS. Facilitators use a Social Intelligence
Dashboard to identify deeply engaged learners and learners who may need help. LRS data can also
trigger automated, personalized communications and nudges intended to bring learners back into
the community.

Because the deployment supports a live, credit-bearing graduate program and connects activity
records to routine facilitator workflows, it is more than an experimental dashboard. Its scope is
the program rather than the whole institution. As with the San Diego example, the public source is
the vendor.

Source:

- [Fielding Graduate University case study](https://learningpool.com/case-studies/fielding-graduate-university)

### Jisc learning analytics and participating universities, United Kingdom

**Classification:** multi-institution production service  
**Technology:** originally an xAPI-enabled cloud Learning Records Warehouse; current Jisc LA2

Jisc began co-designing a higher-education learning analytics service in 2015 with pathfinder
institutions including the University of South Wales, the University of Greenwich, and the
University of Gloucestershire. The Data Explorer staff dashboard and Study Goal student
application went live in 2018.

The documented architecture separated relatively stable student and course records from frequent
learning events. Virtual learning environment, library, attendance, and similar activities could
be represented using xAPI and loaded into a cloud Learning Records Warehouse maintained by Jisc
for each institution. The warehouse combined these events with grades, enrolment, and demographic
data for analytics.

University of Greenwich documentation confirms that the service was used to calculate individual
engagement measures, provide students with Study Goal, give tutors Data Explorer views, and support
interventions. Its privacy documentation explains that identifiers were encrypted before records
were transferred to the central warehouse. Current University of South Wales documentation shows
the successor Jisc LA2 platform in normal operation for attendance and wider engagement monitoring.

Jisc currently markets the service for retention, wellbeing, attendance, case management, and
regulatory compliance. Its present public product pages no longer make the underlying xAPI
contract prominent. The evidence therefore establishes a production service with an xAPI/LRS
lineage, but it does not prove that every part of the 2026 backend remains a conformant xAPI LRS.

Sources:

- [Jisc Learning Records Warehouse and xAPI architecture](https://analytics.jiscinvolve.org/wp/2016/12/21/exploring-issues-around-data-for-jiscs-learning-analytics-architecture/)
- [Jisc platform history and pathfinder institutions](https://www.jisc.ac.uk/innovation/projects/enhancing-the-tools-for-uk-universities-to-improve-student-engagement)
- [Current Jisc learning analytics service](https://www.jisc.ac.uk/learning-analytics)
- [University of Greenwich student guide](https://www.gre.ac.uk/articles/planning-and-statistics/student-guide-to-learning-analytics)
- [University of Greenwich implementation overview](https://www.gre.ac.uk/articles/planning-and-statistics/learning-analytics-at-the-university-of-greenwich)
- [University of South Wales LA2 attendance service](https://www.southwales.ac.uk/services/it-services/attendance-monitoring/)

### University of Electro-Communications, Japan

**Classification:** institutional production with staged faculty adoption  
**Technology:** UEC-LAP, LRS, WebClass, Moodle, Google Classroom, student information system

The University of Electro-Communications operates UEC-LAP, a Learning Analytics Platform that
combines learning history with academic results. The institution uses three LMSs: WebClass,
Moodle, and Google Classroom. UEC-LAP brings records from these systems together with grade data
from the academic information system.

Students can see trends in quiz, report, and other scores by class session and compare their
position with class distributions. Teachers can inspect quiz and report performance, time spent
viewing PDF learning materials, and relationships between behavior and grades. This produces
real-time feedback without requiring instructors to assemble the records manually.

The university loaded five years of historical records into the LRS and began actual production
operation in spring 2024. The case study explicitly says that not every instructor was using the
platform yet. It is consequently a strong example of institution-level infrastructure undergoing
staged adoption, rather than a claim of universal use.

Source:

- [UEC-LAP production case study, Japanese](https://www.mitani-edu.jp/solution/campus/campusla/case/186/)

### University of Tokyo, Japan

**Classification:** institutional production infrastructure; analytics use still developing  
**Technology:** in Campus LMS, xAPI, LRS, LTI, cloud hosting

The University of Tokyo moved its institutionally developed learning environment to a vendor LMS
and cloud infrastructure, with the refreshed system entering course operation in April 2019. The
requirements included stable LMS delivery, integration with the academic system, accumulation of
data for learning analytics, and LTI-based integration with external tools.

The university implemented an xAPI/LRS environment to begin storing device interactions, test
results, report submissions, attendance, and other observable learning activity. The stated goals
included identifying students who need help, evaluating learning-material quality, improving
teaching, and eventually allowing students to review their own learning trajectories.

This is clear evidence that xAPI and an LRS were installed as part of production LMS
infrastructure. The source is also candid that collection preceded mature analytic use: several
personalization and instructional-improvement capabilities remained future objectives. It should
therefore be treated as a production event infrastructure, not proof of a completed university-wide
concept-mastery system.

Source:

- [University of Tokyo LMS and LRS case study, Japanese](https://www.canon-its.co.jp/solution/industry/education/case/education-26)

### Kyoto University LEAF and BookRoll, Japan

**Classification:** institutional research infrastructure used in routine teaching  
**Technology:** LEAF, Moodle, BookRoll, xAPI LRS, LogPalette

Kyoto University's Learning and Evidence Analytics Framework, or LEAF, integrates an LMS, the
BookRoll digital textbook reader, an LRS, and analytics tools such as LogPalette. BookRoll captures
fine-grained reading activity, including page navigation, annotations, highlighting, and notes.
The interactions are stored as xAPI records and converted into feedback for learners and teachers.

LEAF is research-originated, but it has moved beyond a laboratory demonstration. University
research analyzed BookRoll behavior across 243 courses during emergency remote teaching. Other
published studies describe daily classroom use in secondary schools. Kyoto's current LEAF site
provides operational materials, implementation guidance, and case studies, and the framework has
supported international collaboration with institutions in Taiwan and India.

LEAF is especially relevant to an intelligent-textbook LRS because it records activity below the
course-completion level. Its evidence can represent how learners navigate and annotate particular
materials, and its dashboards return that evidence to teaching and learning workflows. It still
does not by itself establish durable mastery of a shared cross-course concept graph.

Sources:

- [Kyoto University LEAF overview](https://www.let.media.kyoto-u.ac.jp/en/leaf/)
- [LEAF institutional and international implementation paper](https://www.jstage.jst.go.jp/article/itel/2/1/2_2.1.Inv.p001/_article)
- [Study describing BookRoll records across 243 courses](https://repository.kulib.kyoto-u.ac.jp/dspace/bitstream/2433/279307/1/s41039-022-00184-0.pdf)
- [Current LEAF implementation site, Japanese](https://eds.let.media.kyoto-u.ac.jp/leaf/)

### Oklahoma State University Libraries, United States

**Classification:** bounded production in an institutional library  
**Technology:** GrassBlade xAPI Companion and Learning Record Store, Pressbooks

Oklahoma State University publicly identifies GrassBlade's xAPI Companion and Learning Record
Store among the systems used to collect student data associated with library e-learning,
tutorials, and open educational resources. The university's data inventory explains what is
collected, why it is collected, where it may be shared, and how vendor retention practices affect
the records.

This is a comparatively small deployment, but it is noteworthy because the evidence comes from an
institutional privacy and data-governance page rather than a promotional case study. It shows an
LRS functioning as ordinary university service infrastructure in a defined domain.

Source:

- [Oklahoma State University Library Data inventory](https://ira.okstate.edu/data/student/library)

## Bounded rollouts and large pilots

The following cases involved real learners and real records, but the available evidence does not
justify describing them as mature university-wide production services.

### University of Twente, Netherlands

The University of Twente instrumented Canvas, H5P, and dominKnow learning content with xAPI and
sent the events to a Veracity LRS. Learner and teacher dashboards were built in the LRS and
embedded in Canvas through LTI. The reported outcome was an early-dropout detection capability
that gave teachers another intervention tool.

The case is operational rather than hypothetical, but the source says full deployment across the
university's educational environment was a subsequent goal. It is best classified as a successful
bounded rollout. The source is the LRS vendor.

Source:

- [University of Twente LRS case study](https://lrs.io/home/case-study-university-of-twente/)

### University of Notre Dame, United States

Notre Dame implemented the Apereo Open Learning Record Warehouse to obtain a combined view of
student interactions. The warehouse accepted both xAPI and Caliper data, including events from
Sakai and other learning tools. An early deployment covered a required first-year course with
approximately 2,000 students and delivered live interaction data for course and performance
analysis.

This is substantial production-scale use, but the strongest public documentation dates from 2017
and 2018. Without recent operating documentation, it is safest to describe it as a large pilot and
important architecture case rather than assume the same service remains in university-wide
production in 2026.

Sources:

- [Notre Dame's learning-record architecture](https://er.educause.edu/blogs/2018/1/ngdle-learning-analytics-gaining-a-360-degree-view-of-learning)
- [Notre Dame 2,000-student deployment](https://events.educause.edu/annual-conference/2017/agenda/open-learning-analytics-in-the-cloud)

### Connected Learning Analytics Toolkit, Australia

Researchers associated with Queensland University of Technology, Monash University, and the
University of Technology Sydney developed the Connected Learning Analytics Toolkit. It collects
learning-related activity from systems such as GitHub, Trello, Slack, WordPress, and social media,
represents the records in xAPI, and stores them in an LRS for learner-facing analysis.

The toolkit was used with authentic learning activities and produced influential lessons about
xAPI recipes, vocabularies, privacy, and learner control. Public sources nevertheless describe an
Australian-government-funded research project rather than a continuing enterprise university
service.

Sources:

- [Connected Learning Analytics Toolkit](https://cic.uts.edu.au/tools/connected-learning-analytics-toolkit/)
- [Lessons learned from the CLA xAPI implementation](https://research.monash.edu/en/publications/recipe-for-success-lessons-learnt-from-using-xapi-within-the-conn/)

### European Data Science Academy, European Union

The European Data Science Academy represented learner activity using xAPI and stored it in a
Learning Locker instance. The records supported visualization and process-mining analysis of a
TU Eindhoven MOOC delivered through Coursera. This was a real cross-institutional learning
platform, but it was organized as a grant-funded project rather than permanent infrastructure at
one university.

Sources:

- [EDSA learning analytics case study](https://edsa-project.eu/resources/learning-analytics/)
- [EDSA technical report and Learning Locker architecture](https://www.edsa-project.eu/edsa-data/uploads/2015/02/EDSA-2016-P-D33-FINAL.pdf)

### ISILA and the University of Leon, Spain

The ISILA project collected Moodle activity, assignments, Discord interaction, and weekly
self-regulated-learning surveys. A project tool converted tabular sources into xAPI statements,
which were uploaded to the University of Leon LRS for central storage, dashboards, and course
analysis.

The 2026 report establishes current operational use in a real course, but it remains a
project-based intervention rather than a mature institutional service.

Source:

- [ISILA intervention report](https://blogs.uef.fi/isila/wp-content/uploads/sites/197/2026/03/4.3.-GlobalReport.docx-1.pdf)

## Adjacent national and school-sector evidence

Higher education is not the only useful comparison. Taiwan's Ministry of Education documents a
national Education Cloud LRS called **eduLRS**. It collects standardized learning histories from
cloud services for analysis at the individual, school, municipality, and ministry levels. Its
published xAPI specification shows that large public education systems can establish a shared
event contract and central LRS, although the service is oriented primarily toward the national
school sector rather than universities.

Source:

- [Taiwan Ministry of Education learning-data xAPI specification, Chinese](https://pads.moe.edu.tw/download_file.php?file=%E5%AD%B8%E7%BF%92%E8%B3%87%E6%96%99xAPI%E8%A6%8F%E6%A0%BC_v1.5.pdf&old=upload)

## Why higher-education production evidence is scarce

### Universities are organized around courses and systems of record

Military and workforce training can define an operational chain from instruction to simulation,
qualification, observed task performance, and recertification. A stable LRS event model is
valuable because evidence arrives from several environments but refers to the same job tasks.

Universities are generally organized around courses, terms, credits, assignments, grades, and
degrees. The LMS and student information system already record the events needed for many routine
decisions. An LRS must provide additional value beyond those systems to justify integration and
governance costs.

### Event interoperability does not guarantee semantic interoperability

xAPI standardizes how statements are transferred and stored, but institutions still have to agree
on the meaning of actors, verbs, activities, contexts, and extensions. A record that a learner
"viewed" a resource is straightforward. Consistently describing concept mastery, prerequisite
knowledge, collaboration, instructor feedback, laboratory performance, and transfer across
departments is much harder.

The Connected Learning Analytics work found that early vocabulary and recipe decisions could
either enable or constrain every later analysis. This is especially relevant to an LRS for
intelligent textbooks: a consistent concept identifier and evidence model matter more than merely
producing syntactically valid statements.

### Identity and context must be reconciled

An institutional LRS may receive events from an LMS, library, video platform, simulation,
assessment tool, mobile application, and external provider. These systems can use different
identifiers for the same person, course, resource, or session. Reliable analytics therefore
requires identity resolution, roster history, activity namespacing, and contextual links to terms,
sections, and curricula.

### Privacy risk grows with event detail

Fine-grained learning records can reveal attendance, reading behavior, study schedules, mistakes,
social participation, and inferred risk. Production systems need a stated purpose, access rules,
retention policy, transparency, and safeguards against inappropriate high-stakes use.

Jisc and Greenwich developed explicit policy and student-facing explanations alongside their
technical platform. Oklahoma State lists its LRS in a student-data inventory. These governance
artifacts are part of the production system, not peripheral paperwork.

### An LRS is not an analytics product by itself

The xAPI query interface can retrieve statements, but meaningful reporting usually requires
aggregation, feature engineering, models, and purpose-built user interfaces. The successful cases
connect the LRS to something actionable:

<iframe src="../sims/learning-record-to-action-workflow/main.html" height="702px" width="100%" scrolling="no"></iframe>

[View the learning-record-to-action workflow fullscreen](../sims/learning-record-to-action-workflow/main.html){ .md-button .md-button--primary }

*Select a workflow step to keep its description visible in the panel on the right.*

Deployments that stop after statement collection risk creating an expensive archive with no clear
instructional consumer.

### Public documentation has two opposite biases

Student-data security and the back-end nature of an LRS discourage universities from publishing
detailed operating architectures. Public evidence probably understates some adoption. At the same
time, vendor case studies can describe a successful course or program as a broad institutional
transformation. Public evidence can therefore overstate deployment scope even while understating
the number of deployments.

## Implications for an intelligent-textbook LRS

The case studies suggest several design requirements for an LRS intended to connect learning
events to textbook concepts:

1. **Preserve stable concept identifiers.** Activity titles and page names are insufficient for
   longitudinal analysis. Evidence should identify the concepts, learning objectives, or
   competencies to which an activity contributes.
2. **Separate immutable event evidence from derived summaries.** Raw statements should remain
   replayable while mastery estimates, risk indicators, and graph summaries are treated as
   projections with model and version metadata.
3. **Expect heterogeneous producers.** LMSs, MicroSims, quizzes, interactive diagrams, reading
   tools, and external applications will emit different evidence. A producer contract and shared
   profiles are necessary to make those records comparable.
4. **Design for identity and roster changes.** Learners move between sections, institutions, and
   identifiers. Event identity, institutional identity, and graph identity should not be conflated.
5. **Return evidence to a decision point.** Teacher reports, learner feedback, author dashboards,
   content evaluation, and interventions should be first-class consumers of the record store.
6. **Make governance inspectable.** Purpose, access, retention, consent or other legal basis, and
   use in high-stakes decisions should be visible in both policy and system behavior.
7. **Measure deployment scope honestly.** A live course integration is valuable, but it should not
   be represented as university-wide adoption without evidence of breadth, ownership, and routine
   operations.

## Conclusion

Formal LRS technology has reached production higher education, but not primarily as a universal
lifelong record. Its most successful university uses are pragmatic and bounded: gathering richer
content interactions, combining engagement data, supporting instructor intervention, feeding
student dashboards, or enabling focused learning research.

The evidence does not support the claim that universities have broadly adopted DoD-style records
of concept and task proficiency. It does support a more precise claim: several institutions have
operated LRSs or learning-record warehouses successfully when the records feed a clear teaching,
student-support, or compliance workflow. For an intelligent-textbook LRS, the opportunity is to
retain that operational focus while adding something most existing deployments lack: stable links
from evidence to a shared concept graph and replayable, explicitly derived mastery summaries.
