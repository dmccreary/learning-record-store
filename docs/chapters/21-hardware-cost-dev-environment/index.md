---
title: Hardware Sizing, Cost, and the Development Environment
description: Deriving the production hardware footprint and monthly cost of the LRS at its 10,000-statement-per-second target, the cheaper single-server pilot tier, and how to provision a development host large enough to prove the burst-throughput claim.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 12:26:09
version: 0.09
---

# Hardware Sizing, Cost, and the Development Environment

## Summary

This chapter derives hardware requirements and a monthly cost estimate at the specification's full target scale, introduces the lower-cost single-server pilot tier, and covers how to provision a development host large enough to run the full stack, including the burst-throughput proof.

## Concepts Covered

This chapter covers the following 19 concepts from the learning graph:

1. Compute Plane Sizing
2. Monthly Cost Estimate
3. Reserved Instance Pricing
4. Neo4j Licensing Cost
5. Cost Sensitivity Driver
6. Single-Server Pilot Tier
7. VM Hypervisor Isolation
8. Bare-Metal Hosting
9. NVMe Local Storage
10. Network Ingress Sizing
11. Docker Desktop
12. Docker Engine
13. Remote SSH Development
14. Docker Context Over SSH
15. SSH Tunnel Port Forward
16. Hetzner Cloud Host
17. DigitalOcean Droplet
18. AWS EC2 Instance
19. UFW Firewall Rule

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 11: Architecture Decision Records and the Capacity Model](../11-adrs-and-capacity-model/index.md)
- [Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../17-compose-makefile-supply-chain/index.md)
- [Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../20-deviations-roadmap-open-questions/index.md)

---

!!! mascot-welcome "From Design to Invoice"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 20 closed on a promise: turning from open questions to the concrete budget and machine you'd actually need to build this system. That's this chapter's whole job — size the production fleet against the spec's 10,000-statement-per-second target, price it out in real dollars, size a cheaper single-server pilot tier, and answer the smaller question every builder faces first: what do I actually develop on? Let's follow the record.

Every architecture decision in this book eventually has to answer to a budget line and a piece of hardware in a rack or a cloud region. The functional specification's backpressure-and-scale target — sustained ingest of at least 10,000 statements per second, bursting to 50,000 — is not, by itself, a hardware requirement. It has to be translated into vCPUs, memory, disk throughput, and network bandwidth for each component in the stack, and that translation is what turns an architecture diagram into a monthly bill. This chapter works through that translation twice: once at full production scale, once at a tenth of that scale for a single-server pilot tier a district can run without committing to the larger fleet — then closes with the more immediate question of where *you* develop and test this system before either tier exists.

## Sizing the Production Fleet

The specification's 10,000-statement-per-second target does not mean 10,000 of anything everywhere in the system. **Compute Plane Sizing** translates one ingest number into the very different loads each component actually feels: roughly 100–400 HTTP requests per second at the gateway, because xAPI clients batch 25 to 100 statements per request; a flat ~2,500 graph upserts per second at the summarizer, because compression collapses many statements per learner into one periodic write; and about 15 MB/sec (120 Mbps) of raw network ingress — too small to bind any component in this design. Summing per-pod requirements across all seven application roles — gateway, stream processor, summarizer, reconciler, identity service, analytics API, admin API, and dashboards — comes to roughly 55 vCPU and 68 GB of memory. Add 30% headroom for autoscaler bursts, daemonsets, and rolling deploys, and the compute plane lands at roughly **9 worker nodes of 8 vCPU / 16 GB each, spread three per availability zone**.

The stores behind that compute plane scale differently from each other. Kafka and ClickHouse sit on the write-hot path and scale directly with ingest rate; Neo4j, Redis, and PostgreSQL scale with student and district population instead, so a 5× burst adds statements per active learner rather than new active learners and never touches graph-tier sizing. That asymmetry — event rate versus population — is the same distinction Chapter 11's capacity model introduced, and it is why the 50,000-statement burst target doesn't double the production bill: only Kafka's queue needs headroom for it, drained by autoscaled processor pods over the following minute rather than by permanently oversized infrastructure.

Turning that hardware footprint into a **Monthly Cost Estimate** means pricing each line item at current cloud list rates. The table below condenses the full component-by-component estimate into its major cost centers.

| Line item | Configuration | Est. $/month (on-demand) |
|---|---|---|
| Kubernetes control plane + 9 worker nodes | 8 vCPU/16 GB nodes, 3 AZs | ~$2,300 |
| Kafka (managed) | 3 brokers, 4 vCPU/16 GB, 1.1 TB storage | ~$1,950 |
| ClickHouse (self-hosted NVMe) | 3 × 8 vCPU/32 GB/4 TB NVMe | ~$1,980 |
| ClickHouse S3 cold tier | ~19 TB at steady state | ~$240 |
| Neo4j infrastructure | 3 × 8 vCPU/32 GB causal cluster | ~$840 |
| Neo4j Enterprise/Aura license | Quote-based, unresolved | see below |
| Redis (Multi-AZ) | 3 shards × 13 GB, 6 nodes | ~$990 |
| PostgreSQL ×2 (Multi-AZ) | vault-db + meta-db | ~$1,520 |
| S3, load balancing, NAT, cross-AZ transfer | | ~$500 |
| **Subtotal, infrastructure only** | | **~$10,300/month** |

That subtotal is the on-demand ceiling, not what a production deployment actually pays. This workload is steady and predictable — the same statements arrive every school day, week after week — which is exactly the shape **Reserved Instance Pricing** rewards. Committing to a 1–3 year reserved instance or savings plan on the steady-state pieces — compute, Kafka, ClickHouse, Neo4j infrastructure, Redis, and Postgres — typically cuts 30–50% off the on-demand rate, bringing the footprint toward roughly **$6,500–7,500 per month**. That gap is the difference between a first-year budget conversation and a three-year commitment, and it's worth having both figures on hand.

#### Diagram: Production Monthly Cost Breakdown

<iframe src="../../sims/production-monthly-cost-breakdown/main.html" width="100%" height="452px" scrolling="no"></iframe>

<details markdown="1">
<summary>Production Monthly Cost Breakdown</summary>
Type: chart
**sim-id:** production-monthly-cost-breakdown<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, break down

Learning objective: Break down the production system's monthly cost into its component line items, and compare the on-demand total against the reserved-pricing total to see which line items are fixed and which shrink under a multi-year commitment.

Chart type: Horizontal stacked bar chart, one bar per pricing mode, segments colored by line item (Kubernetes, Kafka, ClickHouse hot + cold tier, Neo4j infrastructure, Neo4j license, Redis, PostgreSQL, other).

Default state: "On-Demand" (~$10,300, Neo4j license as a hatched "unresolved" segment at the $3,000–8,000 placeholder midpoint) beside "Reserved (1–3 yr)" (~$7,000, segments scaled down 30–50% except the S3 cold tier and the Neo4j license, which don't discount).

Toggle — "Show Memgraph alternative": zeroes the Neo4j license segment on both bars, relabeling it "Memgraph (Apache-2.0, no license cost)," and shrinks each bar's total accordingly.

Interactive features: Hovering any segment shows its line item name, configuration, and dollar figure. Clicking the Neo4j license segment opens an infobox on why it's the largest source of uncertainty in the estimate.

Color scheme: Each line item a distinct palette hue; the unresolved Neo4j license segment hatched rather than solid to flag it as an estimate.

Responsive design: Bars and legend stack vertically on narrow viewports; hover targets stay tap-sized.
</details>

## The Open Variable: Neo4j Licensing

One line item in that table carries more uncertainty than everything else combined. **Neo4j Licensing Cost** exists because Neo4j Community edition — the free tier — cannot cluster, and the production topology's three-node causal cluster requires either Neo4j Enterprise, self-managed, or its managed counterpart AuraDB Enterprise. Neither publishes list pricing; both are quote-based and commonly land in the low-to-mid five figures per year for a cluster this size — a rough planning placeholder of **$3,000–8,000 per month**, not a quote. This is the same open question Chapter 20 named and assigned to architecture, due before the M2 milestone, because the answer changes nothing in the code and everything in the budget.

Two paths make that line item shrink or disappear. Memgraph, the drop-in alternative the design specification names, has an Apache-2.0 core with no per-node licensing cost — choosing it replaces the Neo4j Enterprise/Aura line with nothing but the infrastructure cost already counted above. Or a vendor quote could simply land inside that range, fixing the number instead of leaving it a placeholder. Either way, this decision is worth resolving before committing to a production budget, since it can swing the total by nearly as much as every other line item combined.

!!! mascot-thinking "One Decision, Disproportionate Weight"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Every other line item in the cost table is a firm estimate with a narrow range. The Neo4j license line spans $3,000 to $8,000 — a $5,000/month swing on its own, bigger than the entire PostgreSQL or Redis line. That's what makes it a **Cost Sensitivity Driver** rather than an ordinary budget line: a variable whose change moves the total noticeably, and the largest one in this estimate.

That observation generalizes. A **Cost Sensitivity Driver** is any input whose change moves the total estimate by a meaningful amount, distinct from a line item that is simply large but fixed. The statement rate is one: Kafka and ClickHouse scale roughly linearly with it, while Neo4j, Redis, and PostgreSQL barely move, since they track population, not event volume. The seven-year ClickHouse retention window is a slower one — the S3 cold-tier line grows from near zero toward its steady-state figure only once the window fills, while hot-tier NVMe cost stays flat regardless of retention length. And managed-versus-self-hosted Kafka or ClickHouse trades a usage-based bill that can climb higher at sustained throughput for the on-call burden of self-hosting — a trade the specification accepts for Kafka and ClickHouse but declines for Postgres and Redis, where it isn't worth the savings.

## A Lower-Cost Path: The Single-Server Pilot Tier

Not every deployment needs the multi-availability-zone fleet above on day one. The **Single-Server Pilot Tier** runs the identical container image and data model at one-tenth the ingest rate — 1,000 statements per second sustained instead of 10,000 — implying roughly 10,000 concurrent active students at peak, about the size of one large district. Every hardware number that mattered for production shrinks by roughly the same factor: sub-2-terabyte hot storage, low hundreds of megabits of network traffic, and a graph write rate of about 250 upserts per second — an order of magnitude below what a single unclustered Neo4j instance handles without strain. This tier is not a toy: it validates the same capacity-model assumptions against real school telemetry, and puts real dashboards in front of real teachers before the larger spend is committed.

Running that footprint on one machine still needs internal boundaries, and that's what **VM Hypervisor Isolation** provides. A hypervisor — Proxmox, KVM, or ESXi — carves one physical server into several virtual machines, each with its own kernel and network interface, without needing a full Kubernetes cluster. The pilot tier uses five VMs: `app` for the seven stateless application roles under the same `docker compose` shape Chapter 17 walked through, `streaming-analytics` for a single Kafka-compatible broker plus ClickHouse node, `graph-cache` for an unclustered Neo4j Community instance plus Redis, and two more isolated for compliance rather than scale — `vault`, holding only the PII vault database with minimal egress, the same boundary the specification requires at any deployment size, and `meta-objects`, holding the metadata database and object store. Together the five VMs need roughly 35 vCPU and 78 GB of memory, fitting a **dual-socket server with 32–48 physical cores, 128 GB of RAM, and 2–4 TB of NVMe in a mirrored array** — a standard mid-range rack server, not exotic hardware.

#### Diagram: Single-Server Pilot Tier VM Layout

<iframe src="../../sims/single-server-pilot-vm-layout/main.html" width="100%" height="462px" scrolling="no"></iframe>

<details markdown="1">
<summary>Single-Server Pilot Tier VM Layout</summary>
Type: infographic
**sim-id:** single-server-pilot-vm-layout<br/>
**Library:** p5.js<br/>
**Template:** https://github.com/dmccreary/data-science-course/tree/main/docs/sims/virtual-environment-isolation-microsim<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, classify

Learning objective: Explain how five virtual machines on one physical server separate workload roles and compliance boundaries, and identify which VM exists for a scale reason versus a compliance reason.

Canvas layout: One outer rectangle labeled "Physical Server (32–48 cores, 128 GB RAM, 2–4 TB NVMe RAID)" containing five inner boxes sized proportional to vCPU allocation: "app" (16 vCPU/20 GB), "streaming-analytics" (8 vCPU/28 GB), "graph-cache" (6 vCPU/20 GB), "vault" (2 vCPU/4 GB), "meta-objects" (3 vCPU/6 GB).

Visual elements: Each VM box in the book's teal accent color except "vault," outlined in amber to flag it as a compliance boundary rather than a workload split. A label band along the bottom reads "Hypervisor (Proxmox / KVM / ESXi)."

Interactive controls: Clicking a VM box opens an infobox with its exact contents (e.g., "graph-cache: Neo4j Community single instance + Redis") and vCPU/RAM allocation. A "Why is vault separate?" button opens an infobox with the compliance rationale.

Default parameters: All five VMs shown at once, sized to scale against each other.

Behavior: Hovering enlarges a box and dims the others; clicking pins the infobox open until another box or "Close" is clicked.

Implementation notes: p5.js rectangles with widths proportional to vCPU count; VM metadata stored as an array of objects (name, vCPU, RAM, contents, rationale). Responsive design: canvas width tracks its container; boxes stack into two rows on narrow viewports.
</details>

Two more decisions shape what this hardware costs and how it is acquired. **Bare-Metal Hosting** means renting a dedicated physical server at a flat monthly fee rather than hourly cloud rates — typically $300–800 per month for a comparable dual-socket spec, roughly a third of an equivalent cloud instance on-demand. Buying the hardware outright is the third option: $8,000–15,000 upfront amortizes to $220–420 per month over three years, plus $150–400 per month in colocation, power, and bandwidth if not run in-house. All three options land roughly 10–20 times cheaper than the production fleet's monthly bill, for two compounding reasons: a tenth of the infrastructure size, and no multi-zone redundancy tax. It also removes the Neo4j licensing question entirely — Community edition needs no cluster and therefore no Enterprise license at this scale.

Whichever way the hardware is acquired, its disks matter more than its label. **NVMe Local Storage** — solid-state storage attached directly to the server rather than reached over a network — is required for Kafka and ClickHouse because both sit on the write-hot path and depend on sustained sequential-write speed and low fsync latency; network-attached block storage adds latency that compounds under burst load. This is the one place where "server hardware" in the literal sense — a disk in the box, not a network volume — determines whether the throughput claims hold up under test, at every tier in this chapter. **Network Ingress Sizing** at the pilot tier follows the same tenth-scale pattern as everything else: about 12 Mbps sustained, rising to 60 Mbps at its own burst — traffic no consumer-grade connection would notice.

Running everything on one box without redundancy is a real trade-off, not a detail to gloss over.

- **Single point of failure.** Every store — Kafka, ClickHouse, Neo4j — is unclustered, so a host fault, an OS patch reboot, or a VM crash takes the whole system down until it restarts, with no replica to fail over to.
- **Kafka runs at replication factor 1 in practice**, not the production tier's factor of 3 — durability rests on the RAID array rather than cross-broker replication, though ClickHouse remains the true system of record, so this mainly affects how much lag is survivable during a restart.
- **Mitigations exist and are cheap relative to a second full cluster**: nightly or hourly backups to off-box object storage, RAID for disk-level redundancy, and — far cheaper than a second three-zone cluster — a warm standby second server built from backups for a manual failover path.

!!! mascot-encourage "Giving Up High Availability Isn't a Failure Here"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    A single point of failure sounds alarming next to the production fleet's three-zone redundancy, but remember what this tier is *for*: a pilot district proving the capacity model against real telemetry, not a permanent home for a multi-district fleet. Accepting a restart-and-recover posture for a tenth of the cost is reasonable — the spec even names when it stops being reasonable: once sustained ingest approaches 3,000–5,000 statements/sec, move toward the distributed topology instead of scaling the single box further.

## Why a Laptop Isn't Enough to Build On

Production sizing and the pilot tier both answer "what does this cost to run for real users?" A smaller question comes first for anyone writing the code: what do you develop on? The Docker Compose stack this project builds against — trimmed from the pilot tier's full profile for local development — still needs roughly 8 GB of resident memory once every store and role is running: about 3.3 GB for Neo4j, 2 GB for ClickHouse, 1 GB for the Kafka-compatible broker, the rest split across three processor workers and four more Python roles. On an 8 GB laptop, the runtime and OS need 2–3 GB before a single container starts, so the stack doesn't fit — it squeezes to about 3.5 GB by trimming Neo4j's heap and running one processor instead of three, fine for correctness but fatal to the one measurement this stack exists to produce: driving ingest from 200 to 1,000 statements per second and confirming the graph write rate stays flat. On a memory-saturated machine, a flat line is ambiguous — it might mean the architecture decouples graph writes from ingest, or it might mean the load generator never reached 1,000/sec because the machine was swapping. That measurement only means something with real headroom to spare.

The table below sizes three tiers of development host against exactly that need, matched to which of the five MVP build steps each tier can prove.

| Tier | RAM | vCPU | Disk | Good for |
|---|---|---|---|---|
| Minimum | 8 GB | 4 | 40 GB | Correctness only — a *dedicated* 8 GB box, with nothing else competing for memory |
| Recommended | 16 GB | 8 | 80–100 GB | The full stack including the burst-throughput proof, with headroom for the stores to absorb 1,000 statements/sec without contention |
| Generous | 32 GB | 8 | 100 GB | Zero worry, and room to push past 1,000 statements/sec for a wider burst ratio |

#### Diagram: Build Steps to Development Host Tier

<iframe src="../../sims/build-steps-to-host-tier-timeline/main.html" width="100%" height="402px" scrolling="no"></iframe>

<details markdown="1">
<summary>Build Steps to Development Host Tier</summary>
Type: timeline
**sim-id:** build-steps-to-host-tier-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, match

Learning objective: Match each of the five MVP build steps to the minimum development host tier that can prove it, and recognize that only the final step — the burst-throughput proof — requires the Recommended tier.

Time period: Not calendar time — five sequential build steps, rendered as five contiguous blocks in build order.

Orientation: Horizontal, left to right, each block labeled with its step number and headline task.

Events:

- Step 1: Foundation, bootstrap, infrastructure validation — host tier: Minimum; backing services only, no image needed yet
- Step 2: Ingest path (gateway to processor to ClickHouse) — host tier: Minimum; full stack, low volume
- Step 3: Load generator at the contract shape — host tier: Minimum to Recommended; 200 statements/sec baseline
- Step 4: Compression, graph, and mastery correctness — host tier: Minimum; correctness proofs hold at any volume
- Step 5: The burst-throughput proof (200 to 1,000 statements/sec) — host tier: Recommended (16 GB, local NVMe); the measurement this stack exists to produce

Interactive features: Clicking a step block opens an infobox with its full description and required tier. A "Minimum vs. Recommended" toggle recolors all five blocks to show that four of five steps fit on the smallest host and only the last needs the larger one.

Visual style: Blocks 1–4 shaded calm teal ("fits on Minimum"); block 5 shaded amber to flag its stricter requirement.

Responsive design: The timeline resizes to its container's width; on narrow viewports, labels abbreviate to step number and expand on tap.
</details>

Two runtimes reach that host, depending on where it lives. **Docker Desktop** is the packaged runtime for a Mac or Windows workstation — install it, then raise its resource limits, because Docker Desktop caps container memory at whatever its settings allow regardless of physical RAM; a fresh install often defaults too low to run this stack. **Docker Engine** is the headless equivalent for a Linux server with no GUI: the same `docker` and `docker compose` CLI, installed from the official package repository, producing a Compose stack byte-identical to the one under Docker Desktop. Which one you install depends only on whether the host is a workstation you own or a rented Linux box — the compose file and Makefile don't care which runtime launched them.

!!! mascot-tip "Local NVMe Is the Detail That Makes the Burst Test Trustworthy"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    Whichever host you pick, check that its disk is local, not network-attached. Most VPS providers attach local NVMe by default; on AWS, the default EBS volume is network-attached, so pick an `i`-family or `d`-family instance with local instance storage for the burst test. Measuring on network-attached storage risks measuring the storage layer's latency instead of the architecture's claim.

## Choosing a Cloud Host and Developing Against It

If you already own a workstation with 16 GB or more of RAM, the simplest path skips cloud rental entirely — install Docker Desktop and run the stack directly, at no ongoing cost. Renting a cloud box by the hour is the fallback: since the burst test runs for minutes, the usual pattern is to provision, prove the architecture, and destroy the box the same afternoon for the price of a coffee.

| Provider | Instance | Specs | Approx. cost | Notes |
|---|---|---|---|---|
| **Hetzner Cloud** | CPX41 | 8 vCPU, 16 GB, 240 GB NVMe | ~€0.06/hr, ~€28/mo | Local NVMe by default; best value of the three |
| **DigitalOcean** | Basic 16 GB Droplet | 8 vCPU, 16 GB, 100 GB NVMe | ~$0.24/hr, ~$96/mo | Simplest interface; one-click Docker droplet image |
| **AWS EC2** | `m6i.2xlarge` | 8 vCPU, 32 GB | ~$0.38/hr on-demand | Default storage is network-attached EBS — add instance-store or expect burst-test latency to reflect the disk, not the design |

A **Hetzner Cloud Host** is the recommended default: it pairs the Recommended tier's specs with local NVMe at the lowest price of the three, and a full burst-proof session — provision, bring the stack up, seed data, run the 200 and 1,000-statement passes, read the results — finishes comfortably in under an hour. A **DigitalOcean Droplet** trades a little price advantage for the simplest console and a one-click Docker-ready image, useful for a first-time provisioner. An **AWS EC2 Instance** is worth choosing mainly if an AWS account already exists — `m6i.2xlarge` matches the Recommended tier's vCPU and exceeds its RAM, but its default `gp3` volume is network-attached, so swap in an instance-store-backed family before trusting a burst measurement.

Once a host is running, the code still needs editing from somewhere — a separate decision from where the containers run. **Remote SSH Development** is the smoothest pattern: an editor extension — VS Code's or Cursor's "Remote-SSH" — opens the repository directly on the server, so the editor UI is local but the files, terminal, and every `make` command run remotely, with ports forwarded automatically so the gateway and Neo4j browser open locally with no manual setup. **Docker Context Over SSH** keeps the Docker CLI and any GUI local but points it at an engine on the remote host over SSH — `docker context create` then `docker context use` — honoring a Docker Desktop workflow while containers run elsewhere. The plainest pattern needs no tooling at all: commit and push locally, `git pull` on the server, and work inside a normal SSH session — no editor integration, but always works as a fallback.

#### Diagram: Three Ways to Develop Against a Remote Host

<iframe src="../../sims/remote-dev-workflow-comparison/main.html" width="100%" height="297px" scrolling="no"></iframe>

<details markdown="1">
<summary>Three Ways to Develop Against a Remote Host</summary>
Type: workflow
**sim-id:** remote-dev-workflow-comparison<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Compare Remote SSH Development, Docker Context Over SSH, and plain git-plus-SSH as three ways of developing against containers running on a rented host, and identify which piece of tooling runs locally versus remotely in each pattern.

Purpose: A Mermaid flowchart with three parallel branches, each starting from a shared "Laptop" node and ending at a shared "Remote Host running Docker Engine" node, so the learner sees what crosses the network in each pattern.

Branch A "Remote SSH Development": "Laptop (editor UI only)" -> "VS Code / Cursor Remote-SSH extension" -> "Files, terminal, `make up` execute on" -> "Remote Host." Tag: "Ports auto-forwarded to localhost; smoothest loop, no manual tunnel."

Branch B "Docker Context Over SSH": "Laptop (Docker CLI + GUI)" -> "`docker context use lrs-remote`" -> "Commands sent over SSH to" -> "Remote Host's Docker engine." Tag: "Containers publish ports remotely — needs a manual SSH Tunnel Port Forward for `localhost` scripts."

Branch C "Plain git + SSH": "Laptop (git commit/push)" -> "GitHub" -> "`git pull` inside an SSH session on" -> "Remote Host." Tag: "No editor integration; simplest fallback, always works."

Interactive features: Every node has a Mermaid click directive. Clicking a tag node opens an infobox with its trade-off text. Clicking the shared "Remote Host" node opens an infobox naming the UFW Firewall Rule that keeps only SSH exposed.

Color coding: Branch A teal (recommended default); Branch B amber; Branch C neutral gray; shared start/end nodes darker neutral.

Responsive design: The three branches stack vertically on narrow viewports, preserving click handlers and tag text.
</details>

Whichever pattern is chosen, the host needs to be locked down before it holds anything resembling student data, synthetic or not. A **UFW Firewall Rule** is the mechanism: on a fresh Ubuntu host, `sudo ufw allow OpenSSH` followed by `sudo ufw --force enable` exposes exactly one port — SSH — so the gateway, Neo4j browser, and ClickHouse's HTTP interface stay unreachable from the public internet. Reaching those services still has to work for development, and that's what an **SSH Tunnel Port Forward** provides: a command like `ssh -N -L 8080:localhost:8080 -L 7474:localhost:7474 lrs@YOUR_SERVER_IP` opens an encrypted path from a local port to the same port remotely, so `localhost:8080` on the laptop transparently reaches the gateway — without opening it to the internet. Remote SSH Development handles this automatically; the other two patterns need it set up by hand.

!!! mascot-warning "Never Open the Service Ports Directly"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It's tempting, mid-debugging-session, to run `sudo ufw allow 8080` just to check something quickly from a phone browser. Don't. An open Neo4j browser or ClickHouse HTTP port on a public IP is found by automated scanners within minutes, and the data behind it is student-shaped even when synthetic. Reach every service through the SSH tunnel or an editor's automatic port-forwarding — never through a firewall rule that exposes it directly.

## Bringing the Numbers Together

Three sizing exercises, one method: start from an ingest target and work outward to dollars and silicon. Production sizing does it at full scale, with Neo4j licensing as the biggest lever. The pilot tier does it at a tenth of the scale, trading redundancy for a cost ten to twenty times lower. The development host does it smallest of all — sized against one measurement, the burst-throughput proof, that only means something with real headroom to spare.

## Key Takeaways

- **Compute Plane Sizing** translates one ingest number — 10,000 statements/sec — into very different per-component loads: gateway requests, flat graph upserts, and low network bandwidth.
- The **Monthly Cost Estimate** for the production fleet is roughly $10,300/month on-demand, falling to $6,500–7,500/month under **Reserved Instance Pricing** on the steady-state components.
- **Neo4j Licensing Cost** is the largest **Cost Sensitivity Driver** in the whole estimate — a $3,000–8,000/month placeholder resolved by either a vendor quote or switching to the license-free Memgraph alternative.
- The **Single-Server Pilot Tier** runs the identical stack at a tenth of production scale, using **VM Hypervisor Isolation** to separate workload roles and the vault's compliance boundary on one machine.
- **Bare-Metal Hosting** and owned hardware both undercut cloud rental for the pilot tier, and **NVMe Local Storage** plus modest **Network Ingress Sizing** hold at every scale in this chapter.
- **Docker Desktop** and **Docker Engine** are the same Compose stack on two different hosts — a Mac/Windows workstation versus a headless Linux server.
- **Remote SSH Development**, **Docker Context Over SSH**, and plain git-plus-SSH are three ways to edit code locally while running containers on a rented **Hetzner Cloud Host**, **DigitalOcean Droplet**, or **AWS EC2 Instance**.
- A **UFW Firewall Rule** exposing only SSH, combined with an **SSH Tunnel Port Forward** for everything else, keeps a development host's service ports off the public internet entirely.

!!! mascot-celebration "You Can Now Price and Provision This System"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You can now put a real number on the production fleet, explain why the single-server pilot tier costs a tenth as much, and stand up a development host that won't lie to you about the burst-throughput claim. What does the evidence show? A budget and a machine are necessary, but they aren't sufficient — the whole point of sizing a development host this carefully is to actually run the proof it was built for. In [Chapter 22: Proving the Architecture - the MVP Plan](../22-proving-the-architecture-mvp/index.md), we put that host to work.
