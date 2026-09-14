import { notFound } from "next/navigation";
import { topics, type Story } from "@/lib/models";
import { query } from "@/lib/db";
import { TopicNav, StoryList } from "@/components/stories";
export const dynamic = "force-dynamic";
export default async function Topic({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params,
    t = topics.find((t) => t.key === key);
  if (!t) notFound();
  const stories = await query<Story>(
    "SELECT * FROM stories WHERE state='published' AND $1=ANY(topics) ORDER BY published_at DESC LIMIT 40",
    [key],
  );
  return (
    <div className="shell">
      <div className="page-heading">
        <p className="eyebrow">Your interests, in focus</p>
        <h1>{t.name}</h1>
        <p>{t.description}</p>
      </div>
      <TopicNav selected={key} />
      <StoryList stories={stories} />
    </div>
  );
}
