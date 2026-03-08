# Xiaomi Purifier Test

Standalone test harness for Xiaomi Smart Air Purifier 4 Compact. Isolated from the main Saivers app.

## Structure

```
xiaomi-purifier/
├── backend/   # FastAPI API (port 8002)
└── frontend/  # Simple HTML test UI
```

## Quick start

### 1. Backend

```bash
cd xiaomi-purifier/backend
uv sync   # or: pip install -e .
cp .env.example .env  # edit with your IP + token for real device
uv run uvicorn app.main:app --reload --port 8002
```

### 2. Frontend

```bash
cd xiaomi-purifier/frontend
python -m http.server 3001
```

Open http://localhost:3001 and click **Turn On** / **Turn Off**.

## Connect to real device

1. **Get IP**: Router admin or `miio discover` (device must be on same Wi‑Fi).
2. **Get token**: `miio discover` or use a Xiaomi token extractor app.
3. **Set env** in `backend/.env`:
   ```
   XIAOMI_PURIFIER_IP=192.168.1.xxx
   XIAOMI_PURIFIER_TOKEN=32_char_hex_token
   ```
4. **Install miIO**: `cd backend && uv add python-miio` (or `pip install python-miio`)

## Home Assistant (Xiaomi MiOT Auto)

1. In Home Assistant: **Settings → Devices & Services → Add Integration**
2. Search for **"Xiaomi MiOT Auto"** and add it
3. **Important**: When prompted, choose **Cloud** — local and automatic will not show entities
4. Log in with your Xiaomi account; entities will appear
5. Set in `backend/.env`:
   ```
   HOME_ASSISTANT_URL=http://your-ha:8123
   HOME_ASSISTANT_TOKEN=your_long_lived_access_token
   XIAOMI_PURIFIER_ENTITY_ID=fan.xiaomi_air_purifier_xxx
   ```
   (Find the entity ID in HA: Developer Tools → States)

## Provider order

1. Home Assistant (if `HOME_ASSISTANT_URL` + `HOME_ASSISTANT_TOKEN` set)
2. miIO (if `XIAOMI_PURIFIER_IP` + `XIAOMI_PURIFIER_TOKEN` set)
3. Mock (fallback)
