"""Standalone Xiaomi Air Purifier test API — runs on port 8002."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Load .env from backend folder (no-op when running in Docker — secrets from env)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.services.purifier_service import turn_purifier_off, turn_purifier_on

app = FastAPI(title="Xiaomi Purifier Test API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend UI — works both locally (from frontend/) and in Docker (/app/static/)
_STATIC_CANDIDATES = [
    Path(__file__).resolve().parents[2] / "frontend" / "index.html",  # local dev: .../xiaomi-purifier/frontend/index.html
    Path("/app/static/index.html"),                                      # Docker
]
_UI_FILE = next((p for p in _STATIC_CANDIDATES if p.exists()), None)


@app.get("/ui", tags=["frontend"])
def serve_ui() -> FileResponse:
    """Serve the purifier control UI."""
    if _UI_FILE is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="UI file not found")
    return FileResponse(_UI_FILE, media_type="text/html")


@app.get("/", tags=["root"])
def root() -> dict:
    return {
        "service": "xiaomi-purifier-api",
        "ui": "/ui",
        "docs": "/docs",
        "health": "/health",
        "purifier_on": "POST /api/test/xiaomi/purifier/on",
        "purifier_off": "POST /api/test/xiaomi/purifier/off",
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "xiaomi-purifier-api"}


@app.post("/api/test/xiaomi/purifier/on")
def purifier_on() -> dict:
    """Turn on the Xiaomi air purifier."""
    return turn_purifier_on()


@app.post("/api/test/xiaomi/purifier/off")
def purifier_off() -> dict:
    """Turn off the Xiaomi air purifier."""
    return turn_purifier_off()
