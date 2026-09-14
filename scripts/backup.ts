import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { pool } from "../src/lib/db";
import { backupTables } from "../src/lib/backup";
const db = await pool().connect();
try {
  await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const tables: Record<string, unknown[]> = {};
  for (const name of backupTables)
    tables[name] = (
      await db.query(`SELECT to_jsonb(t) AS row FROM ${name} t`)
    ).rows.map((r) => r.row);
  const data = JSON.stringify({
    version: 1,
    createdAt: new Date().toISOString(),
    tables,
  });
  await db.query("COMMIT");
  await mkdir("storage/backups", { recursive: true, mode: 0o700 });
  const path = resolve(
    "storage/backups",
    `daily-update-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(path, data, { mode: 0o600, flag: "wx" });
  await writeFile(
    path + ".sha256",
    createHash("sha256").update(data).digest("hex"),
    { mode: 0o600, flag: "wx" },
  );
  console.log("Private snapshot saved: " + path);
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  db.release();
  await pool().end();
}
