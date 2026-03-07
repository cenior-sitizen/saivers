"""
Static room + appliance catalogue for WattCoach.

Each household has 4 rooms, each with one AC unit.
device_id follows the convention "ac-{room-slug}" matching ac_readings table.
"""

ROOMS: list[dict] = [
    {
        "room_id":   "living-room",
        "room_name": "Living Room",
        "slug":      "living-room",
        "device_id": "ac-living-room",
        "appliance": "Air Conditioner",
    },
    {
        "room_id":   "master-room",
        "room_name": "Master Room",
        "slug":      "master-room",
        "device_id": "ac-master-room",
        "appliance": "Air Conditioner",
    },
    {
        "room_id":   "room-1",
        "room_name": "Room 1",
        "slug":      "room-1",
        "device_id": "ac-room-1",
        "appliance": "Air Conditioner",
    },
    {
        "room_id":   "room-2",
        "room_name": "Room 2",
        "slug":      "room-2",
        "device_id": "ac-room-2",
        "appliance": "Air Conditioner",
    },
]

# Keyed by device_id for fast lookup
ROOM_MAP: dict[str, dict] = {r["device_id"]: r for r in ROOMS}

# Ordered list of all AC device IDs
DEVICE_IDS: list[str] = [r["device_id"] for r in ROOMS]

# Fixed display order (for consistent API responses)
ROOM_ORDER: list[str] = DEVICE_IDS
