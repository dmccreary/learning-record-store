---
title: "Quiz: Docker Compose, the Makefile, and the Image Supply Chain"
description: Review questions on the Docker Compose stack, YAML anchor reuse, healthcheck gates, compose profiles, Makefile targets, and the image supply chain's build, scan, and signing pipeline.
social:
   cards: false
---
# Quiz: Docker Compose, the Makefile, and the Image Supply Chain

Test your understanding of this project's Docker Compose stack, Makefile, and image supply chain with these review questions.

---

#### 1. What is a Docker Compose Stack in this project?

<div class="upper-alpha" markdown>
1. The complete, versioned description of every container this project runs together, checked into the repository at deploy/docker-compose.yml
2. A single container image that plays every role in the system
3. The GitHub Actions workflow that builds and signs the release image
4. A Kubernetes Helm chart describing production deployment
</div>

??? question "Show Answer"
    The correct answer is **A**. The Compose Stack is the versioned YAML file describing every container — backing services, the bootstrap container, and application roles — that this project brings up together. B confuses it with the single `lrs` image from Chapter 16, a different artifact. C describes the release workflow, a separate mechanism covered later in this chapter. D invents an unrelated Kubernetes artifact this project does not use.

    **Concept Tested:** Docker Compose Stack

    **See:** [From One Image to a Running Stack](index.md#from-one-image-to-a-running-stack)

---

#### 2. What does YAML Anchor Reuse (`&lrs-env`, aliased with `*lrs-env`) actually guarantee, beyond simply saving typing?

<div class="upper-alpha" markdown>
1. It guarantees every service starts in alphabetical order
2. It guarantees the Docker Build Cache Mount is applied automatically to every service
3. It guarantees each service runs as a non-root user
4. It guarantees every application role's shared configuration is byte-identical by construction, because there is only one place the block is written, rather than five copies a developer must remember to keep in sync
</div>

??? question "Show Answer"
    The correct answer is **D**. Because an anchor is authored once and every alias inserts an identical copy, keeping five services' configuration in sync stops being a task a developer could forget — there simply are not five separate copies to drift apart. A, B, and C each invent an unrelated guarantee that YAML anchors do not provide.

    **Concept Tested:** YAML Anchor Reuse

    **See:** [Repetition Without Drift: YAML Anchor Reuse](index.md#repetition-without-drift-yaml-anchor-reuse)

---

#### 3. What is the difference between a Compose Healthcheck Gate using `service_healthy` versus `service_completed_successfully`?

<div class="upper-alpha" markdown>
1. service_healthy only applies to backing services, while service_completed_successfully only applies to application roles
2. service_healthy holds a dependent back until a dependency's healthcheck passes at least once; service_completed_successfully holds it back until the dependency exits with status 0, which is what a run-once setup container is supposed to do
3. service_healthy and service_completed_successfully are two names for the identical condition
4. service_completed_successfully waits for a container to be running indefinitely, while service_healthy waits for it to exit
</div>

??? question "Show Answer"
    The correct answer is **B**. `service_healthy` waits for a passing healthcheck, appropriate for a long-running service, while `service_completed_successfully` waits for exit status 0, appropriate for a run-once setup container like `bootstrap`. A invents a restriction neither condition actually has. C wrongly conflates two distinct conditions. D reverses their actual behaviors.

    **Concept Tested:** Compose Healthcheck Gate

    **See:** [Gating Startup: The Compose Healthcheck Gate](index.md#gating-startup-the-compose-healthcheck-gate)

---

#### 4. Why does the `gateway` service's depends_on list only `redpanda: {condition: service_healthy}`, deliberately omitting ClickHouse and Neo4j that other application roles depend on?

<div class="upper-alpha" markdown>
1. Because the gateway does not actually need Redpanda to be healthy either — the dependency is symbolic only
2. Because ClickHouse and Neo4j are always healthy by the time Compose starts, making the dependency unnecessary
3. Because making the gateway's job accepting a statement and handing it to the queue means it should never wait on a system three hops downstream — a "helpful" ClickHouse dependency would let a ClickHouse restart take ingestion down with it
4. Because the gateway image does not include the code needed to connect to ClickHouse or Neo4j at all
</div>

??? question "Show Answer"
    The correct answer is **C**. This is spec §5.4's non-blocking-ingestion guarantee made structural: the gateway's only real job is accepting and queuing, so it must never depend on a system further downstream that could take ingestion down with it if it hiccups. A contradicts the gateway's actual hard dependency on Redpanda. B is an unfounded assumption about startup timing. D misattributes the narrow dependency to a code limitation rather than a deliberate design choice.

    **Concept Tested:** Compose Healthcheck Gate (gateway's narrow dependency)

    **See:** [Gating Startup: The Compose Healthcheck Gate](index.md#gating-startup-the-compose-healthcheck-gate)

---

#### 5. What does a Compose Profile do?

<div class="upper-alpha" markdown>
1. It defines which network a service is attached to
2. It sets the CPU and memory limits for a container
3. It determines which Dockerfile stage a service is built from
4. It keeps a service out of a plain docker compose up entirely; the service only starts when its profile is explicitly requested with a --profile flag
</div>

??? question "Show Answer"
    The correct answer is **D**. A Compose Profile keeps a labeled service out of the default startup, only bringing it up when its profile is explicitly requested. A, B, and C each name an unrelated Compose or Docker concept that a profile label does not control.

    **Concept Tested:** Compose Profile

    **See:** [Compose Profile: Turning Optional Services On](index.md#compose-profile-turning-optional-services-on)

---

#### 6. Which of these accurately distinguishes services that exist in this repository's actual compose file today from services the design specification describes but has not yet been built?

<div class="upper-alpha" markdown>
1. All of these services, including Keycloak, are already implemented and running by default
2. The Loadgen Profile Service is implemented behind the perf profile today; Redpanda Console, the OTel Collector Service, and Full Profile Keycloak are deferred, described in the design spec but not yet in deploy/docker-compose.yml
3. The Loadgen Profile Service is deferred, while Redpanda Console and Keycloak are already implemented
4. None of these services exist anywhere, not even in the design specification
</div>

??? question "Show Answer"
    The correct answer is **B**. The `perf` profile's Loadgen Profile Service is real and implemented today, while the `obs` and `full` profiles' services are documented in the design specification but explicitly marked "deferred, not forgotten" and absent from the actual compose file. A overstates what is implemented. C reverses which services are deferred versus real. D understates the design specification, which does document all of them.

    **Concept Tested:** Loadgen Profile Service / Redpanda Console / OTel Collector Service / Full Profile Keycloak

    **See:** [Compose Profile: Turning Optional Services On](index.md#compose-profile-turning-optional-services-on)

---

#### 7. A developer wants to stop every running container for this stack but keep their locally seeded demo data intact for tomorrow. Which make target should they run?

<div class="upper-alpha" markdown>
1. make down, which stops containers but leaves the named volumes untouched
2. make clean, which stops containers and destroys the named volumes
3. make rebuild, which reconstructs the concept_mastery grain from the event log
4. make test, which runs the Python integration test suite
</div>

??? question "Show Answer"
    The correct answer is **A**. `make down` stops every container while leaving the named volumes — the database files, including the seeded demo data — untouched, so the next `make up` picks up where the stack left off. B destroys exactly the data the developer wants to keep. C and D each perform an unrelated task that neither stops the stack nor preserves data as the specific goal here.

    **Concept Tested:** Make Down Target / Make Clean Target

    **See:** [The Makefile: One Word per Task](index.md#the-makefile-one-word-per-task)

---

#### 8. An operator suspects a Neo4j summary vertex has drifted from what the event log actually supports, and wants to reconstruct it from the untouched, immutable log rather than trusting the graph's current state. Which make target is built for exactly this?

<div class="upper-alpha" markdown>
1. make smoke, which posts one xAPI statement and asserts it reaches every store it should
2. make perf, which runs a synthetic firehose at a fixed baseline rate
3. make rebuild, which invokes the Replay CLI Command from inside a fresh bootstrap container to reconstruct a grain from the untouched event log
4. make logs, which streams combined output from gateway, processor, and summarizer
</div>

??? question "Show Answer"
    The correct answer is **C**. `make rebuild` invokes the Replay CLI Command to reconstruct a specific grain, like `concept_mastery`, directly from the untouched event log rather than trusting the graph's current state. A verifies the ingest path works, not graph correctness. B measures throughput under load, an unrelated concern. D only streams logs and performs no recovery action.

    **Concept Tested:** Make Rebuild Target

    **See:** [Verifying, Load-Testing, and Recovering](index.md#verifying-load-testing-and-recovering)

---

#### 9. What capability does Docker Buildx add that makes a Multi-Arch Image Build possible?

<div class="upper-alpha" markdown>
1. The ability to produce images for processor architectures other than the one the build machine itself runs on, so one build step can output both amd64 and arm64 images under the same tag
2. The ability to sign a container image with a cryptographic key
3. The ability to scan an image for known vulnerabilities
4. The ability to run integration tests inside a container
</div>

??? question "Show Answer"
    The correct answer is **A**. Buildx can produce images for architectures other than the build machine's own, letting one build step output both `amd64` and `arm64` images under the same tag. B describes Cosign's job, a separate pipeline step. C describes Trivy's job. D describes an unrelated testing concern this pipeline stage does not perform.

    **Concept Tested:** Docker Buildx / Multi-Arch Image Build

    **See:** [From a Laptop to a Signed Image: The Supply Chain](index.md#from-a-laptop-to-a-signed-image-the-supply-chain)

---

#### 10. Why does the GHA Layer Cache matter for a security patch to a single dependency?

<div class="upper-alpha" markdown>
1. It only affects how fast Cosign can sign the resulting image
2. It replaces the need for a Frozen Lockfile entirely
3. It determines which platforms a Multi-Arch Image Build targets
4. Without it, CI would need to rebuild every Dockerfile layer from scratch on every push, since there would be no persisted build-layer cache between workflow runs
</div>

??? question "Show Answer"
    The correct answer is **D**. The GHA Layer Cache persists Docker build-layer cache between workflow runs inside GitHub's storage, so a single dependency patch does not force every layer to rebuild from scratch on every push. A misattributes its effect to an unrelated signing step. B wrongly claims it replaces a separate reproducibility mechanism. C confuses it with an unrelated Buildx platform setting.

    **Concept Tested:** GHA Layer Cache

    **See:** [From a Laptop to a Signed Image: The Supply Chain](index.md#from-a-laptop-to-a-signed-image-the-supply-chain)

---

#### 11. A district administrator wants proof that a specific deployed image was built by this project's own CI, was not tampered with afterward, and contains no known critical or high-severity vulnerabilities. Which three pipeline steps together provide that evidence?

<div class="upper-alpha" markdown>
1. YAML Anchor Reuse, Compose Healthcheck Gate, and Compose Profile
2. Make Smoke Target, Make Perf Target, and Make Test Target
3. Provenance Attestation (how it was built), SBOM Generation (what's inside it), and Trivy Vulnerability Scan (whether anything dangerous was found)
4. Docker Buildx, GHA Layer Cache, and Multi-Arch Image Build
</div>

??? question "Show Answer"
    The correct answer is **C**. Provenance Attestation proves how and where the image was built, SBOM Generation inventories exactly what is inside it, and the Trivy Vulnerability Scan checks and gates on known vulnerabilities — together answering the administrator's question directly. A names local Compose mechanisms unrelated to supply-chain evidence. B names local verification targets, not CI-produced proof. D names build-speed and portability mechanisms, not evidence of trustworthiness.

    **Concept Tested:** Provenance Attestation / SBOM Generation / Trivy Vulnerability Scan

    **See:** [Proving What Shipped](index.md#proving-what-shipped)

---

#### 12. Why does the release pipeline sign and deploy by an image's digest (`name@sha256:...`) rather than by a tag like `:latest` or a version tag?

<div class="upper-alpha" markdown>
1. Because digests are shorter and easier to type than tags
2. Because a tag is a mutable label someone could push new content under tomorrow with the same name, while a digest addresses the content itself directly and cannot be silently repointed — so the whole chain of provenance, SBOM, and signature guarantees stays attached to one unchangeable set of bytes
3. Because Cosign cannot technically sign a tag, only a digest, for purely technical reasons unrelated to trust
4. Because tags are only used during local development and are automatically converted to digests before any CI step runs
</div>

??? question "Show Answer"
    The correct answer is **B**. A tag can be silently repointed at different content, which would quietly disconnect the supply chain's provenance, SBOM, and signature guarantees from what is actually running; a digest addresses the exact bytes directly, so those guarantees stay attached to one unchangeable artifact. A is a trivial and incorrect claim — digests are actually longer than tags. C invents a fabricated technical limitation. D mischaracterizes how tags and digests are actually used across the pipeline.

    **Concept Tested:** Cosign Image Signing / Immutable Digest Reference

    **See:** [Proving What Shipped](index.md#proving-what-shipped)

---
