HOUSEHOLDS: list[dict] = [
    {"household_id": 1001, "name": "Ahmad",    "flat_type": "4-room HDB", "block": "Blk 601 Punggol Drive"},
    {"household_id": 1002, "name": "Priya",    "flat_type": "4-room HDB", "block": "Blk 612 Punggol Way"},
    {"household_id": 1003, "name": "Wei Ming", "flat_type": "5-room HDB", "block": "Blk 623 Punggol Central"},
    {"household_id": 1004, "name": "Siti",     "flat_type": "4-room HDB", "block": "Blk 634 Punggol Road"},
    {"household_id": 1005, "name": "Rajan",    "flat_type": "4-room HDB", "block": "Blk 645 Punggol Field"},
    {"household_id": 1006, "name": "Li Ling",  "flat_type": "5-room HDB", "block": "Blk 656 Punggol Place"},
    {"household_id": 1007, "name": "Muthu",    "flat_type": "4-room HDB", "block": "Blk 667 Punggol Park"},
    {"household_id": 1008, "name": "Xiao Hua", "flat_type": "5-room HDB", "block": "Blk 678 Punggol East"},
    {"household_id": 1009, "name": "Zainab",   "flat_type": "4-room HDB", "block": "Blk 689 Punggol West"},
    {"household_id": 1010, "name": "Chandra",  "flat_type": "Condo",      "block": "Waterway Terraces I"},
]

NEIGHBORHOOD_ID = "punggol"
DEVICE_ID = "ac-living-room"
HOUSEHOLD_IDS = [h["household_id"] for h in HOUSEHOLDS]
HOUSEHOLD_MAP = {h["household_id"]: h for h in HOUSEHOLDS}
