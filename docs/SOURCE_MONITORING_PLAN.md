# Task 1: topics and source-monitoring plan

Research date: September 11, 2026. Status: ready for owner review through a PR. This is a documentation proposal, not an operating monitor, completed benchmark, or authorization to spend.

## 1. Recommended scope

Keep the five topic keys already proposed in [PRODUCT.md](PRODUCT.md). This document supplies the boundaries and concrete source shortlist for review. Merging this plan can establish the topic baseline; until then the names remain proposed.

| Key / topic | Include | Exclude or hold | Example routing, not real news |
| --- | --- | --- | --- |
| ai / AI | Model releases, availability, meaningful capability changes, significant research and AI policy | Routine prompt tips; unverified benchmark superiority; every new paper | A coding-model launch: primary AI, secondary Coding |
| coding / Coding & Developer Tools | Languages, frameworks, libraries, IDEs, developer platforms, breaking changes and deprecations | Cosmetic patches, tutorials without a new development | A framework security patch: primary IT/Security, secondary Coding |
| it-security / Cybersecurity & IT | Exploited vulnerabilities, significant patches, cloud/platform changes, enterprise infrastructure | Every CVE; unsupported breach claims; routine regional service expansions | A cloud service retirement: primary IT/Security |
| consumer-tech / Consumer Technology | Devices, consumer apps/platforms, meaningful releases and availability changes | Deals, affiliate roundups, speculative leaks, lifestyle stories | A new phone with an AI feature: primary Consumer Technology unless the AI change is independently substantial |
| tech-business / Tech Business | Technology-company acquisitions, funding, earnings, strategy, leadership and workforce decisions | Stock-price commentary, trading advice, unrelated industries | Acquisition announcement: primary Tech Business; closing later is a revision |

One event can have multiple tags, but each subscriber receives one initial alert. Choose the primary topic from the event's principal consequence, not its publisher. Evidence-backed facts about an announcement do not establish the truth of its promotional claims.

Audience assumption: English-language global technology coverage, with regional availability stated explicitly. This list is weighted toward US/global vendors; it is not adequate for an India-specific corporate-news promise. Local business/regulatory sources would require a separate coverage review.

## 2. Research method and limits

Opened the 28 entry points below with the web research tool and reviewed source identity, available content, and visible feed/API indications. These were page-level research checks, not direct runtime HTTP tests. A readable page does not prove a stable parser, permitted automated access, or reliable timestamps.

Status legend:

- **Page:** entry point returned readable page content. Proposed retrieval still needs a connector test.
- **Feed shown:** publisher page advertises a feed. Feed parsing, URL resolution, update latency and access terms remain untested.
- **API documented:** official documentation describes structured access; actual endpoint requests remain untested.
- **Limited:** page returned little useful content; keep disabled until an alternative works.
- **Search/manual:** use as a research lead initially; do not enable publisher crawling without an access review.

All automated connectors start disabled. Before enabling each one, record its exact endpoint, applicable access/retention terms, robots guidance, a successful bounded fetch, timestamp behavior, and parser fixture. Respect a restriction or failure rather than bypassing it. Public accessibility and RSS availability are not blanket republication licenses.

## 3. Initial shortlist: 28 distinct sources

Intervals are proposed polling settings after access review, not publisher-supported SLAs. HTML means compare only relevant listing links/content, then fetch newly discovered pages; never diff the entire navigation/footer. Source identifiers are stable planning IDs.

### AI: six sources

| ID | Source / evidence entry point | Role and proposed method | Base interval | Research status / remaining check |
| --- | --- | --- | --- | --- |
| S01 | [OpenAI News](https://openai.com/news/) | Official announcements; HTML listing discovery | 5 min | Page; test listing completeness and article extraction |
| S02 | [Anthropic News](https://www.anthropic.com/news) | Official announcements; HTML listing discovery | 5 min | Page; validate dated item links and extraction |
| S03 | [Google DeepMind](https://deepmind.google/blog/) | Official AI research/releases; HTML listing | 5 min | Page; older `/discover/blog/` entry redirects here |
| S04 | [Hugging Face Blog](https://huggingface.co/blog) | Ecosystem/model announcements; HTML and author classification | 30 min | Page; distinguish company and community claims |
| S05 | [Meta AI Blog](https://ai.meta.com/blog/) | Official research/model announcements; HTML | 30 min | Page; test extraction and availability details |
| S06 | [Mistral News](https://mistral.ai/news/) | Official model/product announcements; HTML | 30 min | Page; canonical trailing-slash redirect observed |

### Coding: five sources

| ID | Source / evidence entry point | Role and proposed method | Base interval | Research status / remaining check |
| --- | --- | --- | --- | --- |
| S07 | [GitHub Changelog](https://github.blog/changelog/) | Releases/deprecations; publisher-linked RSS preferred | 15 min | Feed shown; feed retrieval through research tool failed, so endpoint/parser unverified |
| S08 | [Node.js Blog](https://nodejs.org/en/blog) | Runtime release/security announcements; HTML | 30 min | Page; distinguish stable, current, LTS and prerelease |
| S09 | [React Blog](https://react.dev/blog) | Framework announcements; HTML | 60 min | Page; low cadence, no need for five-minute polling |
| S10 | [TypeScript Blog](https://devblogs.microsoft.com/typescript/) | Compiler/language releases; HTML | 60 min | Page; distinguish beta, RC and stable |
| S11 | [Python Downloads](https://www.python.org/downloads/) | Release index and linked notes; HTML version comparison | 60 min | Page; prerelease/status filtering required |

### Cybersecurity and IT: five sources

| ID | Source / evidence entry point | Role and proposed method | Base interval | Research status / remaining check |
| --- | --- | --- | --- | --- |
| S12 | [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | Exploitation evidence; publisher-linked JSON/CSV diff | 15 min | API/download documented; validate feed and distinguish date added from disclosure date |
| S13 | [AWS What's New](https://aws.amazon.com/new/) | Cloud announcements; listing/feed discovery | 15 min | Page; narrow products and exclude routine low-impact changes |
| S14 | [Google Cloud Release Notes](https://cloud.google.com/release-notes) | Cloud changes; publisher-linked feed preferred | 15 min | Feed shown; research-tool feed retrieval failed; parser unverified |
| S15 | [Microsoft Security Update Guide](https://msrc.microsoft.com/update-guide) | Vendor security evidence; evaluate supported structured access | 30 min | Limited; do not assume HTML parsing works; search/manual until validated |
| S16 | [Cloudflare Blog](https://blog.cloudflare.com/) | Infrastructure/security announcements; HTML listing | 30 min | Page; separate product claims, incidents, and tutorials |

### Consumer Technology: five sources

| ID | Source / evidence entry point | Role and proposed method | Base interval | Research status / remaining check |
| --- | --- | --- | --- | --- |
| S17 | [Apple Newsroom](https://www.apple.com/newsroom/) | Official device/software announcements; test alternate publisher feed/listing | 30 min | Limited in research extraction; disabled pending retrieval test |
| S18 | [Google Products](https://blog.google/products-and-platforms/products/) | Consumer platform updates; publisher-linked RSS discovery | 30 min | Feed shown; filter tutorials and distinguish rollout regions |
| S19 | [Samsung Global Newsroom](https://news.samsung.com/global/) | Device/software announcements; HTML listing | 30 min | Page; filter lifestyle content and label regional availability |
| S20 | [Windows Blog](https://blogs.windows.com/) | OS/platform changes; HTML listing | 60 min | Page; distinguish Insider builds from general release |
| S21 | [Mozilla Blog](https://blog.mozilla.org/en/) | Browser/platform announcements; HTML listing | 60 min | Page; exclude advocacy/general essays without a new event |

### Tech Business: five sources

| ID | Source / evidence entry point | Role and proposed method | Base interval | Research status / remaining check |
| --- | --- | --- | --- | --- |
| S22 | [Microsoft Investor Relations](https://www.microsoft.com/en-us/investor/default) | Earnings and official corporate statements; linked announcement pages | 60 min | Page; compare announcements, not live stock widgets |
| S23 | [NVIDIA Investor Relations](https://investor.nvidia.com/home/default.aspx) | Results and corporate announcements; publisher-linked RSS | 60 min | Feed shown; validate feed and earnings-period labels |
| S24 | [Alphabet Investor Relations](https://abc.xyz/investor/) | Results and corporate updates; linked announcement pages | 60 min | Limited dynamic listing; test news/results subpages before activation |
| S25 | [SEC EDGAR API documentation](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | Primary filings; submissions API for explicitly selected issuers | 60 min | API documented; choose/verify CIKs, identify client, respect fair access; no whole-market polling |
| S26 | [FTC press releases](https://www.ftc.gov/news-events/news/press-releases) | Regulatory actions affecting tech; filtered HTML listing | 60 min | Page; allegations/orders/settlements require distinct wording |

EDGAR is a primary filing interface, not an aggregated news API. See [SEC developer resources](https://www.sec.gov/about/developer-resources) for access guidance. Start with Microsoft, NVIDIA and Alphabet issuer records, verifying identifiers before requests. Multiple issuer requests count separately in the load budget.

### Independent reporting: two shared sources

| ID | Source | Proposed use | Status |
| --- | --- | --- | --- |
| S27 | [TechCrunch](https://techcrunch.com/) | Startup coverage; search/manual discovery | Search/manual; access review pending |
| S28 | [Ars Technica](https://arstechnica.com/) | Technical context and independent reporting; search/manual discovery | Search/manual; access review pending |

These two shared sources are not five additional topic feeds or proof of independent verification for every story. Search should also discover reporting outside this shortlist. Trace syndication back to its origin; a copied press release does not provide a second independent source.

## 4. Scheduling and reliability

Recommend direct monitoring for speed and one shared broad query per topic every hour for coverage discovery. This is a lower-cost refinement of the earlier 15–60-minute search range; use faster search only after measured gaps justify it.

- Start the connector experiment with S07, S12 and S14, then one HTML source per remaining topic. Feed/API failures are findings to fix, not reasons to assume success.
- Begin with each validated connector's table interval. Add 10% jitter and one in-flight request per domain. Respect stricter publisher guidance.
- Temporarily shorten an allowed source to five minutes around a scheduled event, with a two-hour expiry and a recorded reason. No unbounded high-frequency mode.
- On 429 respect Retry-After; on repeated errors back off and surface source health. On blocked access disable and use a permitted alternative.
- Retain a per-source cursor and overlap discovery windows by 24 hours; refresh changes to known stories separately. Do not flood subscribers with old stories when a connector starts.
- Cache unchanged documents; invoke models only after cheap novelty filters. Polling frequency does not imply content-generation frequency.
- Track publication, first observation, approval, dispatch and article-publication times separately. Unknown source timestamps cannot produce a defensible discovery-delay metric.
- Human review means low detection latency is not a promise of immediate delivery outside staffed hours.

The table represents 1,968 base requests/day if all 26 direct sources become usable and EDGAR checks three issuers separately; independent sources add no direct polling. This excludes article fetches, retries and event-time boosts. Approximately 59,040 monthly checks already make a one-workflow-per-check design unsuitable for assuming a 50,000-execution free allowance. Measure step/run accounting; use bounded batches, lower polling, or a separately budgeted worker.

## 5. Shared search recipes

Use one query per topic per hour, rotating between its event types. Queries are examples to test, not confirmed provider-specific syntax. Use documented date/language parameters, retrieve original pages, and retain query/result timestamps.

| Topic | Example natural-language query | Rotate coverage toward |
| --- | --- | --- |
| AI | new AI model release API availability announcement | Model launches, tools, policy, significant research |
| Coding | developer tool framework language release deprecation | Languages, frameworks, IDEs, breaking changes |
| IT/Security | actively exploited vulnerability cloud service retirement announcement | Security, cloud GA, incidents and retirements |
| Consumer | new device app operating system launch availability | Devices, applications, platforms, region changes |
| Tech Business | technology company acquisition funding earnings announcement | Startups, earnings, leadership and regulation |

Do not force all queries to known domains: that would remove the discovery benefit. Use a small number of targeted follow-up searches only for promising uncertain events. Budget them separately. Provider date filters assist discovery but do not establish that an event itself is new.

## 6. What deserves an alert

All gates must pass before scoring: selected topic relevance; a substantive new fact; retrievable evidence; no existing equivalent event/revision; editor approval of wording. Rumors and missing evidence stay held regardless of popularity. No story quota.

Proposed reviewer rubric, not an automated truth score:

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Impact | Cosmetic | Useful to a subset | Broad or high-consequence |
| Actionability | No meaningful implication | Worth understanding | Changes a near-term decision/action |
| Novelty | Repetition | Material extension | New launch, finding, or decision |

Recommend standard alert at 4–6 points after gates pass. Major-only subscribers receive 5–6 with impact=2. Scores 0–3 remain research records unless the editor documents a justified override; scores never bypass evidence. Separate approved material-correction notifications can override ordinary novelty scoring.

| Hypothetical case | Decision |
| --- | --- |
| Official new model with confirmed API availability | Alert; attribute performance claims and verify access scope |
| Reposted model launch from last month | Suppress as duplicate/stale |
| Vendor says its benchmark is best | Report only the attributed claim if the event otherwise qualifies; do not assert independent superiority |
| Framework release with a migration requirement | Alert to Coding; explain affected versions |
| New KEV entry affecting widely used software | Alert with affected product and official mitigation reference; do not invent an exploit timeline |
| Unverified layoff screenshot | Hold; seek attributable evidence |
| Acquisition announced, not completed | Alert using 'announced'; later completion is a material revision |
| Full article becomes available after its brief | Edit original Telegram message; no second routine alert |

Publish the article after the brief release; eligible published articles enter the daily email. No change to the agreed channel order or unpublished-article carry-forward rule.

## 7. Provider comparison and cost model

Prices below were checked on September 11, 2026. USD, before tax. They are research inputs, not purchase authorization or measured invoices.

| Candidate | Verified pricing/capability | Recommendation |
| --- | --- | --- |
| [Perplexity Search](https://docs.perplexity.ai/docs/getting-started/pricing) | $5 per 1,000 successful search requests; up to five queries in a request; search endpoint has no token charge | Paid pilot candidate; compare results and batched-query behavior |
| [Tavily](https://www.tavily.com/pricing) | 1,000 free credits/month; pay-as-you-go $0.008/credit | Good bounded no-cost trial; [basic search costs one credit](https://docs.tavily.com/documentation/api-reference/endpoint/search), advanced uses more |
| [Exa](https://exa.ai/docs/reference/livecrawling-contents) | Supports configurable content freshness | Reserve candidate if the first two have retrieval gaps; no Exa cost included here |

Hourly five-topic discovery over 30 days is 3,600 queries. Perplexity: $18 unbatched, or $3.60 if one five-query request per hour is suitable. Tavily basic: $28.80 gross at pay-as-you-go, before any applicable free allowance; advanced mode and extraction cost extra. These numbers cover discovery only, not model-written briefs or articles. Do not assume all accounts can combine free credits and paid plans in the same way.

For a seven-day trial, two runs per topic per day produce 70 queries/provider; 70 Tavily basic credits or $0.35 unbatched Perplexity search. This sparse comparison tests relevance and extraction, not minute-level freshness. After it, test hourly discovery plus monitored sources for seven days to evaluate latency and misses (840 queries/provider unbatched, before follow-ups).

### Monthly pilot planning envelope

Assume 25 subscribers, at most ten approved events/day, 30 days, shared hourly searches and daily email. Allowances are spending targets to validate, not quoted vendor prices.

| Component | Planning amount | Basis / constraint |
| --- | --- | --- |
| Search plus follow-ups | $25 | $18 unbatched base leaves $7 for bounded verification; batching may save more |
| LLM generation/classification | $15 allowance | No model chosen; constrain token volume and evaluate actual rates before enabling |
| Web and retrieval worker | $20 allowance | Hosting provider not selected; exclude unrestricted browser crawling |
| Database | $25 | [Supabase Pro starts at $25/month](https://supabase.com/pricing); free is possible for a limited experiment, with different limits |
| Email | $0–20 allowance | 750 ordinary emails/month plus verification; validate newsletter eligibility/product and quota with [Resend](https://resend.com/pricing) |
| Scheduler | $0 conditional | [Inngest Hobby lists 50k executions/month; Pro starts at $99](https://www.inngest.com/pricing). Base per-source workflow design would exceed free quota |
| Telegram API | $0 platform allowance | Use [standard bot limits](https://core.telegram.org/bots/faq), not paid broadcasts; worker costs counted above |
| Contingency | $15 | Meter retries, retrieval, storage and unexpected usage |
| Total | $100–120/month conditional envelope | Excludes taxes, domain registration and human editorial labor; not approved spending |

If Inngest Pro is needed, the envelope becomes $199–219 before other changes; redesign polling or revise the budget rather than silently upgrading. Free credits are a trial aid, not the steady-state cost model.

LLM accounting example: cap 100 candidate classifications/day at 1,000 input + 100 output tokens each; cap ten approved events/day at 8,000 input + 1,500 output across brief/article drafting. That is 5.4M input and 0.75M output tokens/month before retries, extra evidence or embeddings. Cost = 5.4 × input rate/M + 0.75 × output rate/M. The $15 allowance is viable only if selected rates and measured workload fit it. Prioritize verification when reducing volume.

Editorial work is separate: even ten events/day at an illustrative ten review minutes/event requires about 50 hours/month, before rejected candidates and research. Reviewer coverage must be decided before promising timely service.

## 8. Next experiment and acceptance

Task 1 delivers this plan only. After owner feedback/merge, Task 2 should create a small connector experiment on a new branch, with no live subscriber messages.

1. Validate exact endpoints, access guidance and parsing for the first sources, recording failures explicitly.
2. Compare search providers on the same query/time sample. Keep result count and freshness settings comparable.
3. Build a manually labeled set of at least 30 events, with at least five per topic, including duplicates, old reports, regional releases and unverified claims. Historical examples test correctness, not historical detection speed.
4. For seven live days record retrieval success, false changes, missed benchmark events, timestamps, cost and reviewer effort. Do not populate the public website with test stories.
5. Report relevance/precision, duplicate rate, source health, p50/p95 delay where measurable, total calls/tokens and cost per useful event. Report sample size and gaps alongside metrics.
6. Choose one search provider and a feasible polling/worker configuration. Targets: no known unsupported claims in approved samples, no duplicate fixture alerts, and explicit disposition of every failed connector. Set numeric relevance/latency targets before the live test.

Owner review requested: five topic boundaries; global versus India emphasis; acceptable spending envelope; available review hours. None of the services have been purchased or configured by this task.
