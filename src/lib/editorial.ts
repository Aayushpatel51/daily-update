import { randomUUID } from "node:crypto";
import { tx, query, type DB } from "./db";
import { storyInput, type Story } from "./models";
import { config } from "./config";
export async function enqueue(
  db: DB,
  key: string,
  channel: string,
  purpose: string,
  payload: unknown = {},
  subscriber: string | null = null,
  story: string | null = null,
  digestId: string | null = null,
) {
  await db.query(
    "INSERT INTO outbox(id,key,channel,purpose,payload,subscriber_id,story_id,digest_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(key) DO NOTHING",
    [
      randomUUID(),
      key,
      channel,
      purpose,
      JSON.stringify(payload),
      subscriber,
      story,
      digestId,
    ],
  );
}
async function audit(db: DB, s: Story, action: string) {
  await db.query(
    "INSERT INTO revisions(story_id,revision,action,snapshot) VALUES($1,$2,$3,$4)",
    [s.id, s.revision, action, JSON.stringify(s)],
  );
}
export async function editorNotice(
  db: DB,
  id: string,
  stage: string,
  revision: number,
) {
  await enqueue(
    db,
    `editor:${id}:${stage}:${revision}`,
    "editor",
    stage,
    {
      text:
        stage === "candidate"
          ? "An unverified candidate needs research."
          : "An article draft is ready for review.",
      url: `${config().APP_URL}/admin/story/${id}`,
    },
    null,
    id,
  );
}
export async function createStory(input: unknown, key: string | null = null) {
  const v = storyInput.parse(input);
  return tx(async (db) => {
    if (key) {
      const old = await db.query<Story>(
        "SELECT * FROM stories WHERE source_key=$1",
        [key],
      );
      if (old.rows[0]) return old.rows[0];
    }
    const id = randomUUID(),
      slug =
        v.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 70) +
        "-" +
        id.slice(0, 8);
    const s = (
      await db.query<Story>(
        `INSERT INTO stories(id,slug,title,topics,state,brief,article,evidence,evidence_label,major,synthetic,source_key) VALUES($1,$2,$3,$4,'candidate',$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          id,
          slug,
          v.title,
          v.topics,
          v.brief,
          JSON.stringify(v.article),
          JSON.stringify(v.evidence),
          v.evidence_label,
          v.major,
          v.synthetic,
          key,
        ],
      )
    ).rows[0];
    await audit(db, s, "created");
    await editorNotice(db, id, "candidate", 1);
    return s;
  });
}
export async function story(id: string) {
  return (await query<Story>("SELECT * FROM stories WHERE id=$1", [id]))[0];
}
export async function switches(db: DB) {
  return (
    await db.query<{ value: Record<string, boolean> }>(
      "SELECT value FROM settings WHERE key='switches'",
    )
  ).rows[0].value;
}
export async function editStory(
  id: string,
  revision: number,
  action: string,
  input: unknown,
  correction = "",
  mergeTarget = "",
) {
  return tx(async (db) => {
    const s = (
      await db.query<Story>("SELECT * FROM stories WHERE id=$1 FOR UPDATE", [
        id,
      ])
    ).rows[0];
    if (!s || s.revision !== revision)
      throw new Error("This story changed. Reload before reviewing it.");
    const sw = await switches(db);
    let state = s.state,
      release = s.released_at,
      published = s.published_at;
    const v = storyInput.parse(input);
    if (s.released_at && !["correct", "retract"].includes(action)) {
      v.title = s.title;
      v.brief = s.brief;
      v.topics = s.topics;
      v.evidence_label = s.evidence_label;
      v.major = s.major;
    }
    if (
      ["merged", "retracted", "rejected"].includes(state) &&
      action !== "reopen"
    )
      throw new Error("Reopen this story before editing.");
    if (action === "release") {
      if (!["candidate", "held"].includes(state))
        throw new Error("This brief has already been released.");
      if (
        v.brief.trim().length < 30 ||
        v.evidence_label === "Awaiting verification"
      )
        throw new Error(
          "Add a researched brief and an evidence label before approval.",
        );
      state = "brief_released";
      release = new Date();
    }
    if (action === "submit") {
      if (!["brief_released", "article_review"].includes(state))
        throw new Error("Release the brief before preparing its article.");
      if (Object.values(v.article).some((x) => x.trim().length < 10))
        throw new Error("Complete all four article sections.");
      state = "article_review";
    }
    if (action === "publish") {
      if (!sw.publishing)
        throw new Error("Publishing is paused in Operations.");
      if (state !== "article_review")
        throw new Error("Submit the article for review first.");
      if (Object.values(v.article).some((x) => x.trim().length < 10))
        throw new Error("Complete all article sections.");
      state = "published";
      published = new Date();
    }
    if (action === "correct") {
      if (state !== "published" || correction.trim().length < 10)
        throw new Error("Published corrections need a clear explanation.");
    }
    if (s.state === "published" && !["correct", "retract"].includes(action))
      throw new Error(
        "Use a recorded correction to change a published article.",
      );
    if (action === "hold") {
      if (release)
        throw new Error("Released stories require a correction or retraction.");
      state = "held";
    }
    if (action === "reject") {
      if (release) throw new Error("Retract a released story instead.");
      state = "rejected";
    }
    if (action === "reopen") {
      if (release)
        throw new Error("Published history cannot be reopened as a new event.");
      state = "candidate";
    }
    if (action === "retract") {
      if (!release || correction.trim().length < 10)
        throw new Error("Provide a retraction reason.");
      state = "retracted";
    }
    if (action === "merge") {
      if (release || id === mergeTarget)
        throw new Error(
          "Only unreleased candidates can be merged into another story.",
        );
      const target = (
        await db.query<Story>(
          "SELECT * FROM stories WHERE id=$1 AND state NOT IN ('merged','retracted','rejected')",
          [mergeTarget],
        )
      ).rows[0];
      if (!target) throw new Error("Select an existing active story.");
      state = "merged";
    }
    const next = (
      await db.query<Story>(
        `UPDATE stories SET title=$2,topics=$3,brief=$4,article=$5,evidence=$6,evidence_label=$7,major=$8,state=$9,revision=revision+1,updated_at=now(),released_at=$10,published_at=$11,correction=$12,merged_into=$13 WHERE id=$1 RETURNING *`,
        [
          id,
          v.title,
          v.topics,
          v.brief,
          JSON.stringify(v.article),
          JSON.stringify(v.evidence),
          v.evidence_label,
          v.major,
          state,
          release,
          published,
          correction || s.correction,
          action === "merge" ? mergeTarget : s.merged_into,
        ],
      )
    ).rows[0];
    await audit(db, next, action);
    if (action === "release") {
      const readers = (
        await db.query<{ id: string }>(
          "SELECT id FROM subscribers WHERE telegram_state='active' AND topics && $1::text[] AND (NOT major_only OR $2)",
          [v.topics, v.major],
        )
      ).rows;
      for (const r of readers)
        await enqueue(
          db,
          `brief:${id}:${r.id}`,
          "telegram",
          "brief",
          {},
          r.id,
          id,
        );
    }
    if (action === "submit" && s.state !== "article_review")
      await editorNotice(db, id, "article", next.revision);
    if (["publish", "correct", "retract"].includes(action)) {
      const sent = (
        await db.query<{ id: string; subscriber_id: string }>(
          "SELECT id,subscriber_id FROM outbox WHERE story_id=$1 AND purpose='brief' AND status IN ('accepted','captured')",
          [id],
        )
      ).rows;
      for (const d of sent)
        await enqueue(
          db,
          `edit:${id}:${next.revision}:${d.id}`,
          "telegram",
          "edit",
          { original: d.id },
          d.subscriber_id,
          id,
        );
    }
    if (["retract", "reject", "merge"].includes(action))
      await db.query(
        "UPDATE outbox SET status='suppressed',error='story_withdrawn' WHERE story_id=$1 AND purpose='brief' AND status='queued'",
        [id],
      );
    return next;
  });
}
