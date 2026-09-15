import { randomUUID } from "node:crypto";
import { pool, query } from "./db";
import { switches } from "./editorial";
import { initSources, monitorOnce } from "./monitor";
import { pollTelegram } from "./telegram";
import { buildDigests } from "./digests";
import { drain, recover } from "./delivery";
// A committed lease works with transaction poolers, unlike session advisory locks.
export async function tick(mode: "all" | "delivery" = "all") {
  const owner = randomUUID();
  const claimed = await query(
    "INSERT INTO job_leases VALUES('worker',$1,now()+interval '4 minutes') ON CONFLICT(name) DO UPDATE SET owner=EXCLUDED.owner,expires_at=EXCLUDED.expires_at WHERE job_leases.expires_at<now() RETURNING owner",
    [owner],
  );
  if (!claimed.length) return { busy: true };
  try {
    await recover();
    if (mode === "all") {
      await initSources();
      const sw = await switches(pool());
      if (sw.monitoring) await monitorOnce();
      await pollTelegram();
      if (sw.email) await buildDigests();
    }
    await drain(10);
    await query(
      "INSERT INTO settings VALUES('worker',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
      [
        JSON.stringify({
          lastRun: new Date().toISOString(),
          status: "ok",
          mode,
        }),
      ],
    );
    return { busy: false };
  } catch {
    await query(
      "INSERT INTO settings VALUES('worker',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
      [
        JSON.stringify({
          lastRun: new Date().toISOString(),
          status: "failed",
          mode,
        }),
      ],
    );
    throw new Error("Worker cycle failed; inspect source and delivery status.");
  } finally {
    await query("DELETE FROM job_leases WHERE name='worker' AND owner=$1", [
      owner,
    ]);
  }
}
