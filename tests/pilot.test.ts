import test from "node:test";
import assert from "node:assert/strict";
import { Webhook } from "svix";
import { verifyEmailEvent } from "../src/lib/email";
import { boundedBody } from "../src/lib/http";
test("Resend webhooks require an authentic, recent signature over the original body", () => {
  const secret = "whsec_" + Buffer.alloc(32, 7).toString("base64");
  const signer = new Webhook(secret);
  const body = JSON.stringify({
    type: "email.bounced",
    data: { email_id: "fixture-id" },
  });
  const now = new Date();
  const headers = {
    "svix-id": "msg_fixture",
    "svix-timestamp": String(Math.floor(now.getTime() / 1000)),
    "svix-signature": signer.sign("msg_fixture", now, body),
  };
  assert.equal(verifyEmailEvent(body, headers, secret).type, "email.bounced");
  assert.throws(() => verifyEmailEvent(body + " ", headers, secret));
  assert.throws(() =>
    verifyEmailEvent(body, { ...headers, "svix-timestamp": "1" }, secret),
  );
});
test("request body limits apply even when content length is absent", async () => {
  assert.equal(
    await boundedBody(
      new Request("https://example.invalid", { method: "POST", body: "hello" }),
      5,
    ),
    "hello",
  );
  await assert.rejects(
    boundedBody(
      new Request("https://example.invalid", {
        method: "POST",
        body: "too large",
      }),
      5,
    ),
  );
});
