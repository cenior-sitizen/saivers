"""
Xiaomi Air Purifier service abstraction.

Provider selection order:
  1. Home Assistant — if HOME_ASSISTANT_URL and HOME_ASSISTANT_TOKEN are set
  2. miIO/local — if XIAOMI_PURIFIER_IP and XIAOMI_PURIFIER_TOKEN are set
  3. Mock — fallback (no external calls)
"""

from __future__ import annotations

import logging
import os
from typing import Literal

logger = logging.getLogger(__name__)

Provider = Literal["homeassistant", "miio", "mock"]


def _resolve_provider() -> Provider:
    ha_url = os.getenv("HOME_ASSISTANT_URL", "").strip()
    ha_token = os.getenv("HOME_ASSISTANT_TOKEN", "").strip()
    if ha_url and ha_token:
        return "homeassistant"

    ip = os.getenv("XIAOMI_PURIFIER_IP", "").strip()
    token = os.getenv("XIAOMI_PURIFIER_TOKEN", "").strip()
    if ip and token:
        return "miio"

    return "mock"


def turn_purifier_on() -> dict:
    provider = _resolve_provider()
    logger.info("purifier_service: turn_purifier_on provider=%s", provider)

    if provider == "homeassistant":
        return _turn_on_homeassistant()
    if provider == "miio":
        return _turn_on_miio()
    return _turn_on_mock()


def turn_purifier_off() -> dict:
    provider = _resolve_provider()
    logger.info("purifier_service: turn_purifier_off provider=%s", provider)

    if provider == "homeassistant":
        return _turn_off_homeassistant()
    if provider == "miio":
        return _turn_off_miio()
    return _turn_off_mock()


# ── Home Assistant ───────────────────────────────────────────────────────────

def _turn_on_homeassistant() -> dict:
    import httpx

    url = os.getenv("HOME_ASSISTANT_URL", "").rstrip("/")
    token = os.getenv("HOME_ASSISTANT_TOKEN", "")
    entity_id = os.getenv("XIAOMI_PURIFIER_ENTITY_ID", "fan.xiaomi_air_purifier")

    if not url or not token:
        return {
            "success": False,
            "provider": "homeassistant",
            "message": "Home Assistant not configured",
            "error": "HOME_ASSISTANT_URL and HOME_ASSISTANT_TOKEN required",
        }

    service_url = f"{url}/api/services/homeassistant/turn_on"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {"entity_id": entity_id}

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(service_url, json=body, headers=headers)
        resp.raise_for_status()
        return {"success": True, "provider": "homeassistant", "message": f"Turned on {entity_id}"}
    except httpx.HTTPStatusError as e:
        return {
            "success": False,
            "provider": "homeassistant",
            "message": "Home Assistant request failed",
            "error": f"HTTP {e.response.status_code}: {e.response.text[:150]}",
        }
    except Exception as e:
        return {"success": False, "provider": "homeassistant", "message": "Home Assistant error", "error": str(e)}


def _turn_off_homeassistant() -> dict:
    import httpx

    url = os.getenv("HOME_ASSISTANT_URL", "").rstrip("/")
    token = os.getenv("HOME_ASSISTANT_TOKEN", "")
    entity_id = os.getenv("XIAOMI_PURIFIER_ENTITY_ID", "fan.xiaomi_air_purifier")

    if not url or not token:
        return {
            "success": False,
            "provider": "homeassistant",
            "message": "Home Assistant not configured",
            "error": "HOME_ASSISTANT_URL and HOME_ASSISTANT_TOKEN required",
        }

    service_url = f"{url}/api/services/homeassistant/turn_off"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {"entity_id": entity_id}

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(service_url, json=body, headers=headers)
        resp.raise_for_status()
        return {"success": True, "provider": "homeassistant", "message": f"Turned off {entity_id}"}
    except Exception as e:
        return {"success": False, "provider": "homeassistant", "message": "Home Assistant error", "error": str(e)}


# ── miIO ──────────────────────────────────────────────────────────────────────

def _turn_on_miio() -> dict:
    return _miio_adapter(turn_on=True)


def _turn_off_miio() -> dict:
    return _miio_adapter(turn_on=False)


def _miio_adapter(turn_on: bool) -> dict:
    ip = os.getenv("XIAOMI_PURIFIER_IP", "").strip()
    token = os.getenv("XIAOMI_PURIFIER_TOKEN", "").strip()
    model = os.getenv("XIAOMI_PURIFIER_MODEL", "zhimi.airp.cpa4")

    if not ip or not token:
        return {
            "success": False,
            "provider": "miio",
            "message": "miIO not configured",
            "error": "XIAOMI_PURIFIER_IP and XIAOMI_PURIFIER_TOKEN required",
        }

    try:
        from app.services.miio_purifier import turn_on_purifier, turn_off_purifier
    except ImportError as e:
        return {
            "success": False,
            "provider": "miio",
            "message": "miIO provider unavailable",
            "error": f"python-miio not installed in this Python env. Run: pip install python-miio (then restart server). Detail: {e}",
        }

    try:
        # Suppress python-miio's noisy "Got error when receiving" logs (user ack timeout)
        _saved = [(logging.getLogger(n), logging.getLogger(n).level) for n in ("miio", "miio.miioprotocol")]
        for _log, _ in _saved:
            _log.setLevel(logging.CRITICAL)
        try:
            if turn_on:
                turn_on_purifier(ip=ip, token=token, model=model)
                return {"success": True, "provider": "miio", "message": "Purifier turned on"}
            else:
                turn_off_purifier(ip=ip, token=token, model=model)
                return {"success": True, "provider": "miio", "message": "Purifier turned off"}
        finally:
            for _log, _prev in _saved:
                _log.setLevel(_prev)
    except Exception as e:
        return {"success": False, "provider": "miio", "message": "miIO command failed", "error": str(e)}


# ── Mock ──────────────────────────────────────────────────────────────────────

def _turn_on_mock() -> dict:
    return {"success": True, "provider": "mock", "message": "Mock: purifier on (no real device)"}


def _turn_off_mock() -> dict:
    return {"success": True, "provider": "mock", "message": "Mock: purifier off (no real device)"}
