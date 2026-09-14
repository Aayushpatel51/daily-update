import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { z } from "zod";
import pg from "pg";
import { config } from "../src/lib/config";
import { backupTables } from "../src/lib/backup";
const path = process.argv[2];
if (!path)
  throw new Error(
    "Pass a private snapshot path. Restore targets a fresh isolated test database only.",
  );
if ((await stat(path)).size > 100 * 1024 * 1024)
  throw new Error("Snapshot too large for local restore tool.");
const data = await readFile(path, "utf8"),
  checksum = await readFile(path + ".sha256", "utf8");
if (createHash("sha256").update(data).digest("hex") !== checksum.trim())
  throw new Error("Snapshot checksum mismatch.");
const snapshot = z
  .object({
    version: z.literal(1),
    tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  })
  .parse(JSON.parse(data));
for (const name of backupTables)
  if (!snapshot.tables[name]) throw new Error("Missing snapshot table.");
const url = new URL(config().DATABASE_URL);
const root = new pg.Pool({ connectionString: url.href }),
  name = "daily_update_restore_" + Date.now();
await root.query(`CREATE DATABASE ${name}`);
await root.end();
url.pathname = "/" + name;
const db = new pg.Client({ connectionString: url.href });
await db.connect();
try {
  await db.query("BEGIN");
  await db.query(await readFile("src/lib/schema.sql", "utf8"));
  await db.query("TRUNCATE settings");
  for (const table of backupTables) {
    await db.query(
      `INSERT INTO ${table} SELECT * FROM jsonb_populate_recordset(NULL::${table},$1::jsonb)`,
      [JSON.stringify(snapshot.tables[table])],
    );
  }
  await db.query(
    "SELECT setval(pg_get_serial_sequence('revisions','id'),COALESCE((SELECT max(id) FROM revisions),1),EXISTS(SELECT 1 FROM revisions))",
  );
  await db.query(
    "UPDATE outbox SET status='ambiguous',error='restored_submission_needs_review' WHERE status='processing'",
  );
  await db.query("COMMIT");
  const count = await db.query("SELECT count(*)::int AS stories FROM stories");
  console.log(
    `Restore verified in ${name}; ${count.rows[0].stories} stories. Sessions and linking tokens intentionally excluded.`,
  );
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
