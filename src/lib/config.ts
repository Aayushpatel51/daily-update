import { loadEnvFile } from "node:process";
import { z } from "zod";
try {
  loadEnvFile(".env");
} catch (e) {
  if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e;
}
export function config() {
  const env = z
    .object({
      APP_URL: z.url().default("http://127.0.0.1:3000"),
      DATABASE_URL: z.string().min(1),
      ADMIN_PASSWORD: z.string().min(16),
      SESSION_SECRET: z.string().min(32),
      DELIVERY_MODE: z.enum(["preview", "sandbox"]).default("preview"),
      TELEGRAM_BOT_TOKEN: z.string().default(""),
      TELEGRAM_BOT_NAME: z.string().default(""),
      TELEGRAM_ALLOWLIST: z.string().default(""),
      EMAIL_MODE: z.enum(["capture", "resend"]).default("capture"),
      RESEND_API_KEY: z.string().default(""),
      RESEND_WEBHOOK_SECRET: z.string().default(""),
      PILOT_EMAIL: z.string().default(""),
      EMAIL_FROM: z.string().default("Daily Update <onboarding@resend.dev>"),
      TELEGRAM_TRANSPORT: z.enum(["polling", "webhook"]).default("polling"),
      TELEGRAM_WEBHOOK_SECRET: z.string().default(""),
      CRON_SECRET: z.string().default(""),
      PILOT_MODE: z.enum(["true", "false"]).default("false"),
      EDITOR_CHAT_ID: z.string().default(""),
    })
    .parse(process.env);
  const url = new URL(env.APP_URL);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !["http:", "https:"].includes(url.protocol)
  )
    throw new Error("Invalid APP_URL");
  if (
    url.protocol === "http:" &&
    !["127.0.0.1", "localhost"].includes(url.hostname)
  )
    throw new Error("Remote access requires HTTPS");
  if (
    env.DELIVERY_MODE === "sandbox" &&
    (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ALLOWLIST)
  )
    throw new Error("Sandbox Telegram needs credentials and an allowlist");
  if (
    env.EMAIL_MODE === "resend" &&
    (!env.RESEND_API_KEY || !z.email().safeParse(env.PILOT_EMAIL).success)
  )
    throw new Error("Resend requires a key and pilot recipient");
  if (
    env.TELEGRAM_TRANSPORT === "webhook" &&
    env.TELEGRAM_WEBHOOK_SECRET.length < 32
  )
    throw new Error("Webhook secret missing");
  if (
    env.PILOT_MODE === "true" &&
    (url.protocol !== "https:" || env.CRON_SECRET.length < 32)
  )
    throw new Error("Pilot requires HTTPS and a scheduler secret");
  return {
    ...env,
    APP_URL: url.origin,
    allowlist: env.TELEGRAM_ALLOWLIST.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
