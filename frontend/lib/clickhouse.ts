/**
 * ClickHouse client for server-side API routes.
 * Uses env: CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD, CLICKHOUSE_DB
 */

import { createClient, ClickHouseClient } from "@clickhouse/client";

let _client: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!_client) {
    const host = process.env.CLICKHOUSE_HOST;
    const user = process.env.CLICKHOUSE_USER;
    const password = process.env.CLICKHOUSE_PASSWORD;
    const database = process.env.CLICKHOUSE_DB || "default";

    if (!host || !user || !password) {
      throw new Error("Missing CLICKHOUSE_HOST, CLICKHOUSE_USER, or CLICKHOUSE_PASSWORD");
    }

    _client = createClient({
      url: `https://${host}`,
      username: user,
      password,
      database,
      request_timeout: 15_000,
    });
  }
  return _client;
}

/** household_id -> room slug (first 4 households map to the 4 room pages) */
export const HOUSEHOLD_TO_ROOM: Record<number, string> = {
  1001: "master-room",
  1002: "room-1",
  1003: "room-2",
  1004: "living-room",
};

export const ROOM_TO_HOUSEHOLD: Record<string, number> = Object.fromEntries(
  Object.entries(HOUSEHOLD_TO_ROOM).map(([k, v]) => [v, Number(k)])
);
