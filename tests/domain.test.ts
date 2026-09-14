import test from "node:test";
import assert from "node:assert/strict";
import { cutoff, quiet } from "../src/lib/time";
import { preferenceSchema } from "../src/lib/subscriptions";
import { escapeHtml, emailDocument } from "../src/lib/delivery";
test("daily cutoff follows subscriber timezone and carries yesterday before 21:00", () => {
  assert.equal(
    cutoff(new Date("2026-09-14T14:00:00Z"), "Asia/Kolkata").date,
    "2026-09-13",
  );
  assert.equal(
    cutoff(
      new Date("2026-09-14T15:30:00Z"),
      "Asia/Kolkata",
    ).instant.toISOString(),
    "2026-09-14T15:30:00.000Z",
  );
});
test("DST uses real timezone offsets at cutoff, including fall overlap", () => {
  assert.equal(
    cutoff(
      new Date("2026-03-09T02:00:00Z"),
      "America/New_York",
    ).instant.toISOString(),
    "2026-03-09T01:00:00.000Z",
  );
  assert.equal(
    cutoff(
      new Date("2026-11-02T03:00:00Z"),
      "America/New_York",
    ).instant.toISOString(),
    "2026-11-02T02:00:00.000Z",
  );
});
test("overnight quiet hours end cleanly and invalid preferences fail", () => {
  assert.equal(
    quiet(new Date("2026-09-14T23:00:00Z"), "UTC", "22:00", "07:00"),
    true,
  );
  assert.equal(
    quiet(new Date("2026-09-14T07:00:00Z"), "UTC", "22:00", "07:00"),
    false,
  );
  assert.throws(() => preferenceSchema.parse({ topics: [], timezone: "UTC" }));
  assert.throws(() =>
    preferenceSchema.parse({ topics: ["ai"], timezone: "Mars/Olympus" }),
  );
  assert.throws(() =>
    preferenceSchema.parse({
      topics: ["ai"],
      timezone: "UTC",
      quiet_start: "07:00",
      quiet_end: "07:00",
    }),
  );
});
test("HTML email treats all source content as text", () => {
  assert.equal(escapeHtml('<script>"&'), "&lt;script&gt;&quot;&amp;");
  assert.ok(
    !emailDocument("title", "<script>alert(1)</script>").includes("<script>"),
  );
});

import { allowedOrigin } from "../src/lib/origin";
test("local origins permit same-port loopback aliases but reject external and missing origins", () => {
  const local = "http://127.0.0.1:3000";
  for (const origin of [local, "http://localhost:3000"])
    assert.equal(allowedOrigin(origin, local), true);
  for (const origin of [
    null,
    "null",
    "https://evil.invalid",
    "http://localhost:3001",
    "http://localhost.evil.invalid:3000",
    "http://localhost:3000/path",
  ])
    assert.equal(allowedOrigin(origin, local), false);
  assert.equal(
    allowedOrigin("http://localhost:3000", "https://daily.example"),
    false,
  );
  assert.equal(
    allowedOrigin("https://daily.example", "https://daily.example"),
    true,
  );
});
