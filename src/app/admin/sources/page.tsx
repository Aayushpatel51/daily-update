import { requireEditor } from "@/lib/auth";
import { query } from "@/lib/db";
import { type Source } from "@/lib/monitor";
import { AdminNav } from "@/components/admin-nav";
import { ActionForm } from "@/components/forms";
export const dynamic = "force-dynamic";
export default async function Sources() {
  await requireEditor();
  const sources = await query<Source>("SELECT * FROM sources ORDER BY id");
  return (
    <div className="shell admin">
      <AdminNav />
      <div className="page-heading compact">
        <p className="eyebrow">A shared research foundation</p>
        <h1>Follow the evidence.</h1>
        <p>
          Review source access before enabling checks. First fetches establish a
          quiet baseline.
        </p>
      </div>
      {sources.map((s) => (
        <section className="source-row" key={s.id}>
          <div>
            <h2>{s.name}</h2>
            <a href={s.url} target="_blank" rel="noreferrer">
              Original source ↗
            </a>
            <p>
              {s.enabled
                ? "Monitoring every " + s.interval_minutes + " minutes"
                : "Not monitoring"}
            </p>
            <p className="caption">
              Last success: {s.success_at?.toISOString() ?? "Not checked"}
            </p>
            {s.error && <p className="error">{s.error}</p>}
          </div>
          {["S07", "S12", "S14"].includes(s.id) ? (
            <ActionForm
              action="source"
              values={{ id: s.id, enabled: !s.enabled }}
              label={s.enabled ? "Pause source" : "Enable reviewed source"}
            >
              <label>
                Access and retention review notes
                <textarea
                  name="note"
                  defaultValue={s.access_note}
                  required
                  minLength={10}
                  rows={3}
                />
              </label>
            </ActionForm>
          ) : (
            <div>
              <span className="status">Manual discovery</span>
              <p>
                Browse this source, research a development, then add a
                candidate. Automated HTML extraction awaits source-specific
                validation.
              </p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
