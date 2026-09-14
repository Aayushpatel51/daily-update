import { pool, query } from "./db";
import { switches } from "./editorial";
import { initSources, monitorOnce } from "./monitor";
import { pollTelegram } from "./telegram";
import { buildDigests } from "./digests";
import { drain, recover } from "./delivery";
export async function tick() {
  const db = await pool().connect();
  try {
    const locked = await db.query<{ ok: boolean }>(
      "SELECT pg_try_advisory_lock(621003) AS ok",
    );
    if (!locked.rows[0].ok) return { busy: true };
    try {
      await recover();
      await initSources();
      const sw = await switches(db);
      if (sw.monitoring) await monitorOnce();
      await pollTelegram();
      if (sw.email) await buildDigests();
      await drain(30);
      await query(
        "INSERT INTO settings VALUES('worker',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
        [JSON.stringify({ lastRun: new Date().toISOString(), status: "ok" })],
      );
      return { busy: false };
    } finally {
      await db.query("SELECT pg_advisory_unlock(621003)");
    }
  } finally {
    db.release();
  }
}
