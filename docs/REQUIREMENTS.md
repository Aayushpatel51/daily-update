# Requirements and acceptance criteria

Baseline: September 11, 2026. P0 means required for the first public version. Numerical operating targets below are proposed pilot settings, not service guarantees.

## 1. Roles and access

- Visitor: browse published topics and articles without authentication.
- Subscriber: manage their own topics and delivery preferences; email is optional.
- Editor/admin: review evidence, approve briefs and articles, manage sources, corrections, and failed jobs.
- Worker: use narrow server-side credentials for background processing. Never expose worker capabilities to readers or model output.

## 2. P0 functional requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| TOP-01 | Five selectable topics | Exactly five active launch topics; at least one required for active delivery; no free-text topic creation |
| SUB-01 | Independent channel opt-in | Telegram can be active without email; email can be active without Telegram; activating one does not authorize the other |
| SUB-02 | Safe Telegram connection | A user starts the bot; linking uses a short-lived, single-use opaque token; no existing account can be claimed using an identifier alone |
| SUB-03 | Verified email | Unverified addresses receive only the requested verification flow, not digests; verification expires and is rate-limited |
| SUB-04 | Preferences | Subscriber can change topics, timezone, Telegram quiet hours, all/major-only alert preference, and channel status |
| SUB-05 | Stop and deletion | Pause/unsubscribe prevents queued sends at dispatch; deletion removes or anonymizes personal records according to the published retention policy |
| SRC-01 | Source registry | Each enabled source has owner/domain, topics, retrieval method, access notes, check interval, health, and last-success state |
| SRC-02 | Shared discovery | Scheduled source checks and topic searches run once per configured scope rather than once per subscriber |
| SRC-03 | Evidence preservation | Each candidate stores source URL, retrieved time, observed text permitted for retention, and publication time when known; unknown dates remain unknown |
| EVT-01 | Event grouping | Repeated URL/content and multiple reports of one event map to one canonical event; editors can merge or split mistaken groups |
| EVT-02 | Meaningful-change detection | Recycled stories and cosmetic page changes are suppressed; a substantive update gets a new revision, not a duplicate event by default |
| EDT-01 | Grounded drafts | Every material claim has linked evidence; unsupported claims are removed or held; invalid structured model output cannot be published |
| EDT-02 | Brief approval | Editor can inspect sources, edit, approve, reject, or hold the initial brief independently of article approval |
| TG-01 | Initial brief first | Approved brief is released to the Telegram outbox before full article publication; it includes headline, short explanation, evidence status, and original source |
| TG-02 | Relevant delivery | Match active selected topics and alert preference; one multi-topic event creates one initial delivery per recipient |
| TG-03 | Bot controls | Support /start, /topics, /settings, /pause, /resume, /stop, and /help with clear outcomes; /stop disables Telegram only |
| TG-04 | Quiet hours | Hold messages during the subscriber's quiet interval; send one catch-up summary afterward if several accumulated; explicitly paused delivery has no automatic backlog replay |
| WEB-01 | Published articles | Each approved event article has a stable URL, title, brief, explanation, sources, topic tags, evidence status, published time, and updated time |
| WEB-02 | Browse and discover | Home, five topic feeds, article pages, and date-based archive navigation work on mobile and desktop; empty and failed states are clear |
| WEB-03 | Enrich original Telegram message | Successful initial sends store message IDs; after publication, edit the original to add the article link; edit failure does not send a second ordinary alert |
| COR-01 | Corrections | Article keeps a visible correction note; misleading prior alerts are edited where possible; material corrections can be separately approved for affected recipients |
| MAIL-01 | Daily digest | At most one ordinary digest per subscriber per local date; group selected-topic stories, include a brief and published article link, and deduplicate cross-topic events |
| MAIL-02 | Time and eligibility | Use the subscriber's confirmed IANA timezone and configured cutoff; no eligible items means no email |
| MAIL-03 | Delivery controls | Include working unsubscribe and preferences links; process verified bounce/complaint events; suppressed recipients are excluded even from existing queues |
| OPS-01 | Traceability | An operator can trace source → evidence → event/revision → approvals → Telegram attempts → article → digest entries |
| OPS-02 | Failure recovery | Transient failures retry with limits; permanent failures suppress or enter review; duplicate callbacks do not duplicate state transitions |
| OPS-03 | Safety switches | Admin can disable ingestion, AI generation, article publishing, Telegram dispatch, or email dispatch independently |
| OPS-04 | Budget | MVP/testing paid-service caps are $0; paid routes disabled; reserve and cap free usage including concurrent retries; exhaustion stops calls and raises an internal alert; live spending requires explicit approval |

## 3. Publishing and timing semantics

### Telegram and article order

1. Candidate is verified and a brief revision is approved.
2. Transaction records a brief release and creates eligible Telegram delivery intents.
3. Telegram gets dispatch priority; article drafting then begins independently of remaining recipient fanout.
4. Article is reviewed and published after the brief release. A failed recipient or Telegram outage does not block the website indefinitely.
5. Successful earlier Telegram messages are edited with the article link. If the article exists when a delayed initial message sends, include the link immediately.

This guarantees the product workflow order, not the arrival order on every device. If there are no Telegram recipients, record a no-recipient release and continue. Never fabricate a successful send.

### Digest cutoff

- Proposed daily cutoff is 21:00 local time, configurable before launch. Show the coverage interval, not an inaccurate midnight-to-midnight promise.
- Select approved, published articles that became digest-eligible since the previous successful digest cutoff, match current topics, and were not already included for that subscriber.
- First digest begins from email activation; selecting a new topic applies prospectively. Explicit catch-up is a later feature.
- Stories after today's cutoff belong to the next digest. A previously alerted story whose article is unfinished remains pending and enters the next eligible digest once published, with its original event date.
- A failed digest does not mark its entries sent. Build retries from the same immutable item snapshot; do not silently substitute new items.
- At the next local-date window, reconcile or supersede an unresolved ordinary digest before creating another. No burst of accumulated daily emails.
- Timezone changes affect future scheduling; sent article identities remain excluded. Resolve daylight-saving gaps/overlaps deterministically and maintain one logical digest per local date.
- Unsubscribe, deletion, and suppression always override a previously prepared send.

## 4. Content contracts

### Initial brief

Proposed editorial length: 60–120 words plus links, shortened when the evidence warrants less. Required: plain headline, what happened, practical relevance, original source, and an honest evidence label. No invented launch names, dates, prices, or numbers. The announcement example in the original conversation is illustrative, not a verified news record.

### Article

Required sections: summary; what changed; availability or affected audience where applicable; why it matters; limitations/unknowns; sources. Use attribution for vendor claims. Length follows the evidence; no padded minimum. Keep speculative analysis separate. Store editorial approval and version history internally.

### Digest

Required: coverage date/interval, relevant topic headings, distinct story titles, short briefs, website article links, and subscription controls. Assign multi-topic stories to one relevant section with additional tags. Never send a broken or unpublished article link. Material corrections can be included without treating them as ordinary duplicate news.

## 5. P0 quality and security requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| SEC-01 | Authorization | Readers cannot query other subscribers or editorial data; all admin mutations are checked server-side |
| SEC-02 | Untrusted retrieval | Reject private/loopback/link-local destinations including redirects; enforce response size/time limits; sanitize source and generated markup |
| SEC-03 | Model isolation | Page text cannot trigger tools, expose secrets, change prompts, approve publishing, or select arbitrary notification recipients |
| SEC-04 | Webhook verification | Validate Telegram secret header and email-provider signatures; reject unauthorized payloads; replay-safe handling |
| SEC-05 | Secret protection | No secrets or personal delivery identifiers in repository, client bundle, URLs used for analytics, or routine logs |
| SEC-06 | Abuse resistance | Rate-limit signups, verification, linking, and preference endpoints; protect authenticated mutations; use opaque expiring tokens |
| REL-01 | Honest delivery state | Distinguish queued, provider-accepted, confirmed-delivered where available, failed, suppressed, and ambiguous outcomes |
| REL-02 | Durable intent | Database changes and associated delivery intents commit together; unique business keys prevent duplicate enqueues |
| ACC-01 | Accessibility | Keyboard navigation, visible focus, labeled forms, semantic headings, text status labels, readable contrast, and reduced-motion support |
| PERF-01 | Public reading | Serve published content from cache/server rendering; article requests do not trigger research or generation |
| DATA-01 | Privacy | Collect only needed identity/preferences; document retention, deletion, and support before public launch |

## 6. Pilot operating targets

- Start with approximately 20–30 reviewed sources across five topics, adjusted to observed coverage gaps.
- Proposed polling: priority sources every 2–5 minutes where allowed; other sources 15–30 minutes; wider searches 15–60 minutes depending on budget.
- Target provider acceptance within two minutes of brief approval for the small pilot under normal conditions; measure p50/p95 and failures. This excludes discovery, editorial wait, quiet hours, and outages.
- Target article publication within 60 minutes of brief release during staffed hours; aging work appears in the review desk. Do not publish weak text to satisfy this target.
- No intentional duplicate initial alerts; zero known unsupported material claims at release.
- Alert operators on stopped source checks, growing queues, repeated failures, missed digest schedules, and budget limits.

## 7. Release gates

- Core journey works using all five configured topics and two independently consented channels.
- Replay a duplicate source result, job, Telegram callback, and email callback without duplicating ordinary sends.
- Exercise a crash around provider submission; expose uncertain outcome instead of claiming exactly-once delivery.
- Verify Telegram blocking, rate limiting, pause/stop, unsubscribe after queueing, and email complaint suppression.
- Exercise quiet hours crossing midnight, a DST transition, timezone changes, empty days, unpublished articles, and next-day carry-forward.
- Confirm source attribution, a material correction, event merge, article version history, and draft access restrictions.
- Configure authenticated email sending, unsubscribe, backups, spend limits, reviewer coverage, and a documented incident owner.
- Verify responsive public pages and subscription controls with keyboard and mobile viewport checks.
- Live public publishing and external subscriber messaging begin only within the user's authorized launch scope.

## 8. Deferred requirements

WhatsApp, web push, native apps, paid tiers, multilingual editions, custom niches, interactive research chat, generated creator scripts, and automatic public approval are outside the first release.
