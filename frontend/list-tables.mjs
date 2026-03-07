import { createClient } from '@clickhouse/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
} catch (_) {}

const client = createClient({
  url: `https://${process.env.CLICKHOUSE_HOST}:443`,
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

const db = process.env.CLICKHOUSE_DB || 'default';
const result = await client.query({
  query: `SELECT name, engine, total_rows FROM system.tables WHERE database = {db:String} ORDER BY name`,
  query_params: { db },
  format: 'JSONEachRow',
});
const rows = await result.json();
await client.close();

console.log(`Tables in "${db}":`);
console.table(rows);
