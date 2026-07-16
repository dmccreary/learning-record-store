"""Neo4j access for the analytics dashboards.

Reads the SAME connection settings the rest of the stack uses (config.py / .env), so
the dashboards talk to the graph the pipeline and `lrs seed` write. Host-facing default
`bolt://localhost:7687` matches config.py's reasoning: the dashboards run on a laptop
against the published Bolt port far more often than they run inside compose.

Every figure in every dashboard ultimately calls `q()` here. It returns a pandas
DataFrame because Plotly Express and `dash_table` both consume DataFrames directly, and
because the aggregation the reports need (group, pivot, rank) is far clearer in pandas
than threaded back through Cypher. The heavy lifting — the graph traversal and the first
aggregation — still happens in Neo4j (spec §9.3: "server-side aggregation; the browser
never receives raw per-statement rows"). pandas only shapes what comes back.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd
from dotenv import load_dotenv
from neo4j import Driver, GraphDatabase
from neo4j.time import Date, DateTime

# The repo root holds the .env that `make`, `lrs seed`, and compose all read. Load it so
# a dashboard started from anywhere inherits the same NEO4J_PASSWORD without a second copy.
_REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_REPO_ROOT / ".env")


def _uri() -> str:
    # NEO4J_URI is set inside compose (bolt://neo4j:7687); on a laptop it is usually unset,
    # so fall back to the published port rather than the compose service name.
    return os.environ.get("NEO4J_URI", "bolt://localhost:7687")


@lru_cache(maxsize=1)
def driver() -> Driver:
    """One process-wide driver. The Bolt driver is a connection POOL and thread-safe, so
    sharing it across Dash's worker threads is correct and avoids a connect per callback."""
    user = os.environ.get("NEO4J_USER", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "neo4j")
    return GraphDatabase.driver(_uri(), auth=(user, password))


def _native(value: Any) -> Any:
    """Neo4j temporal types are not JSON/Plotly-friendly; hand back stdlib datetimes."""
    if isinstance(value, (DateTime, Date)):
        return value.to_native()
    return value


def q(cypher: str, **params: Any) -> pd.DataFrame:
    """Run a read query and return a DataFrame. Column order follows the RETURN clause."""
    with driver().session() as session:
        result = session.run(cypher, **params)
        keys = result.keys()
        rows = [[_native(rec[k]) for k in keys] for rec in result]
    return pd.DataFrame(rows, columns=list(keys))


def health() -> str | None:
    """Return an error string if the graph is unreachable or empty, else None. Dashboards
    render this as a banner instead of a stack trace when Neo4j is down or unseeded."""
    try:
        df = q("MATCH (s:Student) RETURN count(s) AS n")
    except Exception as exc:  # noqa: BLE001 — surfaced to the user as a banner, not swallowed
        return f"Cannot reach Neo4j at {_uri()}: {exc}"
    if df.empty or int(df.iloc[0]["n"]) == 0:
        return "Neo4j is reachable but holds no students. Run `make seed` (or `lrs seed --showcase`)."
    return None
