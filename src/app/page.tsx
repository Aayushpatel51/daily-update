import Link from "next/link";
import { query } from "@/lib/db";
import type { Story } from "@/lib/models";
import { TopicNav, StoryList, Tags } from "@/components/stories";
export const dynamic = "force-dynamic";
export default async function Home() {
  const stories = await query<Story>(
    "SELECT * FROM stories WHERE state='published' ORDER BY published_at DESC LIMIT 11",
  );
  const lead = stories[0];
  return (
    <div className="shell">
      <section className="intro">
        <p className="eyebrow">Technology, with context</p>
        <h1>
          Keep up.
          <br />
          <em>Without the noise.</em>
        </h1>
        <p className="intro-copy">
          The developments that matter, explained clearly.
          <br />
          Five topics. Your own daily perspective.
        </p>
      </section>
      <TopicNav />
      {lead ? (
        <section className="lead-grid">
          <article className="lead">
            <Tags story={lead} />
            <h2>
              <Link href={"/articles/" + lead.slug}>{lead.title}</Link>
            </h2>
            <p>{lead.brief}</p>
            <Link className="text-link" href={"/articles/" + lead.slug}>
              Read the full story <span>↗</span>
            </Link>
          </article>
          <aside className="follow-panel">
            <span className="panel-label">Make it your update</span>
            <h2>
              A brief now.
              <br />
              The bigger picture later.
            </h2>
            <p>
              Choose your interests. Get a Telegram brief after review, then a
              daily email with the full stories.
            </p>
            <Link className="button" href="/subscribe">
              Choose your topics ↗
            </Link>
            <span className="caption">
              Email is optional. Your preferences come first.
            </span>
          </aside>
        </section>
      ) : (
        <div className="empty">
          <h2>Your next useful read starts here.</h2>
          <p>
            There are no published stories yet. The editorial desk is ready for
            the first one.
          </p>
          <Link href="/admin">Open the editorial desk →</Link>
        </div>
      )}
      <section className="latest">
        <div className="section-heading">
          <h2>The latest</h2>
          <Link href="/archive">Browse the archive ↗</Link>
        </div>
        <StoryList stories={stories.slice(1)} />
      </section>
      <section className="principles">
        <p>
          Less catching up.
          <br />
          <em>More understanding.</em>
        </p>
        <div>
          <h3>Sources, always.</h3>
          <p>
            Follow the original evidence, see what is known and understand what
            is still uncertain.
          </p>
          <Link href="/about">How we work →</Link>
        </div>
      </section>
    </div>
  );
}
