"""
ClickHouse connection test.
Usage: uv run python scripts/test_clickhouse.py
"""

import os
from dotenv import load_dotenv
import clickhouse_connect

load_dotenv()

host = os.getenv("CLICKHOUSE_HOST", "").replace("https://", "").replace("http://", "")
user = os.getenv("CLICKHOUSE_USER", "default")
password = os.getenv("CLICKHOUSE_PASSWORD", "")
database = os.getenv("CLICKHOUSE_DB", "wattcoach")

print(f"Connecting to: {host}")
print(f"User:          {user}")
print(f"Database:      {database}")
print()

try:
    # Connect without database — set context explicitly after connection
    client = clickhouse_connect.get_client(
        host=host,
        user=user,
        port=443,
        password=password,
        secure=True,
    )
    version = client.query("SELECT version()").result_rows[0][0]
    print(f"Connected! ClickHouse version: {version}")

    # Check if target database exists, create it if not
    existing_dbs = [row[0] for row in client.query("SHOW DATABASES").result_rows]
    if database not in existing_dbs:
        print(f"Database '{database}' not found. Creating it...")
        client.command(f"CREATE DATABASE IF NOT EXISTS {database}")
        print(f"Database '{database}' created.")
    else:
        print(f"Database '{database}' exists.")

    # List tables explicitly from target database
    tables = client.query(f"SHOW TABLES FROM {database}").result_rows
    if tables:
        print(f"Tables in '{database}': {[t[0] for t in tables]}")
    else:
        print(f"No tables yet in '{database}' — run migrations next:")
        print("  uv run python -m app.db.migrations")

except Exception as e:
    print(f"FAILED: {e}")
    print()
    print("Common fixes:")
    print("  1. IP not allowlisted -> ClickHouse Cloud > Security > Add 0.0.0.0/0")
    print("  2. Wrong password     -> ClickHouse Cloud > Settings > Reset password")
    print("  3. Wrong host         -> check CLICKHOUSE_HOST in .env (no trailing slash)")
