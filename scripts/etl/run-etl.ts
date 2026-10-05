// Extract-transform-load job that rebuilds the `analytics` star schema from
// the live OLTP tables (User/Lead/Sale/Commission). Run with `npm run db:etl`.
import { Client } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = resolve(__dirname, "..", "..", "analytics", "sql");

const STEPS = [
  "01_schema.sql",
  "02_load_dim_date.sql",
  "03_load_dims.sql",
  "04_load_facts.sql",
  "05_views.sql",
];

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Set DATABASE_URL (or DATABASE_URL_UNPOOLED) before running the ETL.");
  }

  const client = new Client(connectionString);
  await client.connect();

  try {
    for (const step of STEPS) {
      const sql = readFileSync(resolve(SQL_DIR, step), "utf8");
      console.log(`Running ${step}...`);
      await client.query(sql);
    }
    console.log("ETL complete: analytics schema rebuilt.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("ETL failed:", err);
  process.exit(1);
});
