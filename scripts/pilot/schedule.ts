import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import pg from "pg";
const env = parseEnv(await readFile(".env.pilot", "utf8"));
const db = new pg.Client({
  connectionString: env.DATABASE_MIGRATION_URL,
  connectionTimeoutMillis: 10000,
});
await db.connect();
try {
  await db.query("CREATE EXTENSION IF NOT EXISTS pg_cron");
  await db.query(
    "CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions",
  );
  const existing = await db.query(
    "SELECT id FROM vault.secrets WHERE name='daily_update_cron_secret'",
  );
  if (existing.rowCount)
    await db.query("SELECT vault.update_secret($1,$2)", [
      existing.rows[0].id,
      env.CRON_SECRET,
    ]);
  else
    await db.query(
      "SELECT vault.create_secret($1,'daily_update_cron_secret')",
      [env.CRON_SECRET],
    );
  const command = `SELECT net.http_post(url := '${new URL("/api/jobs", env.APP_URL).href}', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='daily_update_cron_secret')), body := '{}'::jsonb, timeout_milliseconds := 180000);`;
  await db.query("SELECT cron.schedule($1,$2,$3)", [
    "daily-update-pilot",
    "* * * * *",
    command,
  ]);
  console.log("Pilot scheduler configured for once per minute.");
} finally {
  await db.end();
}
