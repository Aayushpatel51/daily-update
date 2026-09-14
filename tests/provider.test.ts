import test from "node:test";
import assert from "node:assert/strict";
import { telegramCall } from "../src/lib/delivery";
test("Telegram acceptance, rate limit, blocked recipient and uncertain network outcomes", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }));
    assert.deepEqual(await telegramCall("sendMessage", {}), {
      status: "accepted",
      id: "42",
    });
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error_code: 429,
          parameters: { retry_after: 9 },
        }),
      );
    assert.equal((await telegramCall("sendMessage", {})).retrySeconds, 9);
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ ok: false, error_code: 403 }));
    assert.equal(
      (await telegramCall("sendMessage", {})).error,
      "recipient_blocked",
    );
    globalThis.fetch = async () => {
      throw new Error("synthetic timeout");
    };
    assert.equal((await telegramCall("sendMessage", {})).status, "ambiguous");
    globalThis.fetch = async () => new Response("invalid JSON");
    assert.equal((await telegramCall("sendMessage", {})).status, "ambiguous");
  } finally {
    globalThis.fetch = original;
  }
});
