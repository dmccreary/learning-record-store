# Concept List

578 concepts for **Learning Record Store: IEEE Standards, Architecture, and Practice**. Part 1 (Foundations, standards) is unchanged. Parts 2 and 3 cover, exhaustively, everything named in this project's own specification and design documents — every ADR, technology choice, Kafka topic, ClickHouse table, Neo4j node/relationship/constraint, report ID, admin UI, failure mode, test layer, deployment artifact, hardware tier, and producer-contract rule — plus every software tool, package, and library named anywhere in `docs/specs/`.

A report-coverage audit (cross-checking all 35 report IDs and 8 tool IDs in spec §7 against this list) found 14 gaps, now fixed: the `Student` and `Concept` graph nodes were missing entirely despite being the Unit/target of most reports; five architectural components (`Ingestion Gateway`, `Durable Event Queue`, `Event Store`, `Stream Processor`, and the four report-serving APIs) had been dropped in the rebuild from 224 to 564 concepts; and three relationship types named directly in report backing queries (`HAS_MASTERY`, `OF_CONCEPT`, `TOUCHED`) were missing alongside the two that already existed.

| Part | IDs | Count | Source |
|---|---|---|---|
| **1 — Foundations** | 1–60 | 60 | Standards & governance (unchanged) |
| **2 — This project's specification & design** | 61–427 | 367 | `lrs-spec-v1.md`, `lrs-design-v1.md`, `hardware-requirements.md`, `dev-environment-setup.md`, `mvp-plan.md` |
| **3 — Personas & the full report/tool catalog** | 428–578 | 151 | Spec §7 (all 35 reports + 8 tools, by ID), §10 (all 9 admin UIs), §8 (experimentation), `xapi-producer-contract-v1.md` |

## Part 1 — Foundations (1–60)

1. Learning Management System
2. SCORM
3. AICC
4. Content Packaging
5. Sharable Content Object
6. Experience API
7. Learning Record Store
8. Learning Record Provider
9. Actor
10. Verb
11. Object Activity
12. Activity Type
13. Result
14. Context
15. Statement
16. Sub-Statement
17. Attachment
18. Extensions
19. Statement Immutability
20. Voided Statement
21. Registration
22. Actor Account
23. Inverse Functional Identifier
24. Statement ID
25. RESTful API
26. HTTP Verb
27. xAPI Endpoint
28. Statement Query Parameter
29. OAuth Authentication
30. Basic Authentication
31. IEEE LTSC
32. IEEE 9274.1.1-2023
33. IEEE 9274.2.1
34. xAPI Profile Standard
35. JSON-LD
36. Application Profile
37. Determining Property
38. cmi5
39. cmi5 Assignable Unit
40. cmi5 Launch Method
41. Total Learning Architecture
42. ADL Initiative
43. I2IDL
44. xAPI Conformance Suite
45. xAPI Profile Server
46. TLA Reference Implementation
47. Standards Governance
48. Stewardship Transition
49. Open Source Infrastructure
50. 1EdTech Consortium
51. Caliper Analytics
52. Learning Object Metadata
53. Competency Framework
54. Learning Ecosystem
55. Data Verifiability
56. Data Transparency
57. Learner Data Portability
58. Vendor Interoperability
59. Statement Timestamp
60. Activity Definition

## Part 2 — This Project's Specification & Design (61–427)

61. System Context Diagram
62. Ingestion Plane
63. Processing Plane
64. Storage Plane
65. Analytics Plane
66. Presentation Plane
67. Ingestion Gateway
68. Durable Event Queue
69. Event Store
70. Stream Processor
71. Analytics API
72. Admin API
73. Experiment API
74. Roster API
75. Export API
76. Tenant
77. District
78. School
79. Course
80. Section
81. Enrollment
82. Tenancy Hierarchy
83. Hard Isolation
84. Soft Isolation
85. OneRoster
86. Student Information System
87. Student
88. Pseudonymous Account
89. Student Key
90. PII Vault
91. Labeled Property Graph
92. Node Label
93. Relationship Type
94. Textbook
95. Textbook Version
96. Chapter
97. Page
98. MicroSim
99. MicroSim Version
100. Quiz
101. Question
102. Concept
103. Learning Graph DAG
104. Depends On Relationship
105. Covers Relationship
106. Has Mastery Relationship
107. Of Concept Relationship
108. Touched Relationship
109. Verb Controlled Vocabulary
110. Experiment Node
111. Variant Node
112. Summary Vertex
113. Analytical Grain
114. Concept Mastery Vertex
115. Page Engagement Vertex
116. MicroSim Engagement Vertex
117. Question Response Vertex
118. Learning Session Vertex
119. Section Rollup Vertex
120. Statements Compressed
121. xAPI Statement Resource
122. Structural Validation
123. Semantic Validation
124. Schema On Read
125. Non-Blocking Ingestion
126. Accept-First Ingestion
127. Provisional Node
128. Reconciliation Worker
129. Idempotent Delivery
130. At-Least-Once Delivery
131. Backpressure
132. Statement Compression Ratio
133. Change-Driven Materialization
134. Absolute Value Write
135. Statement Storage Function
136. Statement Retrieval Function
137. Voiding Function
138. Actor Pseudonymization Function
139. Activity Resolution Function
140. Concept Mapping Function
141. Mastery Computation Function
142. Progress Projection Function
143. Experiment Assignment Function
144. Reconciliation Function
145. Export Function
146. Retention Purge Function
147. FastAPI
148. Uvicorn
149. Redpanda
150. Apache Kafka
151. Confluent-Kafka Library
152. ClickHouse
153. Neo4j 5 Community
154. PostgreSQL 16
155. Redis 7
156. MinIO
157. Amazon S3
158. GraphQL
159. Keycloak
160. OpenTelemetry
161. Jaeger
162. Prometheus
163. Grafana
164. ADR Event Store Decision
165. ADR Compression Sync Decision
166. ADR Graph Not Hot Path
167. ADR Partition Key Decision
168. ADR One Image Many Roles
169. ADR BKT Mastery Decision
170. ADR Python Gateway Decision
171. Memgraph Alternative
172. Peak Sustained Ingest
173. Burst Ingest Rate
174. Mean Statement Size
175. Active Ingestion Window
176. Duty Cycle
177. Statements Per Day
178. Kafka Disk Sizing
179. ClickHouse Disk Sizing
180. HTTP Request Rate
181. Graph Write Rate Naive
182. Neo4j Structural Node Count
183. Storage Compression Ratio
184. Write-Rate Compression
185. Sync Cadence Tradeoff
186. Distinct Active Grains
187. Bayesian Knowledge Tracing
188. Prior Mastery Probability
189. Slip Parameter
190. Guess Parameter
191. Transit Parameter
192. Evidence Conditioning Step
193. Learning Transition Step
194. Soft Correctness Mapping
195. AuthN Token Cache
196. UUIDv7 Statement ID
197. Kafka Producer Acks All
198. Gateway Backpressure Queue
199. HMAC-SHA256 Pseudonymization
200. Per-District Salt
201. Mutual TLS Salt Fetch
202. Kafka Consumer Batch Window
203. ReplacingMergeTree Dedup
204. BKT Streaming Update
205. Compacted State Checkpoint
206. Late Arrival Detector
207. Targeted Replay Command
208. xxhash64 Bucketing
209. Bucket To Variant Map
210. Ramping Allocation Rule
211. Report ID Endpoint Pattern
212. Analytics Cache Key
213. Data Version Invalidation
214. Privacy Filter Choke Point
215. P95 Latency Budget
216. Dash Background Callback
217. Redis Celery Queue
218. Multi-Page Dash App
219. Filter State Store
220. Raw Statements Topic
221. Bulk Statements Topic
222. Dead Letter Topic
223. Reconcile Task Topic
224. Mastery State Topic
225. Audit Feed Topic
226. Lrs Statements Table
227. Lrs Concept Mastery Table
228. Section Concept Daily MV
229. Student Concept Rollup MV
230. Student Page Rollup MV
231. ReplacingMergeTree Engine
232. AggregatingMergeTree Engine
233. LowCardinality Type
234. ZSTD Compression Codec
235. Partition By Month
236. Grain Uniqueness Constraint
237. Statement Label Prohibition
238. Concept DAG Acyclicity Check
239. Vault-Db Instance
240. Meta-Db Instance
241. Network Credential Boundary
242. Tenant Context Injection
243. Threshold Suppression
244. Complementary Suppression
245. Privacy Audit Write
246. Trace ID Propagation
247. Paged Metric Threshold
248. Idempotency By Statement ID
249. Replay Command
250. Rebuild Graph Command
251. Shadow Table Swap
252. Common Dashboard Anatomy
253. KPI Tile Component
254. Heatmap Component
255. Funnel Chart Component
256. Radar Chart Component
257. Sankey Chart Component
258. Time Series Component
259. Data Table Component
260. Graph Explorer Component
261. Server-Side Aggregation
262. Cross-Filtering Interaction
263. Drill-Down Interaction
264. Dashboard Export
265. One Image Many Roles Philosophy
266. Dockerfile Multi-Stage Build
267. Base Build Stage
268. Builder Build Stage
269. Runtime Build Stage
270. Non-Root Container User
271. uv Sync Command
272. Docker Build Cache Mount
273. Frozen Lockfile
274. Healthcheck Directive
275. PID 1 Signal Handling
276. Role Dispatcher CLI
277. Bootstrap CLI Role
278. Seed Demo Command
279. Loadgen Command
280. Replay CLI Command
281. Healthcheck CLI Command
282. Identity CLI Role
283. Analytics API CLI Role
284. Admin API CLI Role
285. Dashboards CLI Role
286. Docker Compose Stack
287. YAML Anchor Reuse
288. Compose Healthcheck Gate
289. Compose Profile
290. Redpanda Console
291. OTel Collector Service
292. Loadgen Profile Service
293. Full Profile Keycloak
294. Make Up Target
295. Make Down Target
296. Make Clean Target
297. Make Logs Target
298. Make Seed Target
299. Make Smoke Target
300. Make Perf Target
301. Make Obs Target
302. Make Rebuild Target
303. Make Test Target
304. GitHub Actions Release Workflow
305. Docker Buildx
306. Multi-Arch Image Build
307. GHA Layer Cache
308. Provenance Attestation
309. SBOM Generation
310. Trivy Vulnerability Scan
311. Cosign Image Signing
312. Immutable Digest Reference
313. Pydantic Settings Validation
314. Environment Variable Config
315. AWS Secrets Manager
316. External Secrets Operator
317. Kubernetes Secret
318. Ingest Key Rotation
319. Ingest Key Hashing
320. Additive Column Migration
321. Rebuild And Swap Migration
322. Expand Contract Migration
323. Kafka Partition Increase Caveat
324. Recovery Point Objective
325. Recovery Time Objective
326. Write-Ahead Log Archiving
327. Point-In-Time Recovery
328. Nightly Backup Snapshot
329. Quarterly Restore Drill
330. Rolling Update Strategy
331. Termination Grace Period
332. Gateway-First Deploy Order
333. Expand-Contract Rollback
334. Kafka Unavailable Failure
335. ClickHouse Unavailable Failure
336. Neo4j Unavailable Failure
337. Summarizer Stopped Failure
338. Summarizer Split Brain
339. Identity Service Unavailable
340. Redis Unavailable Failure
341. Experiment Service Error
342. Reconciliation Backlog Growth
343. Poison Message Handling
344. District Queue Flood
345. Clock Skew Handling
346. Unit Test Layer
347. Compression Test Suite
348. ADL Conformance Test Suite
349. Testcontainers Integration Test
350. Privacy Adversarial Suite
351. Load Test Loadgen
352. Replay Nightly Test
353. Chaos Kill Test
354. D-3 Partition Key Deviation
355. D-4 Privacy Threshold Deviation
356. D-5 Complementary Suppression
357. M0 Walking Skeleton
358. M1 Ingestion Complete
359. M2 Compression Graph Mastery
360. M3 Analytics Dashboards
361. M4 Admin Experiments
362. M5 Scale Production
363. Neo4j Licensing Question
364. ClickHouse Cloud Vs Self-Hosted
365. Gateway Language Trigger
366. BKT Parameter Fitting
367. Retention Vs Research Value
368. Multi-Region Question
369. MicroSim BKT Mapping Gap
370. Compute Plane Sizing
371. Monthly Cost Estimate
372. Reserved Instance Pricing
373. Neo4j Licensing Cost
374. Cost Sensitivity Driver
375. Single-Server Pilot Tier
376. VM Hypervisor Isolation
377. Bare-Metal Hosting
378. NVMe Local Storage
379. Network Ingress Sizing
380. Docker Desktop
381. Docker Engine
382. Remote SSH Development
383. Docker Context Over SSH
384. SSH Tunnel Port Forward
385. Hetzner Cloud Host
386. DigitalOcean Droplet
387. AWS EC2 Instance
388. UFW Firewall Rule
389. MVP Architecture Proof
390. Burst Insensitivity Claim
391. Smoke Harness Decorative Check
392. Mastery Path Disconnection
393. Lift Vs Rewrite Decision
394. Raw Column PII Hole
395. Last Seen Type Fix
396. Mastery Join Fix
397. MVP Step 1 Foundation
398. MVP Step 2 Ingest Path
399. MVP Step 3 Loadgen Contract
400. MVP Step 4 Compression Graph
401. MVP Step 5 Burst Proof
402. Vault Net Isolation
403. MVP Deferred Scope
404. Kubernetes
405. Helm Chart
406. KEDA Autoscaler
407. Horizontal Pod Autoscaler
408. Availability Zone
409. Managed Streaming Kafka
410. Continuous Integration Pipeline
411. Total Cost Of Ownership
412. EM Parameter Fitting
413. Application Load Balancer
414. ClickHouse Cloud
415. Neo4j AuraDB
416. Neo4j Enterprise Edition
417. Causal Cluster Topology
418. RDS Multi-AZ Postgres
419. ElastiCache Redis
420. Dead Letter Queue Concept
421. Ingress Controller
422. High Availability Requirement
423. LRU Fallback Cache
424. Cache TTL Expiry
425. Managed Identity Provider
426. Step-Up Authentication
427. Client Credentials Grant

## Part 3 — Personas & the Full Report/Tool Catalog (428–578)

428. District Administrator
429. Teacher
430. Textbook Author
431. System Administrator
432. School Administrator
433. Auditor Role
434. District Management UI
435. School Course Section UI
436. Textbook Deployment UI
437. xAPI Credentials UI
438. Experiment Administration UI
439. User Access Management UI
440. Privacy Compliance UI
441. Audit Monitoring UI
442. System Configuration UI
443. Roster Source Configuration
444. Data Residency Policy
445. Retention Policy
446. Legal Hold Toggle
447. Enrollment Editor
448. Instructor Assignment Tool
449. Term Academic Year Rollover
450. Deployment Editor
451. Provisional Reconcile Queue
452. MicroSim Registry View
453. Endpoint Key Rotation
454. Verb Vocabulary Browser
455. Dead-Letter Inspector
456. Experiment List View
457. Experiment Lifecycle Controls
458. User CRUD Management
459. Role Assignment Scope
460. Access Review Workflow
461. Impersonation Audit
462. Policy Profile Preset
463. Data Subject Request
464. Consent Status
465. Aggregation Threshold
466. Audit Log Browser
467. Alerting Configuration
468. Retention Defaults Config
469. Feature Flag Config
470. Rate Limit Config
471. FERPA Compliance
472. COPPA Compliance
473. GDPR Compliance
474. Right To Erasure
475. Role-Based Access Control
476. Single Sign-On
477. SAML Protocol
478. OIDC Protocol
479. District Adoption Dashboard
480. School Comparison Report
481. Course Rollup Report
482. Deployment Inventory Report
483. Data Quality Monitor
484. Ingestion Health Report
485. License Seat Utilization
486. Privacy Access Audit
487. District Overview Dashboard
488. System Health Dashboard
489. District Rollout Plan
490. My Classes Dashboard
491. Student Detail Dashboard
492. Student Progress Overview
493. Concept Mastery Radar
494. Time-On-Task Timeline
495. Struggle Detector
496. Prerequisite Gap Analysis
497. Quiz Item Analysis
498. Idle Disengagement Alert
499. Learning Velocity Report
500. Reading Vs Doing Balance
501. Class Mastery Heatmap
502. Concept Difficulty Ranking
503. Completion Funnel
504. Pace Distribution
505. Class Engagement Calendar
506. Question Discrimination
507. MicroSim Utilization Report
508. Cohort Comparison Report
509. At-Risk Roster
510. Standards Coverage Report
511. Ad-Hoc Cohort Builder
512. Learning Graph Explorer
513. Statement Query Console
514. Funnel Builder
515. Alert Rule Builder
516. Report Scheduler
517. Section Enrollment
518. Co-Teacher Assignment
519. Content Insights Dashboard
520. Experiments Dashboard
521. Page Effectiveness Report
522. MicroSim Impact Report
523. Confusing-Content Finder
524. Drop-Off Map
525. Concept-Coverage Gaps
526. Question Health Report
527. Version Comparison Report
528. Cross-District Benchmark
529. Correlation Explorer
530. Experiment Designer
531. Experiment Definition
532. Experiment Hypothesis
533. Primary Outcome Metric
534. Unit Of Randomization
535. Experiment Variant
536. Allocation Weight
537. Guardrail Metric
538. Eligibility Predicate
539. Deterministic Sticky Assignment
540. Sample-Ratio Mismatch
541. Effect Size
542. Cohens D
543. Confidence Interval
544. Two-Sided Significance Test
545. Sequential Testing Correction
546. Segmentation Analysis
547. Guardrail Regression Flag
548. Experiment Readout Dashboard
549. Textbook Registry
550. MicroSim Registry
551. Content Effectiveness Loop
552. AB Test Lifecycle
553. Cross-Persona Workflow
554. Shared Statement Log
555. Persona-Facing Report
556. Canonical Activity IRI
557. Trailing Slash Rule
558. Question IRI Fragment
559. Named Sub-Activity Fragment
560. Randomized Order Naming Rule
561. Answered Verb
562. Experienced Verb
563. Interacted Verb
564. Textbook Version Grouping IRI
565. Object Definition Type Map
566. Control Object Type
567. Concept Extension Field
568. Concept Enrichment Path
569. Start Pause Dwell Pattern
570. Visibility Change Flush
571. Producer Excluded Field
572. xAPI Transport Header
573. District ID Server-Assigned
574. Student Key Server-Derived
575. Stored At Gateway Timestamp
576. API Version Header
577. Reference Statement Example
578. Field To Column Map
