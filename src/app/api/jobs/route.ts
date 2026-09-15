import { config } from "@/lib/config";
import { same } from "@/lib/security";
import { tick } from "@/lib/worker";
export const maxDuration = 180;
export async function POST(req: Request) {
  const c = config();
  if (
    !c.CRON_SECRET ||
    !same(req.headers.get("authorization") ?? "", `Bearer ${c.CRON_SECRET}`)
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await tick(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Worker failed" }, { status: 503 });
  }
}
