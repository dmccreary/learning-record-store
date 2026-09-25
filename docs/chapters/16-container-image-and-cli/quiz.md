---
title: "Quiz: The Container Image and the Role Dispatcher CLI"
description: Review questions on the One Image Many Roles Philosophy, the multi-stage Dockerfile, non-root and PID 1 signal handling, reproducible builds, the role-aware healthcheck, and the Role Dispatcher CLI's subcommands.
social:
   cards: false
---
# Quiz: The Container Image and the Role Dispatcher CLI

Test your understanding of this project's container image and Role Dispatcher CLI with these review questions.

---

#### 1. What is the One Image Many Roles Philosophy?

<div class="upper-alpha" markdown>
1. Every LRS process runs from the same container image, with the specific role chosen by the command given to the container at startup, not by which image was built
2. Every role gets its own separate container image, rebuilt independently as needed
3. A single image contains twelve different entrypoint binaries, one per role
4. The gateway and dashboards share one image, while every other role uses a separate one
</div>

??? question "Show Answer"
    The correct answer is **A**. One image is built and reused for every role, with the command supplied at startup deciding what a given container becomes. B and D each invent a multi-image scheme this philosophy specifically avoids. C mischaracterizes the mechanism as multiple binaries rather than one program dispatched by subcommand.

    **Concept Tested:** One Image Many Roles Philosophy

    **See:** [One Image, Many Roles](index.md#one-image-many-roles)

---

#### 2. What does a Dockerfile Multi-Stage Build allow a later stage to do?

<div class="upper-alpha" markdown>
1. It automatically merges all stages into a single FROM line at build time
2. It runs every stage simultaneously in parallel containers
3. It skips the need for a Dockerfile entirely by inferring the build steps
4. It selectively copies specific files out of an earlier stage without carrying along everything else that stage produced
</div>

??? question "Show Answer"
    The correct answer is **D**. A multi-stage build lets a later stage copy only specific files out of an earlier one, leaving compilers and intermediate build artifacts behind, which shrinks the final image. A, B, and C each invent a build behavior no Dockerfile mechanism actually provides.

    **Concept Tested:** Dockerfile Multi-Stage Build

    **See:** [Building the Image: A Multi-Stage Dockerfile](index.md#building-the-image-a-multi-stage-dockerfile)

---

#### 3. What does the Runtime Build Stage copy forward from the Builder Build Stage, and what does it deliberately leave behind?

<div class="upper-alpha" markdown>
1. It copies forward the entire builder stage, including uv and the build cache, for debugging convenience
2. It copies forward only the Dockerfile itself, rebuilding everything else from scratch
3. It copies forward only the finished .venv and src/ tree; it leaves behind uv, the compiler, and every intermediate build file
4. It copies forward the base stage's Python interpreter but not the lrs user account
</div>

??? question "Show Answer"
    The correct answer is **C**. The Runtime stage's narrow `COPY --from=builder` lines pull across only the populated virtual environment and application source, leaving `uv` and every build tool behind for a smaller image and attack surface. A contradicts the whole point of a narrow copy. B misdescribes the mechanism entirely. D is false — Runtime inherits the `lrs` account from the shared Base stage.

    **Concept Tested:** Builder Build Stage / Runtime Build Stage

    **See:** [Building the Image: A Multi-Stage Dockerfile](index.md#building-the-image-a-multi-stage-dockerfile)

---

#### 4. What does the Non-Root Container User setting accomplish?

<div class="upper-alpha" markdown>
1. It prevents the container from being started by any user other than the image's original author
2. It switches the running process to an unprivileged account before any application code executes, so a compromise of the application does not automatically hand an attacker the container's most powerful account
3. It disables all network access for the running container
4. It automatically encrypts every file the container writes to disk
</div>

??? question "Show Answer"
    The correct answer is **B**. Running as the unprivileged `lrs` account rather than root means an application vulnerability does not automatically become root-level access inside the container. A invents an unrelated authorship restriction. C and D each fabricate an unrelated security behavior this setting does not provide.

    **Concept Tested:** Non-Root Container User

    **See:** [Hardening the Runtime: Non-Root User and PID 1](index.md#hardening-the-runtime-non-root-user-and-pid-1)

---

#### 5. A Dockerfile declares `ENTRYPOINT lrs` (shell form, no square brackets) instead of `ENTRYPOINT ["lrs"]` (exec form). During a rolling restart, what is most likely to go wrong?

<div class="upper-alpha" markdown>
1. The shell occupies PID 1 and typically does not forward SIGTERM to its child lrs process, so lrs may be killed by SIGKILL mid-operation instead of draining cleanly
2. Nothing — shell form and exec form behave identically under SIGTERM
3. The container fails to start at all, since shell form is not valid Dockerfile syntax
4. The healthcheck directive stops running entirely
</div>

??? question "Show Answer"
    The correct answer is **A**. Shell form inserts a shell as PID 1, and Docker and Kubernetes send `SIGTERM` only to PID 1, so the shell typically absorbs the signal without forwarding it, leaving the real application to be killed by `SIGKILL` once the grace period expires. B is exactly the misconception this chapter warns against. C is false — shell form is valid syntax, just behaviorally different. D confuses an unrelated healthcheck mechanism with signal handling.

    **Concept Tested:** PID 1 Signal Handling

    **See:** [Hardening the Runtime: Non-Root User and PID 1](index.md#hardening-the-runtime-non-root-user-and-pid-1)

---

#### 6. What does the `--frozen` flag do when the Builder stage runs `uv sync --frozen --no-dev`?

<div class="upper-alpha" markdown>
1. It freezes the container's filesystem so no further writes are possible
2. It disables the Docker Build Cache Mount for that specific RUN instruction
3. It excludes the lrs non-root user from being created during that build stage
4. It installs precisely the versions recorded in uv.lock and fails loudly rather than silently re-resolving a different set if the lockfile and declared dependencies have drifted apart
</div>

??? question "Show Answer"
    The correct answer is **D**. `--frozen` makes the build reproducible by installing exactly the locked versions and failing loudly on drift, rather than silently re-resolving a different dependency set. A, B, and C each invent an unrelated build behavior this flag does not control.

    **Concept Tested:** Frozen Lockfile

    **See:** [Keeping Builds Fast and Reproducible](index.md#keeping-builds-fast-and-reproducible)

---

#### 7. Two different speedup mechanisms appear in the Builder stage: copying pyproject.toml and uv.lock before src/, and the `--mount=type=cache` cache mount. Why are these two mechanisms not redundant with each other?

<div class="upper-alpha" markdown>
1. Because the cache mount replaces the need for copying pyproject.toml and uv.lock at all
2. Because layer ordering only affects the Runtime stage, while the cache mount only affects the Base stage
3. Because copying dependency files first lets Docker skip the dependency-install layer entirely when only application code changes, while the cache mount only helps when that layer does rerun, by letting uv reuse already-downloaded packages instead of re-fetching them
4. Because the two mechanisms solve the identical problem, and the Dockerfile only needs one of them to work correctly
</div>

??? question "Show Answer"
    The correct answer is **C**. Layer ordering lets Docker skip the dependency layer entirely when it is unnecessary, while the cache mount only helps on the occasions that layer actually reruns, by avoiding a re-download. A and D both wrongly claim the two mechanisms are interchangeable. B misattributes both mechanisms to the wrong Dockerfile stages.

    **Concept Tested:** Docker Build Cache Mount

    **See:** [Keeping Builds Fast and Reproducible](index.md#keeping-builds-fast-and-reproducible)

---

#### 8. Why does the Healthcheck Directive ask "are you actually working, not just still alive?" rather than simply checking whether the process is still running?

<div class="upper-alpha" markdown>
1. Because Docker cannot detect whether a process has crashed at all
2. Because a process can be running without being able to do its job — for instance, a processor that silently lost its Kafka connection without crashing would pass a simple liveness check but still be unable to do useful work
3. Because every role in this system shares the exact same health-check logic regardless of what it does
4. Because a simple liveness check would use more CPU than a role-aware check
</div>

??? question "Show Answer"
    The correct answer is **B**. A process can remain running while unable to do useful work, such as a processor that silently lost its Kafka connection, so the healthcheck probes actual functionality rather than mere process existence. A is false — Docker can detect crashed processes without a custom healthcheck. C contradicts the chapter's explicit role-aware design. D is an unsupported performance claim.

    **Concept Tested:** Healthcheck Directive

    **See:** [A Role-Aware Healthcheck](index.md#a-role-aware-healthcheck)

---

#### 9. How does the Role Dispatcher CLI decide which role a given container plays?

<div class="upper-alpha" markdown>
1. By reading a subcommand supplied after the program name at container startup — the same lrs Typer program, with the subcommand as the sole difference between containers
2. By inspecting the container's hostname and matching it against a fixed role table
3. By requiring a separate binary to be built and shipped per role
4. By randomly assigning a role at each container restart for load balancing
</div>

??? question "Show Answer"
    The correct answer is **A**. `ENTRYPOINT ["lrs"]` means every container runs the same Typer program, and the subcommand supplied at startup is the sole difference between a gateway container and a dashboards container. B and D each invent a role-assignment mechanism the chapter never describes. C directly contradicts the one-image, one-program design.

    **Concept Tested:** Role Dispatcher CLI

    **See:** [The Role Dispatcher CLI](index.md#the-role-dispatcher-cli)

---

#### 10. A team is standing up a brand-new deployment and needs to create the Kafka topics, apply the ClickHouse DDL, and apply the Neo4j structural constraints before any other role can safely start, in a way that is safe to accidentally run twice. Which command should they run, and why?

<div class="upper-alpha" markdown>
1. lrs seed --demo, because it populates an explorable dataset first
2. lrs loadgen --rate 10000, because it validates the pipeline can handle production load
3. lrs replay --rebuild-graph, because it resets the summarizer's watermark
4. lrs bootstrap, because it is a run-once, idempotent setup command that creates exactly this infrastructure and causes no harm if run again against an already-bootstrapped stack
</div>

??? question "Show Answer"
    The correct answer is **D**. `lrs bootstrap` creates the Kafka topics, ClickHouse DDL, and Neo4j constraints a fresh deployment needs, and is explicitly idempotent, so running it twice causes no harm. A, B, and C each name a real command, but none creates this foundational infrastructure or is the tool built for this specific job.

    **Concept Tested:** Bootstrap CLI Role

    **See:** [Operational Commands: Seed, Loadgen, Replay, and Healthcheck](index.md#operational-commands-seed-loadgen-replay-and-healthcheck)

---

#### 11. A team wants to validate that the system's backpressure and scale claims hold up against real infrastructure, rather than trusting the capacity model on paper. Which command is built for this, and how does it differ from the command that populates an explorable demo dataset?

<div class="upper-alpha" markdown>
1. lrs seed --demo generates load-test traffic, while lrs loadgen populates the demo dataset
2. Both commands do the identical thing; --demo and --rate are interchangeable flags on the same underlying command
3. lrs loadgen --rate 10000 generates a synthetic firehose of statements to test the pipeline under real load; lrs seed --demo instead loads a small, fixed dataset so a fresh stack has something visible on a dashboard
4. lrs loadgen only works after lrs seed --showcase has already run once
</div>

??? question "Show Answer"
    The correct answer is **C**. `lrs loadgen` exists for validation, generating a synthetic firehose at a specified rate, while `lrs seed --demo` exists for demonstration, loading a small, fixed, explorable dataset. A reverses the two commands' actual purposes. B wrongly treats two distinct commands as interchangeable. D invents a dependency between the two commands that the chapter never states.

    **Concept Tested:** Seed Demo Command / Loadgen Command

    **See:** [Operational Commands: Seed, Loadgen, Replay, and Healthcheck](index.md#operational-commands-seed-loadgen-replay-and-healthcheck)

---

#### 12. This chapter's Dockerfile uses a non-root user, exec-form ENTRYPOINT, and a role-aware HEALTHCHECK together. What single operational goal do all three mechanisms serve, even though they act at different points in a container's lifecycle?

<div class="upper-alpha" markdown>
1. They each independently reduce the container image's disk size, which happens to be their only shared effect
2. They together make the running container safer and more honest to operate: a limited-privilege process that shuts down cleanly on request and reports its true working state rather than merely whether it is still alive
3. They are required only for the gateway role; every other role can omit all three safely
4. They exist purely to satisfy the xAPI Conformance Suite's container requirements
</div>

??? question "Show Answer"
    The correct answer is **B**. Together, a limited-privilege user, a signal-receiving PID 1, and a functionally honest healthcheck make the container safer to run and easier to trust operationally, even though each acts at a different moment in the container's life. A reduces their combined value to a coincidental side effect. C contradicts the chapter, which applies all three across every role built from this image. D invents a conformance-suite requirement unrelated to container hardening.

    **Concept Tested:** Non-Root Container User / PID 1 Signal Handling / Healthcheck Directive (synthesis)

    **See:** [Bringing the Image and the CLI Together](index.md#bringing-the-image-and-the-cli-together)

---
