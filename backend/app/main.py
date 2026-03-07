"""Saivers FastAPI application."""

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
    title="Saivers API",
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
from app.routers import aircon, ingest, usage, weekly_insights, recommendations  # noqa: E402

app.include_router(insights.router,         prefix="/api/insights",        tags=["insights"])
app.include_router(weekly_insights.router,  prefix="/api/insights",        tags=["weekly-insights"])
app.include_router(devices.router,          prefix="/api/devices",         tags=["devices"])
app.include_router(aircon.router,           prefix="/api/aircon",          tags=["aircon"])
app.include_router(habits.router,           prefix="/api/habits",          tags=["habits"])
app.include_router(admin.router,            prefix="/api/admin",           tags=["admin"])
app.include_router(ingest.router,           prefix="/api/ingest",          tags=["ingest"])
app.include_router(usage.router,            prefix="/api/usage",           tags=["usage"])
app.include_router(recommendations.router,  prefix="/api/recommendations", tags=["recommendations"])


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": "wattcoach-api"}
