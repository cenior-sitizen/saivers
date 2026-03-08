# ── Stage 1: dependency install ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

# git is required to install python-miio from GitHub (git+https URL in pyproject.toml)
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Copy lock files first — Docker layer cache will skip re-installing if unchanged
COPY backend/pyproject.toml backend/uv.lock ./

# Install production dependencies into /app/.venv
RUN uv sync --frozen --no-dev --no-install-project

# ── Stage 2: runtime image ────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Copy venv from builder — git is NOT needed at runtime
COPY --from=builder /app/.venv /app/.venv

# Copy FastAPI application
COPY backend/app/ ./app/

# Copy frontend static UI (served at /ui via FastAPI StaticFiles)
COPY frontend/index.html ./static/index.html

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Render injects $PORT at runtime; default to 8080 for local `docker run`
ENV PORT=8080

EXPOSE 8080

# Use JSON form with sh -c so $PORT env var is expanded at runtime (exec form doesn't expand env vars)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
