import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { config } from "./config";
const shared = globalThis as typeof globalThis & { dailyPool?: Pool };
export function pool() {
  return (shared.dailyPool ??= new Pool({
    connectionString: config().DATABASE_URL,
    max: 8,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  }));
}
export type DB = Pick<PoolClient, "query">;
export async function query<T extends QueryResultRow>(
  sql: string,
  values: unknown[] = [],
) {
  return (await pool().query<T>(sql, values)).rows;
}
export async function tx<T>(work: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool().connect();
  try {
    await db.query("BEGIN");
    const result = await work(db);
    await db.query("COMMIT");
    return result;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    db.release();
  }
}
