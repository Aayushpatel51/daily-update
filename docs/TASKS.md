# Project task list

Baseline: September 11, 2026. This backlog covers the MVP from planning through launch and initial operation. Future features are separate. It does not authorize purchases, deployment, or live messaging.

Product sequence: **detect → verify → Telegram brief → website article → end-of-day email**. Exactly five selectable topics; shared research; no packaged news API; WhatsApp deferred.

## How to use this list

- Stable IDs let us refer to tasks in conversation, commits and PRs. The earlier “Task 1” source plan is T02 below.
- Status: **Done** = completed and merged; **Review** = prepared for this PR; **Planned** = not started; **Deferred** = outside MVP. No application work is complete yet.
- Dependencies identify prerequisites, not a demand to finish every earlier row. Independent work may proceed when its own prerequisites are met.
- Owner **Build** means implementation/research by the coding collaborator; **Owner** means the repository owner makes a product, access or launch decision; **Editor** means the designated human reviewer. The owner is the initial editor; support and retention policies remain to be decided.
- Normally one task produces one reviewable PR. Closely related tasks may share a PR; large tasks may use several small PRs. Record task IDs, validation, limitations and linked dependencies in each PR.
- Start each implementation branch from current remote `main` after its prerequisite changes are merged. Never merge PRs, enable auto-merge, or push directly to `main`; the owner reviews and merges.
- For completed work, update this list in the same PR and attach evidence. While its PR is open, mark it Review rather than Done. Confirm merge before promoting its status.
- Task order is not a delivery-date estimate. Provider access and live observation periods affect elapsed time.

## Milestones

| Milestone | Tasks | Exit condition |
| --- | --- | --- |
| Planning foundation | T01–T06 | Scope, operational decisions and budget recorded |
| Discovery validation | T07–T12 | Actual source/search observations support provider and monitoring choices |
| Design and foundations | T13–T19 | Approved flows and a safe, testable application foundation |
| One complete story | T20–T24 | A reviewed story passes through sandbox Telegram, preview article and test digest |
| Research and editorial MVP | T25–T29 | Five-topic research and correction workflows work with evidence |
| Subscribers and Telegram | T30–T34 | Independent consent and reliable, controllable alerts |
| Website and daily email | T35–T40 | Public reading and timezone-aware daily digests meet requirements |
| Hardening and release readiness | T41–T47 | Security, recovery, operations and acceptance checks pass |
| Pilot, launch and operation | T48–T52 | Pilot findings addressed, owner authorizes launch, service is monitored |

## A. Planning and decisions

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T01 | Establish repository and planning documents | Build | — | Done | Nine foundation files committed; initial setup is on main; PR-only workflow recorded |
| T02 | Define topic boundaries and source plan | Build | T01 | Done | [PR #1](https://github.com/Aayushpatel51/daily-update/pull/1) merged; 28 candidates, monitoring methods, alert rubric and conditional costs documented; connectors not validated |
| T03 | Create complete project backlog | Build | T02 | Done | [PR #2](https://github.com/Aayushpatel51/daily-update/pull/2) merged; this task list has dependencies, completion criteria, requirement coverage and deferred scope |
| T04 | Record audience, topic and scheduling decisions | Owner | T02 | Review | [MVP decisions](MVP_DECISIONS.md): five topics/keys, English/global coverage, India availability, 21:00 confirmed-zone digest, local $0 testing and owner review notifications accepted |
| T05 | Set budget and grant scoped provider access | Owner | T02 | Planned | Daily/monthly paid caps are now $0 per [owner decision](FREE_MVP_PLAN.md); scoped free test access still pending; live budget unapproved; credentials stored outside Git; no purchase inferred from estimates |
| T06 | Define editorial coverage and data policies | Owner + Editor | T04 | Planned | Owner confirmed as notification-driven initial reviewer; still define support roles, coverage expectations, retention/deletion policy, evidence storage constraints and correction responsibility; document realistic alert expectations |

## B. Discovery experiments before the application

These tasks may use small isolated scripts and fixtures after implementation is requested. They do not require a public site or live subscribers.

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T07 | Validate first source endpoints and access | Build | T02 | Done | [PR #3](https://github.com/Aayushpatel51/daily-update/pull/3) merged; [Six-source observations and access limits](research/T07_SOURCE_VALIDATION.md) recorded; acceptance: test GitHub Changelog, CISA KEV and Google Cloud release notes; record exact endpoint, access notes, timestamps and failures; add one accessible candidate per remaining topic; do not bypass blocked sources |
| T08 | Build bounded source experiment harness | Build | T07 | Done | [PR #5](https://github.com/Aayushpatel51/daily-update/pull/5) merged; [Harness and verification](research/T08_SOURCE_HARNESS.md) ready; Reproducible fetch/parse runs with timeout, response cap, redirect checks, cursor/hash and fixture output; invalid or unchanged content does not become a new event |
| T09 | Create human-labeled evaluation examples | Build + Editor | T04, T07 | Planned | At least 30 examples, at least five per topic; include old reports, duplicates, unsupported claims, regional releases and material updates; expected decisions recorded |
| T10 | Compare search providers | Build | T05, T09 | Planned | Same queries, settings and observation times across bounded no-cost trials only; unavailable free access recorded as blocked; record relevance, original-source retrieval, calls and costs; no fabricated latency benchmark |
| T11 | Run seven-day discovery observation | Build + Editor | T06, T08, T10 | Planned | Record source health, independently noted missed benchmark events, false changes, publication/observation times and spending; distinguish detection from review delay |
| T12 | Select search, model, worker and infrastructure | Build + Owner | T05, T11 | Planned | Decision record compares quality/cost under the $0 testing cap, with local defaults and paid candidates deferred; evaluate model evidence adherence and structured output; resolve scheduler execution limits and hosting requirements; update ARCHITECTURE and actual budget |

## C. Design and engineering foundations

Design planning can proceed while discovery is measured. Do not delay the discovery experiment for visual polish.

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T13 | Choose public brand and domain direction | Owner + Build | T04 | Planned | Name, tone and visual direction decided; domain availability checked when relevant; purchasing remains separately authorized |
| T14 | Specify reader and editorial screen flows | Build | T04, T06 | Planned | Reviewable layouts for topic selection, bot connection, optional email, preferences, topic feed, article, source review and two approval queues; empty/error/paused states included |
| T15 | Refine design tokens and channel templates | Build | T13, T14 | Planned | Typography, spacing, contrast and responsive behavior documented; Telegram, article and HTML/plain-text digest examples visibly labeled as examples |
| T16 | Scaffold application and automated checks | Build | T12 | Planned | Supported runtime, one package manager/lockfile, strict types, lint, formatting, tests and build run; README contains verified setup commands; no live sends |
| T17 | Implement database model and migrations | Build | T16 | Planned | Events/revisions, evidence, topics, subscriptions, approvals, outbox and digest records have keys/constraints; local migration and rollback/recovery procedure demonstrated |
| T18 | Establish environments, configuration and access boundaries | Build | T05, T06, T17 | Planned | Separate test credentials, redacted logs, validated environment schema, sandbox recipient allowlist and server-side editor authorization; public reads cannot expose drafts or personal records |
| T19 | Implement durable jobs and delivery outbox | Build | T17, T18 | Planned | Atomic intents, unique keys, leases, bounded retry and explicit ambiguous outcomes; duplicate job execution does not intentionally duplicate delivery |

## D. One complete story before scaling

Use a synthetic or explicitly approved fixture and sandbox recipients. These tasks establish minimal working slices; later tasks add full product behavior.

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T20 | Store one source event with evidence and draft brief | Build | T08, T09, T18 | Planned | One source document maps to one event/revision; schema-valid draft refers to actual evidence; missing support causes a hold |
| T21 | Add minimal brief review and sandbox Telegram dispatch | Build | T19, T20 | Planned | Research-ready candidate notifies the allowlisted editor before drafting; authenticated editor approves an exact revision; release creates an outbox intent; sandbox send records message ID and original source; article not required beforehand |
| T22 | Draft, review and publish a preview article | Build | T15, T21 | Planned | Manual article-preparation task followed by separate draft-ready editor notification; stable preview article with sources/times; independent article approval; existing sandbox Telegram message receives article link without a second routine alert |
| T23 | Assemble and send one sandbox daily digest | Build | T22 | Planned | Verified sandbox recipient receives grouped summaries linked only to published preview articles; plain-text version and empty-digest behavior checked |
| T24 | Demonstrate the full slice and forced failures | Build | T23 | Planned | Trace evidence → brief → send → article → digest; replay jobs, interrupt a send, and delay article publication; record successes and limitations for review |

## E. Full research and editorial behavior

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T25 | Add reviewed source registry and five-topic connectors | Build | T24 | Planned | Enable validated sources only; registry records interval, access notes and health; every topic has useful coverage; unsupported candidates remain disabled |
| T26 | Add shared scheduled search and novelty filtering | Build | T12, T25 | Planned | Shared queries, overlapping windows, document hashes/cursors, backoff and domain limits; startup does not flood subscribers with historical items |
| T27 | Implement event grouping, revisions and topic routing | Build | T09, T26 | Planned | Duplicate/syndicated reports group into one event; substantive updates create revisions; editor merge/split preserves references and existing delivery history |
| T28 | Complete drafting and editorial review desk | Build + Editor | T14, T27 | Planned | Stage/revision-deduplicated editor notifications, failed-notification visibility and stale-approval protection; claims/evidence side by side; separate brief/article queues, alert rubric, approve/hold/reject actions, stale-work visibility and version-safe concurrent edits |
| T29 | Add correction and retraction workflow | Build + Editor | T28 | Planned | Visible article correction/history; affected earlier Telegram messages edited where possible; separately approved material correction delivery; daily digest can identify corrections |

## F. Subscribers and Telegram

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T30 | Implement subscription identity and independent consent | Build | T14, T18, T24 | Planned | Telegram-only and email-only journeys work; at least one of five topics selected for delivery; preferences are private; channel activation does not imply consent for another |
| T31 | Implement Telegram start/link and bot commands | Build | T21, T30 | Planned | Expiring single-use start token, verified webhook and replay-safe updates; /start, /topics, /settings, /pause, /resume, /stop and /help work; no account linking from an email string alone |
| T32 | Implement safe email verification and identity linking | Build | T23, T30 | Planned | Verification expires/is rate-limited; prove control before linking channels; no digest before email verification; no account enumeration |
| T33 | Implement alert selection, preferences and quiet hours | Build | T27, T31 | Planned | Selected topics and all/major-only preferences respected; one event once per recipient; overnight quiet hours produce controlled catch-up; pause/stop cancels pending sends and resume does not replay a backlog |
| T34 | Harden Telegram dispatch and article-link edits | Build | T22, T33 | Planned | Global/per-chat limits, Retry-After, blocked-recipient suppression and ambiguous sends handled; delayed send/edit race still includes article link; no replacement alert for ordinary edit failure |

## G. Public website and end-of-day email

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T35 | Build public home, five topic feeds and archives | Build | T15, T25 | Planned | Responsive server-rendered reading, pagination/date navigation, truthful empty/error states; multi-topic stories deduplicated in combined feed; no account wall |
| T36 | Complete public article pages and metadata | Build | T22, T29, T35 | Planned | Source links, evidence labels, separate publication/update times, correction notes, canonical URL, page metadata and published-only sitemap; no padded text or invented images |
| T37 | Build subscriber preferences and channel status UI | Build | T15, T31, T32 | Planned | Topic/timezone/quiet-hour controls plus connected, unverified, paused, stopped and suppressed states; opening Telegram is not mistaken for successful connection |
| T38 | Implement timezone scheduler and digest eligibility | Build | T19, T32, T36 | Planned | One ordinary digest per local date; confirmed IANA timezone, cutoff/DST rules, topic activation history and prior items respected; late articles carry forward; no unpublished links or empty sends |
| T39 | Implement digest rendering, retries and stale-run recovery | Build | T15, T38 | Planned | Immutable grouped snapshot, plain-text/HTML, bounded retries, provider idempotency where supported; failed sends do not advance successful watermark; no burst of stale editions |
| T40 | Complete unsubscribe, bounce and complaint handling | Build | T32, T39 | Planned | Signed/replay-safe callbacks, authenticated sending configuration, scoped unsubscribe without login, provider suppression and final eligibility check prevent queued sends after opt-out |

## H. Hardening and acceptance

These tasks broaden checks on existing behavior rather than postponing all security or testing until the end.

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T41 | Implement deletion and retention enforcement | Build | T06, T37, T40 | Planned | Deletion stops queued sends and removes/anonymizes records as specified; only justified suppression/audit data retained; executable retention checks and user-facing policy agree |
| T42 | Audit retrieval, generation and account security | Build | T28, T34, T40, T41 | Planned | Verify SSRF including redirects, markup sanitization, prompt-injection isolation, webhook auth, access controls, signup abuse controls, log redaction and secrets scanning; fix findings |
| T43 | Add operational dashboard and stop controls | Build | T28, T34, T39 | Planned | Source freshness, queue age, review delay, article delay, delivery state and errors visible; ingestion/generation/publication/channel stop switches independently exercised |
| T44 | Implement and test budget enforcement | Build | T05, T12, T26, T39 | Planned | $0 paid-route rejection and per-provider free quotas tested, including concurrent reservations and retries; stop before free limits; operators notified; no automatic plan upgrade |
| T45 | Verify backups, restore and incident procedures | Build | T41, T43 | Planned | Restore tested in isolated environment; migration recovery, credential rotation steps, provider outage and ambiguous-send procedures documented with responsible owner |
| T46 | Run accessibility, responsive and reading-performance checks | Build | T36, T37, T39 | Planned | Keyboard/focus/contrast/zoom and mobile flows pass; emails work with images blocked and in plain text; article reads never invoke research/generation; fix material regressions |
| T47 | Run full acceptance and failure regression suite | Build | T29, T34, T40, T42, T44, T45, T46 | Planned | Trace all P0 requirements to evidence; include duplicate callbacks, concurrent approval, unsubscribe while queued, midnight/DST, late articles, corrections and channel outage; report remaining gaps |

## I. Pilot, launch and operation

| ID | Task | Owner | Depends on | Status | Deliverable / acceptance |
| --- | --- | --- | --- | --- | --- |
| T48 | Prepare private pilot and its authorization | Owner + Build | T06, T47 | Planned | Owner approves pilot distribution/deployment scope; consenting invitees, domain/authentication, support and reviewer rota prepared; no unsolicited invites or real sends before authorization |
| T49 | Run 7–14-day invited pilot | Build + Editor | T48 | Planned | Approximately 15–25 consenting readers; record useful feedback, factual corrections, opt-outs, delays, failures, costs and editorial hours; no claim of comprehensive coverage |
| T50 | Address pilot feedback and release decision | Build + Owner | T49 | Planned | Fixes via review PRs, relevant regressions rerun, measured budget and review capacity accepted; explicit launch/no-launch decision with unresolved limitations |
| T51 | Deploy approved release and verify production | Build | T50 | Planned | Within owner-authorized scope, deploy exact reviewed revision, verify public reading and consented channel smoke tests; rollback/stop controls available; no direct merge to main |
| T52 | Review early operation and reprioritize backlog | Build + Owner | T51 | Planned | First-week operational review covers costs, source gaps, relevance, delivery and reviewer load; record fixes and future priorities; ongoing monitoring cadence/ownership decided explicitly |

## Requirement coverage

Each requirement in [REQUIREMENTS.md](REQUIREMENTS.md) has an implementation owner task below. T47 verifies the complete set; a mapping alone is not proof that a requirement passes.

| Requirement IDs | Primary task coverage |
| --- | --- |
| TOP-01 | T04, T17, T30, T35 |
| SUB-01 | T30 |
| SUB-02 | T31, T32 |
| SUB-03 | T32 |
| SUB-04 | T33, T37 |
| SUB-05 | T33, T40, T41 |
| SRC-01 | T07, T25 |
| SRC-02 | T26 |
| SRC-03 | T08, T20, T25 |
| EVT-01 | T27 |
| EVT-02 | T26, T27 |
| EDT-01 | T09, T12, T20, T28 |
| EDT-02 | T21, T28 |
| EDT-03 | T21, T22, T28 |
| TG-01 | T21, T24 |
| TG-02 | T33 |
| TG-03 | T31 |
| TG-04 | T33 |
| WEB-01 | T22, T36 |
| WEB-02 | T35 |
| WEB-03 | T22, T34 |
| COR-01 | T29 |
| MAIL-01 | T38, T39 |
| MAIL-02 | T38 |
| MAIL-03 | T40 |
| OPS-01 | T17, T43 |
| OPS-02 | T19, T34, T39, T45 |
| OPS-03 | T43 |
| OPS-04 | T44 |
| SEC-01 | T18, T42 |
| SEC-02 | T08, T42 |
| SEC-03 | T20, T28, T42 |
| SEC-04 | T31, T40, T42 |
| SEC-05 | T18, T42 |
| SEC-06 | T31, T32, T42 |
| REL-01 | T19, T34, T39 |
| REL-02 | T19 |
| ACC-01 | T15, T46 |
| PERF-01 | T35, T36, T46 |
| DATA-01 | T06, T41 |

## Future backlog — explicitly deferred

These are reconsideration candidates, not commitments. Each needs a product decision, cost/access review, and its own task breakdown after the MVP has evidence of usefulness.

| ID | Candidate | Revisit when |
| --- | --- | --- |
| F01 | WhatsApp delivery | Audience demand and platform permissions/costs justify it |
| F02 | Browser push or native app | Readers need another channel and delivery friction is measured |
| F03 | More fields or user-defined niches | Existing five-topic quality and editorial capacity are sustainable |
| F04 | Additional languages and regional editions | Audience demand, source coverage and language review are available |
| F05 | Creator research angles and scripts | Core facts are reliable; clearly separate suggested content from news |
| F06 | Audio editions | Users request listening and production costs are justified |
| F07 | Paid tiers or sponsorship | Retention and willingness to pay are demonstrated; editorial separation defined |
| F08 | Searchable personal catch-up and conversational research | Archive quality and explicit user needs justify retrieval complexity |
| F09 | More automated editorial approval | Evaluation shows acceptable risk, corrections are dependable and owner approves the policy |

## Immediate next actions

1. Owner reviews this task-list PR; no application coding is part of this change.
2. Next build task: T07, validate the first endpoints and access assumptions on a new branch after review/merge.
3. Resolve T04–T06 alongside independent endpoint checks; paid experiments and real delivery wait for their actual prerequisites.
4. Track each completed task with PR evidence and owner feedback. Do not silently start the whole backlog from a request to complete one task.
