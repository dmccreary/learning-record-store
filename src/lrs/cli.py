"""`lrs` — one image, many roles (ADR-005). The role is an argument, not a build.

pyproject's [project.scripts] points `lrs` at this module's `app`, and the Dockerfile's
ENTRYPOINT is ["lrs"], so every compose `command:` here is a subcommand below. The commands
and their flags are not invented — they are read back off deploy/docker-compose.yml, which
was lifted from the design.

Roles still to build: processor, summarizer, identity, loadgen, replay. Each is absent
rather than stubbed-green, so `make smoke` stays honestly red until the thing it tests exists.
"""

from __future__ import annotations

import logging
import sys

import typer

from lrs.config import settings

app = typer.Typer(
    name="lrs",
    help="Learning Record Store — xAPI ingestion, compression, and graph analytics.",
    no_args_is_help=True,
    add_completion=False,
)


def _configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, settings().log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
        stream=sys.stdout,
    )


@app.command()
def gateway(
    host: str = typer.Option("0.0.0.0", help="Bind address."),
    port: int = typer.Option(8080, help="Bind port."),
) -> None:
    """Run the xAPI ingestion gateway (design §5.1). Hard dependencies: Kafka only."""
    import uvicorn

    _configure_logging()
    from lrs.gateway.app import create_app

    uvicorn.run(create_app(), host=host, port=port, log_level=settings().log_level.lower())


@app.command()
def bootstrap(
    create_topics: bool = typer.Option(False, "--create-topics", help="Create Kafka topics."),
    apply_ddl: bool = typer.Option(False, "--apply-ddl", help="Apply the ClickHouse DDL."),
    apply_constraints: bool = typer.Option(
        False, "--apply-constraints", help="Apply the Neo4j constraints."
    ),
    verify_: bool = typer.Option(
        False, "--verify", help="Fail if the topology is not as declared."
    ),
) -> None:
    """Create topics, apply DDL and constraints, and verify them (design §8.7)."""
    _configure_logging()
    cfg = settings()
    log = logging.getLogger("lrs.bootstrap")

    import lrs.bootstrap as bs

    if create_topics:
        bs.create_topics(cfg)

    # Reported, not silently skipped. `--verify` that returns 0 for work it never did is the
    # exact defect the smoke.sh rewrite exists to prevent.
    if apply_ddl:
        log.error("--apply-ddl is NOT IMPLEMENTED (src/lrs/ddl/clickhouse.sql is applied by hand)")
        raise typer.Exit(2)
    if apply_constraints:
        log.error("--apply-constraints is NOT IMPLEMENTED (src/lrs/ddl/neo4j.cypher)")
        raise typer.Exit(2)

    if verify_:
        problems = bs.verify(cfg)
        for p in problems:
            log.error("verify: %s", p)
        if problems:
            raise typer.Exit(1)
        log.info("verify: topics match §6.1 as configured")


@app.command()
def seed(
    demo: bool = typer.Option(
        False, "--demo", help="§8.7's shape: one district, two schools, four sections."
    ),
    showcase: bool = typer.Option(
        False, "--showcase", help="8 districts, 40 schools, ~4,000 learners, 3 textbooks."
    ),
    clear: bool = typer.Option(
        False, "--clear", help="Delete previously seeded nodes (seeded: true) first."
    ),
) -> None:
    """Load demo districts, textbooks, and learners into Neo4j (design §8.7).

    NOT the designed path. §8.7 seeds synthetic statements and lets the pipeline
    compress them; processor and summarizer do not exist, so this writes the summary
    vertices directly. They are marked `seeded: true` — see src/lrs/seed.py.
    """
    _configure_logging()
    cfg = settings()
    log = logging.getLogger("lrs.seed")

    import lrs.seed as sd

    if demo and showcase:
        log.error("--demo and --showcase are alternatives; pass one")
        raise typer.Exit(2)

    if clear:
        log.info("cleared %d seeded nodes", sd.clear(cfg))
    if not (demo or showcase):
        if not clear:
            log.error("nothing to do: pass --demo or --showcase (or --clear to remove it)")
            raise typer.Exit(2)
        return

    profile = sd.PROFILES["showcase" if showcase else "demo"]
    counts = sd.seed(cfg, profile)
    log.info(
        "seed complete (%s): %d nodes+edges across %d types",
        profile.name,
        sum(counts.values()),
        len(counts),
    )


if __name__ == "__main__":
    app()
