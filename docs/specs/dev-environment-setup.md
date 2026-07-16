---
title: Development Environment — Running the MVP Stack on a Larger Host
description: How to provision and use a host with enough RAM and disk to run the LRS architecture-proof stack, why an 8 GB laptop is too small for the burst test, and the develop-against-remote workflow.
image: ../img/cover.png
status: scaffold
---

# Development Environment — Running the MVP Stack on a Larger Host

**Companion to:** [LRS Design & Deployment v1](./lrs-design-v1.md) · [Hardware Requirements](./hardware-requirements.md)
**Status:** Draft for review · 2026-07-16
**Scope:** The developer host that runs `docker compose` for the architecture-proof MVP (the `deploy/docker-compose.yml` stack), **not** the production or single-server pilot tiers — those are [hardware-requirements §7 and §8](./hardware-requirements.md). This is the box you build and test on.

---

## 1. Why not the laptop

The development machine this was scoped on is an Apple M2 with **8 GB of RAM**. The MVP compose stack — already trimmed below the design's Core profile (no `meta-db`, no MinIO, three app roles dropped) — still needs roughly this much resident memory:

| Service | Resident (approx.) | Why |
|---|---|---|
| Neo4j | ~3.3 GB | 2 G heap + 1 G pagecache + JVM (as lifted from design §8.4) |
| ClickHouse | ~2.0 GB | comfortable working set at low volume |
| Redpanda | ~1.0 GB | `--memory=1G` |
| processor ×3 | ~0.75 GB | Python workers |
| gateway + identity + summarizer | ~0.6 GB | three more Python roles |
| vault-db + redis | ~0.3 GB | |
| **Total** | **~8.0 GB** | before the Docker VM and macOS take their share |

On an 8 GB host the Docker VM and the OS need 2–3 GB before a single container starts, so the stack does not fit. It *can* be squeezed — Neo4j down to 512 M heap, one processor instead of three, ClickHouse capped — to about 3.5 GB, which fits, and that squeeze is fine for the **correctness** proofs in build steps 1–4 (C-1, C-3, C-6, the mastery join all hold at any volume).

But **step 5 is the whole point of this MVP**: drive ingest from 200 to 1,000 statements/sec and show the graph write rate stays flat ([design §4.1](./lrs-design-v1.md#4-capacity-model)). On a memory-saturated box a flat line is ambiguous — it could mean the architecture decouples graph writes from ingest, or it could mean `loadgen` never managed to push 1,000/sec because the machine was swapping. The burst test only means something with headroom to spare. That needs a bigger host.

---

## 2. What the host actually needs

| Tier | RAM | vCPU | Disk | Good for |
|---|---|---|---|---|
| **Minimum** | 8 GB | 4 | 40 GB | Steps 1–4 only (correctness). A *dedicated* 8 GB box works where the laptop can't, because nothing else is running on it. |
| **Recommended** | 16 GB | 8 | 80–100 GB | The full MVP including the step-5 burst, with room for ClickHouse and Redpanda to absorb 1,000/sec without contention. |
| **Generous** | 32 GB | 8 | 100 GB | Zero worry; lets you push past 1,000/sec if you want a wider burst ratio. |

Two details that affect whether the burst number is *trustworthy*:

- **Local NVMe, not network block storage.** [Hardware §8.2](./hardware-requirements.md) makes the point that Kafka and ClickHouse are on the write-hot-path and "network-attached block storage (e.g., standard EBS gp3) adds latency that compounds under burst." For a faithful step-5 measurement, pick a host with **local NVMe**. Most VPS providers (Hetzner, DigitalOcean) attach local NVMe by default; on AWS, the default `gp3` EBS volume is network-attached, so prefer an instance with local instance-store (the `i`-family or `d`-family) if you run the burst there — otherwise you may be measuring EBS, not the design.
- **Disk is not the binding constraint.** Images total ~5 GB (ClickHouse ~1 GB, Neo4j ~0.6 GB, Redpanda ~0.7 GB, Postgres/Redis small, the `lrs` image ~0.25 GB, plus build cache). A few hours of 1,000/sec ingest adds only a couple of GB to the ClickHouse and Redpanda volumes. 40 GB is enough for correctness; 80–100 GB gives the burst comfortable headroom.

---

## 3. Choose a host

**If you already own a workstation with 16 GB+ of RAM** (a bigger Mac, a Windows desktop, a Linux tower) — use it, and skip to [§4b](#4b-docker-desktop-on-a-mac-or-windows-workstation). Docker Desktop (your chosen runtime) runs there directly, and you avoid all cloud cost and setup.

**Otherwise, rent a cloud box by the hour.** The burst test runs for minutes, so you can provision, prove the architecture, and destroy the box the same afternoon for the price of a coffee. Three concrete options, cheapest first:

| Provider | Instance | Specs | ~Hourly | ~Monthly | Notes |
|---|---|---|---|---|---|
| **Hetzner Cloud** (Rec.) | CPX41 | 8 vCPU, 16 GB, 240 GB NVMe | ~€0.06 | ~€28 | Local NVMe, best value. US (Ashburn/Hillsboro) and EU regions. |
| **DigitalOcean** | Basic 16 GB | 8 vCPU, 16 GB, 100 GB NVMe | ~$0.24 | ~$96 | Simplest UI; one-click Docker droplet image. |
| **AWS EC2** | `m6i.2xlarge` | 8 vCPU, 32 GB | ~$0.38 | on-demand | Use if you already have an account. **Watch the EBS caveat above** — add instance-store or expect network-disk latency in the burst. Spot pricing roughly halves it. |

**Recommendation: a Hetzner CPX41 (or any provider's 16 GB / 8 vCPU / local-NVMe box), created for the burst and destroyed afterward.** A full step-5 session — provision, `make up`, seed, run the 200 and 1,000/sec passes, read the numbers — is well under an hour, so ~€0.20 of compute. If you want the box to persist for daily development, ~€28/month is still an order of magnitude under the [hardware §8 pilot tier](./hardware-requirements.md#8-lower-cost-alternative-single-server-at-1000-statementssec).

---

## 4a. Provision a Linux cloud host (Ubuntu 24.04 + Docker Engine)

On a headless Linux server you install **Docker Engine**, not Docker Desktop — it is the same `docker` and `docker compose` CLI without the GUI, and the `deploy/docker-compose.yml` in this repo is byte-identical either way. (Docker Desktop is for the Mac/Windows path in §4b.)

**Step 1 — create the server** with your provider's console or CLI: Ubuntu 24.04 LTS, the size from §3, your SSH key added. Note its IP.

**Step 2 — first login, create a non-root user, lock down SSH:**

```bash
ssh root@YOUR_SERVER_IP
adduser lrs && usermod -aG sudo lrs
rsync --archive --chown=lrs:lrs ~/.ssh /home/lrs   # copy your key to the new user
# then reconnect as: ssh lrs@YOUR_SERVER_IP
```

**Step 3 — install Docker Engine** (official apt repository):

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER    # log out and back in so this takes effect
docker compose version           # confirm the plugin is present
```

**Step 4 — firewall: expose SSH only** (the LRS ports are reached through an SSH tunnel, never the public internet — see [§6](#6-security)):

```bash
sudo ufw allow OpenSSH
sudo ufw --force enable
```

**Step 5 — get the code and bring up the backing services.** The application image cannot build yet — it needs `uv.lock` and the `lrs` CLI, which are written in build steps 1–2 — but the **backing services need no image**, and standing them up is exactly the [day-1 infrastructure validation the build plan front-loads](./lrs-design-v1.md#63-neo4j-structure):

```bash
git clone https://github.com/dmccreary/learning-record-store.git
cd learning-record-store
cp .env.example .env && nano .env          # change every password
docker compose -f deploy/docker-compose.yml up -d redpanda clickhouse neo4j vault-db redis
docker compose -f deploy/docker-compose.yml ps   # do all five reach "healthy"?
```

Then prove the two assumptions the whole architecture rests on, before a line of Python exists:

```bash
# (a) Do the healthchecks actually pass on the pinned image tags?
#     If clickhouse/neo4j hang in "starting" forever, the wget-based checks the
#     design shipped are the culprit — this compose already swaps them for
#     clickhouse-client / cypher-shell, so they should go healthy.

# (b) Does composite IS UNIQUE work on neo4j:5.26-community? This constraint IS
#     the enforcement mechanism for spec C-1. If it needs Enterprise, we learn
#     it now, not in month 6.
source .env
docker compose -f deploy/docker-compose.yml exec neo4j cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
  "CREATE CONSTRAINT mastery_grain IF NOT EXISTS
   FOR (m:ConceptMastery) REQUIRE (m.student_key, m.concept_id) IS UNIQUE;"
docker compose -f deploy/docker-compose.yml exec neo4j cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
  "SHOW CONSTRAINTS;"
```

Once the `lrs` CLI and `uv.lock` exist (build step 1–2), `make up` builds the image and runs the full stack; `make smoke`, `make perf`, and `make burst` follow.

## 4b. Docker Desktop on a Mac or Windows workstation

If the larger host is a machine you own:

1. Install **Docker Desktop** (your chosen runtime) from docker.com.
2. **Raise its resource limits** — this is the step that matters, and the one an 8 GB machine can't satisfy. Settings → Resources → set Memory to at least **12 GB** (of a 16 GB machine) and CPUs to 6–8. Docker Desktop caps container memory at whatever you set here regardless of physical RAM, so a fresh install often defaults low.
3. `git clone`, `cp .env.example .env`, edit passwords, then `make up`.

The compose file, Makefile, and smoke script are identical to the Linux path.

---

## 5. Developing against a remote host

You keep editing on your laptop; the containers run on the big box. Three ways, best first:

**A — VS Code (or Cursor) Remote-SSH (recommended).** Install the "Remote - SSH" extension, add `lrs@YOUR_SERVER_IP` as a host, and open the cloned repo folder *on the server*. Your editor is local; the files, the integrated terminal, and `make up` all run remotely. This is the smoothest loop — edit a Python file, `make up` in the built-in terminal, `make smoke` — with no sync step. Port-forwarding is automatic: VS Code tunnels `localhost:8080`, `:7474`, `:7687` back to your laptop so the gateway and the Neo4j browser open locally.

**B — Docker context over SSH (keeps Docker Desktop as the client).** This honors the Docker-Desktop choice literally: the CLI and GUI stay on your Mac, but the *engine* runs on the remote host.

```bash
docker context create lrs-remote --docker "host=ssh://lrs@YOUR_SERVER_IP"
docker context use lrs-remote
make up          # builds and runs on the remote engine
```

One caveat: containers publish their ports on the **remote** host, so `scripts/smoke.sh` — which posts to `http://localhost:8080` — must either run *on* the server, or you open a tunnel first:

```bash
ssh -N -L 8080:localhost:8080 -L 7474:localhost:7474 -L 7687:localhost:7687 lrs@YOUR_SERVER_IP &
./scripts/smoke.sh --tier=ingest
```

**C — plain git + SSH.** Commit and push from the laptop, `git pull` on the server, run there in an SSH session. No editor integration, but nothing to install and it always works.

---

## 6. Security

The stack has no authentication in front of Neo4j, ClickHouse, or the gateway in dev, and the data is student-shaped even while it is synthetic. Treat the boundary as real now so it is already habit when real telemetry arrives (the point the [pilot tier makes about the vault](./hardware-requirements.md#8-lower-cost-alternative-single-server-at-1000-statementssec) — it is a compliance boundary regardless of scale).

- **Never publish the service ports.** The firewall in §4a exposes only SSH. Do not add `ufw allow 8080` (or 7474/8123/9092). Reach every service through the SSH tunnel or VS Code's automatic forwarding. An open Neo4j browser or ClickHouse HTTP port on a public IP is found by scanners within minutes.
- **Change every value in `.env`.** The `.env.example` ships `change-me-*` placeholders; a real password on each. `.env` is git-ignored (this repo fixed that — it was not, originally).
- **The `vault-net` isolation carries over.** The compose file puts `vault-db` on an `internal` network with no host port; keep it that way. Only the `identity` role should reach it.
- **Destroy, don't hoard.** A short-lived burst-test box that no longer exists cannot leak.

---

## 7. Cost control and teardown

- **By the hour:** the burst proof is minutes of work. Provision, prove, destroy — a few cents.
- **Persisting for daily dev:** stop the box when idle if your provider bills only for running compute (AWS does; Hetzner/DO bill for the allocated server whether on or off, so for those, *destroy* rather than stop and re-create from a snapshot). A snapshot is a few GB and pennies per month.
- **Clean teardown:**

```bash
docker compose -f deploy/docker-compose.yml down -v   # stop and drop all volumes
# then destroy the server in the provider console, or:
# hcloud server delete lrs   /   doctl compute droplet delete lrs   /   aws ec2 terminate-instances ...
```

---

## 8. How this maps to the build steps

| Build step (from the plan) | Host needed | What runs |
|---|---|---|
| 1 — foundation, bootstrap, infra validation | Minimum (8 GB dedicated) | backing services only; no image build needed for the two day-1 checks |
| 2 — ingest path (gateway → processor → ClickHouse) | Minimum | full stack, low volume |
| 3 — `loadgen` at the contract shape | Minimum → Recommended | 200/sec baseline |
| 4 — compression + graph + mastery | Minimum | correctness proofs, any volume |
| **5 — the burst proof (200 → 1,000/sec)** | **Recommended (16 GB, local NVMe)** | the measurement the MVP exists to produce |

The correctness of the architecture (steps 1–4) can be shown on a modest box. The *claim* that makes the architecture worth building — graph writes flat under a 5× ingest burst — needs the Recommended tier to measure honestly.
