export default function Privacy() {
  return (
    <article className="article-page">
      <h1>Your preferences are yours.</h1>
      <p className="standfirst">
        This is a local test installation, not a public subscription service.
      </p>
      <section>
        <h2>What is stored</h2>
        <p>
          Your chosen topics, timezone, channel status and any email address or
          Telegram chat identifier you provide are stored in the local
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
        <h2>Local retention</h2>
        <p>
          Expired sessions and connection tokens are removed by the worker.
          Review history and local delivery previews remain until the operator
          removes the test database or restores a backup. Backups may retain
          deleted records and must be handled privately.
        </p>
        <p>
          Public-launch retention, support contact and provider data policies
          still require an owner decision before real distribution.
        </p>
      </section>
    </article>
  );
}
