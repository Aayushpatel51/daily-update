import Link from "next/link";
import { topics, topicName, type Story } from "@/lib/models";
export function TopicNav({ selected = "" }: { selected?: string }) {
  return (
    <nav className="topic-nav" aria-label="Topics">
      <Link aria-current={!selected ? "page" : undefined} href="/">
        All updates
      </Link>
      {topics.map((t) => (
        <Link
          key={t.key}
          aria-current={selected === t.key ? "page" : undefined}
          href={"/topics/" + t.key}
        >
          {t.name}
        </Link>
      ))}
    </nav>
  );
}
export function Tags({ story }: { story: Story }) {
  return (
    <div className="meta">
      {story.synthetic && <span className="demo-tag">Demonstration</span>}
      {story.topics.map((t) => (
        <Link key={t} href={"/topics/" + t}>
          {topicName(t)}
        </Link>
      ))}
    </div>
  );
}
export function StoryList({ stories }: { stories: Story[] }) {
  return (
    <div className="story-list">
      {stories.length ? (
        stories.map((s) => (
          <article className="story-row" key={s.id}>
            <div className="date">
              {s.published_at
                ? new Date(s.published_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    timeZone: "UTC",
                  })
                : "Pending"}
            </div>
            <div>
              <Tags story={s} />
              <h2>
                <Link href={"/articles/" + s.slug}>{s.title}</Link>
              </h2>
              <p>{s.brief}</p>
              <span className="caption">{s.evidence_label}</span>
            </div>
            <Link
              className="read-arrow"
              aria-label={"Read " + s.title}
              href={"/articles/" + s.slug}
            >
              ↗
            </Link>
          </article>
        ))
      ) : (
        <div className="empty">
          <h2>A little quiet here.</h2>
          <p>
            No published updates yet. New stories appear after editorial review.
          </p>
          <Link href="/subscribe">Choose the topics you want to follow →</Link>
        </div>
      )}
    </div>
  );
}
