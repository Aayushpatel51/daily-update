import { pool, tx, query } from "./db";
import { config } from "./config";
import { switches } from "./editorial";
import { type Delivery, type Subscriber, type Story } from "./models";
import { scopedToken } from "./security";
import { quiet } from "./time";
import { z } from "zod";
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function emailDocument(title: string, text: string) {
  return (
    '<!doctype html><html><body style="font:17px/1.65 Georgia,serif;color:#182026;background:#f7f7f2;padding:24px"><main style="max-width:640px;margin:auto"><p style="font:700 18px Arial">Daily Update</p><h1>' +
    escapeHtml(title) +
    "</h1>" +
    text
      .split("\n\n")
      .map(
        (p) =>
          "<p>" +
          p
            .split(/(https?:\/\/[^\s]+)/g)
            .map((part) =>
              /^https?:\/\//.test(part)
                ? '<a href="' +
                  escapeHtml(part) +
                  '">' +
                  escapeHtml(part) +
                  "</a>"
                : escapeHtml(part),
            )
            .join("")
            .replace(/\n/g, "<br>") +
          "</p>",
      )
      .join("") +
    "</main></body></html>"
  );
}
const digestItem = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  brief: z.string(),
  topic: z.string(),
  synthetic: z.boolean(),
  correction: z.string(),
});
export async function renderDelivery(d: Delivery, s: Subscriber | undefined) {
  const base = config().APP_URL;
  if (d.purpose === "digest") {
    const items = z.array(digestItem).parse(d.payload.stories);
    let current = "";
    const paragraphs: string[] = [];
    for (const item of [...items].sort((a, b) =>
      a.topic.localeCompare(b.topic),
    )) {
      if (item.topic !== current) {
        current = item.topic;
        paragraphs.push(current);
      }
      paragraphs.push(
        `${item.synthetic ? "[Demonstration] " : ""}${item.title}\n${item.brief}${item.correction ? "\nCorrection: " + item.correction : ""}\n${base}/articles/${item.slug}`,
      );
    }
    if (!s) throw new Error("recipient_missing");
    paragraphs.push(
      `Preferences: ${base}/preferences\nUnsubscribe: ${base}/unsubscribe?id=${s.id}&token=${scopedToken(s.id, "unsubscribe")}`,
    );
    const title = `Your Daily Update · ${String(d.payload.date)}`,
      text = paragraphs.join("\n\n");
    return { text, html: emailDocument(title, text), title };
  }
  if (["brief", "edit"].includes(d.purpose)) {
    let group = d.payload.group;
    if (d.purpose === "edit") {
      const original = (
        await query<Delivery>("SELECT * FROM outbox WHERE id=$1", [
          d.payload.original,
        ])
      )[0];
      group = original?.payload.group;
    }
    if (Array.isArray(group) && group.length > 1) {
      const ids = z.array(z.string().uuid()).parse(group);
      const stories = await query<Story>(
        "SELECT * FROM stories WHERE id=ANY($1::uuid[]) ORDER BY released_at",
        [ids],
      );
      const parts = stories
        .slice(0, 8)
        .map(
          (e) =>
            `${e.state === "retracted" ? "RETRACTED: " : ""}${e.title.slice(0, 110)}\n${e.published_at ? base + "/articles/" + e.slug : e.evidence[0].url}`,
        );
      const text =
        "Your quiet-hours catch-up\n\n" +
        parts.join("\n\n") +
        (stories.length > 8
          ? `\n\n${stories.length - 8} more developments in your topic feeds: ${base}`
          : "");
      return { text, html: "", title: "Quiet-hours catch-up" };
    }

    const e = (
      await query<Story>("SELECT * FROM stories WHERE id=$1", [d.story_id])
    )[0];
    if (!e) throw new Error("story_missing");
    const text = `${e.synthetic ? "[Demonstration] " : ""}${e.state === "retracted" ? "RETRACTED: " : ""}${e.title}\n\n${e.brief}\n\n${e.evidence_label}\n${e.evidence[0].url}${e.published_at ? "\n\nRead the article: " + base + "/articles/" + e.slug : ""}${e.correction ? "\n\nCorrection: " + e.correction : ""}`;
    return { text, html: "", title: e.title };
  }
  const title = d.channel === "editor" ? "Review needed" : "Daily Update";
  const text =
    String(d.payload.text ?? "") + "\n\n" + String(d.payload.url ?? "");
  return {
    title,
    text,
    html: d.channel === "email" ? emailDocument(title, text) : "",
  };
}
export interface ProviderResult {
  status: "accepted" | "failed" | "ambiguous" | "queued";
  id?: string;
  error?: string;
  retrySeconds?: number;
}
export async function telegramCall(
  method: string,
  payload: unknown,
): Promise<ProviderResult> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config().TELEGRAM_BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      },
    );
    const value: unknown = await response.json();
    const result = z
      .object({
        ok: z.boolean(),
        result: z.object({ message_id: z.number() }).optional(),
        error_code: z.number().optional(),
        description: z.string().optional(),
        parameters: z.object({ retry_after: z.number() }).optional(),
      })
      .safeParse(value);
    if (!result.success)
      return { status: "ambiguous", error: "invalid_provider_response" };
    if (result.data.ok && result.data.result)
      return { status: "accepted", id: String(result.data.result.message_id) };
    if (result.data.error_code === 429)
      return {
        status: "queued",
        error: "rate_limited",
        retrySeconds: Math.max(
          1,
          Math.min(86400, result.data.parameters?.retry_after ?? 60),
        ),
      };
    if (
      method === "editMessageText" &&
      result.data.error_code === 400 &&
      result.data.description?.includes("message is not modified")
    )
      return { status: "accepted" };
    if ((result.data.error_code ?? response.status) >= 500)
      return { status: "ambiguous", error: "provider_server_error" };
    return {
      status: "failed",
      error:
        result.data.error_code === 403
          ? "recipient_blocked"
          : "provider_rejected",
    };
  } catch {
    return { status: "ambiguous", error: "submission_uncertain" };
  }
}
export async function dispatchOne(now = new Date(), send = telegramCall) {
  return tx(async (db) => {
    // Session lock prevents multiple worker processes racing external submissions.
    await db.query("SELECT pg_advisory_xact_lock(621002)");
    const sw = await switches(db);
    const d = (
      await db.query<Delivery>(
        "SELECT * FROM outbox WHERE status='queued' AND available_at<=$1 ORDER BY CASE WHEN channel='telegram' THEN 0 ELSE 1 END,created_at FOR UPDATE SKIP LOCKED LIMIT 1",
        [now],
      )
    ).rows[0];
    if (!d) return false;
    const s = d.subscriber_id
      ? (
          await db.query<Subscriber>(
            "SELECT * FROM subscribers WHERE id=$1 FOR UPDATE",
            [d.subscriber_id],
          )
        ).rows[0]
      : undefined;
    const channel = d.channel === "editor" ? "editor" : d.channel;
    if (!sw[channel]) {
      await db.query("UPDATE outbox SET available_at=$2 WHERE id=$1", [
        d.id,
        new Date(now.getTime() + 60_000),
      ]);
      return true;
    }
    let eligible = true;
    if (d.channel === "email")
      eligible =
        !!s &&
        (d.purpose === "access"
          ? !!s.email
          : d.purpose === "verify"
            ? s.email_state === "unverified"
            : s.email_state === "active");
    if (d.channel === "telegram")
      eligible = !!s && s.telegram_state === "active";
    if (d.purpose === "brief" && eligible) {
      const e = (
        await db.query<Story>("SELECT * FROM stories WHERE id=$1", [d.story_id])
      ).rows[0];
      eligible =
        !!e &&
        !!e.released_at &&
        !["merged", "retracted", "rejected"].includes(e.state) &&
        e.topics.some((t) => s!.topics.includes(t)) &&
        (!s!.major_only || e.major);
    }
    if (!eligible) {
      await db.query(
        "UPDATE outbox SET status='suppressed',error='ineligible',finished_at=now() WHERE id=$1",
        [d.id],
      );
      return true;
    }
    if (
      s &&
      d.purpose === "brief" &&
      quiet(now, s.timezone, s.quiet_start, s.quiet_end)
    ) {
      await db.query(
        "UPDATE outbox SET available_at=$2,payload=payload || '{\"deferred\":true}'::jsonb WHERE id=$1",
        [d.id, new Date(now.getTime() + 60_000)],
      );
      return true;
    }
    let deliveryIds = [d.id];
    if (d.purpose === "brief" && d.payload.deferred && s) {
      const others = (
        await db.query<Delivery>(
          "SELECT o.* FROM outbox o JOIN stories e ON e.id=o.story_id WHERE o.subscriber_id=$1 AND o.purpose='brief' AND o.status='queued' AND o.payload->>'deferred'='true' AND e.state NOT IN ('retracted','merged','rejected') AND e.topics && $2::text[] AND (NOT $3 OR e.major) ORDER BY o.created_at FOR UPDATE OF o",
          [s.id, s.topics, s.major_only],
        )
      ).rows;
      deliveryIds = others.map((x) => x.id);
      if (!deliveryIds.includes(d.id)) deliveryIds.push(d.id);
      d.payload = {
        ...d.payload,
        group: [...new Set([d.story_id, ...others.map((x) => x.story_id)])],
        deliveryIds,
      };
    }
    const rendered = await renderDelivery(d, s);
    if (d.channel !== "email" && rendered.text.length > 4000) {
      rendered.text =
        rendered.text.slice(0, 3700) +
        "\n\nContinue on Daily Update: " +
        config().APP_URL;
    }
    const payload: Record<string, unknown> = { ...d.payload, ...rendered };
    // Store submission intent in a separate committed step before any network call.
    await db.query(
      "UPDATE outbox SET status='processing',payload=$2,leased_at=now(),attempts=attempts+1 WHERE id=ANY($1::uuid[])",
      [deliveryIds, JSON.stringify(payload)],
    );
    return { d: { ...d, payload }, s };
  }).then(async (claimed) => {
    if (typeof claimed === "boolean") return claimed;
    const { d, s } = claimed,
      c = config();
    let result: ProviderResult | { status: "captured"; id?: string };
    if (c.DELIVERY_MODE === "preview" || d.channel === "email") {
      result = { status: "captured", id: "preview-" + d.id };
    } else {
      const chat = d.channel === "editor" ? c.EDITOR_CHAT_ID : s?.chat_id;
      if (!chat || !c.allowlist.includes(chat))
        result = { status: "failed", error: "sandbox_recipient_not_allowed" };
      else {
        // Recheck after the claim; serial worker is required, and stop wins until submission.
        const latest = s
          ? await query<Subscriber>("SELECT * FROM subscribers WHERE id=$1", [
              s.id,
            ])
          : [];
        if (s && latest[0]?.telegram_state !== "active")
          result = { status: "failed", error: "recipient_stopped" };
        else if (d.purpose === "edit") {
          const original = (
            await query<Delivery>("SELECT * FROM outbox WHERE id=$1", [
              d.payload.original,
            ])
          )[0];
          if (!original?.provider_id || original.status !== "accepted")
            result = { status: "failed", error: "original_not_sent" };
          else
            result = await send("editMessageText", {
              chat_id: chat,
              message_id: Number(original.provider_id),
              text: d.payload.text,
              link_preview_options: { is_disabled: true },
            });
        } else
          result = await send("sendMessage", {
            chat_id: chat,
            text: d.payload.text,
            link_preview_options: { is_disabled: true },
          });
      }
    }
    if (result.status === "queued" && d.attempts >= 4)
      result = { status: "failed", error: "retry_limit" };
    const retry = "retrySeconds" in result ? result.retrySeconds : undefined;
    await query(
      "UPDATE outbox SET status=$2,provider_id=COALESCE($3,provider_id),error=$4,finished_at=CASE WHEN $2='queued' THEN NULL ELSE now() END,available_at=$5 WHERE id=ANY($1::uuid[])",
      [
        Array.isArray(d.payload.deliveryIds) ? d.payload.deliveryIds : [d.id],
        result.status,
        result.id ?? null,
        "error" in result ? (result.error ?? null) : null,
        new Date(now.getTime() + (retry ?? 60) * 1000),
      ],
    );
    if ("error" in result && result.error === "recipient_blocked" && s)
      await query(
        "UPDATE subscribers SET telegram_state='blocked' WHERE id=$1",
        [s.id],
      );
    return true;
  });
}
export async function drain(limit = 50) {
  for (let i = 0; i < limit; i++) {
    if (!(await dispatchOne())) break;
    if (config().DELIVERY_MODE === "sandbox")
      await new Promise((r) => setTimeout(r, 1100));
  }
}
export async function recover() {
  await query(
    "UPDATE outbox SET status='ambiguous',error='worker_interrupted' WHERE status='processing' AND leased_at<now()-interval '2 minutes'",
  );
  await query("DELETE FROM sessions WHERE expires_at<now()");
  await query("DELETE FROM tokens WHERE expires_at<now()");
  await query("DELETE FROM rate_limits WHERE resets_at<now()");
}
