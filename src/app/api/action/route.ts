import { NextRequest, NextResponse } from "next/server";
import { allowedOrigin } from "@/lib/origin";
import { z } from "zod";
import { config } from "@/lib/config";
import { pool, query, tx } from "@/lib/db";
import {
  digest,
  same,
  session,
  newSession,
  takeToken,
  rateLimit,
} from "@/lib/security";
import {
  recoverEmail,
  addEmail,
  subscribe,
  preferences,
  verifyEmail,
  telegramLink,
  connectTelegram,
  unsubscribe,
  verification,
} from "@/lib/subscriptions";
import { createStory, editStory } from "@/lib/editorial";
import { tick } from "@/lib/worker";
export async function POST(req: NextRequest) {
  try {
    if (!allowedOrigin(req.headers.get("origin"), config().APP_URL))
      return NextResponse.json(
        { error: "Request origin not allowed." },
        { status: 403 },
      );
    if (Number(req.headers.get("content-length") ?? 0) > 80_000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const text = await req.text();
    if (Buffer.byteLength(text) > 80_000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const body = z.record(z.string(), z.unknown()).parse(JSON.parse(text));
    const action = z.string().parse(body.action);
    const identity = await session(req.cookies.get("daily_session")?.value);
    await rateLimit(
      "actions:" +
        (identity?.subscriber_id ?? identity?.role ?? "local-visitor"),
      100,
    );
    let result: Record<string, unknown> = { ok: true };
    let token: string | undefined;
    if (action === "login") {
      await rateLimit("editor-login", 10);
      if (!same(z.string().parse(body.password), config().ADMIN_PASSWORD))
        throw new Error("The editor password is incorrect.");
      token = await newSession(pool(), "editor");
      result.redirect = "/admin";
    } else if (action === "logout") {
      await query("DELETE FROM sessions WHERE hash=$1", [
        digest(req.cookies.get("daily_session")?.value ?? ""),
      ]);
      token = "";
      result.redirect = "/";
    } else if (action === "subscribe") {
      const created = await subscribe(body);
      if (created.session) token = created.session;
      result = {
        ok: true,
        redirect: created.existing ? "/subscribe?requested=1" : "/preferences",
      };
    } else if (action === "recover-email") {
      await rateLimit("email-recovery", 10);
      await recoverEmail(body.email);
      result.message =
        "If this email has a subscription, a private link has been queued. Local testers can find it in delivery previews.";
    } else if (action === "verify") {
      token = await verifyEmail(z.string().parse(body.token));
      result.redirect = "/preferences";
    } else if (action === "access") {
      token = await tx(async (db) =>
        newSession(
          db,
          "subscriber",
          await takeToken(db, z.string().parse(body.token), "access"),
        ),
      );
      result.redirect = "/preferences";
    } else if (action === "unsubscribe") {
      await unsubscribe(z.uuid().parse(body.id), z.string().parse(body.token));
      result.message = "You are unsubscribed from daily email.";
    } else if (
      [
        "preferences",
        "link",
        "preview-connect",
        "verify-again",
        "add-email",
      ].includes(action)
    ) {
      if (identity?.role !== "subscriber" || !identity.subscriber_id)
        return NextResponse.json(
          { error: "Sign in to your subscription first." },
          { status: 401 },
        );
      const id = identity.subscriber_id;
      if (action === "preferences") {
        await preferences(id, body, z.string().parse(body.operation ?? "save"));
        if (body.operation === "delete") {
          token = "";
          result.redirect = "/";
        } else result.redirect = "/preferences?saved=1";
      }
      if (action === "add-email") {
        await addEmail(id, body.email);
        result.redirect = "/preferences";
      }
      if (action === "verify-again") await tx((db) => verification(db, id));
      if (action === "link") result = { ok: true, ...(await telegramLink(id)) };
      if (action === "preview-connect") {
        if (config().DELIVERY_MODE !== "preview")
          throw new Error("Preview connection is disabled.");
        const t = z.string().parse(body.token);
        await tx((db) => connectTelegram(db, t, "preview:" + id));
        result.redirect = "/preferences";
      }
    } else {
      if (identity?.role !== "editor")
        return NextResponse.json(
          { error: "Editor sign-in required." },
          { status: 401 },
        );
      if (action === "create") {
        const s = await createStory(body.story);
        result.redirect = "/admin/story/" + s.id;
      } else if (action === "edit") {
        const s = await editStory(
          z.uuid().parse(body.id),
          z.number().int().parse(body.revision),
          z
            .enum([
              "save",
              "release",
              "submit",
              "publish",
              "hold",
              "reject",
              "reopen",
              "correct",
              "retract",
              "merge",
            ])
            .parse(body.operation),
          body.story,
          z
            .string()
            .max(2000)
            .parse(body.correction ?? ""),
          z.string().parse(body.mergeTarget ?? ""),
        );
        result.redirect = "/admin/story/" + s.id + "?saved=1";
      } else if (action === "tick") {
        await tick();
        result.redirect = "/admin/deliveries";
      } else if (action === "source") {
        const id = z.enum(["S07", "S12", "S14"]).parse(body.id),
          note = z.string().trim().min(10).max(1000).parse(body.note),
          enabled = z.boolean().parse(body.enabled);
        await query(
          "UPDATE sources SET enabled=$2,access_note=$3 WHERE id=$1",
          [id, enabled, note],
        );
        result.redirect = "/admin/sources";
      } else if (action === "switch") {
        const key = z
          .enum(["monitoring", "telegram", "email", "publishing", "editor"])
          .parse(body.key);
        await query(
          "UPDATE settings SET value=jsonb_set(value,ARRAY[$1],$2::jsonb) WHERE key='switches'",
          [key, JSON.stringify(z.boolean().parse(body.enabled))],
        );
        result.redirect = "/admin/operations";
      } else if (action === "resolve") {
        await query(
          "UPDATE outbox SET status=$2,error='operator_resolved' WHERE id=$1 AND status IN ('failed','ambiguous')",
          [z.uuid().parse(body.id), z.enum(["suppressed"]).parse(body.status)],
        );
        result.redirect = "/admin/deliveries";
      } else if (action === "digest-test") {
        if (config().DELIVERY_MODE !== "preview")
          throw new Error("Test digest is available only in preview mode.");
        const { buildDigests } = await import("@/lib/digests");
        await buildDigests(new Date(Date.now() + 86400_000));
        await tick();
        result.redirect = "/admin/deliveries";
      } else throw new Error("Unknown action.");
    }
    const response = NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
    if (token !== undefined)
      response.cookies.set("daily_session", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: config().APP_URL.startsWith("https:"),
        path: "/",
        maxAge: token ? 604800 : 0,
      });
    return response;
  } catch (error) {
    const msg =
      error instanceof z.ZodError
        ? "Some fields are missing or invalid. Check the form."
        : error instanceof Error &&
            !("code" in error) &&
            !error.message.includes("\n")
          ? error.message
          : "The operation could not finish. Please try again.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
