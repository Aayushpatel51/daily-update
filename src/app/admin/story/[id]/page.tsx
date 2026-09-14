import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { story } from "@/lib/editorial";
import { query } from "@/lib/db";
import { Editor } from "@/components/editor";
import { AdminNav } from "@/components/admin-nav";
import type { StoryInput } from "@/lib/models";
export const dynamic = "force-dynamic";
export default async function StoryEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEditor();
  const { id } = await params;
  const s = id === "new" ? null : await story(id);
  if (id !== "new" && !s) notFound();
  const history = s
    ? await query<{ revision: number; action: string; created_at: Date }>(
        "SELECT revision,action,created_at FROM revisions WHERE story_id=$1 ORDER BY id DESC LIMIT 30",
        [s.id],
      )
    : [];
  const initial: StoryInput | undefined = s
    ? {
        title: s.title,
        topics: s.topics,
        brief: s.brief,
        article: s.article,
        evidence: s.evidence,
        evidence_label: s.evidence_label,
        major: s.major,
        synthetic: s.synthetic,
      }
    : undefined;
  return (
    <div className="shell admin">
      <AdminNav />
      <div className="page-heading compact">
        <p className="eyebrow">Research · review · release</p>
        <h1>{s ? "Review the story." : "Start with the source."}</h1>
        <p>
          {s
            ? "Editing revision " +
              s.revision +
              ". Each approval records the exact version."
            : "Add a development for research. Creating a candidate does not publish it."}
        </p>
      </div>
      <Editor
        key={s?.revision ?? "new"}
        initial={initial}
        id={s?.id}
        state={s?.state}
        revision={s?.revision}
      />
      {history.length > 0 && (
        <details className="history">
          <summary>Editorial history</summary>
          {history.map((h, i) => (
            <p key={i}>
              Revision {h.revision} · {h.action} · {h.created_at.toISOString()}
            </p>
          ))}
        </details>
      )}
    </div>
  );
}
