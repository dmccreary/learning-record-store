"""`lrs bootstrap` — create Kafka topics. Design §6.1.

SCOPE: topics only, for now. The compose service invokes
`bootstrap --create-topics --apply-ddl --apply-constraints --verify`; the DDL and constraint
flags are accepted and reported as not-yet-implemented rather than silently succeeding,
because `--verify` claiming green while doing nothing is precisely the failure mode
`scripts/smoke.sh` was rewritten to eliminate. A harness that cannot fail proves nothing.
"""

from __future__ import annotations

import logging

from confluent_kafka.admin import AdminClient, NewTopic

from lrs.config import Settings

log = logging.getLogger(__name__)


def topic_specs(cfg: Settings) -> list[NewTopic]:
    """§6.1's table, with the plan's MVP partition counts.

    Retention is per-topic and deliberate: raw and bulk are a 7-day REPLAY BUFFER, not a
    record (§9 — "Kafka is a 7-day replay buffer, not a record"). The DLQ keeps 30 days
    because a producer bug is found by a human days later, not by a consumer in seconds.
    """
    day_ms = 24 * 60 * 60 * 1000
    return [
        NewTopic(
            cfg.topic_raw,
            num_partitions=cfg.partitions_raw,
            replication_factor=1,
            config={"retention.ms": str(cfg.retention_raw_days * day_ms)},
        ),
        NewTopic(
            cfg.topic_bulk,
            num_partitions=cfg.partitions_bulk,
            replication_factor=1,
            config={"retention.ms": str(cfg.retention_bulk_days * day_ms)},
        ),
        NewTopic(
            cfg.topic_dlq,
            num_partitions=cfg.partitions_dlq,
            replication_factor=1,
            config={"retention.ms": str(cfg.retention_dlq_days * day_ms)},
        ),
    ]


def create_topics(cfg: Settings) -> None:
    admin = AdminClient({"bootstrap.servers": cfg.kafka_bootstrap})
    existing = set(admin.list_topics(timeout=10).topics)

    wanted = topic_specs(cfg)
    todo = [t for t in wanted if t.topic not in existing]

    for t in wanted:
        if t.topic in existing:
            log.info("topic %s already exists", t.topic)

    if not todo:
        return

    for topic, fut in admin.create_topics(todo).items():
        fut.result()  # raises on failure — bootstrap must fail loudly
        log.info("created topic %s", topic)


def verify(cfg: Settings) -> list[str]:
    """Return a list of problems. Empty means verified."""
    problems: list[str] = []
    admin = AdminClient({"bootstrap.servers": cfg.kafka_bootstrap})
    md = admin.list_topics(timeout=10)

    for spec in topic_specs(cfg):
        actual = md.topics.get(spec.topic)
        if actual is None:
            problems.append(f"topic {spec.topic} does not exist")
            continue
        n = len(actual.partitions)
        if n != spec.num_partitions:
            # Not cosmetic: §9 warns that changing partition counts remaps keys and breaks
            # per-learner ordering for in-flight keys — which BKT depends on.
            problems.append(
                f"topic {spec.topic} has {n} partitions, expected {spec.num_partitions}"
            )
    return problems
