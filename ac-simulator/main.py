"""
AC Simulator — standalone FastAPI service on port 8001.

Simulates 10 households x 4 smart AC units each.
Provides REST control endpoints and SSE live-state streaming.

NOTE: All state is in-memory and resets on restart (by design for demo).

Run:
    uv run uvicorn main:app --port 8001 --reload   # development
    uv run uvicorn main:app --port 8001             # demo
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from store import init_store, tick_loop
from router import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise store and launch background simulation tick."""
    init_store()
    task = asyncio.create_task(tick_loop())
    print("[ac-simulator] Started — 80 AC units online (2 per room, 4 rooms x 10 households), ticking every 5s")
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    print("[ac-simulator] Stopped")


app = FastAPI(
    title="AC Simulator",
    description="Mock smart AC appliance server — Saivers hackathon",
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

app.include_router(router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": "ac-simulator", "units": 80}
