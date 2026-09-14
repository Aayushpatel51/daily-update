import { config } from "@/lib/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import type { Story } from "@/lib/models";
import { Tags } from "@/components/stories";
export const dynamic = "force-dynamic";
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = (
    await query<Story>(
      "SELECT * FROM stories WHERE slug=$1 AND state IN ('published','retracted') AND published_at IS NOT NULL",
      [slug],
    )
  )[0];
  if (!s) notFound();
  return (
    <article className="article-page">
      <Link className="back" href="/">
        ← All updates
      </Link>
      <Tags story={s} />
      <h1>{s.title}</h1>
      <p className="standfirst">{s.brief}</p>
      <div className="article-byline">
        <span>Daily Update editorial</span>
        <time dateTime={s.published_at!.toISOString()}>
          Published{" "}
          {s.published_at!.toLocaleString("en-GB", { timeZone: "UTC" })} UTC
        </time>
        <span>{s.evidence_label}</span>
      </div>
      {s.correction && (
        <aside className="notice">
          <strong>
            {s.state === "retracted" ? "Retraction" : "Correction"}
          </strong>
          <p>{s.correction}</p>
          <span>
            Updated {s.updated_at.toLocaleString("en-GB", { timeZone: "UTC" })}{" "}
            UTC
          </span>
        </aside>
      )}
      {s.state !== "retracted" &&
        Object.entries({
          changed: "What changed",
          audience: "Who it affects",
          matters: "Why it matters",
          unknowns: "What remains uncertain",
        }).map(([key, label]) => (
          <section key={key}>
            <h2>{label}</h2>
            {s.article[key as keyof typeof s.article]
              .split("\n")
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </section>
        ))}
      <section className="sources">
        <h2>Go to the source</h2>
        {s.evidence.map((e, i) => (
          <p key={i}>
            <a href={e.url} target="_blank" rel="noreferrer">
              {new URL(e.url).hostname} ↗
            </a>
            {e.publishedAt && (
              <span className="caption"> Source date: {e.publishedAt}</span>
            )}
          </p>
        ))}
      </section>
      <aside className="article-subscribe">
        <h2>Follow the next development.</h2>
        <p>Choose your topics and how you want to hear from us.</p>
        <Link className="button" href="/subscribe">
          Set your preferences ↗
        </Link>
      </aside>
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = (
    await query<Story>(
      "SELECT * FROM stories WHERE slug=$1 AND state='published'",
      [slug],
    )
  )[0];
  return row
    ? {
        title: row.title,
        description: row.brief,
        alternates: { canonical: config().APP_URL + "/articles/" + row.slug },
      }
    : { title: "Story unavailable" };
}
