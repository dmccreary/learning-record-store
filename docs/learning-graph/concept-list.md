# Concept List

564 concepts for **Learning Record Store: IEEE Standards, Architecture, and Practice**. Part 1 (Foundations, standards) is unchanged from the prior pass. Parts 2 and 3 are rebuilt to cover, exhaustively, everything named in this project's own specification and design documents — every ADR, technology choice, Kafka topic, ClickHouse table, Neo4j constraint, report ID, admin UI, failure mode, test layer, deployment artifact, hardware tier, and producer-contract rule — plus every software tool, package, and library named anywhere in `docs/specs/`.

| Part | IDs | Count | Source |
|---|---|---|---|
| **1 — Foundations** | 1–60 | 60 | Standards & governance (unchanged) |
| **2 — This project's specification & design** | 61–413 | 353 | `lrs-spec-v1.md`, `lrs-design-v1.md`, `hardware-requirements.md`, `dev-environment-setup.md`, `mvp-plan.md` |
| **3 — Personas & the full report/tool catalog** | 414–564 | 151 | Spec §7 (all 35 reports + 8 tools, by ID), §10 (all 9 admin UIs), §8 (experimentation), `xapi-producer-contract-v1.md` |

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

## Part 2 — This Project's Specification & Design (61–413)

61. System Context Diagram
62. Ingestion Plane
63. Processing Plane
64. Storage Plane
65. Analytics Plane
66. Presentation Plane
67. Tenant
68. District
69. School
70. Course
71. Section
72. Enrollment
73. Tenancy Hierarchy
74. Hard Isolation
75. Soft Isolation
76. OneRoster
77. Student Information System
78. Pseudonymous Account
79. Student Key
80. PII Vault
81. Labeled Property Graph
82. Node Label
83. Relationship Type
84. Textbook
85. Textbook Version
86. Chapter
87. Page
88. MicroSim
89. MicroSim Version
90. Quiz
91. Question
92. Learning Graph DAG
93. Depends On Relationship
94. Covers Relationship
95. Verb Controlled Vocabulary
96. Experiment Node
97. Variant Node
98. Summary Vertex
99. Analytical Grain
100. Concept Mastery Vertex
101. Page Engagement Vertex
102. MicroSim Engagement Vertex
103. Question Response Vertex
104. Learning Session Vertex
105. Section Rollup Vertex
106. Statements Compressed
107. xAPI Statement Resource
108. Structural Validation
109. Semantic Validation
110. Schema On Read
111. Non-Blocking Ingestion
112. Accept-First Ingestion
113. Provisional Node
114. Reconciliation Worker
115. Idempotent Delivery
116. At-Least-Once Delivery
117. Backpressure
118. Statement Compression Ratio
119. Change-Driven Materialization
120. Absolute Value Write
121. Statement Storage Function
122. Statement Retrieval Function
123. Voiding Function
124. Actor Pseudonymization Function
125. Activity Resolution Function
126. Concept Mapping Function
127. Mastery Computation Function
128. Progress Projection Function
129. Experiment Assignment Function
130. Reconciliation Function
131. Export Function
132. Retention Purge Function
133. FastAPI
134. Uvicorn
135. Redpanda
136. Apache Kafka
137. Confluent-Kafka Library
138. ClickHouse
139. Neo4j 5 Community
140. PostgreSQL 16
141. Redis 7
142. MinIO
143. Amazon S3
144. GraphQL
145. Keycloak
146. OpenTelemetry
147. Jaeger
148. Prometheus
149. Grafana
150. ADR Event Store Decision
151. ADR Compression Sync Decision
152. ADR Graph Not Hot Path
153. ADR Partition Key Decision
154. ADR One Image Many Roles
155. ADR BKT Mastery Decision
156. ADR Python Gateway Decision
157. Memgraph Alternative
158. Peak Sustained Ingest
159. Burst Ingest Rate
160. Mean Statement Size
161. Active Ingestion Window
162. Duty Cycle
163. Statements Per Day
164. Kafka Disk Sizing
165. ClickHouse Disk Sizing
166. HTTP Request Rate
167. Graph Write Rate Naive
168. Neo4j Structural Node Count
169. Storage Compression Ratio
170. Write-Rate Compression
171. Sync Cadence Tradeoff
172. Distinct Active Grains
173. Bayesian Knowledge Tracing
174. Prior Mastery Probability
175. Slip Parameter
176. Guess Parameter
177. Transit Parameter
178. Evidence Conditioning Step
179. Learning Transition Step
180. Soft Correctness Mapping
181. AuthN Token Cache
182. UUIDv7 Statement ID
183. Kafka Producer Acks All
184. Gateway Backpressure Queue
185. HMAC-SHA256 Pseudonymization
186. Per-District Salt
187. Mutual TLS Salt Fetch
188. Kafka Consumer Batch Window
189. ReplacingMergeTree Dedup
190. BKT Streaming Update
191. Compacted State Checkpoint
192. Late Arrival Detector
193. Targeted Replay Command
194. xxhash64 Bucketing
195. Bucket To Variant Map
196. Ramping Allocation Rule
197. Report ID Endpoint Pattern
198. Analytics Cache Key
199. Data Version Invalidation
200. Privacy Filter Choke Point
201. P95 Latency Budget
202. Dash Background Callback
203. Redis Celery Queue
204. Multi-Page Dash App
205. Filter State Store
206. Raw Statements Topic
207. Bulk Statements Topic
208. Dead Letter Topic
209. Reconcile Task Topic
210. Mastery State Topic
211. Audit Feed Topic
212. Lrs Statements Table
213. Lrs Concept Mastery Table
214. Section Concept Daily MV
215. Student Concept Rollup MV
216. Student Page Rollup MV
217. ReplacingMergeTree Engine
218. AggregatingMergeTree Engine
219. LowCardinality Type
220. ZSTD Compression Codec
221. Partition By Month
222. Grain Uniqueness Constraint
223. Statement Label Prohibition
224. Concept DAG Acyclicity Check
225. Vault-Db Instance
226. Meta-Db Instance
227. Network Credential Boundary
228. Tenant Context Injection
229. Threshold Suppression
230. Complementary Suppression
231. Privacy Audit Write
232. Trace ID Propagation
233. Paged Metric Threshold
234. Idempotency By Statement ID
235. Replay Command
236. Rebuild Graph Command
237. Shadow Table Swap
238. Common Dashboard Anatomy
239. KPI Tile Component
240. Heatmap Component
241. Funnel Chart Component
242. Radar Chart Component
243. Sankey Chart Component
244. Time Series Component
245. Data Table Component
246. Graph Explorer Component
247. Server-Side Aggregation
248. Cross-Filtering Interaction
249. Drill-Down Interaction
250. Dashboard Export
251. One Image Many Roles Philosophy
252. Dockerfile Multi-Stage Build
253. Base Build Stage
254. Builder Build Stage
255. Runtime Build Stage
256. Non-Root Container User
257. uv Sync Command
258. Docker Build Cache Mount
259. Frozen Lockfile
260. Healthcheck Directive
261. PID 1 Signal Handling
262. Role Dispatcher CLI
263. Bootstrap CLI Role
264. Seed Demo Command
265. Loadgen Command
266. Replay CLI Command
267. Healthcheck CLI Command
268. Identity CLI Role
269. Analytics API CLI Role
270. Admin API CLI Role
271. Dashboards CLI Role
272. Docker Compose Stack
273. YAML Anchor Reuse
274. Compose Healthcheck Gate
275. Compose Profile
276. Redpanda Console
277. OTel Collector Service
278. Loadgen Profile Service
279. Full Profile Keycloak
280. Make Up Target
281. Make Down Target
282. Make Clean Target
283. Make Logs Target
284. Make Seed Target
285. Make Smoke Target
286. Make Perf Target
287. Make Obs Target
288. Make Rebuild Target
289. Make Test Target
290. GitHub Actions Release Workflow
291. Docker Buildx
292. Multi-Arch Image Build
293. GHA Layer Cache
294. Provenance Attestation
295. SBOM Generation
296. Trivy Vulnerability Scan
297. Cosign Image Signing
298. Immutable Digest Reference
299. Pydantic Settings Validation
300. Environment Variable Config
301. AWS Secrets Manager
302. External Secrets Operator
303. Kubernetes Secret
304. Ingest Key Rotation
305. Ingest Key Hashing
306. Additive Column Migration
307. Rebuild And Swap Migration
308. Expand Contract Migration
309. Kafka Partition Increase Caveat
310. Recovery Point Objective
311. Recovery Time Objective
312. Write-Ahead Log Archiving
313. Point-In-Time Recovery
314. Nightly Backup Snapshot
315. Quarterly Restore Drill
316. Rolling Update Strategy
317. Termination Grace Period
318. Gateway-First Deploy Order
319. Expand-Contract Rollback
320. Kafka Unavailable Failure
321. ClickHouse Unavailable Failure
322. Neo4j Unavailable Failure
323. Summarizer Stopped Failure
324. Summarizer Split Brain
325. Identity Service Unavailable
326. Redis Unavailable Failure
327. Experiment Service Error
328. Reconciliation Backlog Growth
329. Poison Message Handling
330. District Queue Flood
331. Clock Skew Handling
332. Unit Test Layer
333. Compression Test Suite
334. ADL Conformance Test Suite
335. Testcontainers Integration Test
336. Privacy Adversarial Suite
337. Load Test Loadgen
338. Replay Nightly Test
339. Chaos Kill Test
340. D-3 Partition Key Deviation
341. D-4 Privacy Threshold Deviation
342. D-5 Complementary Suppression
343. M0 Walking Skeleton
344. M1 Ingestion Complete
345. M2 Compression Graph Mastery
346. M3 Analytics Dashboards
347. M4 Admin Experiments
348. M5 Scale Production
349. Neo4j Licensing Question
350. ClickHouse Cloud Vs Self-Hosted
351. Gateway Language Trigger
352. BKT Parameter Fitting
353. Retention Vs Research Value
354. Multi-Region Question
355. MicroSim BKT Mapping Gap
356. Compute Plane Sizing
357. Monthly Cost Estimate
358. Reserved Instance Pricing
359. Neo4j Licensing Cost
360. Cost Sensitivity Driver
361. Single-Server Pilot Tier
362. VM Hypervisor Isolation
363. Bare-Metal Hosting
364. NVMe Local Storage
365. Network Ingress Sizing
366. Docker Desktop
367. Docker Engine
368. Remote SSH Development
369. Docker Context Over SSH
370. SSH Tunnel Port Forward
371. Hetzner Cloud Host
372. DigitalOcean Droplet
373. AWS EC2 Instance
374. UFW Firewall Rule
375. MVP Architecture Proof
376. Burst Insensitivity Claim
377. Smoke Harness Decorative Check
378. Mastery Path Disconnection
379. Lift Vs Rewrite Decision
380. Raw Column PII Hole
381. Last Seen Type Fix
382. Mastery Join Fix
383. MVP Step 1 Foundation
384. MVP Step 2 Ingest Path
385. MVP Step 3 Loadgen Contract
386. MVP Step 4 Compression Graph
387. MVP Step 5 Burst Proof
388. Vault Net Isolation
389. MVP Deferred Scope
390. Kubernetes
391. Helm Chart
392. KEDA Autoscaler
393. Horizontal Pod Autoscaler
394. Availability Zone
395. Managed Streaming Kafka
396. Continuous Integration Pipeline
397. Total Cost Of Ownership
398. EM Parameter Fitting
399. Application Load Balancer
400. ClickHouse Cloud
401. Neo4j AuraDB
402. Neo4j Enterprise Edition
403. Causal Cluster Topology
404. RDS Multi-AZ Postgres
405. ElastiCache Redis
406. Dead Letter Queue Concept
407. Ingress Controller
408. High Availability Requirement
409. LRU Fallback Cache
410. Cache TTL Expiry
411. Managed Identity Provider
412. Step-Up Authentication
413. Client Credentials Grant

## Part 3 — Personas & the Full Report/Tool Catalog (414–564)

414. District Administrator
415. Teacher
416. Textbook Author
417. System Administrator
418. School Administrator
419. Auditor Role
420. District Management UI
421. School Course Section UI
422. Textbook Deployment UI
423. xAPI Credentials UI
424. Experiment Administration UI
425. User Access Management UI
426. Privacy Compliance UI
427. Audit Monitoring UI
428. System Configuration UI
429. Roster Source Configuration
430. Data Residency Policy
431. Retention Policy
432. Legal Hold Toggle
433. Enrollment Editor
434. Instructor Assignment Tool
435. Term Academic Year Rollover
436. Deployment Editor
437. Provisional Reconcile Queue
438. MicroSim Registry View
439. Endpoint Key Rotation
440. Verb Vocabulary Browser
441. Dead-Letter Inspector
442. Experiment List View
443. Experiment Lifecycle Controls
444. User CRUD Management
445. Role Assignment Scope
446. Access Review Workflow
447. Impersonation Audit
448. Policy Profile Preset
449. Data Subject Request
450. Consent Status
451. Aggregation Threshold
452. Audit Log Browser
453. Alerting Configuration
454. Retention Defaults Config
455. Feature Flag Config
456. Rate Limit Config
457. FERPA Compliance
458. COPPA Compliance
459. GDPR Compliance
460. Right To Erasure
461. Role-Based Access Control
462. Single Sign-On
463. SAML Protocol
464. OIDC Protocol
465. District Adoption Dashboard
466. School Comparison Report
467. Course Rollup Report
468. Deployment Inventory Report
469. Data Quality Monitor
470. Ingestion Health Report
471. License Seat Utilization
472. Privacy Access Audit
473. District Overview Dashboard
474. System Health Dashboard
475. District Rollout Plan
476. My Classes Dashboard
477. Student Detail Dashboard
478. Student Progress Overview
479. Concept Mastery Radar
480. Time-On-Task Timeline
481. Struggle Detector
482. Prerequisite Gap Analysis
483. Quiz Item Analysis
484. Idle Disengagement Alert
485. Learning Velocity Report
486. Reading Vs Doing Balance
487. Class Mastery Heatmap
488. Concept Difficulty Ranking
489. Completion Funnel
490. Pace Distribution
491. Class Engagement Calendar
492. Question Discrimination
493. MicroSim Utilization Report
494. Cohort Comparison Report
495. At-Risk Roster
496. Standards Coverage Report
497. Ad-Hoc Cohort Builder
498. Learning Graph Explorer
499. Statement Query Console
500. Funnel Builder
501. Alert Rule Builder
502. Report Scheduler
503. Section Enrollment
504. Co-Teacher Assignment
505. Content Insights Dashboard
506. Experiments Dashboard
507. Page Effectiveness Report
508. MicroSim Impact Report
509. Confusing-Content Finder
510. Drop-Off Map
511. Concept-Coverage Gaps
512. Question Health Report
513. Version Comparison Report
514. Cross-District Benchmark
515. Correlation Explorer
516. Experiment Designer
517. Experiment Definition
518. Experiment Hypothesis
519. Primary Outcome Metric
520. Unit Of Randomization
521. Experiment Variant
522. Allocation Weight
523. Guardrail Metric
524. Eligibility Predicate
525. Deterministic Sticky Assignment
526. Sample-Ratio Mismatch
527. Effect Size
528. Cohens D
529. Confidence Interval
530. Two-Sided Significance Test
531. Sequential Testing Correction
532. Segmentation Analysis
533. Guardrail Regression Flag
534. Experiment Readout Dashboard
535. Textbook Registry
536. MicroSim Registry
537. Content Effectiveness Loop
538. AB Test Lifecycle
539. Cross-Persona Workflow
540. Shared Statement Log
541. Persona-Facing Report
542. Canonical Activity IRI
543. Trailing Slash Rule
544. Question IRI Fragment
545. Named Sub-Activity Fragment
546. Randomized Order Naming Rule
547. Answered Verb
548. Experienced Verb
549. Interacted Verb
550. Textbook Version Grouping IRI
551. Object Definition Type Map
552. Control Object Type
553. Concept Extension Field
554. Concept Enrichment Path
555. Start Pause Dwell Pattern
556. Visibility Change Flush
557. Producer Excluded Field
558. xAPI Transport Header
559. District ID Server-Assigned
560. Student Key Server-Derived
561. Stored At Gateway Timestamp
562. API Version Header
563. Reference Statement Example
564. Field To Column Map
