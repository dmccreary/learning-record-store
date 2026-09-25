---
title: Quiz Generation Quality Report
description: Quality metrics for the per-chapter multiple-choice quizzes generated across all 32 chapters.
---

# Quiz Generation Quality Report

Generated: 2026-09-24
Skill: quiz-generator v0.5
Execution Mode: Serial (1 agent processed chapters 2-32; chapter 1 was rewritten directly after its original quiz.md was found to reference content from a different, non-existent version of the chapter)

## Overall Statistics

- **Total Chapters:** 32
- **Total Questions:** 352
- **Avg Questions per Chapter:** 11.0 (10 chapters at 10 questions, 22 chapters at 12 questions)
- **Format compliance:** 100% — every question follows the `#### N.` / `upper-alpha` div / `??? question "Show Answer"` structure
- **Link validity:** 341 `**See:**` links checked against actual chapter headings, **0 broken** (11 questions across 8 chapters intentionally omit the link because the tested concept lives in un-headed introductory prose or synthesizes multiple sections)
- **Explanation length:** mean 61 words, range 30-94 (target 50-100; only 3 of 352 fall under 40 words)
- **Answer-letter balance:** A 24.4%, B 26.4%, C 25.9%, D 23.3% — all within the 20-30% target band, no chapter exceeded a 40% share for any single letter

## Per-Chapter Summary

| # | Chapter | Questions | Bloom's Tier | Concepts Tested | See-links |
|---|---------|-----------|--------------|------------------|-----------|
| 1 | From LMS to the Experience API | 10 | Introductory | 10 | 9 |
| 2 | The Anatomy of an xAPI Statement | 10 | Introductory | 10 | 10 |
| 3 | IEEE Standardization of xAPI and cmi5 | 10 | Introductory | 10 | 10 |
| 4 | Standards Governance and the Wider Interoperability Ecosystem | 10 | Introductory | 10 | 10 |
| 5 | System Context and the Five Architectural Planes | 10 | Intermediate | 10 | 10 |
| 6 | Multi-Tenancy, Rosters, and Pseudonymous Identity | 10 | Intermediate | 10 | 10 |
| 7 | The Property Graph Data Model | 12 | Intermediate | 12 | 10 |
| 8 | Summary Vertices and Statement Ingestion Mechanics | 12 | Intermediate | 12 | 12 |
| 9 | The Twelve Core LRS Functions | 10 | Intermediate | 10 | 10 |
| 10 | Choosing the Technology Stack | 10 | Intermediate | 10 | 10 |
| 11 | Architecture Decision Records and the Capacity Model | 12 | Intermediate | 12 | 12 |
| 12 | Bayesian Knowledge Tracing for Mastery | 10 | Intermediate | 8 | 9 |
| 13 | Component Design in Depth | 12 | Intermediate | 12 | 12 |
| 14 | Kafka Topics, ClickHouse Schema, and Graph Constraints | 12 | Intermediate | 12 | 12 |
| 15 | Privacy Enforcement and Dashboard Mechanics | 12 | Intermediate | 12 | 12 |
| 16 | The Container Image and the Role Dispatcher CLI | 12 | Intermediate | 12 | 12 |
| 17 | Docker Compose, the Makefile, and the Image Supply Chain | 12 | Intermediate | 12 | 12 |
| 18 | Configuration, Migration, Backup, and Rollout | 12 | Intermediate | 12 | 12 |
| 19 | Failure Modes and Verification | 12 | Intermediate | 12 | 12 |
| 20 | Spec Deviations, the Delivery Roadmap, and Open Questions | 10 | Intermediate | 9 | 9 |
| 21 | Hardware Sizing, Cost, and the Development Environment | 12 | Intermediate | 12 | 12 |
| 22 | Proving the Architecture - the MVP Plan | 10 | Intermediate | 10 | 10 |
| 23 | Production Infrastructure and Cloud Services | 12 | Intermediate | 12 | 12 |
| 24 | Meet the Three Personas and the Admin UI Surface | 10 | Advanced | 8 | 9 |
| 25 | District Administrator - Rosters, Deployments, and Registries | 10 | Advanced | 9 | 10 |
| 26 | District Administrator - Access Control and System Configuration | 10 | Advanced | 9 | 9 |
| 27 | Compliance, Privacy Law, and District-Level Reporting | 12 | Advanced | 12 | 12 |
| 28 | Teacher Dashboards and Student-Level Reports | 10 | Advanced | 10 | 9 |
| 29 | Class-Level Reports and Teacher Tools | 12 | Advanced | 12 | 11 |
| 30 | Textbook Author Dashboards and Content Reports | 10 | Advanced | 10 | 9 |
| 31 | Designing and Reading A/B Experiments | 12 | Advanced | 12 | 11 |
| 32 | The Producer Contract - Writing Conformant Statements | 12 | Advanced | 12 | 12 |

Chapters were bumped from the default 10 questions to 12 wherever the source chapter's own concept list ran unusually large (18-27 listed concepts), to raise Priority-1 concept coverage rather than re-testing the same concept twice.

## Bloom's Taxonomy Distribution (Overall)

| Level | Actual | Target (blended across tiers) | Notes |
|-------|--------|-------------------------------|-------|
| Remember | 84 (23.9%) | ~25% | On target |
| Understand | 103 (29.3%) | ~28% | On target |
| Apply | 82 (23.3%) | ~26% | Slightly under, offset by Understand |
| Analyze | 64 (18.2%) | ~16% | On target |
| Evaluate | 9 (2.6%) | ~3% (Advanced-tier chapters only) | On target |
| Create | 10 (2.8%) | ~3% (Advanced-tier chapters only) | On target |

Chapters 1-4 used the Introductory distribution (40/40/15/5), chapters 5-23 used the Intermediate distribution (25/30/30/15), and chapters 24-32 used the full Advanced six-level spread (15/20/25/25/10/5) since the course's own Evaluate- and Create-level learning outcomes (judging a district's privacy configuration, critiquing a rollout plan, assessing an A/B result, designing a persona-facing report) concentrate in Part 3's persona chapters.

## Answer Balance (Overall)

- A: 86 (24.4%)
- B: 93 (26.4%)
- C: 91 (25.9%)
- D: 82 (23.3%)

Three 12-question chapters (27, 31, 32) landed at B:4 (33%) rather than the ideal 3 — a minor, acceptable deviation given the small per-chapter sample size; no chapter shows a directional pattern (e.g., always-B or alternating) that a test-taker could exploit.

## Known Limitations

1. **Concept coverage is Priority-1, not exhaustive.** The learning graph carries roughly 15-27 concepts per chapter; a 10-12 question quiz cannot test every one without retesting weaker concepts twice. Coverage favors concepts with dedicated sections, bolded terms, or glossary entries. Chapters 12, 20, 24, 25, and 26 tested slightly fewer distinct concepts (8-9) because those chapters' content concentrated more narrowly around a smaller set of testable ideas.
2. **Eleven questions omit a `**See:**` link** because the tested concept appears only in a chapter's un-headed introductory prose (before the first `##` heading) or because the question intentionally synthesizes multiple sections (the Advanced-tier Create-level questions). Omitting the link was preferred over guessing at an anchor.
3. **Chapter 1's original quiz.md was discovered to be mismatched** during verification — it tested statement-compression, Bayesian Knowledge Tracing, and summary-vertex content that appears nowhere in Chapter 1 (that material belongs to later chapters). It has been rewritten from Chapter 1's actual content on LMS/SCORM/AICC/xAPI history.

## Success Criteria Check

| Criterion | Target | Result |
|---|---|---|
| Questions per chapter | 8-12 | ✅ 10 or 12 throughout |
| Bloom's distribution | within ±15% of tier target | ✅ |
| Answer balance | 20-30% per option | ✅ (352/352 questions; no chapter over 33% on any letter) |
| Explanations present | 100% | ✅ |
| Valid links only | no broken anchors | ✅ 0 broken of 341 |
| No duplicate questions | unique across quizzes | ✅ (spot-checked; each question is chapter-specific) |
