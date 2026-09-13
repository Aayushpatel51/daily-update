# Product plan

Baseline: September 11, 2026. Related: [requirements](REQUIREMENTS.md), [architecture](ARCHITECTURE.md).

## 1. Purpose

Help people notice relevant developments early and understand them without repeatedly searching the internet. Serve both professionals keeping up with their field and creators looking for timely, source-backed subjects.

The product is a curated monitoring and publishing service. Its usefulness depends on finding meaningful changes, explaining them accurately, and matching delivery to expressed interests.

## 2. Decisions and assumptions

### Decided with the user

- Exactly five topics at launch; readers select from those topics.
- Collect evidence through internet research, general web search, and direct monitoring rather than a packaged news API.
- Telegram brief first, website article afterward, end-of-day email last.
- Telegram alerts contain a short explanation; articles provide more context.
- Email groups the day's relevant updates by topic and links to the articles.
- $0 incremental service spend for MVP development/testing; minimize measured live costs later. Follow the [free MVP plan](FREE_MVP_PLAN.md). WhatsApp remains deferred.
- Create the planning foundation before application code.

### Confirmed operating defaults

Accepted September 13, 2026; see [MVP decisions](MVP_DECISIONS.md) for the initial manual research workflow and editor notifications.

- MVP name: Daily Update. Domain purchase is deferred.
- Initial audience: English-reading technology professionals, learners, and creators.
- Coverage: global technology developments, with explicit regional availability where relevant. Mention India availability where relevant.
- The owner reviews initial briefs and articles separately, prompted by private Telegram review notifications. Pending tasks remain queued while the owner is unavailable.
- Email cutoff: 21:00 in each subscriber's selected IANA timezone. The UI displays and allows confirmation of the timezone; 21:00 is the accepted default; preselect Asia/Kolkata and require subscriber confirmation.
- Telegram delivers all newly approved, meaningful events matching selected topics; users can pause, set quiet hours, or choose a major-only filter.
- Public articles are accessible without an account. Telegram-only use must not require an email address.

### Confirmed five topics

| Stable key | Display name | Include | Boundary |
| --- | --- | --- | --- |
| ai | AI | Models, applications, important research, AI policy | Label research and vendor claims accurately |
| coding | Coding & Developer Tools | Languages, frameworks, libraries, coding tools | Focus on practical developer impact |
| it-security | Cybersecurity & IT | Security, cloud, infrastructure, enterprise IT | Avoid turning every minor advisory into an alert |
| consumer-tech | Consumer Technology | Devices, apps, consumer platforms | Distinguish announcement from actual availability |
| tech-business | Tech Business | Funding, acquisitions, strategy, leadership, workforce | Initially technology companies, not all industries |

Topic names and keys are accepted for the MVP. AI coding tools may have multiple tags, but remain one event and one notification per subscriber. Broader corporate coverage requires a scope decision.

The [Task 1 source-monitoring plan](SOURCE_MONITORING_PLAN.md) supplies the concrete topic boundaries, 28-source shortlist, proposed alert rubric, polling intervals and cost envelope for owner review. It does not represent a completed connector benchmark or approved spending.

## 3. Reader journeys

### Subscribe

Browse a topic or article → choose topics → connect Telegram → confirm preferences in the bot → optionally subscribe to email → confirm email and timezone. Each channel has separate consent and status.

Telegram onboarding can also begin in the bot. Users can choose topics there and later link a verified email. Public reading is independent of subscription.

### Discover and understand

Receive a verified brief with the primary source → read the initial facts → the same message is enriched with the published article link → read the article's context, caveats, and sources. Do not send another alert solely because the article became available.

### Catch up

At the daily cutoff, receive a digest of eligible published stories for selected topics. Deduplicate stories across topics. Include late-published stories in the next eligible digest with an appropriate date label. Empty digests are skipped.

### Control delivery

Change topics, pause Telegram, configure quiet hours, unsubscribe from email, or delete the subscription. Stopping one channel does not silently stop the other.

## 4. Editorial product

An alert-worthy development must be new, relevant to a launch topic, sufficiently supported, and meaningful beyond a cosmetic change or recycled coverage.

- New article URL does not imply a new event.
- One official announcement may establish that something was announced; independent confirmation is required for stronger claims when appropriate.
- Several copies of one press release are one evidence origin.
- Speculative performance, commercial success, and creator angles must not be written as facts.
- The initial alert can be short. It must not wait for a long article, but cannot skip verification.
- Every alerted event gets an article task. If it cannot be published, retain a clear internal reason and consider a correction where the alert was misleading.
- Material corrections must be visible on the article and reach affected recipients where necessary.
- There is no minimum daily story quota. A quiet day is valid.

## 5. MVP scope

### Included

- Five topic feeds, individual articles, source references, and public archive navigation.
- Topic selection, Telegram connection, bot commands, quiet hours, and pause/resume.
- Optional verified email subscription and timezone-based daily digests.
- Shared source monitoring, scheduled web discovery, evidence extraction, event grouping, and structured LLM drafts.
- Internal source registry and editorial review queue with brief and article approvals.
- Delivery history, retries, suppression, corrections, budget controls, and basic operational metrics.

### Deferred

- WhatsApp, native mobile apps, browser push, custom user-created topics, and additional fields.
- General-purpose chat, autonomous publishing, audio, multilingual output, paid plans, advertising, and creator script generation.
- Personalized article rewriting, recommendation models, broad social-platform scraping, and a proprietary web search index.
- A separate headless CMS, vector database service, or distributed microservice platform without measured need.

## 6. Implementation sequence

The [complete task list](TASKS.md) breaks these phases into reviewable tasks, links their dependencies, and maps every P0 requirement to implementation work. It distinguishes completed planning from unstarted application work.

| Phase | Work | Evidence needed before advancing |
| --- | --- | --- |
| 0: Scope | Confirm topic labels, audience/geography, brand/domain, budget, and reviewer availability; audit 20–30 candidate sources across five topics | Approved configuration and source access notes; no paid commitments assumed |
| 1: Discovery experiment | Trial direct monitoring and one or two search candidates; record detected and missed developments | 7 days of observations where practical; timestamp provenance; human relevance labels; spend per useful event |
| 2: Vertical slice | Scaffold app and database; ingest one source; review one event; send to sandbox Telegram; publish preview article; send sandbox digest | Correct sequence; event traceability; a forced failure recovers without intentional duplicate delivery |
| 3: MVP | Add remaining source coverage, subscriptions, topic feeds, review desk, scheduling, corrections, and delivery controls | P0 requirements demonstrated; accessibility and permissions reviewed |
| 4: Private pilot | Invite roughly 15–25 consenting readers for 7–14 days; operate with editorial review | Measured relevance, repeat use, failures, review latency, opt-outs, and cost; resolve serious factual issues |
| 5: Launch | Configure production domain and authentication, backups, provider limits, support, deletion, and incident controls | Operational release gates met; user authorizes public launch |

Implementation should deliver working slices rather than complete each channel in isolation. Do not claim phase 1's limited source benchmark proves internet-wide coverage.

## 7. Pilot measurements

| Measure | Definition |
| --- | --- |
| Discovery delay | Source publication to first observation, only where the publication timestamp is trustworthy |
| Review delay | First observation to editorial approval |
| Dispatch delay | Approval to provider acceptance; distinguish acceptance from actual delivery |
| Article delay | Brief release to article publication |
| Relevance | Human and reader assessment of whether the event belongs in the selected topic |
| Duplicate rate | Repeated alerts for the same substantive event per recipient |
| Coverage gaps | Important events missed within the monitored benchmark, manually recorded |
| Cost | Search, retrieval, inference, infrastructure, email, and editorial time separately |
| Usefulness | Voluntary feedback, article visits, returning readers, pauses, and unsubscribes |

Avoid using email opens as the sole engagement signal. Pilot targets for speed and relevance should be recorded before measurement; they are not guarantees or market benchmarks.

## 8. Budget and launch decisions

MVP development/testing daily and monthly paid-service caps are $0. Use the local-first [free MVP plan](FREE_MVP_PLAN.md); paid trials and fallback are disabled. Full live spending requires a later explicit budget decision. Monitor shared sources and topics, not each subscriber separately. Reduce broad discovery frequency before sacrificing evidence verification when approaching the budget.

Open decisions: domain/sender setup before real distribution; source access permissions; automated search/model and live hosting; future live monetary budget; retention policy, support responsibility and operating jurisdiction. The accepted defaults and $0 additional testing cap in [MVP decisions](MVP_DECISIONS.md) override earlier budget estimates. These can be resolved in their dependent phase without blocking unrelated local work.

## 9. Key risks

| Risk | Product response |
| --- | --- |
| Fast alerts contain errors | Evidence-backed briefs, review, uncertainty labels, visible corrections |
| Review is not staffed continuously | State operating coverage honestly; measure review delay; do not promise 24/7 immediate alerts |
| Excess notifications | Meaningful-event threshold, topic matching, quiet hours, pause, optional major-only preference |
| Search misses a launch | Direct monitoring plus broader search; expand registry from observed gaps |
| Articles lag alerts | Dedicated article queue, aging alerts, next-digest carry-forward |
| Provider costs grow | Shared work, caching, per-provider budgets, bounded retries |
| Delivery fails | Independent channel status, retry/suppression rules, website remains the public archive |

Future expansion should reuse the event and subscription model while introducing domain-specific sources and editorial expertise.
