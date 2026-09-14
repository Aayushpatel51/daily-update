import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Story } from "@/lib/models";
import { AdminNav } from "@/components/admin-nav";
import { Tags } from "@/components/stories";
export const dynamic = "force-dynamic";
export default async function Admin() {
  await requireEditor();
  const stories = await query<Story>(
    "SELECT * FROM stories ORDER BY CASE WHEN state='candidate' THEN 0 WHEN state='article_review' THEN 1 WHEN state='brief_released' THEN 2 ELSE 3 END,updated_at DESC LIMIT 100",
  );
  const counts = {
    research: stories.filter((s) => ["candidate", "held"].includes(s.state))
      .length,
    article: stories.filter((s) =>
      ["brief_released", "article_review"].includes(s.state),
    ).length,
    published: stories.filter((s) => s.state === "published").length,
  };
  return (
    <div className="shell admin">
      <AdminNav />
      <div className="page-heading">
        <p className="eyebrow">The editorial desk</p>
        <h1>
          From a lead
          <br />
          <em>to a useful update.</em>
        </h1>
        <p>
          Research first. Approve the brief. Give the full story its own review.
        </p>
      </div>
      <div className="metrics">
        <div>
          <strong>{counts.research}</strong>
          <span>Need research</span>
        </div>
        <div>
          <strong>{counts.article}</strong>
          <span>Article tasks</span>
        </div>
        <div>
          <strong>{counts.published}</strong>
          <span>Published in this view</span>
        </div>
      </div>
      <div className="section-heading">
        <h2>Your review queue</h2>
        <Link className="button" href="/admin/story/new">
          Add a candidate +
        </Link>
      </div>
      {stories.length ? (
        stories.map((s) => (
          <article className="queue-row" key={s.id}>
            <div>
              <Tags story={s} />
              <h2>
                <Link href={"/admin/story/" + s.id}>{s.title}</Link>
              </h2>
              <p className="caption">
                Revision {s.revision} · Updated{" "}
                {s.updated_at.toLocaleString("en-GB", {
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </p>
            </div>
            <div>
              <span className={"status " + s.state}>
                {s.state.replaceAll("_", " ")}
              </span>
              <Link href={"/admin/story/" + s.id}>Review →</Link>
            </div>
          </article>
        ))
      ) : (
        <div className="empty">
          <h2>Ready for the first lead.</h2>
          <p>Add a source-backed candidate, or enable a reviewed source.</p>
        </div>
      )}
    </div>
  );
}
