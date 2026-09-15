import { z } from "zod";
import { config } from "./config";
import { tx, query } from "./db";
import { connectTelegram } from "./subscriptions";
import { newToken } from "./security";
import { enqueue } from "./editorial";
import type { Subscriber } from "./models";
const updateSchema = z.object({
  update_id: z.number().int().nonnegative(),
  message: z
    .object({
      text: z.string().max(4096).optional(),
      chat: z.object({ id: z.number().int(), type: z.string() }),
    })
    .optional(),
});
export async function handleUpdate(value: unknown) {
  const u = updateSchema.parse(value),
    m = u.message;
  return tx(async (db) => {
    const fresh = await db.query(
      "INSERT INTO telegram_updates(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
      [u.update_id],
    );
    if (!fresh.rowCount || !m || m.chat.type !== "private") return;
    const chat = String(m.chat.id);
    if (!config().allowlist.includes(chat)) return;
    const text = m.text?.trim() ?? "";
    let s = (
      await db.query<Subscriber>(
        "SELECT * FROM subscribers WHERE chat_id=$1 FOR UPDATE",
        [chat],
      )
    ).rows[0];
    if (text.startsWith("/start ")) {
      if (s) return;
      const id = await connectTelegram(db, text.slice(7), chat);
      s = (
        await db.query<Subscriber>("SELECT * FROM subscribers WHERE id=$1", [
          id,
        ])
      ).rows[0];
    }
    if (!s) {
      if (text === "/start" || text === "/help")
        await enqueue(
          db,
          `onboarding:${u.update_id}`,
          "telegram",
          "onboarding",
          {
            text: "Welcome to Daily Update. Choose your topics on the website, then use its Telegram connection link to connect this chat.",
            url: config().APP_URL + "/subscribe",
            chat,
          },
          null,
        );
      return;
    }
    const cmd = text.split(" ")[0].split("@")[0];
    if (cmd === "/stop" || cmd === "/pause") {
      await db.query("UPDATE subscribers SET telegram_state=$2 WHERE id=$1", [
        s.id,
        cmd === "/stop" ? "off" : "paused",
      ]);
      await db.query(
        "UPDATE outbox SET status='suppressed',error='recipient_stopped' WHERE subscriber_id=$1 AND channel='telegram' AND status='queued'",
        [s.id],
      );
      return;
    }
    if (cmd === "/resume" || cmd === "/start")
      await db.query(
        "UPDATE subscribers SET telegram_state='active' WHERE id=$1",
        [s.id],
      );
    if (["/start", "/resume", "/topics", "/settings", "/help"].includes(cmd)) {
      const token = await newToken(db, s.id, "access");
      await enqueue(
        db,
        `command:${u.update_id}`,
        "telegram",
        "command",
        {
          text: "Your Daily Update preferences. Use /pause to pause, /resume to resume, or /stop to stop Telegram alerts.",
          url: `${config().APP_URL}/access?token=${token}`,
        },
        s.id,
      );
    }
  });
}
export async function pollTelegram() {
  const c = config();
  if (c.DELIVERY_MODE !== "sandbox" || c.TELEGRAM_TRANSPORT === "webhook")
    return;
  const last =
    (
      await query<{ value: { offset: number } }>(
        "SELECT value FROM settings WHERE key='telegram_offset'",
      )
    )[0]?.value.offset ?? 0;
  const res = await fetch(
    `https://api.telegram.org/bot${c.TELEGRAM_BOT_TOKEN}/getUpdates`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        offset: last,
        timeout: 0,
        limit: 30,
        allowed_updates: ["message"],
      }),
      signal: AbortSignal.timeout(12000),
    },
  );
  const data = z
    .object({ ok: z.literal(true), result: z.array(z.unknown()) })
    .parse(await res.json());
  for (const raw of data.result) {
    const parsed = updateSchema.parse(raw);
    try {
      await handleUpdate(raw);
    } catch {
      await query(
        "INSERT INTO telegram_updates(id) VALUES($1) ON CONFLICT DO NOTHING",
        [parsed.update_id],
      );
    }
    await query(
      "INSERT INTO settings VALUES('telegram_offset',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
      [JSON.stringify({ offset: parsed.update_id + 1 })],
    );
  }
}
