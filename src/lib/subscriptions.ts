import { randomUUID } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";
import { tx, query, type DB } from "./db";
import { topicSchema, type Subscriber } from "./models";
import { newSession, newToken, takeToken, scopedToken, same } from "./security";
import { enqueue } from "./editorial";
import { config } from "./config";
const time = z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const preferenceSchema = z
  .object({
    topics: topicSchema,
    timezone: z.string().refine((s) => {
      try {
        Temporal.Now.zonedDateTimeISO(s);
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid timezone"),
    major_only: z.boolean().default(false),
    quiet_start: time.default(""),
    quiet_end: time.default(""),
  })
  .refine(
    (s) =>
      Boolean(s.quiet_start) === Boolean(s.quiet_end) &&
      (!s.quiet_start || s.quiet_start !== s.quiet_end),
    "Choose different start and end times for quiet hours",
  );
export async function subscribe(input: unknown) {
  const data = z
    .object({
      email: z.union([z.literal(""), z.email().max(254)]).default(""),
      telegram: z.boolean().default(false),
    })
    .and(preferenceSchema)
    .parse(input);
  if (!data.email && !data.telegram)
    throw new Error("Choose Telegram or the daily email.");
  return tx(async (db) => {
    const email = data.email.toLowerCase();
    if (
      email &&
      (await db.query("SELECT id FROM subscribers WHERE email=$1", [email]))
        .rowCount
    ) {
      return { existing: true };
    }
    const id = randomUUID();
    const since = Object.fromEntries(
      data.topics.map((t) => [t, new Date().toISOString()]),
    );
    await db.query(
      `INSERT INTO subscribers(id,email,email_state,telegram_state,topics,topic_since,timezone,major_only,quiet_start,quiet_end) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        email || null,
        email ? "unverified" : "off",
        data.telegram ? "pending" : "off",
        data.topics,
        JSON.stringify(since),
        data.timezone,
        data.major_only,
        data.quiet_start,
        data.quiet_end,
      ],
    );
    if (email) await verification(db, id);
    return { id, session: await newSession(db, "subscriber", id) };
  });
}
export async function verification(db: DB, id: string) {
  const token = await newToken(db, id, "verify");
  await enqueue(
    db,
    `verify:${id}:${randomUUID()}`,
    "email",
    "verify",
    {
      text: "Confirm your Daily Update email subscription.",
      url: `${config().APP_URL}/verify?token=${token}`,
    },
    id,
  );
}
export async function verifyEmail(token: string) {
  return tx(async (db) => {
    const id = await takeToken(db, token, "verify");
    await db.query(
      "UPDATE subscribers SET email_state='active',email_since=now() WHERE id=$1 AND email_state='unverified'",
      [id],
    );
    return newSession(db, "subscriber", id);
  });
}
export async function subscriber(id: string) {
  return (
    await query<Subscriber>("SELECT * FROM subscribers WHERE id=$1", [id])
  )[0];
}
export async function preferences(id: string, input: unknown, action = "save") {
  return tx(async (db) => {
    const s = (
      await db.query<Subscriber>(
        "SELECT * FROM subscribers WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!s) throw new Error("Subscription no longer exists.");
    if (action === "delete") {
      await db.query("DELETE FROM subscribers WHERE id=$1", [id]);
      return;
    }
    const p = preferenceSchema.parse(input);
    const since = Object.fromEntries(
      p.topics.map((t) => [
        t,
        s.topics.includes(t) ? s.topic_since[t] : new Date().toISOString(),
      ]),
    );
    let tg = s.telegram_state,
      email = s.email_state;
    if (action === "pause") tg = "paused";
    if (action === "resume" && s.chat_id) tg = "active";
    if (action === "stop") tg = "off";
    if (action === "unsubscribe") email = "off";
    await db.query(
      "UPDATE subscribers SET topics=$2,topic_since=$3,timezone=$4,major_only=$5,quiet_start=$6,quiet_end=$7,telegram_state=$8,email_state=$9 WHERE id=$1",
      [
        id,
        p.topics,
        JSON.stringify(since),
        p.timezone,
        p.major_only,
        p.quiet_start,
        p.quiet_end,
        tg,
        email,
      ],
    );
    if (["pause", "stop"].includes(action))
      await db.query(
        "UPDATE outbox SET status='suppressed',error='recipient_stopped' WHERE subscriber_id=$1 AND channel='telegram' AND status='queued'",
        [id],
      );
    if (action === "save")
      await db.query(
        "UPDATE outbox SET status='suppressed',error='preferences_changed' WHERE subscriber_id=$1 AND purpose='digest' AND status='queued'",
        [id],
      );
    if (action === "unsubscribe")
      await db.query(
        "UPDATE outbox SET status='suppressed',error='unsubscribed' WHERE subscriber_id=$1 AND channel='email' AND status='queued'",
        [id],
      );
  });
}
export async function unsubscribe(id: string, token: string) {
  if (!same(token, scopedToken(id, "unsubscribe")))
    throw new Error("Invalid unsubscribe link.");
  await tx(async (db) => {
    await db.query("UPDATE subscribers SET email_state='off' WHERE id=$1", [
      id,
    ]);
    await db.query(
      "UPDATE outbox SET status='suppressed' WHERE subscriber_id=$1 AND channel='email' AND status='queued'",
      [id],
    );
  });
}
export async function telegramLink(id: string) {
  return tx(async (db) => {
    const s = (
      await db.query<Subscriber>(
        "SELECT * FROM subscribers WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!s) throw new Error("Subscription missing.");
    if (s.chat_id) throw new Error("Telegram is already linked.");
    const token = await newToken(db, id, "telegram");
    await db.query(
      "UPDATE subscribers SET telegram_state='pending' WHERE id=$1",
      [id],
    );
    return {
      token,
      url: config().TELEGRAM_BOT_NAME
        ? `https://t.me/${config().TELEGRAM_BOT_NAME}?start=${token}`
        : null,
    };
  });
}
export async function connectTelegram(db: DB, token: string, chat: string) {
  const id = await takeToken(db, token, "telegram");
  const old = (
    await db.query<Subscriber>(
      "SELECT * FROM subscribers WHERE id=$1 FOR UPDATE",
      [id],
    )
  ).rows[0];
  if (!old || old.chat_id) throw new Error("Already connected.");
  await db.query(
    "UPDATE subscribers SET chat_id=$2,telegram_state='active' WHERE id=$1",
    [id, chat],
  );
  return id;
}

export async function recoverEmail(input: unknown) {
  const email = z.email().max(254).parse(input).toLowerCase();
  await tx(async (db) => {
    const s = (
      await db.query<Subscriber>(
        "SELECT * FROM subscribers WHERE email=$1 FOR UPDATE",
        [email],
      )
    ).rows[0];
    if (!s) return;
    if (s.email_state === "unverified") {
      await verification(db, s.id);
      return;
    }
    const token = await newToken(db, s.id, "access");
    await enqueue(
      db,
      `access:${s.id}:${randomUUID()}`,
      "email",
      "access",
      {
        text: "Your requested private preferences link. Opening it does not restart daily email.",
        url: `${config().APP_URL}/access?token=${token}`,
      },
      s.id,
    );
  });
}

export async function addEmail(id: string, input: unknown) {
  const email = z.email().max(254).parse(input).toLowerCase();
  await tx(async (db) => {
    const s = (
      await db.query<Subscriber>(
        "SELECT * FROM subscribers WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!s) throw new Error("Subscription missing.");
    if (s.email && s.email !== email)
      throw new Error("Use your existing email address.");
    if (s.email_state === "active") return;
    const other = await db.query(
      "SELECT id FROM subscribers WHERE email=$1 AND id<>$2",
      [email, id],
    );
    if (other.rowCount)
      throw new Error(
        "This email cannot be linked here. Request its private preferences link instead.",
      );
    await db.query(
      "UPDATE subscribers SET email=$2,email_state='unverified' WHERE id=$1",
      [id, email],
    );
    await verification(db, id);
  });
}
