import { randomUUID } from "node:crypto";
import { tx } from "./db";
import { enqueue } from "./editorial";
import { cutoff } from "./time";
import { topicName, type Subscriber, type Story } from "./models";
export async function buildDigests(now = new Date()) {
  return tx(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(621001)");
    const readers = (
      await db.query<Subscriber>(
        "SELECT * FROM subscribers WHERE email_state='active' ORDER BY id",
      )
    ).rows;
    let total = 0;
    for (const s of readers) {
      const end = cutoff(now, s.timezone);
      if (!s.email_since || s.email_since > end.instant) continue;
      if (
        (
          await db.query(
            "SELECT 1 FROM digests WHERE subscriber_id=$1 AND local_date=$2",
            [s.id, end.date],
          )
        ).rowCount
      )
        continue;
      // Do not construct another edition around an uncertain submission.
      if (
        (
          await db.query(
            "SELECT 1 FROM outbox WHERE subscriber_id=$1 AND purpose='digest' AND status IN ('ambiguous','processing')",
            [s.id],
          )
        ).rowCount
      )
        continue;
      await db.query(
        "UPDATE outbox SET status='suppressed',error='superseded_edition' WHERE subscriber_id=$1 AND purpose='digest' AND status='queued'",
        [s.id],
      );
      const rows = (
        await db.query<Story>(
          `SELECT * FROM stories WHERE state='published' AND published_at<=$1 AND published_at>=$2 AND topics && $3::text[] AND NOT EXISTS(SELECT 1 FROM digests d JOIN outbox o ON o.digest_id=d.id WHERE d.subscriber_id=$4 AND o.status IN ('accepted','captured') AND stories.id=ANY(d.story_ids)) ORDER BY published_at`,
          [end.instant, s.email_since, s.topics, s.id],
        )
      ).rows.filter((e) =>
        e.topics.some(
          (t) =>
            s.topics.includes(t) &&
            new Date(s.topic_since[t]) <= e.published_at!,
        ),
      );
      if (!rows.length) continue;
      const id = randomUUID();
      const snapshot = rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        brief: r.brief,
        topic: topicName(r.topics.find((t) => s.topics.includes(t))!),
        synthetic: r.synthetic,
        correction: r.correction,
      }));
      await db.query("INSERT INTO digests VALUES($1,$2,$3,$4,$5,$6)", [
        id,
        s.id,
        end.date,
        end.instant,
        rows.map((r) => r.id),
        JSON.stringify(snapshot),
      ]);
      await enqueue(
        db,
        `digest:${s.id}:${end.date}`,
        "email",
        "digest",
        { date: end.date, stories: snapshot },
        s.id,
        null,
        id,
      );
      total++;
    }
    return total;
  });
}
