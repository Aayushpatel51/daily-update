export default function Privacy() {
  return (
    <article className="article-page">
      <h1>Your preferences are yours.</h1>
      <p className="standfirst">
        This is an owner-only pilot for testing subscriptions and delivery.
      </p>
      <section>
        <h2>What is stored</h2>
        <p>
          Your chosen topics, timezone, channel status and any email address or
          Telegram chat identifier you provide are stored in the configured
          PostgreSQL database. Private session and connection tokens are hashed.
          Verification links and delivery previews are available only to the
          editor.
        </p>
      </section>
      <section>
        <h2>How to stop</h2>
        <p>
          Use Preferences to pause Telegram, stop a channel or delete your
          subscription. Deletion removes the subscriber record, private
          sessions, connection tokens, digests and subscriber delivery records.
          It does not remove published articles.
        </p>
      </section>
      <section>
        <h2>Test data and providers</h2>
        <p>
          Expired sessions and connection tokens are removed by the worker.
          Review history and local delivery previews remain until the operator
          removes the test database or restores a backup. Backups may retain
          deleted records and must be handled privately.
        </p>
        <p>
          The hosted pilot uses Vercel for the website, Supabase for data,
          Telegram for messages, and Resend for email. Each provider processes
          the data needed to deliver its service. Access is restricted to the
          owner’s test destinations. Wider distribution requires a separate
          privacy and retention review.
        </p>
      </section>
    </article>
  );
}
