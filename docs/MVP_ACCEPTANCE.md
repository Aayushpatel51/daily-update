# Local MVP acceptance

September 14, 2026. The owner requested one complete local MVP pull request after merging the earlier planning and source-experiment PRs. This authorizes application implementation and consolidates the local implementation work from the backlog; it does not authorize public launch or mark all production requirements complete.

| Area | Implemented for local testing | Remaining release work |
| --- | --- | --- |
| Discovery | Three structured source adapters, source registry, baseline/change tracking, manual source-linked JSON research import, candidate review notices | Validate access continuously; broader five-topic coverage, scheduled web search, semantic grouping and measured discovery evaluation |
| Editorial | Revision-checked brief approval, separate article review/publication, hold/reject/reopen, unreleased duplicate merge, audit history, recorded corrections/retractions | Rich claim-level evidence, split tooling, material correction notification policy and notification reconciliation |
| Reader website | Exactly five topics, public articles, evidence, dates, archive, sitemap, responsive layout | Broader accessibility/browser review and deployment metadata |
| Subscription | Independent Telegram/email consent, hashed single-use links, preferences, quiet hours, major filter, pause/resume, unsubscribe/delete, email access recovery | Public abuse protection, hosted identity management and privacy/retention policy review |
| Telegram | Local previews; optional private allowlisted Bot API adapter; link edits, combined quiet catch-up, classified errors and bounded 429 retries | Actual bot/device test, message edit edge cases, operator reconciliation and scale/load testing |
| Daily email | Verification/access captures, 21:00 IANA timezone scheduling, HTML links and plain text, immutable topic-deduplicated digest snapshots, no empty editions | Real provider, authenticated domain, bounce/complaint processing, one-click unsubscribe headers and deliverability testing |
| Reliability | PostgreSQL transactions and durable outbox, worker/advisory locks, crash ambiguity handling, stage switches, health timestamps, private backup and isolated restore check | Production migrations, disaster-recovery drill, monitoring/alerting, retention and multi-instance deployment |
| Budget | Local runtime; no paid search, model, email, hosting or broadcast calls | Measured pilot costs and explicit budget before live services |

## Verification recorded

- 15 domain, mocked-provider and database workflow tests pass, covering approval ordering, stale revisions, deduplication, quiet-hour consolidation, subscription suppression, account recovery, corrections and crash ambiguity.
- Three browser tests exercise reader/mobile navigation and access boundaries, editor release-to-publication, and subscriber connection/pause/delete.
- Type checking, formatting and production build are required before submitting this PR.
- A real local JSON snapshot was restored into a separate PostgreSQL database with seven stories; credentials and sessions were not exposed or committed.
- Browser layout is inspected locally. Tests use synthetic content, not fabricated current news.

The complete local test journey is in [LOCAL_TESTING.md](LOCAL_TESTING.md). Real Telegram delivery, real email delivery, hosted operation, comprehensive coverage and zero-delay notification have not been demonstrated. The original backlog and requirements remain the broader release target; this matrix records the narrower evidence for this testable version.

## Implementation map

Next.js routes and React forms are under `src/app` and `src/components`. Domain modules, SQL schema and replaceable adapters are under `src/lib`; executable setup/database/worker/backup scripts are under `scripts`. `tests` contains domain and PostgreSQL scenarios; `e2e` contains browser acceptance tests. The existing source-monitor experiment supplies bounded retrieval and parsers.

The local schema combines canonical events, briefs and articles in `stories`, with JSON evidence and append-only `revisions`. Subscription channel state and topic activation times are in `subscribers`; hashed sessions and expiring links are separate. `outbox` records durable delivery intents and immutable captured content; `digests` records edition snapshots. `sources`, `settings`, `telegram_updates` and `rate_limits` support operations. This is a deliberately smaller schema than the proposed production model in ARCHITECTURE.md.

Worker processing commits the submission intent before external I/O. An interrupted in-flight request becomes ambiguous, because database uniqueness cannot guarantee exactly-once external messaging. Article publication is independent of whether every queued Telegram recipient has been reached; the approved brief intent is committed first. The adapter re-renders delayed briefs with the current article link. Evidence and articles remain plain text, never executable model HTML.
