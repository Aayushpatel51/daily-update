import { unsubscribe } from "@/lib/subscriptions";
import { boundedBody } from "@/lib/http";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = new URLSearchParams(await boundedBody(req, 1000));
    if (body.get("List-Unsubscribe") !== "One-Click")
      return Response.json({ error: "Invalid request" }, { status: 400 });
    await unsubscribe(
      z.uuid().parse(url.searchParams.get("id")),
      z.string().parse(url.searchParams.get("token")),
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Invalid unsubscribe link" },
      { status: 400 },
    );
  }
}
