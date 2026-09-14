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
  return {
    ...env,
    APP_URL: url.origin,
    allowlist: env.TELEGRAM_ALLOWLIST.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
