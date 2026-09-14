import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { config } from "./config";
import { query, type DB } from "./db";
export const opaque = () => randomBytes(32).toString("base64url");
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export function same(a: string, b: string) {
  const aa = Buffer.from(digest(a)),
    bb = Buffer.from(digest(b));
  return timingSafeEqual(aa, bb);
}
export function scopedToken(id: string, purpose: string) {
  return createHmac("sha256", config().SESSION_SECRET)
    .update(purpose + ":" + id)
    .digest("base64url");
}
export async function newSession(
  db: DB,
  role: "editor" | "subscriber",
  id: string | null = null,
) {
  const token = opaque();
  await db.query(
    "INSERT INTO sessions VALUES($1,$2,$3,now()+interval '7 days')",
    [digest(token), role, id],
  );
  return token;
}
export async function session(token: string | undefined) {
  if (!token) return null;
  return (
    (
      await query<{ role: string; subscriber_id: string | null }>(
        "SELECT role,subscriber_id FROM sessions WHERE hash=$1 AND expires_at>now()",
        [digest(token)],
      )
    )[0] ?? null
  );
}
export async function newToken(db: DB, id: string, purpose: string) {
  const token = opaque();
  await db.query("DELETE FROM tokens WHERE subscriber_id=$1 AND purpose=$2", [
    id,
    purpose,
  ]);
  await db.query(
    "INSERT INTO tokens VALUES($1,$2,$3,now()+interval '30 minutes')",
    [digest(token), purpose, id],
  );
  return token;
}
export async function takeToken(db: DB, token: string, purpose: string) {
  const r = await db.query<{ subscriber_id: string }>(
    "DELETE FROM tokens WHERE hash=$1 AND purpose=$2 AND expires_at>now() RETURNING subscriber_id",
    [digest(token), purpose],
  );
  if (!r.rows[0])
    throw new Error(
      "This link expired or was already used. Request a new one.",
    );
  return r.rows[0].subscriber_id;
}
export async function rateLimit(key: string, max = 20) {
  const rows = await query<{ hits: number }>(
    `INSERT INTO rate_limits VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.resets_at<now() THEN 1 ELSE rate_limits.hits+1 END,resets_at=CASE WHEN rate_limits.resets_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.resets_at END RETURNING hits`,
    [digest(key)],
  );
  if (rows[0].hits > max)
    throw new Error("Too many attempts. Please try again in 15 minutes.");
}
