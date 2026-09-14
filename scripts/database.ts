import EmbeddedPostgres from "embedded-postgres";
import { mkdir, readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "../src/lib/config";
const url = new URL(config().DATABASE_URL);
if (url.hostname !== "127.0.0.1" || url.pathname !== "/daily_update")
  throw new Error("Bundled database requires 127.0.0.1/daily_update");
await mkdir("storage", { recursive: true, mode: 0o700 });
const db = new EmbeddedPostgres({
  databaseDir: resolve("storage/postgres"),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port),
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1", "-k", resolve("storage")],
  onLog: () => {},
  onError: () => {},
});
try {
  await access("storage/postgres/PG_VERSION");
} catch {
  await db.initialise();
}
await db.start();
const client = db.getPgClient();
await client.connect();
if (
  !(
    await client.query("SELECT 1 FROM pg_database WHERE datname='daily_update'")
  ).rowCount
)
  await db.createDatabase("daily_update");
await client.end();
const { pool } = await import("../src/lib/db");
await pool().query(await readFile("src/lib/schema.sql", "utf8"));
await pool().end();
console.log(
  "Local PostgreSQL is ready on 127.0.0.1:" +
    url.port +
    ". Leave this terminal running.",
);
await new Promise(() => {});
