# Daily Update

Working project name. Planning baseline: September 11, 2026.

Daily Update will monitor the internet for relevant developments in five topics, send subscribers a verified Telegram brief, publish an explanatory article, and deliver an optional end-of-day email connecting the day's updates to those articles.

**Status: planning and initial source validation. There is no runnable application yet. MVP/testing service budget: $0.**

## Agreed experience

1. Select one or more of five topics.
2. Start and connect the Telegram bot to receive relevant updates.
3. Optionally verify an email address for the daily digest.
4. Receive a concise Telegram alert after a development is detected and verified, with its original source.
5. Read the full article when published; the existing Telegram message gains an article link where editing succeeds.
6. Receive one end-of-day email, grouped by selected topics and linked to published articles. Skip empty digests.

Content is discovered through source monitoring and general web search, not a packaged news feed. WhatsApp is deferred.

## Repository map

```text
Daily Update/
├── AGENTS.md
├── README.md
├── .gitignore
└── docs/
    ├── PRODUCT.md
    ├── REQUIREMENTS.md
    ├── ARCHITECTURE.md
    ├── SOURCE_MONITORING_PLAN.md
    ├── TASKS.md
    ├── FREE_MVP_PLAN.md
    ├── research/
    │   ├── T07_SOURCE_VALIDATION.md
    │   └── T07_SOURCE_OBSERVATIONS.json
    ├── design/
    │   ├── BRAND.md
    │   └── DESIGN_SYSTEM.md
    └── engineering/
        └── CODING_STANDARDS.md
```

The existing `.agents/` directory and `skills-lock.json` are local tooling configuration, not application implementation.

## Reading guide

| Document | Purpose |
| --- | --- |
| [Free MVP plan](docs/FREE_MVP_PLAN.md) | $0 testing defaults, free-quota controls and future live-budget gate |
| [T07 source validation](docs/research/T07_SOURCE_VALIDATION.md) | Six observed endpoints, parsing findings, access notes and limitations |
| [Product](docs/PRODUCT.md) | Audience, scope, topic proposal, roadmap, validation, and open decisions |
| [Project task list](docs/TASKS.md) | End-to-end MVP backlog, dependencies, acceptance criteria, requirement coverage and future work |
| [Task 1: source-monitoring plan](docs/SOURCE_MONITORING_PLAN.md) | Five topic boundaries, 28 source candidates, alert rubric, polling, costs, and next experiment |
| [Requirements](docs/REQUIREMENTS.md) | Observable behavior, acceptance criteria, and release gates |
| [Architecture](docs/ARCHITECTURE.md) | Pipeline, data model, integrations, delivery reliability, and cost controls |
| [Brand](docs/design/BRAND.md) | Positioning, editorial voice, and trust principles |
| [Design system](docs/design/DESIGN_SYSTEM.md) | Proposed visual tokens, page structure, components, and accessibility |
| [Coding standards](docs/engineering/CODING_STANDARDS.md) | Implementation conventions, security boundaries, and meaningful testing |
| [Agent instructions](AGENTS.md) | Repository-wide instructions for future coding work |

## How implementation will start

### Contribution workflow

The initial documentation setup may be committed directly to `main`. All subsequent changes must use a separate branch and pull request. The repository owner reviews and merges PRs; agents must not push directly to `main`, merge PRs, or enable auto-merge. This applies to documentation as well as application code.

Implementation begins with a discovery experiment and one complete story flowing through a private test environment. It does not begin by automating public publication at scale.

| Phase | Deliverable | Exit condition |
| --- | --- | --- |
| 0. Resolve scope and access | Final topic labels, pilot audience, source list, provider trial, budget cap | Five topics configured; source access checked; pilot spending limit recorded |
| 1. Prove discovery | Monitoring and search experiment with human-scored results | Measure detection delay, duplicates, relevance, coverage gaps, and cost |
| 2. Build one vertical slice | Evidence → reviewed brief → test Telegram → reviewed article → test digest | One event completes the sequence with linked IDs and recoverable failures |
| 3. Complete the MVP | Five topics, subscription preferences, bot controls, review desk, timezone digests | All P0 acceptance criteria pass |
| 4. Run a private pilot | Small invited cohort over 7–14 days | Review quality, user feedback, delivery failures, reviewer workload, and costs |
| 5. Launch gradually | Production domain, monitored delivery, editorial coverage, operational runbook | Launch gates passed and public launch authorized |

Phase durations depend on provider access, editorial capacity, and pilot findings. They are not delivery commitments. Detailed work and launch decisions are in [PRODUCT.md](docs/PRODUCT.md).

## Proposed technical baseline

TypeScript, Next.js, local PostgreSQL and a local worker for testing, with the official Telegram Bot API and local email capture. Hosted services remain optional later candidates under the [free MVP plan](docs/FREE_MVP_PLAN.md). Search and LLM providers will be selected using a small evaluation; none is purchased or integrated. A separate crawling worker is conditional on source needs, not a day-one dependency.

There are no install, development, migration, or test commands yet. Add verified commands when the application scaffold exists. Testing must remain within $0 incremental service spend. Local capture does not prove real email delivery; full live hosting and delivery require a later measured budget decision.
