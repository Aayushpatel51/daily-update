# Free MVP and testing plan

Decision: September 13, 2026. The owner requires **$0 incremental third-party service spend for MVP development and testing**, with minimal measured cost when a full live launch is considered. This supersedes earlier paid pilot allowances. It does not authorize paid trials, purchases, public deployment or real subscriber messages.

## Default development profile

| Component | $0 approach | Practical limit |
| --- | --- | --- |
| App and database | Run the app and PostgreSQL on the existing computer | Existing hardware/internet assumed; electricity and human time are separate; no always-on availability |
| Monitoring and jobs | Local bounded worker, shared source polling, database outbox | Stops while the computer sleeps or is offline; process failures require recovery |
| Source discovery | Direct public feeds/pages where permitted; manual general-web discovery initially | Limited coverage; source access remains subject to review |
| Automated search | Optional genuine no-card free quota, disabled until scoped credentials and limits are verified | Stop at quota; no paid fallback, top-up or automatic upgrade |
| Drafting | Human-authored drafts and synthetic fixtures first; evaluate a local model if hardware and license fit | Fixtures test workflow, not research quality; autonomous drafting is not proven until evaluated |
| Telegram | Standard free Bot API, sandbox allowlist; local long polling can avoid public webhook hosting during tests | Bot setup and consented test recipients needed; rate limits apply; no paid broadcasts |
| Website | Local preview and local article archive | Public access and production hosting remain a later decision |
| Email | Capture rendered HTML/plain-text messages locally | Does not prove inbox delivery, domain authentication, bounces or complaints; actual sandbox sending remains a release prerequisite |
| CI and storage | Local checks first; use hosted free allowance only when verified for this repository | No paid runners, artifacts, storage or overage |

These are the development defaults. Supabase, Inngest, Resend and hosted models remain optional later candidates, not required paid dependencies. Keep provider boundaries replaceable and preserve the PostgreSQL/outbox design. Do not change production acceptance criteria just because local capture is cheaper.

## Free search experiment

[Tavily pricing](https://www.tavily.com/pricing) lists 1,000 monthly free credits with no credit card required, checked September 13, 2026. No account or API key has been configured here. Verify the actual account allowance and [credit rules](https://docs.tavily.com/documentation/api-credits) before use.

Proposed bounded trial: five topics × two basic one-credit searches/day × seven days = 70 credits. Set an overall 100-credit experiment cap including follow-ups/retries, and reserve usage before dispatch. Disable advanced search and extraction unless their full credit cost fits the remaining cap. Monthly use must stay below the verified remaining free allowance. Do not run the former hourly schedule on a 1,000-credit allowance: five hourly queries over 30 days would be 3,600 searches before follow-ups.

If free access is unavailable or exhausted, pause automated search and use manually recorded discovery. Do not silently reduce evidence standards. Manual comparison is not an automated search benchmark. Hosted model trial credits that expire are not the default MVP dependency.

## Spending controls and acceptance

- Daily and monthly paid-service budgets are both $0. Paid routes are disabled by default, even if credentials exist.
- Each external adapter must know its free quota, expiry/reset behavior and overage policy before activation. Unknown billing behavior means disabled.
- Reserve expected usage atomically across concurrent jobs, bound retries, and stop before the free cap. A local ledger alone cannot prevent another application consuming a shared account quota; prefer isolated credentials/accounts and provider-side hard limits.
- No credit card enrollment, domain purchase, plan upgrade or paid fallback without a new explicit budget decision.
- T44 must test exhausted quotas, concurrent requests, retry accounting and rejection of paid configuration. Earlier integrations must implement their own limits before external calls; T44 is the full audit, not the first protection.
- Complete local workflow tests for $0; mark real Telegram/email delivery and cloud operation unverified until separately exercised with authorized free test access. T23/T47 cannot pass using email capture alone.

## Minimal-cost live path

Before an invited pilot or full launch, measure useful events, search credits, model tokens or local compute load, database/storage growth, emails, queue time and editorial hours. Reuse research per event across all readers, avoid model calls for unchanged pages, batch polling, bound evidence/output size and skip empty digests.

Use only the smallest deployment that meets measured uptime, authentication, backup and delivery requirements. Compare a single modest worker/app host with managed free tiers using current prices at T12/T50. [Supabase Free](https://supabase.com/pricing), for example, has capacity limits and inactivity pausing; it is not an unconditional production availability solution. Telegram's [standard bot limits](https://core.telegram.org/bots/faq) constrain free fanout.

The live budget remains **unapproved**. Present the owner a concrete monthly estimate, hard cap and upgrade trigger from pilot usage before enabling paid infrastructure. There is no promised fixed live price and no requirement to buy the earlier $100–120 stack. A domain/sender setup may be a real cost if none is already owned; do not buy one to unblock testing.
