"""
Create and seed the device_registry table in ClickHouse.

Maps device_id strings (used in ac_readings) to rich metadata:
brand, model name, room label, device type.

Covers all 10 demo households × 4 AC rooms + fridge per household.
Each household gets a distinct mix of AC brands (Singapore market:
Daikin, Mitsubishi Electric, Panasonic, LG, Midea, Samsung).

Xiaomi fridge models sourced from official Xiaomi Singapore lineup:
  BCD-329WMSD  — 329 L double-door
  BCD-521WMBI  — 521 L French door (4-door)

Usage:
    uv run python -m scripts.seed_device_registry
"""

from datetime import datetime, timezone

from app.db.client import get_client

SGT = timezone(__import__("datetime").timedelta(hours=8))
NOW = datetime.now(SGT)

# -----------------------------------------------------------------
# Table DDL
# -----------------------------------------------------------------
DDL = """
CREATE TABLE IF NOT EXISTS saivers.device_registry
(
    household_id  UInt32,
    device_id     String,
    room          String,
    device_type   LowCardinality(String),
    brand         LowCardinality(String),
    model_name    String,
    updated_at    DateTime('Asia/Singapore')
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (household_id, device_id)
"""

# -----------------------------------------------------------------
# AC brand/model catalogue (Singapore market, 2024-2026 lineup)
# -----------------------------------------------------------------
_AC_MODELS: dict[str, list[tuple[str, str]]] = {
    # brand → [(model_name, capacity_label), ...]
    "Daikin": [
        ("FTKF25TV", "9,000 BTU"),
        ("FTKF35TV", "12,000 BTU"),
        ("FTKM60SVM", "24,000 BTU"),
    ],
    "Mitsubishi Electric": [
        ("MSY-GN10VF", "9,500 BTU"),
        ("MSY-GN13VF", "12,300 BTU"),
        ("MSY-GN18VF", "18,000 BTU"),
    ],
    "Panasonic": [
        ("CS-PU12VKH", "12,000 BTU"),
        ("CS-PU18VKH", "18,000 BTU"),
        ("CS-PU9VKH",  "9,000 BTU"),
    ],
    "LG": [
        ("S12EQ.NSJ", "12,000 BTU"),
        ("S09EQ.NSJ", "9,000 BTU"),
        ("S18ET.NSJ", "18,000 BTU"),
    ],
    "Midea": [
        ("MSAGD-12HRN1", "12,000 BTU"),
        ("MSAGD-09HRN1", "9,000 BTU"),
        ("MSAGD-18HRN1", "18,000 BTU"),
    ],
    "Samsung": [
        ("AR12TXHQAWKXXSP", "12,000 BTU"),
        ("AR09TXHQAWKXXSP", "9,000 BTU"),
        ("AR18TXHQAWKXXSP", "18,000 BTU"),
    ],
}

# Fridge catalogue (Xiaomi Singapore lineup)
_FRIDGE_MODELS: dict[str, str] = {
    "BCD-329WMSD": "Xiaomi Smart Refrigerator 329L Double Door",
    "BCD-521WMBI": "Xiaomi Smart Refrigerator 521L French Door (4-door)",
}

# -----------------------------------------------------------------
# Per-household device assignments
# Four AC rooms + one fridge.
# Format: (device_id, room_label, brand, model_index, fridge_model)
# -----------------------------------------------------------------
_HOUSEHOLD_CONFIG: dict[int, dict] = {
    1001: {
        "ac": [
            ("ac-living-room",  "Living Room",  "Daikin",              0),
            ("ac-master-room",  "Master Room",  "Mitsubishi Electric", 0),
            ("ac-room-1",       "Room 1",       "LG",                  0),
            ("ac-room-2",       "Room 2",       "LG",                  1),
        ],
        "fridge": "BCD-329WMSD",
    },
    1002: {
        "ac": [
            ("ac-living-room",  "Living Room",  "Panasonic",           0),
            ("ac-master-room",  "Master Room",  "Panasonic",           1),
            ("ac-room-1",       "Room 1",       "Midea",               0),
            ("ac-room-2",       "Room 2",       "Midea",               1),
        ],
        "fridge": "BCD-329WMSD",
    },
    1003: {
        "ac": [
            ("ac-living-room",  "Living Room",  "Mitsubishi Electric", 1),
            ("ac-master-room",  "Master Room",  "Daikin",              1),
            ("ac-room-1",       "Room 1",       "Daikin",              0),
            ("ac-room-2",       "Room 2",       "Samsung",             0),
        ],
        "fridge": "BCD-521WMBI",
    },
    1004: {
        "ac": [
            ("ac-living-room",  "Living Room",  "LG",                  0),
            ("ac-master-room",  "Master Room",  "LG",                  2),
            ("ac-room-1",       "Room 1",       "Midea",               0),
            ("ac-room-2",       "Room 2",       "Panasonic",           2),
        ],
        "fridge": "BCD-329WMSD",
    },
    1005: {
        "ac": [
            ("ac-living-room",  "Living Room",  "Samsung",             0),
            ("ac-master-room",  "Master Room",  "Samsung",             2),
            ("ac-room-1",       "Room 1",       "Daikin",              0),
            ("ac-room-2",       "Room 2",       "Daikin",              2),
        ],
        "fridge": "BCD-329WMSD",
    },
    1006: {
        "ac": [
            ("ac-living-room",  "Living Room",  "Mitsubishi Electric", 0),
            ("ac-master-room",  "Master Room",  "Mitsubishi Electric", 2),
            ("ac-room-1",       "Room 1",       "Panasonic",           0),
            ("ac-room-2",       "Room 2",       "LG",                  1),
        ],
        "fridge": "BCD-521WMBI",
    },
    1007: {
        "ac": [
            ("ac-living-room",  "Living Room",  "Daikin",              1),
            ("ac-master-room",  "Master Room",  "Midea",               2),
            ("ac-room-1",       "Room 1",       "Samsung",             1),
            ("ac-room-2",       "Room 2",       "Samsung",             2),
        ],
        "fridge": "BCD-329WMSD",
    },
    1008: {
        "ac": [
            ("ac-living-room",  "Living Room",  "Panasonic",           2),
            ("ac-master-room",  "Master Room",  "Daikin",              2),
            ("ac-room-1",       "Room 1",       "Mitsubishi Electric", 1),
            ("ac-room-2",       "Room 2",       "Midea",               1),
        ],
        "fridge": "BCD-521WMBI",
    },
    1009: {
        "ac": [
            ("ac-living-room",  "Living Room",  "LG",                  2),
            ("ac-master-room",  "Master Room",  "Samsung",             0),
            ("ac-room-1",       "Room 1",       "Daikin",              0),
            ("ac-room-2",       "Room 2",       "Panasonic",           1),
        ],
        "fridge": "BCD-329WMSD",
    },
    1010: {
        "ac": [
            ("ac-living-room",  "Living Room",  "Mitsubishi Electric", 2),
            ("ac-master-room",  "Master Room",  "LG",                  0),
            ("ac-room-1",       "Room 1",       "Samsung",             2),
            ("ac-room-2",       "Room 2",       "Daikin",              1),
        ],
        "fridge": "BCD-521WMBI",
    },
}

_COLUMNS = ["household_id", "device_id", "room", "device_type", "brand", "model_name", "updated_at"]


def build_rows() -> list[list]:
    rows: list[list] = []
    for hid, cfg in _HOUSEHOLD_CONFIG.items():
        # AC devices
        for device_id, room_label, brand, model_idx in cfg["ac"]:
            model_name, _ = _AC_MODELS[brand][model_idx]
            rows.append([hid, device_id, room_label, "ac", brand, model_name, NOW])

        # Fridge
        fridge_model_id = cfg["fridge"]
        fridge_full_name = _FRIDGE_MODELS[fridge_model_id]
        rows.append([hid, "fridge-kitchen", "Kitchen", "fridge", "Xiaomi", fridge_full_name, NOW])

    return rows


def seed() -> None:
    client = get_client()

    print("Creating device_registry table...")
    client.command(DDL)

    print("Clearing existing rows...")
    client.command("TRUNCATE TABLE IF EXISTS saivers.device_registry")

    rows = build_rows()
    print(f"Inserting {len(rows)} device registry rows...")
    client.insert("device_registry", rows, column_names=_COLUMNS)

    count = client.command("SELECT count() FROM device_registry FINAL")
    print(f"device_registry: {count} rows inserted")

    # Preview
    r = client.query(
        "SELECT household_id, device_id, room, brand, model_name "
        "FROM device_registry FINAL "
        "WHERE household_id IN (1001, 1002, 1003) "
        "ORDER BY household_id, device_id"
    )
    print("\nSample (households 1001–1003):")
    for row in r.named_results():
        print(f"  {row['household_id']} | {row['device_id']:<18} | {row['room']:<12} | {row['brand']:<22} | {row['model_name']}")


if __name__ == "__main__":
    seed()
