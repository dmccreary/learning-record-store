#!/usr/bin/env bash
#
# scripts/smoke.sh — post statements, assert they reach every store.
#
# Rewritten from lrs-design-v1.md §8.8 (design lines 1169-1231). The original
# is not safe to lift. It used this pattern for three of its five checks:
#
#     <query> | grep -q '^1$' && echo "✓ clickhouse stored it"
#
# That exits 0 when the grep fails, because `set -e` is ignored for any
# non-final command in an && list. The check silently skips its checkmark and
# the script continues to an unconditional `echo "✓ smoke passed"`. The C-6
# compression block had no assertion at all — it printed a number. So the
# script that is M0's stated exit criterion could not fail for the two things
# the design doc itself calls "the interesting" assertions.
#
# Every check below is an explicit if-not-fail. A tier either exits 0 having
# proven something, or exits 1. There is no third outcome.
#
# Usage:  ./scripts/smoke.sh [--tier=ingest|graph|mastery] [--keep]
#
#   ingest   §5.4 + F-1  — gateway accepts, ClickHouse stores, no graph needed
#   graph    C-1 + C-6   — summaries materialize, no per-statement vertices
#   mastery  C-3 + F-7   — idempotent resync, BKT score is non-null
#
# Each tier is a superset gate for the step that delivers it, so `--tier=ingest`
# is expected to be RED until step 2 lands. A harness that has never failed has
# never been tested.

set -euo pipefail

TIER="ingest"
MIN_RATIO="${LRS_SMOKE_MIN_RATIO:-20}"

for arg in "$@"; do
  case "$arg" in
    --tier=*) TIER="${arg#*=}" ;;
    -h|--help) sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'unknown argument: %s\n' "$arg" >&2; exit 2 ;;
  esac
done

case "$TIER" in
  ingest|graph|mastery) ;;
  *) printf 'unknown tier: %s (want ingest|graph|mastery)\n' "$TIER" >&2; exit 2 ;;
esac

# ---------------------------------------------------------------- helpers ----

fail() { printf '\033[31m✗ FAIL\033[0m  %s\n' "$*" >&2; exit 1; }
pass() { printf '\033[32m✓\033[0m %s\n' "$*"; }
info() { printf '\033[2m·\033[0m %s\n' "$*"; }

[ -f .env ] || fail ".env not found — run: cp .env.example .env"
set -a; . ./.env; set +a

: "${CLICKHOUSE_PASSWORD:?not set in .env}"
: "${NEO4J_PASSWORD:?not set in .env}"
: "${LRS_DEV_INGEST_TOKEN:?not set in .env}"

# --env-file is explicit: Compose resolves its project directory from the -f
# file (deploy/), so a bare invocation may look for deploy/.env, find nothing,
# and interpolate every ${VAR} to empty rather than failing. See the Makefile.
COMPOSE="docker compose --env-file .env -f deploy/docker-compose.yml"

ch() {
  $COMPOSE exec -T clickhouse clickhouse-client \
    --user lrs --password "${CLICKHOUSE_PASSWORD}" --query "$1"
}

# --format plain still emits a header row; take the last line and strip quotes.
cy() {
  $COMPOSE exec -T neo4j cypher-shell \
    -u neo4j -p "${NEO4J_PASSWORD}" --format plain "$1" | tail -1 | tr -d ' "'
}

# ------------------------------------------------------------ tier: ingest ----

STATEMENT_ID="$(uuidgen | tr 'A-Z' 'a-z')"
ACTOR_NAME="smoke-$(date +%s)"
OBJECT_ID="https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/"
VERSION_IRI="https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0"

info "posting ${STATEMENT_ID}"

# `answered`, not `interacted` — this statement carries result.success and
# result.score.scaled, which is what mv_student_concept_rollup's
# countIfState(result_success IS NOT NULL) needs to produce attempts > 0.
# See docs/specs/xapi-producer-contract-v1.md §3.
if ! curl -sf -X POST http://localhost:8080/xapi/statements \
     -H 'Content-Type: application/json' \
     -H 'X-Experience-API-Version: 1.0.3' \
     -H "Authorization: Bearer ${LRS_DEV_INGEST_TOKEN}" \
     -d @- >/dev/null <<JSON
[{
  "id": "${STATEMENT_ID}",
  "actor":  {"objectType": "Agent",
             "account": {"homePage": "https://demo.example.edu",
                         "name": "${ACTOR_NAME}"}},
  "verb":   {"id": "http://adlnet.gov/expapi/verbs/answered",
             "display": {"en-US": "answered"}},
  "object": {"objectType": "Activity",
             "id": "${OBJECT_ID}#q2",
             "definition": {"type": "http://adlnet.gov/expapi/activities/cmi.interaction",
                            "name": {"en-US": "How many PageEngagement vertices exist?"}}},
  "result": {"score": {"scaled": 0.9}, "success": true, "duration": "PT4M12S"},
  "context": {"contextActivities": {
               "grouping": [{"id": "${VERSION_IRI}"}],
               "parent":   [{"id": "${OBJECT_ID}"}]},
              "extensions": {
               "https://w3id.org/lrs/ext/concept_id": "compression-ratio"}},
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}]
JSON
then
  fail "gateway rejected the statement (spec §5.4: ingest must accept-first)"
fi
pass "gateway accepted ${STATEMENT_ID}"

# Async inserts flush on a timer (async_insert_busy_timeout_ms, default 1s) and
# the processor batches at <=1000/200ms. Poll rather than sleep-and-hope.
info "waiting for the statement to land in the event log"
landed=0
for _ in $(seq 1 30); do
  n="$(ch "SELECT count() FROM lrs.statements WHERE statement_id = '${STATEMENT_ID}'" || echo 0)"
  if [ "${n:-0}" = "1" ]; then landed=1; break; fi
  sleep 1
done
[ "$landed" = "1" ] || fail "F-1: statement never reached lrs.statements after 30s"
pass "clickhouse stored it (F-1, system of record)"

# §5.2: the vault boundary claims nothing downstream of the processor sees the
# raw actor. Assert it — this is the `raw`-column PII hole from the plan.
leaked="$(ch "SELECT count() FROM lrs.statements
              WHERE statement_id = '${STATEMENT_ID}'
                AND position(raw, '${ACTOR_NAME}') > 0")"
[ "${leaked:-1}" = "0" ] || \
  fail "§5.2 boundary: the raw actor name '${ACTOR_NAME}' is readable in lrs.statements.raw
        — an analytics reader can re-identify without vault access"
pass "raw actor identity is not readable in the event log (§5.2)"

# The pseudonym must actually be derived, not blank or passthrough.
key="$(ch "SELECT student_key FROM lrs.statements WHERE statement_id = '${STATEMENT_ID}'")"
[ -n "$key" ] && [ "$key" != "$ACTOR_NAME" ] || fail "§5.2: student_key was not derived"
pass "actor pseudonymized to ${key}"

[ "$TIER" = "ingest" ] && { pass "tier=ingest passed"; exit 0; }

# ------------------------------------------------------------- tier: graph ----

# C-1 is enforced by the absence of a :Statement label AND by the grain
# uniqueness constraints (design line 571). This is the one assertion the
# original script got right; it is kept, verbatim in spirit.
count="$(cy "MATCH (s:Statement) RETURN count(s)")"
[ "${count:-x}" = "0" ] || \
  fail "C-1: ${count} :Statement vertices in the graph — per-statement vertices are prohibited (spec §5.6)"
pass "no per-statement vertices in the graph (C-1)"

info "waiting one summarizer cadence for the grain to materialize"
materialized=0
for _ in $(seq 1 90); do
  v="$(cy "MATCH (m:ConceptMastery) RETURN count(m)" || echo 0)"
  if [ "${v:-0}" -gt 0 ] 2>/dev/null; then materialized=1; break; fi
  sleep 1
done
[ "$materialized" = "1" ] || \
  fail "C-6: no ConceptMastery vertex after 90s — the summarizer never synced the grain"

statements="$(cy "MATCH (m:ConceptMastery) RETURN coalesce(sum(m.statements_compressed),0)")"
vertices="$(cy "MATCH (m:ConceptMastery) RETURN count(m)")"
[ "${vertices:-0}" -gt 0 ] || fail "C-6: zero ConceptMastery vertices"

ratio="$(awk -v s="$statements" -v v="$vertices" 'BEGIN{printf "%.1f", s/v}')"

# C-6 asserts. The original printed this number and fell through to a
# hard-coded success message.
if ! awk -v r="$ratio" -v m="$MIN_RATIO" 'BEGIN{exit !(r+0 >= m+0)}'; then
  fail "C-6: compression ratio ${ratio}:1 is below the ${MIN_RATIO}:1 floor
        (${statements} statements over ${vertices} vertices) — the compressor is not compressing"
fi
pass "compression ratio ${ratio}:1 over ${vertices} vertices (C-6, asserted)"

[ "$TIER" = "graph" ] && { pass "tier=graph passed"; exit 0; }

# ----------------------------------------------------------- tier: mastery ----

# C-3: applying the same rollup twice must leave the graph unchanged. This is
# the assertion that catches `SET n.x = n.x + 1` — the ADR-002 trap, which the
# design doc says "looks identical and is silently wrong".
before="$(cy "MATCH (m:ConceptMastery)
              RETURN toString(collect(m.statements_compressed + '|' + m.mastery_score))")"
info "forcing a second summarizer sync (C-3)"
$COMPOSE run --rm --no-deps bootstrap replay --rebuild-graph --grain concept_mastery >/dev/null
after="$(cy "MATCH (m:ConceptMastery)
             RETURN toString(collect(m.statements_compressed + '|' + m.mastery_score))")"

[ "$before" = "$after" ] || \
  fail "C-3: the graph changed after re-applying the same rollup — materialization is not idempotent.
        Check for 'SET n.x = n.x + \$delta' where it must be 'SET n.x = \$absolute' (design §5.4)."
pass "re-applying the same rollup left the graph unchanged (C-3)"

# F-7 / ADR-006. The design's summarizer SELECT (lines 332-340) never produces
# mastery_score, but its Cypher (line 349) writes it — so this asserts null
# until the processor->concept_mastery->summarizer join is wired up.
nulls="$(cy "MATCH (m:ConceptMastery) WHERE m.mastery_score IS NULL RETURN count(m)")"
[ "${nulls:-1}" = "0" ] || \
  fail "F-7: ${nulls} ConceptMastery vertices have a null mastery_score — BKT's P(L) is not
        reaching the graph. The rollup does not compute it; wire lrs.concept_mastery in."
pass "every ConceptMastery vertex carries a non-null BKT score (F-7)"

pass "tier=mastery passed"
