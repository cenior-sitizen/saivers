"""WattCoach FastAPI application."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.migrations import run_all
from app.services.device_store import init_device_store, run_schedule_checker


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: run migrations, init device store, start AC schedule checker."""
    run_all()
    init_device_store()
    task = asyncio.create_task(run_schedule_checker())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="WattCoach API",
    description="AI-powered energy behaviour coach — HackOMania 2026",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.routers import insights, devices, habits, admin  # noqa: E402
from app.routers import ingest  # noqa: E402 — Dev A ingest router

app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
app.include_router(devices.router,  prefix="/api/devices",  tags=["devices"])
app.include_router(habits.router,   prefix="/api/habits",   tags=["habits"])
app.include_router(admin.router,    prefix="/api/admin",    tags=["admin"])
app.include_router(ingest.router,   prefix="/api/ingest",   tags=["ingest"])


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": "wattcoach-api"}
