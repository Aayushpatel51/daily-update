import { after } from "next/server";
import { config } from "@/lib/config";
import { same } from "@/lib/security";
import { handleUpdate } from "@/lib/telegram";
import { boundedBody } from "@/lib/http";
import { tick } from "@/lib/worker";
export const maxDuration = 180;
export async function POST(req: Request) {
  const c = config();
  if (
    c.TELEGRAM_TRANSPORT !== "webhook" ||
    !same(
      req.headers.get("x-telegram-bot-api-secret-token") ?? "",
      c.TELEGRAM_WEBHOOK_SECRET,
    )
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await handleUpdate(JSON.parse(await boundedBody(req)));
    after(async () => {
      try {
        await tick("delivery");
      } catch {
        console.error("Telegram delivery remains queued for scheduler");
      }
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Unable to process update" },
      { status: 503 },
    );
  }
}
