---
title: The Container Image and the Role Dispatcher CLI
description: How the LRS builds one non-root, multi-stage container image and uses a single Typer CLI to dispatch every role — gateway, identity, analytics API, dashboards, and the operational commands that seed, load-test, replay, and health-check the stack.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 11:18:31
version: 0.09
---

# The Container Image and the Role Dispatcher CLI

## Summary

This chapter explains the one-image-many-roles philosophy that underlies deployment: the multi-stage Dockerfile, the non-root runtime, and the CLI role dispatcher that turns a single container image into a gateway, a processor, a summarizer, or any other role by command alone.

## Concepts Covered

This chapter covers the following 21 concepts from the learning graph:

1. One Image Many Roles Philosophy
2. Dockerfile Multi-Stage Build
3. Base Build Stage
4. Builder Build Stage
5. Runtime Build Stage
6. Non-Root Container User
7. uv Sync Command
8. Docker Build Cache Mount
9. Frozen Lockfile
10. Healthcheck Directive
11. PID 1 Signal Handling
12. Role Dispatcher CLI
13. Bootstrap CLI Role
14. Seed Demo Command
15. Loadgen Command
16. Replay CLI Command
17. Healthcheck CLI Command
18. Identity CLI Role
19. Analytics API CLI Role
20. Admin API CLI Role
21. Dashboards CLI Role

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 11: Architecture Decision Records and the Capacity Model](../11-adrs-and-capacity-model/index.md)
- [Chapter 13: Component Design in Depth](../13-component-design-in-depth/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)

---

!!! mascot-welcome "One Image, Twelve Roles"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 15 ended with a promise: we would leave the data layer behind and look at how every role — gateway, processor, summarizer, analytics API, dashboards — actually starts up and runs. This chapter keeps that promise. Everything from here on is about one artifact: a single container image, and the command line that decides what it becomes each time it starts. Let's follow the record.

Every role this book has described — the ingestion gateway from Chapter 5, the twelve core functions from Chapter 9, the components detailed in Chapter 13, the privacy filter and dashboards from Chapter 15 — has to actually run somewhere. A **container image** is a self-contained, portable package bundling an application with everything it needs to execute: the interpreter, installed libraries, application code, and the operating-system files those depend on. Running that image produces a **container**: one isolated running process executing from the image's contents. This project builds exactly one application container image and reuses it for every role — the **One Image Many Roles Philosophy**.

## One Image, Many Roles

Every LRS process is the same container image; the role a running container plays is chosen by the command given to it, not by which image was built. The same image tag can be told to behave as the gateway, the stream processor, or the dashboard server:

```bash
docker run ghcr.io/dmccreary/lrs:1.0.0 gateway
docker run ghcr.io/dmccreary/lrs:1.0.0 processor
docker run ghcr.io/dmccreary/lrs:1.0.0 dashboards
```

Each command starts a container from the identical image — same interpreter, same dependencies, same source code — and the single word after the image tag decides which role that container plays. This matters structurally: the gateway and the dashboard server cannot silently drift onto different versions of the xAPI-parsing code, because there is exactly one copy of it, built once, and every role runs from it. One image also means one dependency resolution to review, one vulnerability scan to run, and one artifact to promote to production — twelve roles built separately would mean twelve chances for one to fall out of sync with the rest.

!!! mascot-thinking "One Build, Twelve Ways to Run It"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Keep *building* and *running* apart. Building an image happens once per version and produces one artifact. Running it happens every time a container starts, and the role is decided fresh at that moment, by the command. A bug in the shared code affects every role identically — which sounds alarming until you notice the alternative: twelve separately built images could each carry a *different* bug, and you would not know which ones until each failed independently.

## Building the Image: A Multi-Stage Dockerfile

A **Dockerfile** is the recipe a build tool follows to produce a container image: a plain-text file of instructions — copy this file in, run this command, set this variable — executed in order. This project's Dockerfile uses a **Dockerfile Multi-Stage Build**: rather than one long sequence, the file is divided into named stages, each starting from its own `FROM` line, where a later stage selectively copies specific files out of an earlier stage without carrying along everything else that stage produced. The payoff is a final image containing only what the running application needs — no compilers, no package-resolution tools, none of the intermediate files a build produces along the way.

This Dockerfile uses three stages, each earning its own name because each does one bounded job. The **Base Build Stage** sets up the shared foundation every later stage builds on: the Python interpreter and the non-root user account the container will eventually run as.

```dockerfile
ARG PYTHON_VERSION=3.12

# ---------- base: shared runtime, non-root user ----------
FROM python:${PYTHON_VERSION}-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
RUN groupadd --system --gid 10001 lrs \
 && useradd  --system --uid 10001 --gid lrs --create-home lrs
```

`FROM python:${PYTHON_VERSION}-slim AS base` starts from a minimal, official Python image and names this stage `base` so later stages can build on it. `PYTHONUNBUFFERED=1` makes log output appear immediately rather than sitting in a buffer, which matters when an external tool is collecting the container's output stream in real time. The `groupadd`/`useradd` pair creates a dedicated system account named `lrs` — prepared here, though nothing runs as it yet.

The **Builder Build Stage** does the work the base stage deliberately skipped: resolving and installing the project's Python dependencies.

```dockerfile
# ---------- builder: resolve and install deps ----------
FROM base AS builder
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv
WORKDIR /app

# Dependency layer — cached until the lockfile changes
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Application layer — the only layer most builds rebuild
COPY src/ ./src/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev
```

`FROM base AS builder` inherits the interpreter and the `lrs` account without repeating that setup. `COPY --from=ghcr.io/astral-sh/uv:0.5` pulls a single pre-built binary — `uv`, this project's Python package manager — directly out of `uv`'s own published image. Notice the files arrive in two steps: `pyproject.toml` and `uv.lock` first, then a dependency install, and only afterward `src/`. Docker rebuilds a stage starting from the first instruction whose inputs changed, so editing one Python file triggers only the second `uv sync`, not a full dependency reinstall. Copying everything in at once would lose that distinction and pay the full resolution cost on every code change.

The **Runtime Build Stage** assembles the final, shippable image from what the earlier two stages produced — and nothing else.

```dockerfile
# ---------- runtime: no build tooling, no uv ----------
FROM base AS runtime
WORKDIR /app
COPY --from=builder --chown=lrs:lrs /app/.venv /app/.venv
COPY --from=builder --chown=lrs:lrs /app/src   /app/src
ENV PATH="/app/.venv/bin:$PATH"

USER lrs
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
    CMD ["lrs", "healthcheck"]

ENTRYPOINT ["lrs"]
CMD ["--help"]
```

This stage also starts `FROM base`, inheriting the interpreter and the `lrs` account, but it never installs `uv` or a compiler — those tools did their job inside the builder stage and are simply left behind. The two `COPY --from=builder` lines pull only the finished virtual environment (`.venv`, holding every resolved dependency) and `src/` out of the builder stage, `--chown=lrs:lrs` so the copied files are owned by the non-root account rather than `root`. The result is a smaller image and a smaller attack surface: less software present for a vulnerability scanner to check, and less an attacker could repurpose after a foothold.

The table below reinforces the three stages just described.

| Stage | Starts from | Job | Leaves behind for the next stage |
|---|---|---|---|
| Base Build Stage | `python:3.12-slim` | Set runtime behavior; create the non-root `lrs` account | Interpreter and `lrs` user/group, inherited by both later stages |
| Builder Build Stage | `base` | Install `uv`; resolve dependencies; copy in source | A populated `.venv` and `src/` tree — nothing else copied forward |
| Runtime Build Stage | `base` | Copy only `.venv` and `src/`; set the user, port, healthcheck, entrypoint | The final image — no compiler, no `uv`, no build cache |

#### Diagram: The Multi-Stage Build Pipeline

<iframe src="../../sims/multi-stage-build-pipeline/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Multi-Stage Build Pipeline</summary>
Type: workflow
**sim-id:** multi-stage-build-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Trace which files and tools enter each of the three Dockerfile stages, and see which artifacts the Runtime stage copies forward versus what the Builder stage's tools are discarded along with.

Purpose: One Mermaid flowchart with three stage subgraphs left to right, connected by arrows representing COPY --from instructions.

Left subgraph "Base Build Stage": "python:3.12-slim" -> "Create non-root lrs user/group (UID 10001)".

Middle subgraph "Builder Build Stage" (arrow in from Base, labeled "FROM base"): "Copy in uv binary" -> "Copy pyproject.toml + uv.lock" -> "uv sync --frozen (dependency layer)" -> "Copy src/" -> "uv sync --frozen (application layer)" -> "Populated .venv/ and src/ (uv and build cache left behind)".

Right subgraph "Runtime Build Stage" (arrows in from Base, labeled "FROM base", AND from Builder, labeled "COPY --from=builder: .venv/ and src/ ONLY"): "USER lrs" -> "EXPOSE 8080" -> "HEALTHCHECK: lrs healthcheck" -> "ENTRYPOINT [\"lrs\"]" -> "Final shippable image".

Interactive features: Every node has a Mermaid click directive opening a one-sentence infobox matching this chapter's prose. A toggle "Highlight what's left behind" dims every Builder-stage node except the two copied forward.

Color coding: Base in neutral gray, Builder in muted amber (discarded scaffolding), Runtime in the book's teal accent color (what ships).

Responsive design: Subgraphs stack vertically on narrow viewports, preserving left-to-right order as top-to-bottom.
</details>

## Hardening the Runtime: Non-Root User and PID 1

Two details in the runtime stage are easy to skim past, and both are load-bearing. The first is `USER lrs`. By default a container process runs as `root`, the most privileged account — convenient for development, dangerous in production, since a vulnerability in the application would hand an attacker root privileges inside the container as a side effect. The **Non-Root Container User** switches the running process to the unprivileged `lrs` account before any application code executes, so a compromise of the application is not automatically a compromise of the container's most powerful account.

The second is the exact form of `ENTRYPOINT ["lrs"]`, written as a JSON array — called **exec form**. The alternative, `ENTRYPOINT lrs` written as a plain string, is **shell form**: shell form launches a shell (`/bin/sh -c "lrs"`), which launches `lrs` as its *child*, while exec form launches `lrs` directly. This decides which process receives **Process ID (PID) 1**, the identifier the kernel assigns to the first process inside a container — the only process the runtime signals directly on shutdown, and if it does not handle that signal, the shutdown does not go smoothly.

**PID 1 Signal Handling** is how that first process reacts when the runtime asks a container to stop. Docker and Kubernetes request a graceful shutdown by sending `SIGTERM` — "finish what you're doing and stop" — directly to PID 1, followed by an unconditional `SIGKILL` after a grace period. Because this Dockerfile uses exec form, `lrs` itself is PID 1 and receives `SIGTERM` immediately, giving it the chance to stop accepting new work, commit outstanding Kafka offsets, and exit cleanly inside the grace period. Had the Dockerfile used shell form, the shell would occupy PID 1 and absorb the signal, while `lrs` — a mere child — might never learn a shutdown was requested until `SIGKILL` arrived mid-operation.

!!! mascot-tip "Watch for the Shell-Form Trap"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    If you review a Dockerfile and see `ENTRYPOINT some-command` without square brackets, that is shell form — one of the most common silent bugs in container deployments. It looks identical on a quick read and behaves completely differently under a rolling restart. Train your eye to look for the brackets.

- A rolling restart or scale-down event sends `SIGTERM` to a container's PID 1 and expects a clean exit within a bounded grace period.
- Exec-form `ENTRYPOINT ["lrs"]` makes `lrs` itself PID 1, so it receives `SIGTERM` directly and can drain in-flight work.
- Shell-form `ENTRYPOINT lrs` inserts an extra shell as PID 1, which typically does not forward `SIGTERM` to its child, so the real application is killed once the grace period expires.

#### Diagram: PID 1 Signal Handling — Exec Form versus Shell Form

<iframe src="../../sims/pid1-signal-handling-comparison/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>PID 1 Signal Handling -- Exec Form versus Shell Form</summary>
Type: microsim
**sim-id:** pid1-signal-handling-comparison<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Given a simulated SIGTERM, compare how the signal propagates under exec-form versus shell-form ENTRYPOINT, and predict whether in-flight work finishes cleanly or is killed.

Canvas layout: Two side-by-side process-tree panels, left "Exec form: ENTRYPOINT [\"lrs\"]" (one box, "PID 1: lrs process"), right "Shell form: ENTRYPOINT lrs" (two stacked boxes, "PID 1: /bin/sh -c lrs" above "PID 2 (child): lrs process"). A control strip above: "Send SIGTERM" button and a "Grace period" slider (1-10s, default 5). A countdown and status readout below each panel.

Visual elements: Before SIGTERM, both panels show calm teal boxes with a pulsing "in-flight request" icon. On click, a signal icon travels from a "container runtime" icon down to PID 1 in each panel. Left panel: signal reaches `lrs` directly; box turns amber ("draining"), the request completes and fades, box turns gray ("exited") before the grace period ends. Right panel: signal reaches the shell, which turns amber, but no arrow continues to the child box, which stays teal ("unaware") until the countdown hits zero, then turns red ("SIGKILL -- work lost").

Interactive controls: "Send SIGTERM" button starts both panels' animation together; "Grace period" slider adjusts the countdown; "Reset" restores the pre-signal state.

Interactive features: Clicking either process box opens an infobox stating its PID, whether it received SIGTERM directly, and — for the child box — that Docker and Kubernetes send SIGTERM only to PID 1 by default.

Color coding: Teal running, amber draining, gray clean exit, red unclean SIGKILL.

Responsive design: Panels stack vertically on narrow viewports; the control strip stays fixed above both.
</details>

## Keeping Builds Fast and Reproducible

Two more details from the Builder stage code above deserve their own explanation. Each stage runs `uv sync --frozen --no-dev`. The **uv Sync Command** reads the project's dependency declarations and installs exactly the packages and versions they specify into `.venv`. `--no-dev` excludes development-only tools such as test runners, since a runtime image never runs the test suite. `--frozen` is what makes this a **Frozen Lockfile** build — it installs precisely the versions recorded in `uv.lock` and fails loudly rather than silently re-resolving a different set if the lockfile and the declared dependencies have drifted apart. Without `--frozen`, two builds a week apart could quietly install different dependency versions from identical source code, defeating the point of a reproducible image.

The second detail is `RUN --mount=type=cache,target=/root/.cache/uv`, appearing before both `uv sync` calls. A **Docker Build Cache Mount** attaches a persistent cache directory to a single `RUN` instruction — its contents survive between builds on the same machine, but the cache itself never becomes part of the final image's layers. Here it caches `uv`'s package-download cache, so a rebuild needing the same versions again can reuse packages already fetched rather than re-downloading them. This is a different mechanism from the ordinary layer caching the dependency-before-application ordering already exploits; the cache mount specifically helps when a layer *does* need to rerun, by keeping that rerun off the network.

!!! mascot-warning "A Cache Mount Is Not a Substitute for Layer Ordering"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    Do not confuse the two speedups. Copying `pyproject.toml` and `uv.lock` before `src/` lets Docker *skip* the dependency-install layer entirely when only application code changes — ordinary layer caching, free at build time. `--mount=type=cache` only helps when that layer *does* rerun, by letting `uv` reuse already-downloaded packages instead of re-fetching them. Skipping a layer is always faster than re-running it with a warm cache; the cache mount is the fallback for what layer-skipping cannot cover.

#### Diagram: Rebuild Time by Scenario and Cache State

<iframe src="../../sims/build-cache-rebuild-times/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Rebuild Time by Scenario and Cache State</summary>
Type: chart
**sim-id:** build-cache-rebuild-times<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: determine, justify

Learning objective: Given three rebuild scenarios, determine which of ordinary layer caching versus the build cache mount is responsible for the time saved in each case.

Purpose: A grouped bar chart comparing simulated rebuild wall-clock time across three scenarios, each with and without the uv cache mount, isolating the mount's effect from ordinary layer-skipping.

Data (illustrative, labeled as representative, not measured): Scenario 1 "Code only changed (layer skip applies)" -- with mount 8s, without 9s (dependency layer is skipped entirely either way). Scenario 2 "uv.lock changed (dependency layer reruns)" -- with mount 12s, without 65s (mount reuses already-downloaded packages). Scenario 3 "Cold machine, no prior cache" -- with mount 70s, without 70s (nothing cached yet to reuse).

Controls: Toggle "Absolute seconds / Multiple of fastest"; dropdown to highlight one scenario's bars while the others dim to 40% opacity.

Interactive features: Hovering or clicking a bar opens a tooltip explaining, in one sentence, why that bar has its value. Scenario 3's tooltip notes a cache mount cannot help a build with nothing cached yet.

Color coding: "With cache mount" bars in the book's teal accent color; "without" bars in muted gray, so Scenario 2's size difference reads immediately as the mount's payoff.

Responsive design: Legend moves below the plot on narrow viewports; bar labels rotate rather than overlap.
</details>

## A Role-Aware Healthcheck

The runtime stage also declares a `HEALTHCHECK`:

```dockerfile
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
    CMD ["lrs", "healthcheck"]
```

A **Healthcheck Directive** tells the container runtime how to ask "are you actually working, not just still alive?" — a distinction that matters because a process can be running without being able to do its job, for instance if it lost its Kafka connection without crashing. `--interval=15s` runs the check every fifteen seconds; `--timeout=3s` gives each check three seconds to respond; `--start-period=20s` grants a grace window before failed checks count against a newly started container; `--retries=3` requires three consecutive failures before marking it unhealthy, avoiding a single transient blip triggering a restart. The command each check runs is `lrs healthcheck` — the same executable the whole image is built around, called with a different subcommand.

## The Role Dispatcher CLI

Everything above converges on one mechanism: the **Role Dispatcher CLI**. `ENTRYPOINT ["lrs"]` means every container built from this image starts by running `lrs` with whatever arguments were supplied after the image name. That program is built with Typer, a Python library for command-line interfaces where each capability is a named **subcommand** — a word immediately following the program name that selects which action to perform, such as `gateway` or `bootstrap`. Because `CMD ["--help"]` is also set, running the image with no arguments prints the list of available subcommands rather than doing nothing silently.

This is the concrete mechanism behind the One Image Many Roles Philosophy: one `lrs` program, no separate `lrs-gateway` or `lrs-dashboards` binary, with the subcommand supplied at start time the sole difference between containers. Several subcommands correspond to long-running roles — gateway, processor, summarizer, and reconciler were introduced in Chapter 13's component design and are not repeated here — while five more are specific to this chapter: server-style roles that expose an HTTP port.

The **Bootstrap CLI Role**, `lrs bootstrap`, is a run-once, idempotent setup command: it creates the Kafka topics, applies the ClickHouse data-definition-language statements, and applies the Neo4j structural constraints a fresh deployment needs before any other role can safely start. Idempotent means running it a second time against an already-bootstrapped stack causes no harm. Its `--verify` flag runs a read-only check that a deployed topology matches the specification, exiting nonzero rather than silently reporting success for work it never verified.

The **Identity CLI Role**, `lrs identity`, runs the pseudonym-resolution service from Chapter 6 — the component translating a district's real student identifiers into the pseudonymous keys the rest of the system operates on. It is the only role with a direct line to the vault database holding that mapping.

The **Analytics API CLI Role**, `lrs analytics-api`, runs the reporting service Chapter 15 built an entire chapter around: the single privacy-filter choke point every dashboard query passes through.

The **Admin API CLI Role**, `lrs admin-api`, runs the administrative operations service — the API a District Administrator's tools call to manage rosters, deployments, and configuration, distinct from the read-oriented Analytics API.

The **Dashboards CLI Role**, `lrs dashboards`, runs the Dash/Plotly application itself — the Common Dashboard Anatomy and component vocabulary Chapter 15 cataloged, from KPI tiles through the Graph Explorer component. Every callback it serves calls out to the Analytics API rather than touching a database directly, which is what keeps the privacy filter from ever being bypassed by a chart.

Every one of these five commands, and the server and worker roles from Chapter 13 alongside them, ships inside the identical image built earlier in this chapter — a security patch to a shared library is one rebuild, not five coordinated ones.

| CLI role | Subcommand | What it runs | Exposes |
|---|---|---|---|
| Bootstrap CLI Role | `lrs bootstrap` | Run-once setup: Kafka topics, ClickHouse DDL, Neo4j constraints | Nothing (exits when done) |
| Identity CLI Role | `lrs identity` | Pseudonym resolution against the vault database (Chapter 6) | Port 8086 |
| Analytics API CLI Role | `lrs analytics-api` | The privacy-filtered reporting API (Chapter 15) | Port 8081 |
| Admin API CLI Role | `lrs admin-api` | Roster, deployment, and configuration management | Port 8083 |
| Dashboards CLI Role | `lrs dashboards` | The Dash/Plotly dashboard application | Port 8050 |

## Operational Commands: Seed, Loadgen, Replay, and Healthcheck

Four more subcommands round out the Role Dispatcher CLI, and none run continuously — each performs one task and exits, making them tools an operator reaches for by hand.

The **Seed Demo Command**, `lrs seed --demo`, loads a small, explorable dataset into a freshly bootstrapped stack: one district, two schools, four sections, a learning graph, a textbook with MicroSims, and tens of thousands of synthetic statements across a simulated term. The design specification is direct about why: a stack a developer has to hand-populate before anything is visible on a dashboard is a stack nobody explores. A `--showcase` variant loads a larger multi-district catalog, and `--clear` removes previously seeded data, marked `seeded: true` so it can never be confused with real district data.

The **Loadgen Command**, `lrs loadgen --rate 10000`, generates a synthetic firehose of xAPI statements at the ingestion gateway, at whatever rate `--rate` specifies. Its purpose is validation, not demonstration: it is how this book's backpressure and scale claims get tested against real infrastructure rather than taken on faith from a capacity model on paper.

The **Replay CLI Command** is the command-line surface for the Replay Command and Rebuild Graph Command mechanisms Chapter 15 already explained — `lrs replay --district D --from T1 --to T2 --into <table>` for rebuilding a projection from the immutable log, and `lrs replay --rebuild-graph` for resetting the summarizer's watermark so the ordinary sync loop rebuilds the graph. Nothing about the underlying safety guarantee changes at the CLI layer; `lrs replay` is simply how a human or a script invokes that mechanism.

The **Healthcheck CLI Command**, `lrs healthcheck`, is the same subcommand the Dockerfile's `HEALTHCHECK` already calls every fifteen seconds — but it is also callable by hand, or by an orchestrator other than Docker. Every role sets an `LRS_ROLE` environment variable identifying which subcommand it was started with, so `lrs healthcheck` reads that variable and probes accordingly: an HTTP request to `/healthz` for a server role, or a check of consumer-group liveness against Kafka for a worker role. This is what makes the check role-aware rather than a generic "is the process still running" probe — a processor that silently lost its Kafka connection is not healthy even though its process has not crashed, and only a role-aware check catches that.

!!! mascot-encourage "Four Commands, One Shared Habit"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If tracking nine or ten subcommands feels like a lot, notice they split cleanly into two habits. Server roles (gateway, identity, analytics-api, admin-api, dashboards, and Chapter 13's roles) run forever until stopped. Operational commands (bootstrap, seed, loadgen, replay, healthcheck) do one job and exit. You do not need to memorize every flag — recognize which bucket a new subcommand falls into, and the rest follows.

#### Diagram: The Role Dispatcher Command Explorer

<iframe src="../../sims/role-dispatcher-command-explorer/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Role Dispatcher Command Explorer</summary>
Type: infographic
**sim-id:** role-dispatcher-command-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: select, apply

Learning objective: Given a deployment scenario, select the correct lrs subcommand and identify whether it is a long-running server role or a one-shot operational command.

Canvas layout: Left column, a scrollable list of nine role/command tiles (bootstrap, identity, analytics-api, admin-api, dashboards, seed, loadgen, replay, healthcheck) in monospace. Right panel, a detail card populated on click, showing the full example command, its exposed port ("no port -- exits when done" for one-shot commands), and a one-sentence description matching this chapter's prose. Top strip: "Server roles" / "Operational commands" / "Show all" filter buttons.

Visual elements: Server-role tiles show a looping-arrow icon and a teal left border; operational-command tiles show a checkmark icon and an amber left border. The selected tile has a highlighted outline; its detail card slides in from the right.

Interactive controls: Click a tile to populate the detail panel. Filter buttons highlight one category and dim the rest. A scenario search box (e.g. typing "recover the graph") highlights the best-matching tile (replay) via keyword tags stored per tile.

Behavior: The search box performs a keyword match against each tile's tags (e.g. healthcheck tagged "liveness," "is it healthy"; replay tagged "recover," "rebuild," "fix bad data") and highlights the closest match, giving the learner a self-check on scenario-to-command mapping.

Color coding: Teal left border for server roles, amber for operational commands, matching the build-versus-run color logic used earlier in this chapter.

Responsive design: The two-column layout collapses to a single stacked column on narrow viewports, the detail card appearing below the selected tile.
</details>

## Bringing the Image and the CLI Together

Follow one deployment through everything this chapter named. A build pipeline runs `docker build`, executing the Base, Builder, and Runtime stages in order, discarding `uv` and every build tool once Runtime's narrow `COPY --from=builder` lines pull across only the finished virtual environment and source. The resulting image carries a non-root `USER lrs`, an exec-form `ENTRYPOINT ["lrs"]` that makes the application itself PID 1, and a role-aware `HEALTHCHECK` calling `lrs healthcheck` every fifteen seconds. An operator first runs the image as `bootstrap`, then starts the same image again — unchanged — as `gateway`, `analytics-api`, and `dashboards`, each container differing only in the word following the image name. A rolling restart's `SIGTERM` lands directly on `lrs` because of exec form, so it drains cleanly inside its grace period. If something needs fixing afterward, `lrs seed --demo` populates an explorable dataset, `lrs loadgen` proves the pipeline holds up under load, and `lrs replay` rebuilds a projection from the untouched log — the same commands, the same image, the same non-root user, every time.

## Key Takeaways

- The **One Image Many Roles Philosophy** builds a single container image and selects a running container's role by command rather than by building a separate image per role, so every role stays on identical shared code.
- A **Dockerfile Multi-Stage Build** divides image construction into named stages — this project's **Base Build Stage**, **Builder Build Stage**, and **Runtime Build Stage** — so the final image copies forward only a finished virtual environment and application source, leaving build tooling behind.
- The **Non-Root Container User** runs the application as an unprivileged account rather than root, and exec-form `ENTRYPOINT` gives the application **PID 1 Signal Handling** — receiving `SIGTERM` directly so it can drain in-flight work, unlike shell form.
- The **uv Sync Command** with a **Frozen Lockfile** (`uv sync --frozen`) makes dependency installation reproducible, and a **Docker Build Cache Mount** keeps that install off the network on rebuilds without becoming part of the final image.
- A **Healthcheck Directive** in the Dockerfile calls the role-aware **Healthcheck CLI Command** (`lrs healthcheck`) on a fixed interval, probing an HTTP endpoint for server roles and consumer-group liveness for worker roles.
- The **Role Dispatcher CLI** is the `lrs` Typer program every container runs, exposing the **Bootstrap**, **Identity**, **Analytics API**, **Admin API**, and **Dashboards CLI Roles** as long-running subcommands, alongside the one-shot **Seed Demo Command**, **Loadgen Command**, and **Replay CLI Command**.

!!! mascot-celebration "One Image, Understood"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You can now read the Dockerfile that ships every role in this book's architecture, name what each stage discards and why, and pick the right `lrs` subcommand for any deployment scenario. What does the evidence show? A system earns "one image, many roles" by discipline in the build file, not by luck. In [Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../17-compose-makefile-supply-chain/index.md), we wire this single image into the full multi-service stack and the developer commands that bring it up.
