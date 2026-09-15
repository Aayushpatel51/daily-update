# Owner-only live pilot

The owner authorized Vercel hosting, Supabase PostgreSQL/Cron and Resend to test real Telegram, email and article publication. This deployment can run from the feature branch without merging main; the owner still reviews and merges the PR. Scope is one allowlisted owner email and explicitly allowlisted Telegram chats, not general public subscriptions.

## Runtime

Vercel serves Next.js routes. Telegram posts to `/api/telegram` with a secret header. Supabase Cron invokes authenticated `POST /api/jobs` once per minute. Approval and account actions also request a short delivery pass after the HTTP response. A committed four-minute lease prevents concurrent worker runs across pooled connections; an interrupted submission remains ambiguous and is not blindly resent. The lease outlasts the 180-second function limit. A paused or failed source remains visible in the editor; sources start disabled until access is reviewed.

The email adapter uses Resend's API, a delivery-specific idempotency key, a 12-second request deadline, and hard limits of 90 new delivery intents per UTC day and 2,800 per UTC month. These limits reserve room below Resend's free transactional quotas but do not account for unrelated applications using the same Resend account. Only `PILOT_EMAIL` can receive an email. Keep billing upgrades and paid fallbacks disabled. The test sender `onboarding@resend.dev` can reach only the inbox associated with the Resend account. A custom verified domain is needed before wider testing.

## Configuration

`.env.pilot` is private and ignored; it is setup input, not automatically loaded by Next.js. Do not upload it as a source artifact. `.vercelignore` excludes all environment files, local skill configuration, databases and test output.

Set production variables on the existing Vercel project: `APP_URL`, `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `PILOT_MODE=true`, `PILOT_EMAIL`, `EMAIL_MODE=resend`, `EMAIL_FROM`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `DELIVERY_MODE=sandbox`, `TELEGRAM_TRANSPORT=webhook`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_NAME`, `TELEGRAM_ALLOWLIST`, `EDITOR_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, and `CRON_SECRET`. Never prefix secrets with `NEXT_PUBLIC_`. Only the production environment receives these values; preview deployments must not inherit live sending credentials automatically.

Use the Supabase transaction pooler for `DATABASE_URL`. Use its session pooler for `DATABASE_MIGRATION_URL` in the private setup file. `node --import tsx scripts/pilot/migrate.ts` applies the schema transactionally and enables RLS/revokes browser-role access to every application table. Runtime access is server-only. Do not expose these tables via permissive Data API policies.

## Connect delivery

1. Deploy the feature branch to the existing Vercel project using its production domain. This is a deployment, not a Git merge.
2. Stop the old local Telegram poller. Register the production `/api/telegram` URL with Telegram `setWebhook`, passing `TELEGRAM_WEBHOOK_SECRET`, `allowed_updates=["message"]`, and one connection. Do not run polling alongside a webhook.
3. In Resend, create a webhook for `/api/email-events`, selecting `email.delivered`, `email.bounced`, `email.complained`, and `email.suppressed`. Store its signing secret as `RESEND_WEBHOOK_SECRET` and redeploy. A sending-only API key cannot administer webhooks; configure this in the dashboard if required.
4. Run `node --import tsx scripts/pilot/schedule.ts`. The cron credential is stored in Supabase Vault, not embedded in the job command. Inspect Cron job history and the editor Operations heartbeat. Database inactivity/plan limits can interrupt scheduling.
5. Register a fresh subscription on the production domain. Local browser sessions and subscriptions are not copied into production.

Signed email events are deduplicated. Bounce/complaint/suppression events stop queued email to the affected subscriber. Provider acceptance is not a delivery receipt or proof a person read a message. The current dashboard displays acceptance; provider event records remain in `email_events` for operational verification. Digest emails include an authenticated one-click unsubscribe endpoint and a visible unsubscribe link. Empty days are skipped; publication after the cutoff enters the next eligible edition. The preview next-cutoff simulation remains disabled for live delivery.

## Test

Use separate editor/subscriber browser profiles. Register your own email, follow the verification email, connect Telegram through the generated website link, create a clearly labelled synthetic candidate, approve the brief, confirm Telegram receipt, separately submit/approve the article, and inspect the original Telegram message's article link. At 21:00 in your selected timezone the digest is queued and sent on the next available worker pass. Scheduling is not a zero-delay guarantee.

The app supports all five topics but only three structured source adapters; manual source-linked research remains necessary. ChatGPT Plus is used separately by the owner and is not an API integration. No fabricated current news is seeded into the hosted database automatically.

## Operations and rollback

Pause stages in Editor → Operations. To stop scheduled processing, unschedule `daily-update-pilot` in Supabase Cron. Disable the Telegram webhook before resuming local polling. Keep a private database backup before schema changes; Supabase Free does not include automatic backups. The pilot schema migrations are additive and transactional. Reverting Vercel to the previous local-only build will not provide live delivery; disable the schedule and webhook first.

The existing backup command follows `DATABASE_URL`; use a deliberate private environment when backing up hosted data. Backups include private subscriber data and must stay out of source control. Restoring hosted data needs a controlled migration connection and review of in-flight sends; do not overwrite a live database as a test.

Before inviting anyone else: review commercial hosting eligibility, privacy/retention/support, verified sender domain, free-tier capacity, security/load testing and delivery reconciliation. Vercel Hobby is for personal non-commercial use. This pilot is not a public commercial launch.

## References

- [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Resend email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests)
- [Telegram Bot API](https://core.telegram.org/bots/api#setwebhook)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
