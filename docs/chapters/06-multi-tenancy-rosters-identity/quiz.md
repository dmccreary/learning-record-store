---
title: "Quiz: Multi-Tenancy, Rosters, and Pseudonymous Identity"
description: Review questions on the Tenancy Hierarchy, Hard and Soft Isolation, OneRoster and Student Information Systems, Pseudonymous Accounts, Student Keys, and the PII Vault.
social:
   cards: false
---
# Quiz: Multi-Tenancy, Rosters, and Pseudonymous Identity

Test your understanding of this Learning Record Store's multi-tenancy model, roster ingestion, and pseudonymization pipeline with these review questions.

---

#### 1. In this LRS's specification, what is a Tenant?

<div class="upper-alpha" markdown>
1. A school district — the top-level unit and the boundary every isolation guarantee is drawn around
2. Any individual school within a district
3. A single classroom section taught by one teacher
4. The Learning Record Provider that submits statements on behalf of a textbook
</div>

??? question "Show Answer"
    The correct answer is **A**. A Tenant is defined precisely as a school district, the top-level unit whose data must never leak into another tenant's view. B and C each name a level nested inside a district, not the tenant root itself. D confuses the architectural role of Tenant with a Learning Record Provider, an unrelated concept from earlier chapters.

    **Concept Tested:** Tenant

    **See:** [The Tenant: Who Owns This Data?](index.md#the-tenant-who-owns-this-data)

---

#### 2. What is the correct order of levels in this project's Tenancy Hierarchy?

<div class="upper-alpha" markdown>
1. School → District → Section → Course
2. Course → Section → District → School
3. District → School → Course → Section
4. Section → Course → School → District
</div>

??? question "Show Answer"
    The correct answer is **C**. The specification nests the hierarchy top to bottom as District, School, Course, Section, with Enrollment as the relationship connecting a Student to a Section. A, B, and D each scramble this order in a way that would place a level above its own parent.

    **Concept Tested:** Tenancy Hierarchy

    **See:** [The Tenancy Hierarchy: District Down to Student](index.md#the-tenancy-hierarchy-district-down-to-student)

---

#### 3. What is the key structural difference between Hard Isolation and Soft Isolation?

<div class="upper-alpha" markdown>
1. Hard Isolation is enforced only by role-based access control, while Soft Isolation is a structural property with no configuration
2. Hard Isolation applies only at the District level and makes cross-boundary queries architecturally impossible; Soft Isolation governs School, Course, and Section through role-based access control that could, in principle, be configured to overlap
3. Both guarantees apply at every level of the hierarchy with identical enforcement mechanisms
4. Soft Isolation applies only to the District level, while Hard Isolation applies to School, Course, and Section
</div>

??? question "Show Answer"
    The correct answer is **B**. Hard Isolation at the District level is a structural property with no code path capable of crossing it, while Soft Isolation at School, Course, and Section is a policy enforced by role-based access control that could, in principle, be configured to overlap. A reverses which guarantee is structural versus policy-based. C ignores that the two guarantees differ in strength and mechanism. D reverses which level gets which guarantee.

    **Concept Tested:** Hard Isolation / Soft Isolation

    **See:** [Hard Isolation and Soft Isolation](index.md#hard-isolation-and-soft-isolation)

---

#### 4. Why does this LRS rely on OneRoster syncs from a district's Student Information System rather than treating itself as the authoritative source of enrollment?

<div class="upper-alpha" markdown>
1. Because OneRoster is a hard requirement of the xAPI Conformance Suite
2. Because a Student Information System cannot export data in CSV or REST formats
3. Because the Roster API only accepts data that has already been pseudonymized
4. Because the district's SIS already holds the official enrollment records and legal/administrative authority over them, so the LRS remains a faithful copy rather than a second source of truth
</div>

??? question "Show Answer"
    The correct answer is **D**. A district's SIS already keeps the official, legally authoritative enrollment records long before it adopts any intelligent textbook, so the LRS treats roster data as a faithful copy rather than inventing a competing source of truth. A misattributes OneRoster to an unrelated conformance suite. B is false — SIS platforms commonly export CSV or REST feeds, which is exactly what OneRoster relies on. C is unrelated to why rosters originate outside the LRS.

    **Concept Tested:** Student Information System / OneRoster

    **See:** [Rosters: How Enrollment Data Actually Gets In](index.md#rosters-how-enrollment-data-actually-gets-in)

---

#### 5. What does the Student node in this LRS's property graph actually contain?

<div class="upper-alpha" markdown>
1. A `student_key` (pseudonymous) and a `grade_level`, with no PII stored on the node at all
2. The student's real name and email address, encrypted at rest
3. A direct foreign key reference to the matching row in the PII Vault
4. The student's roster ID exactly as it appears in the district's SIS
</div>

??? question "Show Answer"
    The correct answer is **A**. The Student node is deliberately thin, holding only a pseudonymous `student_key` and a `grade_level`, with the specification stating plainly that no PII is stored there. B is wrong because even encrypted PII is never stored on the node. C is wrong because no direct reference to the PII Vault exists on the graph side. D is wrong because the raw roster ID never appears there either.

    **Concept Tested:** Student (pseudonymous)

    **See:** [The Student Node: Present in the Graph, Absent as a Person](index.md#the-student-node-present-in-the-graph-absent-as-a-person)

---

#### 6. An intelligent textbook constructs an xAPI Statement for a student's quiz attempt. According to this chapter, what does the Actor field of that Statement actually contain when it arrives at the Ingestion Gateway?

<div class="upper-alpha" markdown>
1. The student's real name as recorded in the district's SIS
2. The already-derived `student_key` computed by the identity service
3. A Pseudonymous Account made of `homePage` (the issuing system) and `name` (an opaque identifier), never a real identity
4. An empty field, since the Ingestion Gateway does not accept Actor data
</div>

??? question "Show Answer"
    The correct answer is **C**. Every actor on the event stream carries a Pseudonymous Account — `homePage` naming the issuing system and `name` an opaque, internally-used identifier — so the sending Learning Record Provider never puts a real identity directly on the wire. A contradicts the whole point of pseudonymization at the source. B is wrong because the `student_key` is derived downstream by the Stream Processor, not supplied by the textbook. D is wrong because the Actor field is required and present.

    **Concept Tested:** Pseudonymous Account

    **See:** [From a Pseudonymous Account to a Student Key](index.md#from-a-pseudonymous-account-to-a-student-key)

---

#### 7. A student's `student_key` needs to stay consistent every time that same student produces a new statement within one district, while also being impossible to reverse back into their original account. Which property of the HMAC-SHA256-based derivation makes both true at once?

<div class="upper-alpha" markdown>
1. It is encrypted with a reversible cipher that only the identity service can decrypt
2. It is deterministic (same input always yields the same key) and one-way (no formula runs backward from the key to the account)
3. It is randomly re-generated on every statement to maximize unpredictability
4. It stores the original account alongside the derived key for auditability
</div>

??? question "Show Answer"
    The correct answer is **B**. Determinism keeps one learner's statements linked to one Student node within a district, while the one-way property means no formula recovers the original account from the key — together these are exactly what the formula is designed to guarantee. A is wrong because HMAC is not a reversible cipher. C would break the consistency the system depends on. D would defeat the entire purpose of pseudonymization by keeping the raw account linked to the key.

    **Concept Tested:** Student Key

    **See:** [From a Pseudonymous Account to a Student Key](index.md#from-a-pseudonymous-account-to-a-student-key)

---

#### 8. A vendor proposes storing the PII Vault's mapping table in the same PostgreSQL instance as the event store, just in a separate schema, to simplify operations. Why would this violate the design this chapter describes?

<div class="upper-alpha" markdown>
1. PostgreSQL does not support multiple schemas within one instance
2. It would make the Roster API unable to ingest OneRoster files
3. It would violate Hard Isolation at the District level specifically, unrelated to PII protection
4. It would put the entire privacy boundary one accidental permission grant away from collapsing, since the specification requires a separate instance, not merely a separate schema, with only the identity service able to read it
</div>

??? question "Show Answer"
    The correct answer is **D**. The specification is emphatic that the PII Vault must be a separate instance — its own deployment, credentials, and network policy — precisely so the privacy boundary is architectural rather than one misconfigured permission away from failure. A is factually false about PostgreSQL's capabilities. B and C each attach an unrelated consequence to a change that is really about PII protection, not roster ingestion or district-level isolation specifically.

    **Concept Tested:** PII Vault

    **See:** [The PII Vault: Where the Real Mapping Lives](index.md#the-pii-vault-where-the-real-mapping-lives)

---

#### 9. A student transfers from District A to District B partway through the year. Why can't anyone holding only analytics data correlate that student's activity across the two districts?

<div class="upper-alpha" markdown>
1. Because each district derives the student_key using its own distinct salt, so the same learner produces two unrelated keys with no discoverable relationship between them
2. Because the Roster API automatically deletes a student's enrollment the moment they transfer
3. Because Hard Isolation physically deletes all of a student's prior statements when they change districts
4. Because Pseudonymous Accounts are re-issued by the Learning Record Provider every time a student changes schools
</div>

??? question "Show Answer"
    The correct answer is **A**. Because each district's salt is unique, the same physical learner derives two completely unrelated `student_key` values, one per district — this holds even against a reader with illegitimate access to derived data, not just an honest query respecting the tenant boundary. B and C both invent deletion behaviors the chapter does not describe. D misattributes the mechanism to the Learning Record Provider rather than the identity service's district-salted derivation.

    **Concept Tested:** PII Vault / per-district salt

    **See:** [From a Pseudonymous Account to a Student Key](index.md#from-a-pseudonymous-account-to-a-student-key)

---

#### 10. When a district exercises a right-to-erasure request for one student, what actually happens, and why does it make re-identification permanently impossible?

<div class="upper-alpha" markdown>
1. The Student node's grade_level field is set to null, while the student_key remains active for future statements
2. The district's entire salt is rotated, invalidating every student's key in that district at once
3. The vault mapping row and matching event-store rows are deleted, so the per-district salt can no longer be used to re-derive which pseudonymous statements belonged to that student
4. The PII Vault is taken offline temporarily while the identity service reprocesses all statements
</div>

??? question "Show Answer"
    The correct answer is **C**. Erasure deletes the student's row from the vault's mapping table and purges the matching event-store rows, so the now-gone mapping means that student's `student_key` becomes permanently un-derivable, leaving only de-identified aggregates behind. A would leave the key active, defeating erasure. B would incorrectly affect every other student in the district. D describes an operational outage, not the actual erasure mechanism.

    **Concept Tested:** PII Vault (right to erasure)

    **See:** [The PII Vault: Where the Real Mapping Lives](index.md#the-pii-vault-where-the-real-mapping-lives)

---
