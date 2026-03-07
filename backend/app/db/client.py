"""ClickHouse Cloud client singleton."""

import os
import clickhouse_connect
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


@lru_cache(maxsize=1)
def get_client():
    """Return a cached ClickHouse client. Reads credentials from .env."""
    host = os.getenv("CLICKHOUSE_HOST", "")
    user = os.getenv("CLICKHOUSE_USER", "default")
    password = os.getenv("CLICKHOUSE_PASSWORD", "")
    database = os.getenv("CLICKHOUSE_DB", "default")

    # Strip protocol prefix if present (clickhouse-connect wants host only)
    host = host.replace("https://", "").replace("http://", "").rstrip("/")

    return clickhouse_connect.get_client(
        host=host,
        user=user,
        port=443,
        password=password,
        database=database,
        secure=True,
        # Safe small-batch writes — avoids ClickHouse part explosion for real-time inserts
        settings={"async_insert": 1, "wait_for_async_insert": 1},
    )
