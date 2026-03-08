"""Standalone Xiaomi Air Purifier test API — runs on port 8002."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env from backend folder
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


@app.get("/", tags=["root"])
def root() -> dict:
    return {
        "service": "xiaomi-purifier-api",
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
