from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.migrations import run_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_all()
    yield


app = FastAPI(title="WattCoach API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import admin, ingest  # noqa: E402 — imported after app creation

app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
