---
title: "Quiz: Hardware Sizing, Cost, and the Development Environment"
description: Review questions on production fleet sizing and cost, Neo4j licensing as a cost sensitivity driver, the single-server pilot tier, and provisioning a trustworthy development host.
social:
   cards: false
---
# Quiz: Hardware Sizing, Cost, and the Development Environment

Test your understanding of this project's hardware sizing, cost estimates, and development environment provisioning with these review questions.

---

#### 1. Why does Compute Plane Sizing translate the 10,000-statement-per-second ingest target into very different numbers at different components, such as ~200 requests/sec at the gateway versus a flat ~2,500 graph upserts/sec at the summarizer?

<div class="upper-alpha" markdown>
1. Because each component sits at a different point in the pipeline and is shaped by a different factor — batching at the gateway, compression at the summarizer — rather than all components scaling linearly with the raw statement rate
2. Because the specification requires every component to be sized identically regardless of its actual role
3. Because the gateway and summarizer run on physically separate networks with different bandwidth limits
4. Because the summarizer only processes 25% of the statements the gateway receives
</div>

??? question "Show Answer"
    The correct answer is **A**. The gateway's request rate is shaped by batching, while the summarizer's write rate is shaped by compression — each component feels the same underlying ingest number differently based on its own role in the pipeline. B contradicts the whole point of component-specific sizing. C invents an unrelated network-topology explanation. D fabricates a fixed processing fraction the chapter never states.

    **Concept Tested:** Compute Plane Sizing

    **See:** [Sizing the Production Fleet](index.md#sizing-the-production-fleet)

---

#### 2. What is the production fleet's approximate Monthly Cost Estimate on-demand, before any reserved pricing discount?

<div class="upper-alpha" markdown>
1. Roughly $1,000/month
2. Roughly $100,000/month
3. Roughly $500/month
4. Roughly $10,300/month
</div>

??? question "Show Answer"
    The correct answer is **D**. The condensed component-by-component estimate sums to roughly $10,300/month on-demand for the production fleet's infrastructure. A, B, and C each land far outside the figure the chapter's cost table actually derives.

    **Concept Tested:** Monthly Cost Estimate

    **See:** [Sizing the Production Fleet](index.md#sizing-the-production-fleet)

---

#### 3. What does committing to Reserved Instance Pricing do to the production fleet's monthly cost?

<div class="upper-alpha" markdown>
1. It has no measurable effect on cost, only on contract length
2. It doubles the on-demand cost in exchange for guaranteed capacity
3. It typically cuts 30-50% off the on-demand rate for steady-state components, bringing the total toward roughly $6,500-7,500/month
4. It only applies to the Neo4j licensing line item
</div>

??? question "Show Answer"
    The correct answer is **C**. Because this workload is steady and predictable, committing to a 1-3 year reserved instance or savings plan typically cuts 30-50% off the on-demand rate, bringing the footprint down to roughly $6,500-7,500/month. A understates its real effect. B reverses the direction of the discount entirely. D wrongly restricts the discount to a single line item, when it applies across the steady-state components.

    **Concept Tested:** Reserved Instance Pricing

    **See:** [Sizing the Production Fleet](index.md#sizing-the-production-fleet)

---

#### 4. Why is Neo4j Licensing Cost singled out as the largest Cost Sensitivity Driver in the entire production cost estimate?

<div class="upper-alpha" markdown>
1. Because its $3,000-8,000/month range is a bigger swing on its own than the entire PostgreSQL or Redis line, making it the input whose resolution moves the total estimate the most
2. Because it is simply the single largest line item in absolute dollar terms
3. Because it is the only line item that scales with statement rate rather than population
4. Because it is the only cost that applies exclusively to the pilot tier, not production
</div>

??? question "Show Answer"
    The correct answer is **A**. A Cost Sensitivity Driver is defined by how much its own uncertainty moves the total, and Neo4j's $5,000/month range swing is larger than several other line items combined, which is what makes it disproportionately significant. B misdefines the concept as simple absolute size rather than sensitivity. C is false — Kafka and ClickHouse, not Neo4j, scale with statement rate. D is backwards; the pilot tier specifically avoids this cost by using unclustered Community edition.

    **Concept Tested:** Neo4j Licensing Cost / Cost Sensitivity Driver

    **See:** [The Open Variable: Neo4j Licensing](index.md#the-open-variable-neo4j-licensing)

---

#### 5. What ingest rate does the Single-Server Pilot Tier target, relative to the full production specification?

<div class="upper-alpha" markdown>
1. The identical 10,000 statements per second as production, just on fewer machines
2. 50,000 statements per second, matching only the burst target
3. 100 statements per second, matching only the gateway's HTTP request rate
4. 1,000 statements per second sustained — one-tenth of the 10,000-statement-per-second production target
</div>

??? question "Show Answer"
    The correct answer is **D**. The pilot tier runs the identical container image and data model at one-tenth the production ingest rate, 1,000 statements per second sustained instead of 10,000. A contradicts the whole purpose of a lower-cost pilot tier. B and C each confuse the pilot rate with an unrelated production figure.

    **Concept Tested:** Single-Server Pilot Tier

    **See:** [A Lower-Cost Path: The Single-Server Pilot Tier](index.md#a-lower-cost-path-the-single-server-pilot-tier)

---

#### 6. Why is the pilot tier's `vault` VM kept separate from the other four VMs on the same physical server?

<div class="upper-alpha" markdown>
1. Because it needs more CPU cores than any other VM in the pilot tier
2. Because it is the only VM that runs a different hypervisor than the rest
3. Because it holds only the PII vault database with minimal egress, enforcing the same compliance boundary the specification requires at any deployment size, not because it needs more compute
4. Because it is the VM responsible for running the Kafka-compatible broker
</div>

??? question "Show Answer"
    The correct answer is **C**. The `vault` VM is isolated for a compliance reason, not a scale reason — it holds only the PII vault database with minimal egress, enforcing the same boundary the specification requires regardless of deployment size. A is false; `vault` is one of the smallest VMs by allocation. B invents a hypervisor difference the chapter never describes. D misattributes the Kafka-compatible broker to the `streaming-analytics` VM instead.

    **Concept Tested:** VM Hypervisor Isolation

    **See:** [A Lower-Cost Path: The Single-Server Pilot Tier](index.md#a-lower-cost-path-the-single-server-pilot-tier)

---

#### 7. A district wants to run the pilot tier as cheaply as possible while still getting predictable monthly billing rather than hourly cloud rates. Which acquisition option does this chapter describe as fitting that need, and at roughly what cost?

<div class="upper-alpha" markdown>
1. A production-scale Kubernetes cluster, at roughly $10,300/month
2. Bare-Metal Hosting — renting a dedicated physical server at a flat monthly fee, typically $300-800/month for a comparable dual-socket spec
3. An hourly AWS EC2 on-demand instance, billed only while running
4. A managed Neo4j Aura subscription, priced independently of the rest of the stack
</div>

??? question "Show Answer"
    The correct answer is **B**. Bare-Metal Hosting rents a dedicated server at a flat monthly fee, typically $300-800/month for a comparable dual-socket spec, roughly a third of an equivalent cloud instance's on-demand rate. A names the full production fleet, far larger than needed here. C is explicitly hourly, not the predictable flat fee requested. D names an unrelated managed database service, not a server acquisition option.

    **Concept Tested:** Bare-Metal Hosting

    **See:** [A Lower-Cost Path: The Single-Server Pilot Tier](index.md#a-lower-cost-path-the-single-server-pilot-tier)

---

#### 8. A team provisions a cloud instance for the burst-throughput proof and unknowingly selects a volume type that is network-attached rather than local. What is the specific risk this creates for their measurement?

<div class="upper-alpha" markdown>
1. The measurement becomes meaningless in a different way: it may end up measuring the network-attached storage layer's latency rather than the architecture's actual claim, since Kafka and ClickHouse depend on sustained sequential-write speed and low fsync latency that network storage can compound
2. Network-attached storage always makes a system faster, so the measurement would simply look better than reality
3. Network-attached storage has no effect on Kafka or ClickHouse, only on Neo4j
4. The burst test would fail to start entirely, making the risk obvious immediately
</div>

??? question "Show Answer"
    The correct answer is **A**. Because Kafka and ClickHouse sit on the write-hot path and depend on fast sequential writes and low fsync latency, network-attached storage's added latency risks the test measuring the storage layer instead of the architecture's own claim — a silent, not obvious, failure mode. B invents an implausible performance benefit. C misattributes the risk to the wrong component. D wrongly assumes the problem would be immediately visible rather than silently confounding the result.

    **Concept Tested:** NVMe Local Storage

    **See:** [Why a Laptop Isn't Enough to Build On](index.md#why-a-laptop-isnt-enough-to-build-on)

---

#### 9. What is the key difference between Docker Desktop and Docker Engine?

<div class="upper-alpha" markdown>
1. Docker Desktop only runs backing services, while Docker Engine only runs application roles
2. Docker Desktop is the packaged runtime for a Mac or Windows workstation, while Docker Engine is the headless equivalent for a Linux server, but both produce a byte-identical Compose stack
3. Docker Engine requires a graphical interface, while Docker Desktop does not
4. Docker Desktop is required for production deployments, while Docker Engine is development-only
</div>

??? question "Show Answer"
    The correct answer is **B**. Docker Desktop targets a Mac or Windows workstation, Docker Engine targets a headless Linux server, and the choice between them depends only on which kind of host is being used, since both produce the identical Compose stack. A invents an artificial service-role split neither runtime enforces. C reverses which one needs a GUI. D misstates both runtimes' actual roles, which are about host type, not deployment stage.

    **Concept Tested:** Docker Desktop / Docker Engine

    **See:** [Why a Laptop Isn't Enough to Build On](index.md#why-a-laptop-isnt-enough-to-build-on)

---

#### 10. A developer wants the cheapest possible cloud host for a one-time burst-throughput proof, with local NVMe storage included by default, and is not particular about which provider's console they use. Which option does this chapter recommend as the default choice, and why?

<div class="upper-alpha" markdown>
1. AWS EC2's m6i.2xlarge, because it exceeds the Recommended tier's RAM
2. DigitalOcean's Basic 16 GB Droplet, because it offers the simplest console
3. Hetzner Cloud's CPX41, because it pairs the Recommended tier's specs with local NVMe at the lowest price of the three options
4. A self-owned workstation, because it has no ongoing cloud cost at all
</div>

??? question "Show Answer"
    The correct answer is **C**. Hetzner Cloud is named as the recommended default precisely because it pairs the right specs with local NVMe at the lowest price of the three compared providers. A's default EBS volume is network-attached, working against the stated priority. B trades away price for console simplicity, which the scenario does not prioritize. D assumes ownership of a suitable workstation, which the scenario does not establish.

    **Concept Tested:** Hetzner Cloud Host / DigitalOcean Droplet / AWS EC2 Instance

    **See:** [Choosing a Cloud Host and Developing Against It](index.md#choosing-a-cloud-host-and-developing-against-it)

---

#### 11. Why doesn't the specification's 50,000-statement burst target roughly double the production fleet's monthly bill compared to sizing for the 10,000-statement sustained rate alone?

<div class="upper-alpha" markdown>
1. Because the burst target is purely theoretical and the specification does not actually require the infrastructure to survive it
2. Because autoscaling eliminates the need for any additional headroom anywhere in the stack
3. Because the burst only affects the development host tier, never the production fleet
4. Because Kafka and ClickHouse scale with event rate and need headroom for the burst, but Neo4j, Redis, and PostgreSQL scale with student and district population instead, so a burst adds statements per already-active learner rather than new active learners and never touches graph-tier sizing
</div>

??? question "Show Answer"
    The correct answer is **D**. Only the stores that scale with event rate — Kafka and ClickHouse — need burst headroom, while the population-scaled stores are untouched by a burst that reflects existing learners generating more events, not new learners appearing. A contradicts the chapter's treatment of the burst as a real, sized requirement. B overstates autoscaling's role, which drains Kafka lag over time rather than eliminating all headroom needs. C is false — the burst target is central to production sizing, not just the dev host.

    **Concept Tested:** Compute Plane Sizing

    **See:** [Sizing the Production Fleet](index.md#sizing-the-production-fleet)

---

#### 12. Why does this chapter recommend reaching every development-host service through an SSH Tunnel Port Forward rather than opening a UFW Firewall Rule for each service port directly?

<div class="upper-alpha" markdown>
1. Because an SSH tunnel is technically incapable of reaching a remote Neo4j browser or ClickHouse HTTP interface
2. Because an open port on a public IP is found by automated scanners within minutes, and the data behind it is student-shaped even when synthetic, so only SSH itself should ever be exposed directly to the internet
3. Because UFW rules are more expensive to configure than SSH tunnels on most cloud providers
4. Because SSH Tunnel Port Forward is required by the ADL Conformance Test Suite for any development environment
</div>

??? question "Show Answer"
    The correct answer is **B**. An open service port on a public IP is found by automated scanners within minutes, and even synthetic data is student-shaped, so only SSH should ever be exposed directly, with every other service reached through a tunnel. A is false — the whole point of an SSH tunnel is that it can reach exactly those services. C invents an unrelated cost comparison. D fabricates an unrelated conformance-suite requirement.

    **Concept Tested:** UFW Firewall Rule / SSH Tunnel Port Forward

    **See:** [Choosing a Cloud Host and Developing Against It](index.md#choosing-a-cloud-host-and-developing-against-it)

---
