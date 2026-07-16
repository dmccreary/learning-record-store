# Lifted from lrs-design-v1.md §8.6 (design lines 1109-1142).
# Changes: compose lives in deploy/, smoke is tiered, and `up` no longer
# runs `up` twice.

COMPOSE := docker compose -f deploy/docker-compose.yml

.PHONY: help up down clean logs seed smoke smoke-graph smoke-mastery perf burst rebuild test lint

help:          ## Show this help
	@grep -E '^[a-z-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up:            ## Start the core stack (bootstrap runs first, then 3 processors)
	$(COMPOSE) up -d --build --scale processor=3

down:          ## Stop, keep volumes
	$(COMPOSE) down

clean:         ## Stop and destroy all data
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f gateway processor summarizer

seed:          ## Load a demo district, textbook, and synthetic statements
	$(COMPOSE) run --rm bootstrap seed --demo

smoke:         ## Assert the ingest path (F-1, §5.2, §5.4)
	./scripts/smoke.sh --tier=ingest

smoke-graph:   ## Assert compression and no per-statement vertices (C-1, C-6)
	./scripts/smoke.sh --tier=graph

smoke-mastery: ## Assert idempotent resync and a live BKT score (C-3, F-7)
	./scripts/smoke.sh --tier=mastery

perf:          ## Run the synthetic firehose at the baseline rate
	$(COMPOSE) --profile perf run --rm loadgen loadgen --rate 200 --duration 300

burst:         ## The proof: 5x the ingest rate, watch graph writes stay flat (§4.1)
	$(COMPOSE) --profile perf run --rm loadgen loadgen --rate 1000 --duration 300

rebuild:       ## Rebuild a projection from the immutable log (§7.4)
	$(COMPOSE) run --rm bootstrap replay --rebuild-graph --grain concept_mastery

test:          ## Integration tests against the same images as compose
	uv run pytest tests/ -v

lint:
	uv run ruff check src tests && uv run mypy
