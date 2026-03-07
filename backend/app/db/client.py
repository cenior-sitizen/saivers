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
    return clickhouse_connect.get_client(
        host=os.environ["CLICKHOUSE_HOST"],
        port=443,
        user=os.environ["CLICKHOUSE_USER"],
        password=os.environ["CLICKHOUSE_PASSWORD"],
        secure=True,
    )
