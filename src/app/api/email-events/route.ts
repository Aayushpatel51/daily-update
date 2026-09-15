import { config } from "@/lib/config";
import { verifyEmailEvent, recordEmailEvent } from "@/lib/email";
import { boundedBody } from "@/lib/http";
export async function POST(req: Request) {
  const secret = config().RESEND_WEBHOOK_SECRET;
  if (!secret)
    return Response.json({ error: "Not configured" }, { status: 503 });
  let event;
  try {
    event = verifyEmailEvent(
      await boundedBody(req),
      {
        "svix-id": req.headers.get("svix-id") ?? "",
        "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
        "svix-signature": req.headers.get("svix-signature") ?? "",
      },
      secret,
    );
  } catch {
    return Response.json(
      { error: "Invalid signature or event" },
      { status: 400 },
    );
  }
  if (!event.data.email_id) return Response.json({ ok: true, ignored: true });
  await recordEmailEvent(req.headers.get("svix-id")!, {
    type: event.type,
    data: { email_id: event.data.email_id },
  });
  return Response.json({ ok: true });
}
