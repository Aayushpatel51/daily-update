import { query } from "@/lib/db";
import type { Story } from "@/lib/models";
import { StoryList } from "@/components/stories";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Archive({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; date?: string }>;
}) {
  const p = await searchParams,
    page = Math.max(1, Math.min(10000, Number(p.page) || 1)),
    date = /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "") ? p.date : null;
  const stories = await query<Story>(
    "SELECT * FROM stories WHERE state='published' AND ($1::text IS NULL OR to_char(published_at AT TIME ZONE 'UTC','YYYY-MM-DD')=$1) ORDER BY published_at DESC LIMIT 21 OFFSET $2",
    [date, (page - 1) * 20],
  );
  return (
    <div className="shell">
      <div className="page-heading">
        <p className="eyebrow">The reading room</p>
        <h1>Worth coming back to.</h1>
        <p>Every published story, with its original sources.</p>
      </div>
      <form className="inline" action="/archive">
        <label>
          Publication date (UTC)
          <input type="date" name="date" defaultValue={date ?? ""} />
        </label>
        <button>Filter</button>
        <Link href="/archive">Clear</Link>
      </form>
      <StoryList stories={stories.slice(0, 20)} />
      <div className="pagination">
        {page > 1 && (
          <Link href={`?page=${page - 1}&date=${date ?? ""}`}>← Newer</Link>
        )}
        {stories.length > 20 && (
          <Link href={`?page=${page + 1}&date=${date ?? ""}`}>Older →</Link>
        )}
      </div>
    </div>
  );
}
