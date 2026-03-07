"""
Seed ClickHouse with generated mock data.

Inserts in batches of 50,000 rows (per insert-batch-size rule).
Never inserts single rows — avoids ClickHouse part explosion.

Usage:
    uv run python -m scripts.seed_clickhouse
"""

from app.db.client import get_client
from scripts.generate_ac_data import generate_ac_data
from scripts.generate_sp_data import generate_sp_data

BATCH_SIZE = 50_000


def _insert_batches(client, table: str, column_names: list[str], rows: list[dict]) -> None:
    total = len(rows)
    inserted = 0
    while inserted < total:
        batch = rows[inserted : inserted + BATCH_SIZE]
        data = [[row[col] for col in column_names] for row in batch]
        client.insert(table, data, column_names=column_names)
        inserted += len(batch)
        print(f"  [{table}] inserted {inserted:,}/{total:,}")


def seed() -> None:
    client = get_client()

    print("Generating SP interval data...")
    sp_rows = generate_sp_data()
    print(f"  {len(sp_rows):,} SP rows generated")

    print("Inserting sp_energy_intervals...")
    _insert_batches(
        client,
        "sp_energy_intervals",
        ["household_id", "neighborhood_id", "flat_type", "ts", "kwh", "cost_sgd", "carbon_kg", "peak_flag", "dr_event_flag"],
        sp_rows,
    )

    print("Generating AC reading data...")
    ac_rows = generate_ac_data(sp_rows)
    print(f"  {len(ac_rows):,} AC rows generated")

    print("Inserting ac_readings...")
    _insert_batches(
        client,
        "ac_readings",
        ["household_id", "device_id", "ts", "power_w", "kwh", "temp_setting_c", "is_on", "mode"],
        ac_rows,
    )

    sp_count = client.command("SELECT count() FROM sp_energy_intervals")
    ac_count = client.command("SELECT count() FROM ac_readings")
    print(f"\nSeed complete.")
    print(f"  sp_energy_intervals: {sp_count:,} rows")
    print(f"  ac_readings:         {ac_count:,} rows")


if __name__ == "__main__":
    seed()
