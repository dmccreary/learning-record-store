# Learning Record Store

An intelligent textbook on Learning Record Stores — what they are, how xAPI statements work, and how to design, deploy, and query an LRS — **plus the implementation of the LRS itself**.

Published site: <https://dmccreary.github.io/learning-record-store/>

## What's here

| Path | What it is |
|---|---|
| `docs/` | The MkDocs textbook: specs, glossary, MicroSims. |
| `docs/specs/` | [Specification](docs/specs/lrs-spec-v1.md) (what) · [Design & Deployment](docs/specs/lrs-design-v1.md) (how) · [Hardware & cost](docs/specs/hardware-requirements.md) |
| `src/lrs/` | The LRS implementation (Python 3.12). |
| `deploy/` | `docker-compose.yml` — the whole stack on one host. |
| `scripts/smoke.sh` | Tiered end-to-end assertions (`--tier=ingest\|graph\|mastery`). |
| `logs/mvp-status.md` | **Current build status and session handoff. Start here.** |

## Architecture in three sentences

ClickHouse is the system of record for the xAPI statement log; every statement lands there at full fidelity. Neo4j holds **only** structure (tenancy, content tree, concept DAG) and compressed summary vertices — one vertex per analytical grain, never one per statement ([spec §5.6 C-1](docs/specs/lrs-spec-v1.md)). A summarizer syncs rollups into the graph every 60 seconds as **absolute values**, which is what makes the pipeline idempotent under replay and keeps the graph write rate flat through an ingest burst.

## Status

**Pre-alpha. Nothing runs yet.** The build is at step 1 of 5 — see [`logs/mvp-status.md`](logs/mvp-status.md) for exactly what exists, what doesn't, and what to do next. The current target is proving the architecture's central claim (graph writes stay flat through a 5× ingest burst), not shipping a product.

The image cannot build until `uv.lock` and `src/lrs/cli.py` exist. Until then, only the backing services come up:

```bash
git clone https://github.com/dmccreary/learning-record-store.git
cd learning-record-store
cp .env.example .env && $EDITOR .env    # change every password
make stores                             # backing services only — no image build
```

Once the CLI exists:

```bash
make up            # build the image, run the full stack
make smoke         # assert the ingest path (F-1, §5.2, §5.4)
make burst         # the proof: 5x ingest, graph writes flat
```

Requires Docker (Desktop, or Engine on Linux) and ~16 GB RAM for the burst test — see [`docs/specs/dev-environment-setup.md`](docs/specs/dev-environment-setup.md).

## Building the book

```bash
pip install mkdocs-material
mkdocs serve      # http://127.0.0.1:8000/learning-record-store/
```

## License

Content: [CC BY-NC-SA 4.0](docs/license.md).
