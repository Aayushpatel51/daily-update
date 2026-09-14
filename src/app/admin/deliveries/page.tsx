import { requireEditor } from "@/lib/auth";
import { query } from "@/lib/db";
import { type Delivery } from "@/lib/models";
import { AdminNav } from "@/components/admin-nav";
import { ActionForm } from "@/components/forms";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Deliveries() {
  await requireEditor();
  const rows = await query<Delivery>(
    "SELECT * FROM outbox ORDER BY created_at DESC LIMIT 100",
  );
  return (
    <div className="shell admin">
      <AdminNav />
      <div className="page-heading compact">
        <p className="eyebrow">An honest delivery record</p>
        <h1>Every handoff, visible.</h1>
        <p>
          Captured means local preview. Accepted means the provider accepted it,
          not that a person read it.
        </p>
      </div>
      <div className="inline">
        <ActionForm action="tick" label="Run one worker cycle" />
        <ActionForm action="digest-test" label="Preview next daily cutoff" />
      </div>
      {rows.map((d) => (
        <details className="delivery" key={d.id}>
          <summary>
            <span>
              {d.channel} / {d.purpose}
            </span>
            <span className={"status " + d.status}>{d.status}</span>
            <time>
              {d.created_at.toLocaleString("en-GB", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </time>
          </summary>
          {d.error && <p className="error">{d.error}</p>}
          <p className="caption">
            Attempts: {d.attempts} ·{" "}
            {d.story_id && (
              <Link href={"/admin/story/" + d.story_id}>Open story →</Link>
            )}
          </p>
          <pre>
            {String(
              d.payload.text ??
                "Waiting for the worker to render this message.",
            )}
          </pre>
          {typeof d.payload.url === "string" &&
            d.payload.url.startsWith("/") === false && (
              <a href={d.payload.url}>Open private action link →</a>
            )}
          {d.channel === "email" && typeof d.payload.html === "string" && (
            <>
              <h3>Email preview</h3>
              <iframe
                title={"Email preview " + d.id}
                sandbox=""
                srcDoc={d.payload.html}
              />
            </>
          )}
          {["failed", "ambiguous"].includes(d.status) && (
            <ActionForm
              action="resolve"
              values={{ id: d.id, status: "suppressed" }}
              label="Resolve without resending"
            />
          )}
        </details>
      ))}
      {!rows.length && (
        <div className="empty">
          <p>No delivery attempts yet. Add and review a candidate to begin.</p>
        </div>
      )}
    </div>
  );
}
