import os
from functools import lru_cache

import clickhouse_connect
from clickhouse_connect.driver.client import Client
from dotenv import load_dotenv

load_dotenv()

_REQUIRED_ENV = ("CLICKHOUSE_HOST", "CLICKHOUSE_USER", "CLICKHOUSE_PASSWORD")


def _validate_env() -> None:
    missing = [k for k in _REQUIRED_ENV if not os.getenv(k)]
    if missing:
        raise EnvironmentError(f"Missing required env vars: {', '.join(missing)}")


@lru_cache(maxsize=1)
def get_client() -> Client:
    _validate_env()
    host = os.environ["CLICKHOUSE_HOST"].replace("https://", "").replace("http://", "").rstrip("/")
    return clickhouse_connect.get_client(
        host=host,
        port=443,
        user=os.environ["CLICKHOUSE_USER"],
        password=os.environ["CLICKHOUSE_PASSWORD"],
        database=os.getenv("CLICKHOUSE_DB", "saivers"),
        secure=True,
        # Safe small-batch writes — avoids ClickHouse part explosion for real-time inserts
        settings={"async_insert": 1, "wait_for_async_insert": 1},
    )
