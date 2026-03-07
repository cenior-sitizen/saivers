/**
 * Test ClickHouse connection and analyze database schema/data.
 * Run: npx tsx scripts/test-clickhouse.ts
 *
 * Uses .env from frontend root (CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD, CLICKHOUSE_DB).
 */

import { createClient } from "@clickhouse/client";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from frontend root
config({ path: resolve(process.cwd(), ".env") });

const host = process.env.CLICKHOUSE_HOST;
const user = process.env.CLICKHOUSE_USER;
const password = process.env.CLICKHOUSE_PASSWORD;
const database = process.env.CLICKHOUSE_DB || "default";

async function main() {
  console.log("=== ClickHouse Connection Test ===\n");
  console.log("Config:", { host, user: user ? "***" : "(empty)", database });

  if (!host || !user || !password) {
    console.error("Missing CLICKHOUSE_HOST, CLICKHOUSE_USER, or CLICKHOUSE_PASSWORD in .env");
    process.exit(1);
  }

  // ClickHouse Cloud: HTTPS on 443 (default) or 8443
  const client = createClient({
    url: `https://${host}`,
    username: user,
    password,
    database,
    request_timeout: 10_000,
  });

  try {
    // 1. Ping
    const ping = await client.ping();
    console.log("\n1. Ping:", ping.success ? "OK" : "FAILED");

    // 2. List tables
    const tablesResult = await client.query({
      query: `SELECT name, engine FROM system.tables WHERE database = '${database}' ORDER BY name`,
    });
    const tables = await tablesResult.json();
    console.log("\n2. Tables in database:", database);
    const tableList = (tables as { data: { name: string; engine: string }[] }).data;
    if (tableList?.length) {
      tableList.forEach((t) => console.log(`   - ${t.name} (${t.engine || ""})`));
    } else {
      console.log("   (no tables or different response format)");
      console.log("   Raw:", JSON.stringify(tables, null, 2).slice(0, 500));
    }

    // 3. Describe ac_readings and sp_energy_intervals
    for (const table of ["ac_readings", "sp_energy_intervals"]) {
      try {
        const desc = await client.query({
          query: `DESCRIBE TABLE ${table}`,
        });
        const descData = await desc.json();
        console.log(`\n3. Schema: ${table}`);
        const rows = (descData as { data?: { name: string; type: string }[] }).data;
        if (rows?.length) {
          rows.forEach((r: { name: string; type: string }) => console.log(`   ${r.name}: ${r.type}`));
        }
      } catch (e) {
        console.log(`\n3. ${table}: not found or error`, (e as Error).message);
      }
    }

    // 4. Row counts
    for (const table of ["ac_readings", "sp_energy_intervals"]) {
      try {
        const countResult = await client.query({
          query: `SELECT count() as cnt FROM ${table}`,
        });
        const countData = await countResult.json();
        const cnt = (countData as { data?: { cnt: string }[] }).data?.[0]?.cnt;
        console.log(`\n4. ${table} row count:`, cnt ?? "?");
      } catch (e) {
        console.log(`\n4. ${table} count error:`, (e as Error).message);
      }
    }

    // 5. Sample ac_readings (last 5 rows)
    try {
      const sampleAc = await client.query({
        query: `
          SELECT household_id, device_id, ts, power_w, kwh, temp_setting_c, is_on, mode
          FROM ac_readings
          ORDER BY ts DESC
          LIMIT 5
        `,
      });
      const acData = await sampleAc.json();
      console.log("\n5. Sample ac_readings (last 5):");
      console.log(JSON.stringify(acData, null, 2));
    } catch (e) {
      console.log("\n5. ac_readings sample error:", (e as Error).message);
    }

    // 6. Sample sp_energy_intervals (last 5 rows)
    try {
      const sampleSp = await client.query({
        query: `
          SELECT household_id, neighborhood_id, flat_type, ts, kwh, cost_sgd, peak_flag
          FROM sp_energy_intervals
          ORDER BY ts DESC
          LIMIT 5
        `,
      });
      const spData = await sampleSp.json();
      console.log("\n6. Sample sp_energy_intervals (last 5):");
      console.log(JSON.stringify(spData, null, 2));
    } catch (e) {
      console.log("\n6. sp_energy_intervals sample error:", (e as Error).message);
    }

    // 7. Aggregated AC usage by household (last 7 days) - useful for UI
    try {
      const aggAc = await client.query({
        query: `
          SELECT
            household_id,
            device_id,
            sum(kwh) as total_kwh,
            countIf(is_on) as on_slots,
            avg(temp_setting_c) as avg_temp
          FROM ac_readings
          WHERE reading_date >= today() - 7
          GROUP BY household_id, device_id
          ORDER BY household_id
          LIMIT 20
        `,
      });
      const aggData = await aggAc.json();
      console.log("\n7. AC usage by household (last 7 days):");
      console.log(JSON.stringify(aggData, null, 2));
    } catch (e) {
      console.log("\n7. AC aggregation error:", (e as Error).message);
    }

    console.log("\n=== Connection test complete ===");
  } catch (err) {
    console.error("\nConnection error:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
