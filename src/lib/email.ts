import { z } from "zod";
import { Webhook } from "svix";
import { config } from "./config";
import { query, tx } from "./db";
import { scopedToken } from "./security";
import type { Delivery, Subscriber } from "./models";
import type { ProviderResult } from "./delivery";
export async function sendEmail(
  d: Delivery,
  s: Subscriber | undefined,
): Promise<ProviderResult> {
  const c = config();
  if (!s?.email || s.email.toLowerCase() !== c.PILOT_EMAIL.toLowerCase())
    return { status: "failed", error: "email_recipient_not_allowed" };
  const eligible = await query<Subscriber>(
    "SELECT * FROM subscribers WHERE id=$1",
    [s.id],
  );
  if (
    !eligible[0] ||
    eligible[0].email !== s.email ||
    eligible[0].email_state === "suppressed" ||
    (d.purpose === "digest" && eligible[0].email_state !== "active")
  )
    return { status: "failed", error: "email_recipient_ineligible" };
  const budget = await tx(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(621010)");
    if (
      (
        await db.query("SELECT 1 FROM email_budget WHERE delivery_id=$1", [
          d.id,
        ])
      ).rowCount
    )
      return true;
    const counts = (
      await db.query<{ day: number; month: number }>(
        "SELECT count(*) FILTER(WHERE reserved_at>=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::int AS day,count(*)::int AS month FROM email_budget WHERE reserved_at>=date_trunc('month',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'",
      )
    ).rows[0];
    if (counts.day >= 90 || counts.month >= 2800) return false;
    await db.query("INSERT INTO email_budget(delivery_id) VALUES($1)", [d.id]);
    return true;
  });
  if (!budget) return { status: "failed", error: "free_email_budget_reached" };
  const headers: Record<string, string> = {};
  if (d.purpose === "digest") {
    const url = `${c.APP_URL}/api/unsubscribe?id=${s.id}&token=${scopedToken(s.id, "unsubscribe")}`;
    headers["List-Unsubscribe"] = `<${url}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": d.id,
      },
      body: JSON.stringify({
        from: c.EMAIL_FROM,
        to: [s.email],
        subject: String(d.payload.title),
        html: String(d.payload.html),
        text: String(d.payload.text),
        headers,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (r.status === 429)
      return {
        status: "queued",
        error: "email_rate_limited",
        retrySeconds: 60,
      };
    if (r.status >= 500)
      return { status: "ambiguous", error: "email_submission_uncertain" };
    if (!r.ok)
      return { status: "failed", error: "email_provider_rejected_" + r.status };
    const value = z.object({ id: z.string() }).safeParse(await r.json());
    return value.success
      ? { status: "accepted", id: value.data.id }
      : { status: "ambiguous", error: "email_invalid_response" };
  } catch {
    return { status: "ambiguous", error: "email_submission_uncertain" };
  }
}
export function verifyEmailEvent(
  body: string,
  headers: Record<string, string>,
  secret: string,
) {
  new Webhook(secret).verify(body, headers);
  return z
    .object({ type: z.string(), data: z.object({ email_id: z.string() }) })
    .parse(JSON.parse(body));
}
export async function recordEmailEvent(
  eventId: string,
  event: { type: string; data: { email_id: string } },
) {
  await tx(async (db) => {
    const fresh = await db.query(
      "INSERT INTO email_events(event_id,provider_id,type) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING event_id",
      [eventId, event.data.email_id, event.type],
    );
    if (!fresh.rowCount) return;
    if (
      ["email.bounced", "email.complained", "email.suppressed"].includes(
        event.type,
      )
    ) {
      const ids = (
        await db.query<{ subscriber_id: string }>(
          "SELECT subscriber_id FROM outbox WHERE channel='email' AND provider_id=$1",
          [event.data.email_id],
        )
      ).rows;
      for (const row of ids) {
        await db.query(
          "UPDATE subscribers SET email_state='suppressed' WHERE id=$1",
          [row.subscriber_id],
        );
        await db.query(
          "UPDATE outbox SET status='suppressed',error='email_provider_suppression' WHERE subscriber_id=$1 AND channel='email' AND status='queued'",
          [row.subscriber_id],
        );
      }
    }
  });
}
