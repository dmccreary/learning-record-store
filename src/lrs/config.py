"""Settings, resolved from the environment that deploy/docker-compose.yml already defines.

The env var names here are NOT invented — they are read back off `x-lrs-env` in the compose
file, which was lifted from lrs-design-v1.md §8.4. They are deliberately inconsistent
(`LRS_LOG_LEVEL` is prefixed, `KAFKA_BOOTSTRAP` is not), which is why each field declares its
own alias rather than relying on a single `env_prefix`.
"""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # .env carries NEO4J_PASSWORD etc. that only other roles want
        case_sensitive=False,
    )

    env: str = Field(default="dev", validation_alias="LRS_ENV")
    log_level: str = Field(default="INFO", validation_alias="LRS_LOG_LEVEL")

    # The gateway's ONLY hard dependency (design §5.1). Defaults to the host-facing
    # advertised listener so the gateway runs outside compose against the same broker;
    # inside compose it is redpanda:29092.
    kafka_bootstrap: str = Field(default="localhost:9092", validation_alias="KAFKA_BOOTSTRAP")

    # --- Auth -------------------------------------------------------------------
    # MVP shape only. Design §5.1 wants token -> district_id from the identity service,
    # cached in Redis with a 60s TTL and an LRU fallback so that "auth must not become an
    # ingestion dependency". The identity service is not built yet, so the dev token maps
    # to one district in-process. That is strictly MORE available than the designed path,
    # so it cannot mask the failure mode the design is guarding against — and the seam
    # (`resolve_district`) is where the real lookup lands.
    dev_ingest_token: str | None = Field(default=None, validation_alias="LRS_DEV_INGEST_TOKEN")
    dev_district_id: str = Field(default="demo-district", validation_alias="LRS_DEV_DISTRICT_ID")

    # --- Neo4j (design §6.3) ----------------------------------------------------
    # Same host-facing default as kafka_bootstrap, and for the same reason: inside
    # compose x-lrs-env sets bolt://neo4j:7687, but `lrs seed` is run from a laptop
    # against the published port far more often than it runs as a compose service.
    neo4j_uri: str = Field(default="bolt://localhost:7687", validation_alias="NEO4J_URI")
    neo4j_user: str = Field(default="neo4j", validation_alias="NEO4J_USER")
    neo4j_password: str = Field(default="neo4j", validation_alias="NEO4J_PASSWORD")

    # --- Demo content (`lrs seed`) ----------------------------------------------
    # Where the intelligent-textbook repos live. `lrs seed` reads each one's committed
    # docs/learning-graph/ rather than shipping invented course content. Defaults to
    # the parent directory because these repos are normally siblings; nothing outside
    # `lrs seed` reads this, so a wrong value cannot affect the running stack.
    textbook_root: str = Field(default="..", validation_alias="LRS_TEXTBOOK_ROOT")

    # --- Kafka topics (design §6.1) --------------------------------------------
    topic_raw: str = Field(default="xapi.statements.raw", validation_alias="LRS_TOPIC_RAW")
    topic_bulk: str = Field(default="xapi.statements.bulk", validation_alias="LRS_TOPIC_BULK")
    topic_dlq: str = Field(default="xapi.statements.dlq", validation_alias="LRS_TOPIC_DLQ")

    # 48 -> 6 for the MVP, per the plan's "lift with fixes". §6.1 sizes 48 for a
    # 10k/sec target needing ~24; this laptop proves a RATIO, not a throughput number.
    # Note §9's warning: raising partitions later remaps keys and breaks per-learner
    # ordering for in-flight keys, which is load-bearing for BKT — so this is a
    # deliberate MVP-only number, not a default to grow into.
    partitions_raw: int = Field(default=6, validation_alias="LRS_PARTITIONS_RAW")
    partitions_bulk: int = Field(default=12, validation_alias="LRS_PARTITIONS_BULK")
    partitions_dlq: int = Field(default=12, validation_alias="LRS_PARTITIONS_DLQ")

    retention_raw_days: int = Field(default=7, validation_alias="LRS_RETENTION_RAW_DAYS")
    retention_bulk_days: int = Field(default=7, validation_alias="LRS_RETENTION_BULK_DAYS")
    retention_dlq_days: int = Field(default=30, validation_alias="LRS_RETENTION_DLQ_DAYS")


_settings: Settings | None = None


def settings() -> Settings:
    """Process-wide settings. Lazy so importing a module never reads the environment."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
