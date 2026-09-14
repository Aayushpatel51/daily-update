import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { config } from "../src/lib/config";
process.env.DELIVERY_MODE = "preview";
const original = config().DATABASE_URL;
const testUrl = new URL(original);
testUrl.pathname = "/daily_update_test";
process.env.DATABASE_URL = testUrl.href;
const { pool, query, tx } = await import("../src/lib/db");
const { createStory, editStory } = await import("../src/lib/editorial");
const {
  subscribe,
  verifyEmail,
  telegramLink,
  connectTelegram,
  preferences,
  subscriber,
  unsubscribe,
} = await import("../src/lib/subscriptions");
const { drain, recover, dispatchOne } = await import("../src/lib/delivery");
const { buildDigests } = await import("../src/lib/digests");
const { scopedToken } = await import("../src/lib/security");
const input = {
  title: "SYNTHETIC test development",
  topics: ["ai", "coding"],
  brief:
    "A fictional development used only to test the approval and delivery pipeline.",
  article: {
    changed: "Synthetic change with an explicit source.",
    audience: "People testing the local application.",
    matters: "The pipeline should preserve approval order.",
    unknowns: "This is not an actual news story.",
  },
  evidence: [
    {
      url: "https://example.invalid/test",
      note: "Synthetic test evidence, not a news claim.",
      publishedAt: "",
    },
  ],
  evidence_label: "Synthetic fixture",
  major: false,
  synthetic: true,
};
before(async () => {
  const root = new pg.Pool({ connectionString: original });
  if (
    !(
      await root.query(
        "SELECT 1 FROM pg_database WHERE datname='daily_update_test'",
      )
    ).rowCount
  )
    await root.query("CREATE DATABASE daily_update_test");
  await root.end();
  await pool().query(await readFile("src/lib/schema.sql", "utf8"));
  await pool().query(
    "TRUNCATE outbox,digests,tokens,sessions,subscribers,revisions,stories,telegram_updates,rate_limits CASCADE",
  );
});
after(async () => {
  await pool().end();
});
let reader: string, storyId: string;
test("subscription channels are independent, verification tokens are single-use", async () => {
  const a = await subscribe({
    topics: ["ai", "coding"],
    timezone: "UTC",
    email: "fixture@example.invalid",
    telegram: true,
  });
  reader = a.id!;
  assert.ok(a.session);
  assert.equal((await subscriber(reader)).email_state, "unverified");
  await drain();
  const rows = await query<{ payload: { url: string } }>(
    "SELECT payload FROM outbox WHERE subscriber_id=$1 AND purpose='verify'",
    [reader],
  );
  const token = new URL(rows[0].payload.url).searchParams.get("token")!;
  await verifyEmail(token);
  await assert.rejects(verifyEmail(token));
  const link = await telegramLink(reader);
  await tx((db) => connectTelegram(db, link.token, "preview:" + reader));
  await assert.rejects(tx((db) => connectTelegram(db, link.token, "another")));
  assert.equal((await subscriber(reader)).email_state, "active");
  const duplicate = await subscribe({
    topics: ["ai"],
    timezone: "UTC",
    email: "fixture@example.invalid",
    telegram: false,
  });
  assert.equal(duplicate.existing, true);
  assert.equal(duplicate.session, undefined);
});
test("candidate notifies editor, exact revision approval releases brief once", async () => {
  let s = await createStory(input);
  storyId = s.id;
  assert.equal(s.state, "candidate");
  assert.equal(
    (
      await query(
        "SELECT 1 FROM outbox WHERE story_id=$1 AND purpose='brief'",
        [s.id],
      )
    ).length,
    0,
  );
  await assert.rejects(editStory(s.id, s.revision, "publish", input));
  s = await editStory(s.id, s.revision, "release", input);
  await assert.rejects(editStory(s.id, 1, "release", input));
  assert.equal(
    (
      await query(
        "SELECT 1 FROM outbox WHERE story_id=$1 AND purpose='brief'",
        [s.id],
      )
    ).length,
    1,
  );
  await drain();
  assert.equal(
    (
      await query<{ status: string }>(
        "SELECT status FROM outbox WHERE story_id=$1 AND purpose='brief'",
        [s.id],
      )
    )[0].status,
    "captured",
  );
});
test("article approval is separate and enriches the original message", async () => {
  const s = (
    await query<{ revision: number }>(
      "SELECT revision FROM stories WHERE id=$1",
      [storyId],
    )
  )[0];
  const submitted = await editStory(storyId, s.revision, "submit", input);
  assert.equal(submitted.state, "article_review");
  const published = await editStory(
    storyId,
    submitted.revision,
    "publish",
    input,
  );
  assert.ok(published.published_at);
  assert.equal(
    (
      await query("SELECT 1 FROM outbox WHERE story_id=$1 AND purpose='edit'", [
        storyId,
      ])
    ).length,
    1,
  );
  await drain();
});
test("digest deduplicates topics and repeats and skips empty days", async () => {
  await query(
    "UPDATE subscribers SET email_since=now()-interval '1 day',topic_since=$2 WHERE id=$1",
    [
      reader,
      JSON.stringify({
        ai: "2020-01-01T00:00:00Z",
        coding: "2020-01-01T00:00:00Z",
      }),
    ],
  );
  const tomorrow = new Date(Date.now() + 86400_000);
  assert.equal(await buildDigests(tomorrow), 1);
  assert.equal(await buildDigests(tomorrow), 0);
  await drain();
  assert.equal(await buildDigests(new Date(tomorrow.getTime() + 86400_000)), 0);
  const ids = (
    await query<{ story_ids: string[] }>(
      "SELECT story_ids FROM digests WHERE subscriber_id=$1",
      [reader],
    )
  )[0].story_ids;
  assert.deepEqual(ids, [storyId]);
});
test("pause cancels queued alerts, resume has no replay, email stays active", async () => {
  const s = await createStory({
    ...input,
    title: "SYNTHETIC second development",
  });
  await editStory(s.id, s.revision, "release", input);
  const pref = { topics: ["ai", "coding"], timezone: "UTC" };
  await preferences(reader, pref, "pause");
  await drain();
  assert.equal(
    (
      await query<{ status: string }>(
        "SELECT status FROM outbox WHERE story_id=$1 AND purpose='brief'",
        [s.id],
      )
    )[0].status,
    "suppressed",
  );
  await preferences(reader, pref, "resume");
  assert.equal((await subscriber(reader)).email_state, "active");
});
test("corrections retain publication time and record history; stale writes fail", async () => {
  const row = (
    await query<{ revision: number; published_at: Date }>(
      "SELECT revision,published_at FROM stories WHERE id=$1",
      [storyId],
    )
  )[0];
  const corrected = await editStory(
    storyId,
    row.revision,
    "correct",
    { ...input, brief: input.brief + " Clarified." },
    "Clarified a synthetic example for testing.",
  );
  assert.equal(
    corrected.published_at!.toISOString(),
    row.published_at.toISOString(),
  );
  await assert.rejects(
    editStory(
      storyId,
      row.revision,
      "correct",
      input,
      "A second stale correction.",
    ),
  );
});
test("interrupted submissions become ambiguous without retry", async () => {
  await query(
    "UPDATE outbox SET status='processing',leased_at=now()-interval '5 minutes' WHERE id=(SELECT id FROM outbox LIMIT 1)",
  );
  await recover();
  assert.equal(
    (await query("SELECT 1 FROM outbox WHERE status='ambiguous'")).length,
    1,
  );
});
test("quiet hours consolidate held alerts into one catch-up without a burst", async () => {
  await drain();
  await preferences(reader, {
    topics: ["ai", "coding"],
    timezone: "UTC",
    quiet_start: "22:00",
    quiet_end: "07:00",
  });
  const ids: string[] = [];
  for (let i = 0; i < 2; i++) {
    let s = await createStory({
      ...input,
      title: "SYNTHETIC quiet example " + i,
    });
    await editStory(s.id, s.revision, "release", input);
    ids.push(s.id);
  }
  const night = new Date();
  night.setUTCDate(night.getUTCDate() + 1);
  night.setUTCHours(23, 0, 0, 0);
  await dispatchOne(night);
  await dispatchOne(night);
  const morning = new Date(night.getTime() + 9 * 3600_000);
  await dispatchOne(morning);
  const rows = await query<{
    status: string;
    provider_id: string;
    payload: { text: string };
  }>(
    "SELECT status,provider_id,payload FROM outbox WHERE purpose='brief' AND story_id=ANY($1::uuid[])",
    [ids],
  );
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.status === "captured"));
  assert.equal(new Set(rows.map((r) => r.provider_id)).size, 1);
  assert.ok(rows[0].payload.text.includes("catch-up"));
});
test("unsubscribe is scoped and deletion removes private records", async () => {
  await assert.rejects(unsubscribe(reader, "wrong"));
  await unsubscribe(reader, scopedToken(reader, "unsubscribe"));
  assert.equal((await subscriber(reader)).email_state, "off");
  assert.equal((await subscriber(reader)).telegram_state, "active");
  await preferences(reader, { topics: ["ai"], timezone: "UTC" }, "delete");
  assert.equal(await subscriber(reader), undefined);
  assert.equal(
    (await query("SELECT 1 FROM outbox WHERE subscriber_id=$1", [reader]))
      .length,
    0,
  );
});

test("Telegram-only readers can add email; recovery never restarts an opted-out digest", async () => {
  const { addEmail, recoverEmail } = await import("../src/lib/subscriptions");
  const { takeToken } = await import("../src/lib/security");
  const a = await subscribe({
    topics: ["ai"],
    timezone: "UTC",
    telegram: true,
  });
  await addEmail(a.id!, "recovery@example.invalid");
  const verify = (
    await query<{ payload: { url: string } }>(
      "SELECT payload FROM outbox WHERE subscriber_id=$1 AND purpose='verify'",
      [a.id],
    )
  )[0];
  await verifyEmail(new URL(verify.payload.url).searchParams.get("token")!);
  const s = await subscriber(a.id!);
  await preferences(a.id!, s, "unsubscribe");
  await recoverEmail("recovery@example.invalid");
  await drain();
  const access = (
    await query<{ payload: { url: string }; status: string }>(
      "SELECT payload,status FROM outbox WHERE subscriber_id=$1 AND purpose='access'",
      [a.id],
    )
  )[0];
  assert.equal(access.status, "captured");
  const token = new URL(access.payload.url).searchParams.get("token")!;
  assert.equal(await tx((db) => takeToken(db, token, "access")), a.id);
  await assert.rejects(tx((db) => takeToken(db, token, "access")));
  assert.equal((await subscriber(a.id!)).email_state, "off");
  await recoverEmail("unknown@example.invalid");
  await preferences(a.id!, {}, "delete");
});

test("existing email links only after proof in the requesting subscriber session", async () => {
  const { addEmail, confirmEmailLink } =
    await import("../src/lib/subscriptions");
  const old = await subscribe({
    topics: ["coding"],
    timezone: "UTC",
    email: "link-proof@example.invalid",
    telegram: true,
  });
  const current = await subscribe({
    topics: ["ai"],
    timezone: "Asia/Kolkata",
    telegram: true,
  });
  const outsider = await subscribe({
    topics: ["ai"],
    timezone: "UTC",
    telegram: true,
  });
  const link = await telegramLink(current.id!);
  await tx((db) => connectTelegram(db, link.token, "preview:" + current.id));
  const stale = (
    await query<{ payload: { url: string } }>(
      "SELECT payload FROM outbox WHERE subscriber_id=$1 AND purpose='verify'",
      [old.id],
    )
  )[0];
  assert.equal(
    (await addEmail(current.id!, "link-proof@example.invalid"))?.linking,
    true,
  );
  assert.equal((await subscriber(current.id!)).email, null);
  await drain();
  const capture = (
    await query<{ payload: { url: string }; status: string }>(
      "SELECT payload,status FROM outbox WHERE subscriber_id=$1 AND purpose='email-link'",
      [old.id],
    )
  )[0];
  assert.equal(capture.status, "captured");
  const token = new URL(capture.payload.url).searchParams.get("token")!;
  await assert.rejects(confirmEmailLink(outsider.id!, token));
  assert.equal((await subscriber(old.id!)).email, "link-proof@example.invalid");
  await confirmEmailLink(current.id!, token);
  const target = await subscriber(current.id!);
  assert.equal(target.email_state, "active");
  assert.equal(target.email, "link-proof@example.invalid");
  assert.equal(target.chat_id, "preview:" + current.id);
  assert.deepEqual(target.topics, ["ai"]);
  assert.equal(target.timezone, "Asia/Kolkata");
  assert.equal((await subscriber(old.id!)).email, null);
  assert.equal((await subscriber(old.id!)).email_state, "off");
  await assert.rejects(confirmEmailLink(current.id!, token));
  await assert.rejects(
    verifyEmail(new URL(stale.payload.url).searchParams.get("token")!),
  );
  for (const id of [old.id, current.id, outsider.id])
    await preferences(id!, {}, "delete");
});
