---
title: Docker Compose, the Makefile, and the Image Supply Chain
description: How this project's deploy/docker-compose.yml and root Makefile bring the whole LRS stack up on a laptop, and how the design specification's GitHub Actions pipeline builds, scans, signs, and ships the image that stack runs.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 11:27:45
version: 0.09
---

# Docker Compose, the Makefile, and the Image Supply Chain

## Summary

This chapter covers how the whole stack comes up on a laptop: the Docker Compose file's backing services and YAML anchors, every `make` target a developer runs day to day, and the CI/CD pipeline that builds, signs, and attests the image before it ships.

## Concepts Covered

This chapter covers the following 27 concepts from the learning graph:

1. Docker Compose Stack
2. YAML Anchor Reuse
3. Compose Healthcheck Gate
4. Compose Profile
5. Redpanda Console
6. OTel Collector Service
7. Loadgen Profile Service
8. Full Profile Keycloak
9. Make Up Target
10. Make Down Target
11. Make Clean Target
12. Make Logs Target
13. Make Seed Target
14. Make Smoke Target
15. Make Perf Target
16. Make Obs Target
17. Make Rebuild Target
18. Make Test Target
19. GitHub Actions Release Workflow
20. Docker Buildx
21. Multi-Arch Image Build
22. GHA Layer Cache
23. Provenance Attestation
24. SBOM Generation
25. Trivy Vulnerability Scan
26. Cosign Image Signing
27. Immutable Digest Reference

## Prerequisites

This chapter builds on concepts from:

- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 16: The Container Image and the Role Dispatcher CLI](../16-container-image-and-cli/index.md)

---

!!! mascot-welcome "One Command, One Stack"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 16 gave us one container image and one dispatcher CLI. That image is useless alone, though — the gateway needs a queue to write to, and every role needs the same passwords pointed at the same places. This chapter wires it all together into one file a developer runs with a single command, then follows that same image through the pipeline that builds, scans, and signs it before it ships. Let's follow the record.

## From One Image to a Running Stack

A single `lrs` image can play any role, but a working Learning Record Store needs several roles running at once, each backed by the right database, queue, and cache, all reachable from one another by name. **Docker Compose** is a tool that reads a declarative YAML file describing a set of containers — their images, environment variables, networks, and startup order — and brings all of them up or down together with one command. The file itself is a **Docker Compose Stack**: the complete, versioned description of every container this project runs together, checked into the repository at `deploy/docker-compose.yml` rather than assembled by hand on each developer's machine.

This project's stack divides into two groups. **Backing services** are off-the-shelf, pre-built images this project did not write: Redpanda for the event queue, ClickHouse for the event log, Neo4j for the summary graph, a dedicated PostgreSQL instance for the identity vault, and Redis for caching. **Application roles** are all the identical `lrs` image from Chapter 16, distinguished only by their startup subcommand.

Before looking at the file itself, the roster it declares is worth laying out in one place, since the rest of this chapter refers back to it.

- **Backing services:** `redpanda` (queue), `clickhouse` (event log), `neo4j` (summary graph), `vault-db` (pseudonym vault, PostgreSQL), `redis` (cache).
- **Bootstrap:** `bootstrap` — a run-once, idempotent setup container that must finish successfully before any application role starts.
- **Application roles (all one image):** `identity`, `gateway`, `processor`, `summarizer` — each started with a different `lrs` subcommand, exactly as Chapter 16 described.
- **Optional, profile-gated:** `loadgen` — a synthetic-traffic generator that only starts when explicitly requested.

## Repetition Without Drift: YAML Anchor Reuse

Five of those containers — `bootstrap`, `identity`, `gateway`, `processor`, and `summarizer` — are the same image, need most of the same environment variables (the Kafka address, the ClickHouse URL, the Neo4j credentials), and must wait on the same backing services before starting. Copying that block five times would work, but every future change would need five identical edits, and a missed one would let a role silently point at a different Kafka broker than its siblings. **YAML Anchor Reuse** solves this at the file-format level: an anchor, written `&name`, marks a block of configuration once, and an alias, written `*name`, inserts a full copy of it anywhere else in the file. The block is authored once, and every place that uses it stays byte-identical because there is only one place it is written.

This project's compose file defines three such anchors near the top of the file, before any service is declared.

```yaml
x-lrs-image: &lrs-image
  image: ${LRS_IMAGE:-lrs:dev}
  build:
    context: ..
    dockerfile: Dockerfile
    target: runtime
    args:
      PYTHON_VERSION: "3.12"

x-lrs-env: &lrs-env
  LRS_ENV: dev
  LRS_LOG_LEVEL: ${LRS_LOG_LEVEL:-INFO}
  KAFKA_BOOTSTRAP: redpanda:29092
  CLICKHOUSE_URL: http://lrs:${CLICKHOUSE_PASSWORD}@clickhouse:8123/lrs
  NEO4J_URI: bolt://neo4j:7687
  NEO4J_USER: neo4j
  NEO4J_PASSWORD: ${NEO4J_PASSWORD}
  REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
  IDENTITY_URL: http://identity:8086

x-lrs-depends: &lrs-depends
  redpanda:   {condition: service_healthy}
  clickhouse: {condition: service_healthy}
  neo4j:      {condition: service_healthy}
  redis:      {condition: service_healthy}
```

The `x-` prefix on each top-level key is a Compose convention for a block never itself started as a service — it exists only to be aliased. `&lrs-image` builds every application role from the identical Dockerfile and `runtime` target Chapter 16 walked through, with `context: ..` pointing one directory up because this file lives in `deploy/` while the Dockerfile sits at the repo root. `&lrs-env` bundles the shared connection strings every role needs — the `${VAR}` references are filled in from the `.env` file at the repo root. `&lrs-depends` bundles the four backing-service health conditions a role typically waits on. A service picks up an entire anchor in one line: `<<: *lrs-image` merges the image block in; `environment: {<<: *lrs-env, LRS_ROLE: gateway}` merges the environment and adds one role-specific variable.

!!! mascot-thinking "The Anchor Is the Guarantee, Not the Discipline"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice what YAML Anchor Reuse actually buys the project: it is not that a developer *remembers* to keep five services' configuration in sync — it is that keeping them in sync is no longer a task at all. There is one `KAFKA_BOOTSTRAP` value in the whole file. Five services alias it. A typo in one service's copy simply cannot happen, because there are not five copies to typo.

Before moving on to how the file orders startup, the table below reinforces what each of the three anchors defined above actually eliminates.

| Anchor | Aliased by | What repeating it by hand would risk |
|---|---|---|
| `&lrs-image` | `bootstrap`, `identity`, `gateway`, `processor`, `summarizer` | Two roles quietly built from different Dockerfile targets or Python versions |
| `&lrs-env` | Same five roles | One role pointed at a stale Kafka broker or a different Neo4j password |
| `&lrs-depends` | `identity`, `processor`, `summarizer` (`gateway` and `bootstrap` intentionally use narrower dependency lists — see below) | A role starting before the backing service it needs is actually healthy |

## Gating Startup: The Compose Healthcheck Gate

A container that reports "started" is not the same as a container ready to do useful work — Neo4j's process can run for several seconds before it can accept a Cypher query. Compose's `depends_on` can express more than plain ordering: a **Compose Healthcheck Gate** is a `depends_on` entry written as `{condition: service_healthy}` rather than the bare service name, which holds a dependent container back not just until the service it depends on has *started*, but until that service's own `healthcheck` directive — the same kind of role-aware check Chapter 16 introduced for the `lrs` image — has reported passing at least once. A second condition, `service_completed_successfully`, is stricter still: it waits for the dependency to *exit with status 0*, exactly what a run-once setup container is supposed to do.

That second condition is how `bootstrap` gates everything else. `bootstrap` runs `lrs bootstrap --create-topics --apply-ddl --apply-constraints --verify` — the run-once setup Chapter 16 named — and every application role lists `bootstrap: {condition: service_completed_successfully}` in its own `depends_on`. Until `bootstrap` exits 0, `identity`, `processor`, and `summarizer` do not start; Compose holds them rather than letting them race against topics and constraints that do not exist yet.

One dependency line is deliberately the *narrowest* in the stack, and it is worth pausing on why. The `gateway` service's `depends_on` lists only `redpanda: {condition: service_healthy}` — not ClickHouse, not Neo4j. This is not an oversight; it is spec §5.4's non-blocking-onboarding guarantee made structural. A "helpful" `clickhouse` dependency would let a ClickHouse restart take the ingestion gateway down with it, losing a classroom's live telemetry every time the analytics store hiccups. The gateway's job is to accept a statement and hand it to the queue; it should never wait on a system three hops downstream of that job.

!!! mascot-warning "A Healthy `bootstrap` Container Is Not Guaranteed Today"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    The compose file's `bootstrap` command already asks for `--apply-ddl` and `--apply-constraints`, but as of this writing those two flags are stubs that exit 2 rather than applying anything — the real setup still has to be run by hand, the way `dev-environment-setup.md`'s day-1 walkthrough does with `cypher-shell` directly. Because every application role is gated on `bootstrap: {condition: service_completed_successfully}`, a `bootstrap` that exits 2 means `identity`, `processor`, and `summarizer` never start — not a partial stack, a stuck one. If `make up` seems to hang with only backing services healthy, this is the first thing to check.

Seeing the gating logic as a graph is easier to hold in your head than `depends_on` blocks scattered across five service definitions.

#### Diagram: Compose Startup Dependency Graph

<iframe src="../../sims/compose-startup-dependency-graph/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>Compose Startup Dependency Graph</summary>
Type: workflow
**sim-id:** compose-startup-dependency-graph<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Trace which services gate which other services at startup, and explain why the gateway's dependency list is deliberately narrower than every other application role's.

Purpose: A Mermaid flowchart of five backing services, the bootstrap container, and four application roles, with edges representing depends_on conditions.

Nodes and edges: redpanda, clickhouse, neo4j, redis, vault-db each feed into "bootstrap" labeled "service_healthy". "bootstrap" feeds into "identity", "processor", "summarizer" labeled "service_completed_successfully". redpanda, clickhouse, neo4j, redis also feed into those three roles labeled "service_healthy" (the lrs-depends anchor). redpanda ALONE feeds into "gateway", in a distinct color, with a callout reading "Deliberately narrow -- spec section 5.4".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence definition drawn from this chapter's prose. A toggle button "Highlight the narrow dependency" dims every edge except the single redpanda-to-gateway edge.

Color coding: Backing services gray-blue, bootstrap amber (gate), application roles the book's teal accent, the gateway's single redpanda edge in a distinct highlight color.

Responsive design: The graph reflows vertically (backing services top, bootstrap middle, roles bottom) on narrow viewports, preserving all click handlers.
</details>

## Compose Profile: Turning Optional Services On

Not every developer needs every service running on every startup. A **Compose Profile** is a label attached to a service definition — `profiles: ["perf"]` — that keeps that service out of a plain `docker compose up` entirely; it only starts when its profile is explicitly requested with a `--profile` flag. This project's compose file uses exactly one profile today: `perf`.

```yaml
loadgen:
  <<: *lrs-image
  profiles: ["perf"]
  command: ["loadgen", "--rate", "200", "--duration", "300"]
  environment:
    <<: *lrs-env
    LRS_ROLE: loadgen
    GATEWAY_URL: http://gateway:8080
    LRS_DEV_INGEST_TOKEN: ${LRS_DEV_INGEST_TOKEN}
  depends_on:
    gateway: {condition: service_healthy}
```

This is the **Loadgen Profile Service** — the compose-level home for the `lrs loadgen` operational command Chapter 16 introduced. It aliases `&lrs-image` and `&lrs-env` like every other application role, but it never starts on a plain `docker compose up`; it only runs when a developer or CI job asks for the `perf` profile by name, because a synthetic firehose of statements is exactly the kind of traffic you want running on purpose and never by accident.

The design specification this repository is built from describes a fuller compose file with two more profiles this MVP has not yet built. The design's `obs` profile would add **Redpanda Console**, a web UI for inspecting Kafka-API topics, partitions, and consumer-group lag against Redpanda, and the **OTel Collector Service**, an OpenTelemetry Collector container that receives traces and metrics over `OTEL_EXPORTER_OTLP_ENDPOINT`. The design's `full` profile would add **Full Profile Keycloak** — a real OpenID Connect identity provider, used in place of the `LRS_DEV_INGEST_TOKEN` placeholder this dev stack currently authenticates with.

None of the three — Redpanda Console, the OTel Collector, or Keycloak — appears in this repository's actual `deploy/docker-compose.yml` today. The file's own header comment says so: they are "scoped out (deferred, not forgotten)," alongside the `analytics-api`, `admin-api`, and `dashboards` roles Chapter 16 named. `.env.example` carries the same signal as commented-out lines for exactly this deferred set:

```bash
# --- Deferred for the architecture-proof MVP; kept here so the shape does not
# --- change when they come back. See the plan's "Deferred, explicitly".
# KEYCLOAK_PASSWORD=change-me-keycloak   # OIDC (M3+)
# GRAFANA_PASSWORD=change-me-grafana     # obs profile (M5)
```

Those commented lines are a placeholder for a shape the file will grow back into, positioned so a later milestone can uncomment rather than redesign.

!!! mascot-tip "Read `--profile` Flags as a Question About Cost, Not Correctness"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    When you see a service gated behind a Compose Profile, ask "what does running this cost me in RAM and startup time right now?" rather than "is this broken?" A profile is the file's way of saying a service is real and supported, just not free to everyone by default. The `perf` profile's `loadgen` is the clearest case: traffic you want on a burst-test afternoon, and never while debugging a processor bug.

The table below summarizes every profile this chapter has named, distinguishing what exists in this repository today from what the design specification describes for later milestones.

| Profile | Status in this repo | Services | Purpose |
|---|---|---|---|
| (default, no profile) | Implemented | `redpanda`, `clickhouse`, `neo4j`, `vault-db`, `redis`, `bootstrap`, `identity`, `gateway`, `processor`, `summarizer` | The core stack every `make up` brings up |
| `perf` | Implemented | `loadgen` | Synthetic traffic for baseline and burst load testing |
| `obs` | Deferred (design spec §8.4/§8.9) | Redpanda Console, OTel Collector, Jaeger, Prometheus, Grafana | Kafka-API topic inspection and distributed tracing/metrics |
| `full` | Deferred (design spec §8.4/§8.9) | Keycloak | Real OIDC login in place of the dev ingest token |

## The Makefile: One Word per Task

Typing the full `docker compose --env-file .env -f deploy/docker-compose.yml ...` invocation by hand for every task would be tedious and error-prone — a developer who forgets `--env-file .env` gets a stack with every password silently interpolated to empty, since Compose otherwise resolves its project directory from the first `-f` file and finds no `.env` inside `deploy/`. A **Makefile** is a plain-text file of short, named recipes — `make` targets — each expanding to one or more shell commands, so a developer types `make up` instead of memorizing the invocation. This project's root-level `Makefile` defines that invocation once as a variable, `COMPOSE`, and every target below builds on it.

The everyday loop uses six targets. The **Make Up Target** builds the image if needed and starts the core stack — with `--scale processor=3`, so a fresh `make up` already runs three processor replicas rather than Compose's default single instance.

```bash
make up            # docker compose ... up -d --build --scale processor=3
```

The **Make Down Target** stops every container but leaves the named volumes — the database files — untouched, so the next `make up` picks up where the stack left off. The **Make Clean Target** goes further and destroys those volumes too, for when the data itself needs to start over.

```bash
make down           # docker compose ... down            (stop, keep data)
make clean           # docker compose ... down -v          (stop, drop data)
```

The **Make Logs Target** streams combined output from the three roles a developer debugging ingestion cares about most — `gateway`, `processor`, `summarizer` — rather than every container at once. The **Make Seed Target** runs the `lrs seed --demo` operational command from inside a throwaway `bootstrap` container, loading the demo district, schools, and synthetic statements Chapter 16 described.

```bash
make logs             # docker compose ... logs -f gateway processor summarizer
make seed             # docker compose ... run --rm bootstrap seed --demo
```

Every target routes through the same `COMPOSE` variable, so every one carries `--env-file .env`. Only copy-pasting a bare `docker compose` command, skipping `make` entirely, can hit the empty-password trap this section opened with.

## Verifying, Load-Testing, and Recovering

Three targets answer "does the stack actually work," each proving a different claim. The **Make Smoke Target** runs `scripts/smoke.sh --tier=ingest`, the script that posts one xAPI statement and asserts it reaches every store it should — Chapter 19 covers what each tier actually asserts. The **Make Perf Target** runs the synthetic firehose at a fixed baseline rate through the `perf` profile's `loadgen` service, and its sibling `burst` target repeats the command at five times the rate to observe whether graph write volume stays flat under a burst, as Chapter 11's capacity model predicts. The **Make Rebuild Target** invokes the Replay CLI Command Chapter 16 introduced, from inside a fresh `bootstrap` container, to reconstruct the `concept_mastery` grain from the untouched event log rather than trusting the graph's current state.

```bash
make smoke            # ./scripts/smoke.sh --tier=ingest
make perf              # loadgen --rate 200  --duration 300  (baseline)
make burst              # loadgen --rate 1000 --duration 300  (5x burst)
make rebuild             # bootstrap replay --rebuild-graph --grain concept_mastery
```

Two more targets round out the file without touching Compose at all. The **Make Test Target** runs the Python integration test suite with `uv run pytest tests/ -v`, against the same images the compose stack uses rather than a separate mocked environment. A neighboring `lint` target runs `ruff` and `mypy`, the same two gates CLAUDE.md names as mandatory before any change ships.

The design specification also documents a **Make Obs Target** — `make obs`, expanding to `docker compose --profile obs up -d` — bringing up the deferred Redpanda Console and OTel Collector Service alongside Jaeger, Prometheus, and Grafana in one step. Like the `obs` profile itself, it is not yet in the actual `Makefile`; it exists only as documentation of the shape the file will grow into.

A dozen targets is a lot to hold in your head from prose alone. The infographic below lets you search by scenario instead.

#### Diagram: Makefile Target Command Explorer

<iframe src="../../sims/makefile-target-explorer/main.html" width="100%" height="492px" scrolling="no"></iframe>

<details markdown="1">
<summary>Makefile Target Command Explorer</summary>
Type: infographic
**sim-id:** makefile-target-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: select, apply

Learning objective: Given a development scenario, select the correct make target, distinguish implemented targets from the deferred obs target, and identify the underlying docker compose (or script) command each one expands to.

Canvas layout: Left column, a scrollable list of eleven target tiles in monospace (up, down, clean, logs, seed, smoke, perf, burst, rebuild, test, obs). Right panel, a detail card populated on click showing the expanded command, a one-sentence description, and a status tag ("Implemented" or "Deferred"). Top strip: a search box and "Implemented only / Show all" toggle.

Visual elements: Implemented-target tiles show a teal left border; the deferred obs tile shows a dashed amber border with a "deferred" badge. The selected tile has a highlighted outline; its detail card slides in from the right.

Interactive controls: Click a tile to populate the detail panel. The search box keyword-matches each tile's tags (e.g. "burst" tagged "load test," "5x"; "obs" tagged "tracing," "not yet built") and highlights the best match. The filter toggle hides the obs tile when set to "Implemented only."

Color coding: Teal left border for implemented targets, amber dashed border for the deferred target, matching this chapter's compose-profile table.

Responsive design: The two-column layout collapses to a single stacked column on narrow viewports, with the detail card below the selected tile.
</details>

## From a Laptop to a Signed Image: The Supply Chain

Everything so far in this chapter runs on one developer's machine, building the image locally with `docker build`. Getting that image safely into a shared or production environment is a different problem: many developers push code, but exactly one built, tested artifact per version should ever run anywhere. A **GitHub Actions Release Workflow** is an automated pipeline, defined in a YAML file under `.github/workflows/`, that GitHub triggers on an event — typically a push to a release tag — and that builds, scans, signs, and publishes the image without a human running `docker build` by hand. This project's design specification documents that pipeline even though the workflow file has not yet been written; the abridged version below is quoted from §8.12.

```yaml
# .github/workflows/release.yml (abridged, per lrs-design-v1.md §8.12)
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: |
      ghcr.io/dmccreary/lrs:${{ github.sha }}
      ghcr.io/dmccreary/lrs:${{ github.ref_name }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    provenance: true
    sbom: true
- uses: aquasecurity/trivy-action@0.28.0
  with: {image-ref: 'ghcr.io/dmccreary/lrs:${{ github.sha }}', severity: 'CRITICAL,HIGH', exit-code: '1'}
- run: cosign sign --yes ghcr.io/dmccreary/lrs@${DIGEST}
```

Reading this pipeline top to bottom introduces five more concepts, each doing one job in sequence. **Docker Buildx** is Docker's extended build engine, invoked through `docker/setup-buildx-action`, that can produce images for processor architectures other than the one the build machine itself runs on. That capability is what makes a **Multi-Arch Image Build** possible: `platforms: linux/amd64,linux/arm64` asks Buildx to produce two complete images from one build step — `amd64` for cloud servers, `arm64` for Apple Silicon laptops — under the same tag, so the image an M-series Mac pulls is genuinely the build CI produced, not a second, separately-maintained one.

The **GHA Layer Cache**, configured by `cache-from: type=gha` and `cache-to: type=gha,mode=max`, persists Docker build-layer cache between workflow runs inside GitHub's own storage — the CI equivalent of the Docker Build Cache Mount Chapter 16 described for `uv sync`, but shared across every run. Without it, a security patch to one dependency would force CI to rebuild every layer of the Dockerfile from scratch on every push.

## Proving What Shipped

Building the image quickly is only half the job; a district trusting this system with student records needs evidence, not just assurance. Three more lines in the workflow above produce that evidence. `provenance: true` generates a **Provenance Attestation** — a signed record of how the image was built: source commit, workflow run, build parameters — so a consumer can verify it was built by this project's own CI and not tampered with afterward. `sbom: true` generates an **SBOM**, a **Software Bill of Materials**: a machine-readable inventory of every package baked into the image, letting a security team check for a vulnerable library version without opening the image itself.

The Trivy step that follows is a **Trivy Vulnerability Scan** — `aquasecurity/trivy-action` scans the built image against a database of known vulnerabilities, and `severity: 'CRITICAL,HIGH'` combined with `exit-code: '1'` fails the workflow, blocking the release, if any critical or high-severity vulnerability is found. This turns a scan from an advisory report into a gate nothing can bypass silently.

!!! mascot-encourage "Five New Terms, One Shared Question"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Buildx, the GHA layer cache, provenance attestations, SBOMs, Trivy scans, and image signing can feel like a wall of unfamiliar names arriving at once. Notice they all answer one question a district administrator is entitled to ask: "prove this exact image is the one your team built, and nothing dangerous is hiding inside it." Hold that question in mind and each term is just one more way the pipeline answers it.

The final line, `cosign sign --yes ghcr.io/dmccreary/lrs@${DIGEST}`, is **Cosign Image Signing** — Cosign attaches a cryptographic signature to a container image, so a deployment can verify the image was signed by this project's own release pipeline and reject anything unsigned before a container starts. Notice the command signs `@${DIGEST}`, not a tag. A container image's **digest** is a cryptographic hash of its exact contents, and an **Immutable Digest Reference** — written as `name@sha256:...` rather than `name:tag` — cannot be silently repointed at different content the way a tag like `:latest` can be. A tag is a mutable label someone could push a new image under tomorrow with the same name; a digest is the content itself, addressed directly. The design specification is explicit that deployments should reference the digest, never a mutable tag, and that `:latest` should not exist in any manifest — the whole chain, from Buildx through Cosign, proves something about one unchangeable set of bytes, and a mutable tag would let that guarantee quietly stop meaning anything.

Tracing one image through every stage named above is easier as a diagram than as prose.

#### Diagram: Image Supply Chain Pipeline

<iframe src="../../sims/image-supply-chain-pipeline/main.html" width="100%" height="642px" scrolling="no"></iframe>

<details markdown="1">
<summary>Image Supply Chain Pipeline</summary>
Type: workflow
**sim-id:** image-supply-chain-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/infographics/tree/main/docs/sims/cicd-deployment-pipeline<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Trace a single image from a release-tag push through build, cache, provenance/SBOM generation, vulnerability scanning, and signing, and explain why a deployment must reference the resulting digest rather than a mutable tag.

Purpose: A left-to-right Mermaid flowchart tracing one release through the abridged workflow quoted in this chapter's prose.

Nodes in order: "Push to release tag" -> "Docker Buildx (multi-arch: amd64 + arm64)" -> "GHA Layer Cache" -> "Build image, attach Provenance Attestation + SBOM" -> "Trivy Vulnerability Scan (CRITICAL/HIGH = block)" -> two branches: "Vulnerabilities found" to a red "Release blocked, exit 1" end node; "Clean scan" onward to "Cosign Image Signing" -> "Push ghcr.io/dmccreary/lrs@sha256:... (Immutable Digest Reference)" -> "Deployment pulls by digest, never by tag".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence definition drawn from this chapter's prose. Clicking the Trivy node explains severity and exit-code gating. Clicking the final two nodes explains the difference between a mutable tag and an immutable digest reference.

Color coding: Build-stage nodes in the book's teal accent color, security-gate nodes (Trivy, Cosign) in amber, the blocked-release branch in red, the final deploy-by-digest node in green.

Responsive design: The flowchart stacks vertically on narrow viewports, preserving left-to-right order as top-to-bottom, with the two branch paths staying visually distinct.
</details>

## Bringing It Together

Follow one change through everything this chapter named. A developer edits `src/lrs/`, runs `make up`, and Compose rebuilds only the layers Chapter 16's Dockerfile says changed, using the same anchors that keep `identity`, `gateway`, `processor`, and `summarizer` from drifting apart. `bootstrap` runs first and must exit 0 before any of those four roles starts — a Compose Healthcheck Gate, not a sleep loop — and the gateway alone skips waiting on ClickHouse or Neo4j, because spec §5.4 says ingestion must never block on the analytics store. `make seed` populates a demo district; `make smoke` and `make perf` — and `make burst` for the full claim — prove the ingest path and the capacity model hold on this machine. None of that touches the `obs` or `full` profiles this chapter also described, because neither is built yet.

When that change ships beyond one laptop, a push to a release tag hands it to an automated version of the same idea: Buildx builds two architectures at once, the GHA layer cache keeps that fast, Trivy blocks the release or lets it through clean, Cosign signs the result, and every deployment pulls that exact, unchangeable digest — never a tag that could quietly point somewhere else tomorrow.

- One `docker-compose.yml`, reused blocks via YAML anchors, and healthcheck-gated startup keep every role from drifting apart or racing its own dependencies.
- Compose profiles keep optional services — a load generator today, observability tooling and a real identity provider once built — out of everyone's way until requested.
- A Makefile turns a long, easy-to-mistype Compose invocation into one memorable word per task.
- An automated image supply chain turns "we built an image" into "here is proof of exactly what we built and that nothing dangerous is hiding inside it."

## Key Takeaways

- A **Docker Compose Stack** declares every container this project runs together — backing services, a run-once bootstrap container, and application roles built from Chapter 16's single image — in one versioned YAML file.
- **YAML Anchor Reuse** (`&lrs-image`, `&lrs-env`, `&lrs-depends`) lets the application-role services share configuration by construction rather than discipline, so they cannot silently drift apart.
- A **Compose Healthcheck Gate** (`service_healthy` or `service_completed_successfully`) holds a dependent container back until its dependency is actually ready, not just started; the gateway's deliberately narrow dependency on `redpanda` alone protects spec §5.4's non-blocking guarantee.
- A **Compose Profile** keeps optional services — the implemented **Loadgen Profile Service**, and the design-specified but not-yet-built **Redpanda Console**, **OTel Collector Service**, and **Full Profile Keycloak** — out of the default startup until requested.
- The **Makefile**'s **Up**, **Down**, **Clean**, **Logs**, **Seed**, **Smoke**, **Perf**, **Rebuild**, and **Test** targets, plus the not-yet-built **Obs** target, turn a long Compose invocation into one word per task.
- A **GitHub Actions Release Workflow** uses **Docker Buildx** for a **Multi-Arch Image Build**, sped by a **GHA Layer Cache**, attaches a **Provenance Attestation** and an **SBOM**, then gates release on a **Trivy Vulnerability Scan**.
- **Cosign Image Signing** attaches a verifiable signature, and deployments reference the image only by its **Immutable Digest Reference** — never a mutable tag — so the supply chain's guarantees stay attached to one unchangeable set of bytes.

!!! mascot-celebration "The Whole Stack, Start to Signed"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You can now read this project's actual `deploy/docker-compose.yml` and root `Makefile` line by line, explain why the gateway's dependency list looks deliberately thin, and trace an image from a release-tag push to a signed, digest-pinned deployment artifact. What does the evidence show? A trustworthy system is not just correct code — it is a pipeline that can prove what it shipped. In [Chapter 18: Configuration, Migration, Backup, and Rollout](../18-config-migration-backup-rollout/index.md), we pick up right where the `.env` file and that immutable digest leave off.

