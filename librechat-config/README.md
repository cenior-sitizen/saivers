# LibreChat Setup for Saivers

This folder contains the Saivers-specific LibreChat configuration for the AI Assistant (ClickHouse MCP integration).

## Prerequisites

- Docker and Docker Compose
- `frontend/.env` with ClickHouse credentials (`CLICKHOUSE_HOST`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DB`, `CLICKHOUSE_PORT`) and `OPENAI_API_KEY`

## Setup

1. **Clone LibreChat** (if not already done):
   ```bash
   git clone https://github.com/danny-avila/LibreChat.git
   cd LibreChat
   ```

2. **Copy config files** from this folder into the LibreChat directory:
   ```bash
   cp ../librechat-config/docker-compose.override.yml .
   cp ../librechat-config/librechat.yaml .
   ```
   (Adjust the path if you're not in the saivers repo root.)

3. **Create LibreChat `.env`** from the example and add your OpenAI API key:
   ```bash
   cp .env.example .env
   # Edit .env and set OPENAI_API_KEY=your_key
   ```

4. **Start LibreChat**:
   ```bash
   docker compose up -d
   ```

5. Open **http://localhost:3080** and create an account. Select **clickhouse-default** as the MCP server to query the energy database.

## What's Included

- **docker-compose.override.yml** – Adds the ClickHouse MCP server, mounts `librechat.yaml`, uses `frontend/.env` for credentials
- **librechat.yaml** – MCP server config (`clickhouse-default`), custom welcome message, `socialLogins: []` for local dev

## Production

For production deployment (e.g. Railway, Render):

- Set `socialLogins` in `librechat.yaml` to enable OAuth
- Deploy LibreChat to your hosting provider
- Set `NEXT_PUBLIC_LIBRECHAT_URL` in the frontend to your LibreChat URL
