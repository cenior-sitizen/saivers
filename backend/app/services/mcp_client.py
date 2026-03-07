"""
MCP Client — abstraction over Xiaomi MIoT MCP server and mock AC simulator.

MCP_MODE env var:
  mock (default) — calls ac-simulator REST API at AC_SIMULATOR_URL
  miot           — stubs Xiaomi MIoT MCP (logs intent, returns mock success)
                   used for demo/presentation narrative

SIMULATOR_DEVICE_MAP:
  Bridges ClickHouse room-level device_ids → ac-simulator unit-level device_ids.
  One room-level apply fans out to both simulator units for that room.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx

SGT = ZoneInfo("Asia/Singapore")

MCP_MODE = os.getenv("MCP_MODE", "mock")
AC_SIMULATOR_URL = os.getenv("AC_SIMULATOR_URL", "http://localhost:8002")

# Bridge: ClickHouse room-level device_id → ac-simulator unit-level device_ids
SIMULATOR_DEVICE_MAP: dict[str, list[str]] = {
    "ac-living-room": ["ac-living-room-1", "ac-living-room-2"],
    "ac-master-room": ["ac-master-room-1", "ac-master-room-2"],
    "ac-room-1":      ["ac-room-1-unit-1", "ac-room-1-unit-2"],
    "ac-room-2":      ["ac-room-2-unit-1", "ac-room-2-unit-2"],
}

# Append-only device action log buffer (flushed by run_schedule_checker)
_log_buffer: list[list] = []


def _flush_log_buffer() -> None:
    """Flush device action log to ClickHouse device_actions table."""
    if not _log_buffer:
        return
    batch = _log_buffer.copy()
    _log_buffer.clear()
    try:
        from app.db.client import get_client
        get_client().insert(
            "device_actions",
            batch,
            column_names=[
                "household_id", "device_id", "action_type",
                "params_json", "status",
                "projected_kwh_saved", "projected_sgd_saved",
            ],
        )
    except Exception:
        pass  # best-effort for demo


def _log_action(household_id: int, device_id: str, action_type: str,
                params: dict, status: str) -> None:
    _log_buffer.append([
        household_id, device_id, action_type,
        json.dumps(params), status, 0.0, 0.0,
    ])
    # Flush inline for recommendation applies (not just on schedule tick)
    _flush_log_buffer()


class MCPClient:
    """
    Unified interface for controlling AC appliances.

    Usage:
        client = MCPClient(household_id=1001)
        result = client.apply_settings("ac-living-room", temp_c=25, mode="cool")
        status = client.get_status("ac-living-room")
    """

    def __init__(self, household_id: int) -> None:
        self.household_id = household_id
        self.mode = MCP_MODE

    def apply_settings(
        self,
        room_device_id: str,
        temp_c: int,
        mode: str = "cool",
    ) -> dict:
        """
        Apply temperature and mode settings to all simulator units for a room.

        Returns:
          {
            "success": bool,
            "partial": bool,       # True if some units failed
            "units": [{device_id, success, error?}],
            "room_device_id": str,
          }
        """
        sim_units = SIMULATOR_DEVICE_MAP.get(room_device_id, [room_device_id])

        if self.mode == "miot":
            return self._apply_miot(room_device_id, sim_units, temp_c, mode)
        return self._apply_mock(room_device_id, sim_units, temp_c, mode)

    def _apply_mock(
        self,
        room_device_id: str,
        sim_units: list[str],
        temp_c: int,
        mode: str,
    ) -> dict:
        """Call ac-simulator REST API for each unit in the room."""
        unit_results: list[dict] = []

        for unit_id in sim_units:
            url = f"{AC_SIMULATOR_URL}/ac/{self.household_id}/{unit_id}/on"
            try:
                resp = httpx.post(
                    url,
                    json={"temp_c": temp_c, "mode": mode},
                    timeout=5.0,
                )
                resp.raise_for_status()
                status = "completed"
                unit_results.append({"device_id": unit_id, "success": True})
            except httpx.ConnectError:
                status = "failed"
                unit_results.append({
                    "device_id": unit_id,
                    "success": False,
                    "error": "AC simulator unreachable",
                })
            except Exception as e:
                status = "failed"
                unit_results.append({
                    "device_id": unit_id,
                    "success": False,
                    "error": str(e),
                })

            _log_action(
                self.household_id, unit_id, "mcp_apply",
                {"temp_c": temp_c, "mode": mode, "room": room_device_id},
                status,
            )

        successes = [u for u in unit_results if u["success"]]
        return {
            "success": len(successes) > 0,
            "partial": 0 < len(successes) < len(unit_results),
            "units": unit_results,
            "room_device_id": room_device_id,
        }

    def _apply_miot(
        self,
        room_device_id: str,
        sim_units: list[str],
        temp_c: int,
        mode: str,
    ) -> dict:
        """
        Xiaomi MIoT MCP stub — for demo/presentation narrative.
        Logs intent, returns mock success without making any external call.
        """
        now = datetime.now(SGT).isoformat()
        for unit_id in sim_units:
            print(
                f"[MIOT MCP] {now} Would call Xiaomi MIoT MCP server: "
                f"set {unit_id} → temp={temp_c}°C mode={mode}"
            )
            _log_action(
                self.household_id, unit_id, "mcp_miot_apply",
                {"temp_c": temp_c, "mode": mode, "room": room_device_id,
                 "mcp_url": "https://mcpmarket.com/server/miot"},
                "completed",
            )

        return {
            "success": True,
            "partial": False,
            "units": [{"device_id": u, "success": True} for u in sim_units],
            "room_device_id": room_device_id,
        }

    def get_status(self, room_device_id: str) -> list[dict]:
        """
        Get current status of all simulator units for a room.
        Returns list of ACState dicts from the simulator.
        """
        sim_units = SIMULATOR_DEVICE_MAP.get(room_device_id, [room_device_id])

        if self.mode == "miot":
            # Return mock status for presentation mode
            return [
                {"device_id": u, "is_on": False, "temp_c": 25, "mode": "cool",
                 "power_w": 0.0, "source": "miot_stub"}
                for u in sim_units
            ]

        results = []
        for unit_id in sim_units:
            url = f"{AC_SIMULATOR_URL}/ac/{self.household_id}/{unit_id}"
            try:
                resp = httpx.get(url, timeout=5.0)
                resp.raise_for_status()
                results.append(resp.json())
            except Exception as e:
                results.append({
                    "device_id": unit_id,
                    "error": str(e),
                    "is_on": False,
                    "temp_c": 0,
                    "mode": "unknown",
                    "power_w": 0.0,
                })
        return results
