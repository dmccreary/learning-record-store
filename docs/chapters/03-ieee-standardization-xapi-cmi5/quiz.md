---
title: "Quiz: IEEE Standardization of xAPI and cmi5"
description: Review questions on IEEE LTSC, IEEE 9274.1.1-2023, I2IDL, the xAPI Conformance Suite, the xAPI Profile Standard, JSON-LD, Application Profiles, cmi5, and the Total Learning Architecture.
social:
   cards: false
---
# Quiz: IEEE Standardization of xAPI and cmi5

Test your understanding of xAPI's standards governance, conformance tooling, Application Profiles, cmi5, and the Total Learning Architecture with these review questions.

---

#### 1. What is IEEE LTSC's role in xAPI's governance?

<div class="upper-alpha" markdown>
1. It balloted and published the formal xAPI core standard, IEEE 9274.1.1-2023
2. It operates the xAPI Conformance Suite and Profile Server
3. It originated the xAPI specification through Project Tin Can
4. It develops cmi5 as an Application Profile
</div>

??? question "Show Answer"
    The correct answer is **A**. IEEE LTSC is the standing committee that took over the specification's formal, openly balloted development, producing IEEE 9274.1.1-2023. B describes I2IDL's operational role, not IEEE LTSC's. C describes the ADL Initiative's origin work on xAPI. D is wrong because cmi5 is developed by the ADL Initiative, not IEEE LTSC.

    **Concept Tested:** IEEE LTSC

    **See:** [From One Organization's Spec to a Formal Standard](index.md#from-one-organizations-spec-to-a-formal-standard)

---

#### 2. What does IEEE 9274.1.1-2023 define?

<div class="upper-alpha" markdown>
1. The registry where reusable vocabularies are published
2. The in-development rules for how any xAPI Profile must be structured
3. The formally balloted core standard covering Statement structure and the RESTful API from earlier chapters
4. The Total Learning Architecture's reference components
</div>

??? question "Show Answer"
    The correct answer is **C**. IEEE 9274.1.1-2023 is the published, balloted core standard defining the Statement structure and RESTful API mechanics, plus conformance requirements. A describes the xAPI Profile Server, a separate piece of I2IDL infrastructure. B describes IEEE 9274.2.1, the still-unpublished Profile Standard. D describes the TLA Reference Implementation, an unrelated artifact.

    **Concept Tested:** IEEE 9274.1.1-2023

    **See:** [From One Organization's Spec to a Formal Standard](index.md#from-one-organizations-spec-to-a-formal-standard)

---

#### 3. What operational role does I2IDL play in the xAPI ecosystem?

<div class="upper-alpha" markdown>
1. It balloted the original core standard text
2. It originated xAPI through Project Tin Can and still develops cmi5
3. It is the U.S. Department of Defense-affiliated agency that wrote the first specification draft
4. It operates the xAPI Conformance Suite, xAPI Profile Server, and TLA Reference Implementation
</div>

??? question "Show Answer"
    The correct answer is **D**. I2IDL, established in late 2025, hosts and maintains the operational tooling implementers rely on rather than writing standard text. A describes IEEE LTSC's balloting role. B and C both describe the ADL Initiative, a separate organization with a separate, earlier-established job in this ecosystem.

    **Concept Tested:** I2IDL

    **See:** [From One Organization's Spec to a Formal Standard](index.md#from-one-organizations-spec-to-a-formal-standard)

---

#### 4. What gap does the xAPI Conformance Suite close?

<div class="upper-alpha" markdown>
1. It supplies each Learning Record Provider with a pre-written vocabulary of Verbs and Activity Types
2. It lets a Learning Record Store implementation verify against automated tests that it correctly implements IEEE 9274.1.1-2023's required behavior
3. It hosts published Application Profile documents for other implementers to fetch
4. It formally ballots new revisions of the core xAPI standard
</div>

??? question "Show Answer"
    The correct answer is **B**. The Conformance Suite is an automated test suite that checks whether a Learning Record Store implementation correctly follows IEEE 9274.1.1-2023's required behavior, from HTTP Verb handling to Statement Immutability. A describes what an Application Profile provides, not the Conformance Suite. C describes the xAPI Profile Server. D describes IEEE LTSC's balloting function, a different process entirely.

    **Concept Tested:** xAPI Conformance Suite

    **See:** [Proving an Implementation Actually Conforms](index.md#proving-an-implementation-actually-conforms)

---

#### 5. Why does the xAPI Profile Standard matter, given that Verbs are just URIs a Learning Record Provider can choose freely?

<div class="upper-alpha" markdown>
1. It defines how to publish a shared, reusable vocabulary and validation rules so independent implementers can produce comparable Statements
2. It restricts every Learning Record Provider to using only the Verbs ADL originally published in 2013
3. It replaces the need for JSON-LD by defining Verbs directly in plain JSON
4. It requires every Learning Record Store to run the same underlying database technology
</div>

??? question "Show Answer"
    The correct answer is **A**. Without a shared vocabulary, independently built textbooks can use differently-spelled Verb URIs to mean the same thing, silently breaking cross-implementation queries; the Profile Standard defines how to publish and follow a shared vocabulary to prevent that. B invents a restriction the standard does not impose. C is backwards — Profiles are expressed in JSON-LD, not an alternative to it. D is unrelated to what a Profile governs.

    **Concept Tested:** xAPI Profile Standard

    **See:** [The Trouble With Being Too Flexible](index.md#the-trouble-with-being-too-flexible)

---

#### 6. In a JSON-LD Application Profile, what does the `@context` mapping accomplish?

<div class="upper-alpha" markdown>
1. It compresses Statement JSON to reduce network bandwidth
2. It encrypts sensitive fields like Actor identity before transmission
3. It records which version of the LRS software produced the Statement
4. It resolves a short, convenient key such as `completed` to one specific, globally unique IRI, so independent teams mean the same thing by it
</div>

??? question "Show Answer"
    The correct answer is **D**. The `@context` mapping is what lets a short key like `completed` resolve unambiguously to one globally unique IRI, so two unrelated teams importing the same Profile produce genuinely comparable Statements. A, B, and C each describe a plausible-sounding but unrelated technical function that JSON-LD's `@context` does not perform in this chapter's description.

    **Concept Tested:** JSON-LD

    **See:** [The Trouble With Being Too Flexible](index.md#the-trouble-with-being-too-flexible)

---

#### 7. Within an Application Profile that defines several Statement Templates, what role does a Determining Property play?

<div class="upper-alpha" markdown>
1. It sets the priority order in which Templates are validated
2. It records which organization authored the Application Profile
3. It is the field, usually the Verb or Activity Type, that a validator checks first to decide which Template's rules apply to a given Statement
4. It defines the encryption key used to sign Statements conforming to that Profile
</div>

??? question "Show Answer"
    The correct answer is **C**. A Determining Property is the field a validator or reporting tool checks first to mechanically route an incoming Statement to the correct Statement Template among several a Profile might define. A invents a priority-ordering mechanism not described in the chapter. B and D describe authorship metadata and cryptographic signing, neither of which is a Determining Property's function.

    **Concept Tested:** Determining Property

    **See:** [The Trouble With Being Too Flexible](index.md#the-trouble-with-being-too-flexible)

---

#### 8. What is a cmi5 Assignable Unit (AU)?

<div class="upper-alpha" markdown>
1. A JSON-LD document that defines cmi5's shared vocabulary of Verbs
2. The smallest piece of content an LMS can assign and launch under cmi5, tracked through xAPI Statements rather than SCORM's in-browser reporting
3. The registry entry that identifies a learner's Actor Account within a district
4. A background service that reconciles duplicate Statement IDs
</div>

??? question "Show Answer"
    The correct answer is **B**. An Assignable Unit is cmi5's smallest launchable content unit, tracked entirely through xAPI Statements rather than SCORM's proprietary in-browser reporting call, so it can be built with any technology able to make an HTTP request. A describes an Application Profile document, not an AU itself. C and D describe unrelated identity and reconciliation concepts covered in other chapters.

    **Concept Tested:** cmi5 Assignable Unit

    **See:** [cmi5: A Profile Everyone Already Uses](index.md#cmi5-a-profile-everyone-already-uses)

---

#### 9. A cmi5-conformant LMS launches an Assignable Unit for a learner. Which mechanism supplies the AU, at launch time, with the xAPI Endpoint to write to, a way to obtain an authorization token, and a Registration UUID grouping the attempt?

<div class="upper-alpha" markdown>
1. The cmi5 Launch Method's query-string parameters appended to the AU's launch URL
2. The xAPI Conformance Suite
3. A manually configured settings file bundled inside the AU
4. The Determining Property of the AU's Statement Template
</div>

??? question "Show Answer"
    The correct answer is **A**. The cmi5 Launch Method appends `endpoint`, `fetch`, `actor`, and `registration` parameters to the AU's launch URL so the AU can begin sending conformant Statements the instant it loads, with no separate configuration step. B is an unrelated testing tool. C contradicts the chapter's point that no separate configuration step is needed. D routes Statements to templates, an unrelated function.

    **Concept Tested:** cmi5 Launch Method

    **See:** [cmi5: A Profile Everyone Already Uses](index.md#cmi5-a-profile-everyone-already-uses)

---

#### 10. How does the TLA Reference Implementation differ from the xAPI Conformance Suite?

<div class="upper-alpha" markdown>
1. They test the identical thing; the Reference Implementation is simply I2IDL's newer name for the Conformance Suite
2. The Conformance Suite checks one Learning Record Store's Statement API in isolation, while the Reference Implementation checks whether a whole constellation of interoperating systems plugs together as the TLA architecture describes
3. The Reference Implementation only tests cmi5 Assignable Units, while the Conformance Suite tests the Total Learning Architecture
4. The Conformance Suite is maintained by the ADL Initiative, while the Reference Implementation is maintained by IEEE LTSC
</div>

??? question "Show Answer"
    The correct answer is **B**. The Conformance Suite verifies one Learning Record Store's Statement API against IEEE 9274.1.1-2023 in isolation, while the TLA Reference Implementation checks whether a whole ecosystem of components — LRS, registries, recommendation engines — actually interoperates as the architecture's documentation claims. A wrongly collapses two distinct tools into one. C reverses their actual scopes. D misattributes both tools, which are both operated by I2IDL.

    **Concept Tested:** Total Learning Architecture / TLA Reference Implementation

    **See:** [The Bigger Picture: Total Learning Architecture](index.md#the-bigger-picture-total-learning-architecture)

---
