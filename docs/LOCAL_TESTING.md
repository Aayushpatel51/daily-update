# Test the local MVP

This version runs on your computer with $0 additional service spend. It provides the reader website, editorial desk, durable worker, Telegram previews and captured daily emails. Nothing is deployed. Live Telegram delivery has not been verified; real email delivery is not implemented.

## Start

Use Node 24.20 or newer within Node 24 and npm. Bundled PostgreSQL was tested on macOS Apple Silicon. From the repository root:

```sh
npm ci --ignore-scripts
npm run setup
npm run db
```

Leave the database terminal running. Setup creates a private, ignored `.env` with generated credentials and preserves an existing file. Read `ADMIN_PASSWORD` there when signing in; do not paste it into issues or commit it.

In another terminal:

```sh
npm run seed
npm run dev
```

Seeding is optional and idempotent. It adds five clearly labelled fictional articles, not real news. Open [the website](http://127.0.0.1:3000) and [the editorial desk](http://127.0.0.1:3000/admin). Both `127.0.0.1` and `localhost` work on the configured local HTTP port. Use one consistently because each has separate browser cookies; generated links use `APP_URL`. Other origins are rejected.

In a third terminal:

```sh
npm run worker
```

The worker checks due work every 15 seconds; each source has its own polling interval. Sleeping or shutting down this computer stops discovery and delivery. The Operations page can run one cycle manually. Stop the worker and website before stopping the database. Restart with the same commands; PostgreSQL data survives in `storage/postgres`.

For a production-mode local build, run `npm run build` and then `npm start` instead of `npm run dev`.

If bundled PostgreSQL is unavailable, use an existing local PostgreSQL server, create a dedicated `daily_update` database, configure `DATABASE_URL`, and apply `src/lib/schema.sql` using your database client. Do not run `npm run db` against that external installation. External database setup and other operating systems have not been tested.

## Try a complete story

Use separate browser profiles for editor and subscriber: each profile has one session cookie. Signing in as editor replaces that profile's subscriber session.

1. On the reader website, choose topics and Telegram and/or daily email. Confirm the timezone. Telegram-only registration needs no email.
2. In preferences, create the Telegram connection and choose **Connect a local test chat**. This simulates consent without sending messages.
3. If testing email, run a worker cycle, then open the editor's **Deliveries** page. Copy the verification link from its protected preview into the reader browser and explicitly confirm. Links expire after 30 minutes and are single-use.
4. Add a candidate in the editorial desk. Use fictional evidence and check the demonstration label for test content. A candidate creates an editor review notification; it does not publish anything.
5. Enter a source-backed brief and evidence label. Approve and release the brief. Run a worker cycle and inspect its Telegram preview. The article can still be unfinished.
6. Complete all four article sections, submit it for a separate review, then approve publication. The story becomes public and an edit to the original Telegram message is queued.
7. Run a cycle to capture the article-link edit. Check the topic feed, article sources, archive and mobile layout.
8. Publish after the email subscriber has verified and selected the topic. At 21:00 in that reader's timezone, the worker captures the daily digest. The Deliveries page also offers a next-cutoff simulation so you need not wait.

**Digest simulation writes real local preview records for the next day's cutoff.** It affects later local digest eligibility; use synthetic test subscriptions. It is disabled in sandbox mode. Empty digests are skipped. Cross-topic stories appear once, and previously captured editions are not replayed.

If your email belongs to an earlier test subscription, add it from the current subscriber’s Preferences. The app queues an `email-link` confirmation under Editor → Deliveries. Copy that link into the same subscriber browser, then choose **Confirm and link my email**. This moves only the email channel, preserves the current topics/Telegram settings, and stops email on the earlier subscription. It does not delete either subscription. Links expire after 30 minutes and cannot be used by a different subscriber session.

Try changing topics, major-only alerts, quiet hours, pause/resume, email unsubscribe and deletion. Quiet-hour briefs become a combined catch-up. Telegram-only readers can add verified email later. Readers without a browser session can request an email access link from Preferences; this does not reactivate an unsubscribed daily digest. In preview mode these links are also in Deliveries.

## Research and source monitoring

Research is owner-assisted. Use ChatGPT Plus and your browser separately, verify the original sources, then paste or import the structured result into the editor. The downloadable JSON template is labelled synthetic. This app does not automate the ChatGPT website, consume a Plus subscription as an API, or purchase search/model calls.

The Sources page includes the monitored registry and manual research links. Three structured adapters are implemented: GitHub RSS, CISA KEV JSON and Google Cloud Atom. They are disabled by default. Review source access rules and enter access notes before enabling one. The first successful fetch establishes a baseline; subsequent changes create unverified candidates. A changed page is not automatically verified news. Daily bundles and duplicates need editorial splitting or merging. Other fields use manual discovery until further adapters are validated.

## Optional Telegram sandbox

Keep `DELIVERY_MODE=preview` for safe local testing. To intentionally test with your own Telegram accounts, configure `.env` with `DELIVERY_MODE=sandbox`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_NAME`, comma-separated `TELEGRAM_ALLOWLIST`, and `EDITOR_CHAT_ID` (also allowlisted). Restart the app and worker. Never commit those values.

The adapter uses long polling, not a public webhook. Only allowlisted private chats can connect or receive sandbox messages. Use `/start` through the website's connection link; `/settings`, `/topics` and `/help` provide a private preferences link. `/pause`, `/resume` and `/stop` control Telegram. Local review links open only on the development computer; phone access needs a separately configured authenticated deployment. Email remains captured even in sandbox mode.

Do not reuse preview-connected subscriptions for real Telegram: create a fresh test subscription. Real sends require the owner's explicit authorization; this PR's verification uses previews and mocked provider responses only.

## Checks

With the local database and web server running:

```sh
npm run typecheck
npm run format:check
npm test
npm run test:e2e
npm run build
```

Install the browser once with `npx playwright install chromium` if missing. Database tests create and clear only `daily_update_test` on the configured database server, which must be a dedicated local test server. Browser tests create clearly labelled synthetic stories in the running app and delete their temporary subscriber. They do not send externally. Source-harness checks are documented in [its README](../experiments/source-monitor/README.md).

## Backup and recovery

```sh
npm run backup
npm run restore:check -- storage/backups/your-snapshot.json
```

Backup prints the actual snapshot path. It creates a transactionally consistent JSON snapshot plus SHA-256 checksum, with private file permissions. Backups contain private subscriber and delivery data, including captured links; keep them outside Git and restrict access. Sessions and token records are intentionally excluded. A checksum detects accidental corruption, not a malicious replacement of both files.

Restore verification creates a fresh `daily_update_restore_<timestamp>` database and checks schema/data restoration without overwriting the app database. It leaves the restored database for inspection; remove it through your database client after review. Interrupted submissions become ambiguous. To recover from a real failure, stop the worker, retain the original data, inspect the restored database, point `DATABASE_URL` to that verified database and use your external PostgreSQL process to serve it. Start in preview mode and review pending work before any sandbox sending. Fresh sign-in/linking is required.

Operations has independent monitoring, publishing, editor, Telegram and email switches. A failed or ambiguous delivery stays visible; ambiguous submissions are never automatically resent. The desk currently permits acknowledging/suppressing these outcomes, not unproven blind retries. Telegram 429 responses get bounded retries. A provider acceptance does not prove a device notification or read.

## Before an invited pilot or public launch

See [MVP acceptance and remaining gates](MVP_ACCEPTANCE.md). Hosting, real email authentication/deliverability, actual Telegram device tests, continuous editorial coverage, expanded source monitoring, load/security testing and an approved live budget remain separate work. Do not expose this local single-editor installation directly to the internet.
