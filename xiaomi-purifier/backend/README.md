# Xiaomi Purifier Test — Backend

Standalone API for testing Xiaomi Smart Air Purifier 4 Compact control.

## Run

```bash
cd xiaomi-purifier/backend
uv sync   # or: pip install -r requirements.txt
uv run uvicorn app.main:app --reload --port 8002
# or: python -m uvicorn app.main:app --reload --port 8002
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/test/xiaomi/purifier/on` | Turn on purifier |
| POST | `/api/test/xiaomi/purifier/off` | Turn off purifier |
| GET | `/health` | Health check |

## Connect to real device (miIO)

1. Copy `.env.example` to `.env`
2. Set `XIAOMI_PURIFIER_IP` — your device IP (router admin or `miio discover`)
3. Set `XIAOMI_PURIFIER_TOKEN` — 32-char hex token
4. Install miIO: `uv add python-miio` or `pip install python-miio`
5. Ensure backend and purifier are on same Wi‑Fi

### Getting the token

- **miio discover**: `pip install python-miio` then `miio discover` (device must be on same network)
- **Token extractor**: Use a Xiaomi token extractor app (e.g. from F-Droid) if device is in Xiaomi Home

## Home Assistant (Xiaomi MiOT Auto)

1. **Settings → Devices & Services → Add Integration** → search **"Xiaomi MiOT Auto"**
2. **Use Cloud** — local and automatic will not show entities
3. Log in with Xiaomi account; entities appear
4. Set `HOME_ASSISTANT_URL`, `HOME_ASSISTANT_TOKEN`, `XIAOMI_PURIFIER_ENTITY_ID` in `.env`

## Provider order

1. Home Assistant (if `HOME_ASSISTANT_URL` + `HOME_ASSISTANT_TOKEN` set)
2. miIO (if `XIAOMI_PURIFIER_IP` + `XIAOMI_PURIFIER_TOKEN` set)
3. Mock (fallback)
