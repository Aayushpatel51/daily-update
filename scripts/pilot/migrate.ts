import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import pg from "pg";
const env = parseEnv(await readFile(".env.pilot", "utf8"));
const db = new pg.Client({
  connectionString: env.DATABASE_MIGRATION_URL,
  connectionTimeoutMillis: 10000,
});
await db.connect();
const tables = [
  "migrations",
  "stories",
  "revisions",
  "subscribers",
  "sessions",
  "tokens",
  "digests",
  "outbox",
  "sources",
  "settings",
  "telegram_updates",
  "rate_limits",
  "job_leases",
  "email_budget",
  "email_events",
];
try {
  await db.query("BEGIN");
  await db.query(await readFile("src/lib/schema.sql", "utf8"));
  for (const table of tables) {
    await db.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    await db.query(
      `REVOKE ALL ON TABLE public.${table} FROM anon,authenticated`,
    );
  }
  await db.query("COMMIT");
  console.log("Pilot schema applied; browser Data API roles denied access.");
} catch {
  await db.query("ROLLBACK");
  throw new Error("Pilot migration failed; transaction rolled back.");
} finally {
  await db.end();
}
