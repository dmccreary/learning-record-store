# syntax=docker/dockerfile:1.7
#
# Lifted from lrs-design-v1.md §8.2 (design lines 694-736), which is sound as
# written. The only addition is the OCI source label: the image is named
# ghcr.io/dmccreary/lrs but published from the learning-record-store repo, so
# without this label GHCR will not link the package back to its source.
#
# ADR-005: one image, many roles. `docker run ghcr.io/dmccreary/lrs:X gateway`.

ARG PYTHON_VERSION=3.12

# ---------- base: shared runtime, non-root user ----------
FROM python:${PYTHON_VERSION}-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
RUN groupadd --system --gid 10001 lrs \
 && useradd  --system --uid 10001 --gid lrs --create-home lrs

# ---------- builder: resolve and install deps ----------
FROM base AS builder
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app

# Dependency layer — cached until the lockfile changes
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Application layer — the only layer most builds rebuild
COPY src/ ./src/
COPY README.md ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ---------- runtime: no build tooling, no uv, no source of truth for secrets ----------
FROM base AS runtime
LABEL org.opencontainers.image.source="https://github.com/dmccreary/learning-record-store"
LABEL org.opencontainers.image.description="Learning Record Store — xAPI ingestion and graph analytics"
LABEL org.opencontainers.image.licenses="CC-BY-NC-SA-4.0"

WORKDIR /app
COPY --from=builder --chown=lrs:lrs /app/.venv /app/.venv
COPY --from=builder --chown=lrs:lrs /app/src   /app/src
ENV PATH="/app/.venv/bin:$PATH"

USER lrs
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
    CMD ["lrs", "healthcheck"]

ENTRYPOINT ["lrs"]
CMD ["--help"]
