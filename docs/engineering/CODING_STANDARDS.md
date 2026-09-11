# Coding standards

Status: intended conventions for future implementation, September 11, 2026. No application code or executable commands exist yet.

## 1. General approach

- Use TypeScript with strict checking for the proposed Node/Next.js stack.
- Prefer clear functions and domain modules over frameworks for autonomous agents or premature service separation.
- Keep provider integrations replaceable. Domain logic should operate on validated records rather than vendor response shapes.
- Use meaningful names: event, evidence, brief, article, subscription, delivery, digest. Avoid conflating source documents with published articles.
- Preserve the sequence and scope in [PRODUCT.md](../PRODUCT.md) and acceptance criteria in [REQUIREMENTS.md](../REQUIREMENTS.md).

## 2. Repository conventions

- After the initial documentation setup, branch from the current remote `main`, commit changes on a separate branch, and open a pull request. The user reviews and merges it. Do not push directly to `main`, merge PRs, or enable auto-merge. Documentation changes follow the same workflow.
- Keep UI routing, domain behavior, provider adapters, and job entry points separate as described in [ARCHITECTURE.md](../ARCHITECTURE.md).
- Use one package manager and commit its lockfile. Select supported runtime/library versions during scaffolding rather than inventing versions in documentation.
- Include actual setup and verification commands in README only after they work.
- Add a safe `.env.example` with variable names and non-secret explanations when environment configuration exists. Never include real credentials.
- Do not add sample current news as factual seed content; mark fixtures as synthetic or preserve source/date attribution for approved recorded examples.

## 3. Types and validation

- Validate all external input at boundaries: HTTP, webhooks, feeds, provider responses, database JSON, and model output.
- Represent editorial, subscription, and delivery states with explicit discriminated types; do not use loosely related booleans.
- Avoid `any`, unchecked casts, or swallowing parse failures. Unknown data stays `unknown` until validated.
- Use explicit UTC timestamps and IANA timezone strings. Do not use the server's local timezone to decide digest dates.
- Treat monetary amounts and estimated usage explicitly with units/currency; avoid floating-point assumptions in billing-related arithmetic.

## 4. Database and concurrency

- Use versioned migrations and database constraints for identities, relationships, and business uniqueness.
- Commit editorial state changes and delivery intents in one transaction.
- Lease jobs with expiration and concurrency protection. A stale worker cannot overwrite a later approval or delivery outcome.
- Preserve event revisions, approval versions, and digest snapshots. Do not mutate already-sent content history invisibly.
- Keep queries bounded and indexed for topic feeds, due digests, source checks, and delivery queues.
- Enforce access rules server-side and at the database boundary where applicable. A hidden admin button is not authorization.

## 5. External I/O and retries

- Every external request has a timeout, response-size cap where applicable, and classified failure behavior.
- Retry transient failures with bounded exponential backoff and jitter; respect `Retry-After`.
- Do not retry invalid credentials, explicit opt-outs, permanent recipient errors, or ambiguous message sends blindly.
- Use transactional outbox keys, provider idempotency where supported, and deduplicated webhook events. Document that external exactly-once delivery is not guaranteed.
- Recheck subscription and suppression immediately before dispatch.
- Track queued, accepted, delivered where evidenced, ambiguous, failed, and suppressed separately.
- Keep publication available if one notification channel fails; do not couple website availability to Telegram fanout completion.

## 6. Retrieval and AI

- Protect outbound retrieval against SSRF, unsafe redirects, decompression bombs, oversized responses, and unbounded browser execution.
- Respect source access and retention policies. Store only content needed and permitted for evidence and processing.
- Separate instructions from retrieved text; source content cannot invoke tools or change destinations.
- Require structured model output with evidence references; reject malformed or unsupported material.
- Version prompts and record model identity, token usage, and evaluation outcomes. Never record secrets in prompt logs.
- Treat model confidence as a heuristic, not factual verification. Keep initial editorial approval explicit.
- Do not allow model-generated HTML, SQL, URLs, or code to execute without purpose-specific validation; sanitize rendered text.

## 7. Security and privacy

- Keep secrets in server-managed environment configuration; never in public-prefixed variables.
- Verify webhook authenticity and prevent replay effects.
- Use cryptographically random, short-lived, single-use linking tokens stored hashed. Bind tokens to their specific purpose.
- Prove control of both identities before linking an existing email subscriber and Telegram account.
- Rate-limit subscription, verification, linking, and account recovery; avoid revealing whether an email exists.
- Redact personal addresses, chat IDs, source credentials, and tokens from logs and error reports.
- Prevent cross-user preference access, draft leakage, unsafe redirects, and CSRF on authenticated actions.
- Deletion and opt-out must invalidate pending deliveries; preserve only explicitly justified minimum audit/suppression information.

## 8. Frontend and content

- Follow [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) and [BRAND.md](../design/BRAND.md).
- Prefer server-rendered/cacheable public content; use client state only for interactions that need it.
- Use semantic HTML, visible focus, labeled inputs, accessible validation, and clear loading/empty/error states.
- Never render raw scraped HTML. Escape Telegram formatting and generate safe email markup.
- Keep public UI free of internal workflow IDs, provider jargon, and unsupported promises.
- Changes to metadata, canonical links, dates, and correction notes must preserve truthful publication history.

## 9. Testing strategy

Test meaningful behavior and failure boundaries rather than implementation details.

| Level | Required examples |
| --- | --- |
| Unit/domain | Novelty/grouping fixtures, topic matching, preference eligibility, digest cutoff/DST rules, evidence schema validation |
| Database/integration | Outbox uniqueness, atomic release, concurrent leases, event merge, draft permissions, deletion/suppression |
| Provider contract | Telegram webhook verification, rate-limit response, edit behavior, ambiguous send; email callbacks and idempotency |
| End-to-end | Select topics → start sandbox bot → approved brief → preview article → enriched message → daily test digest |
| Operational scenarios | Unsubscribe while queued, delayed article, duplicate job, failed digest crossing dates, quiet hours, source outage, budget stop |

Use recorded/synthetic fixtures and test clocks for repeatable tests. External provider tests use explicit sandbox recipients and credentials; they do not run as uncontrolled public sends in CI. Never equate a mock passing with live deliverability verification.

During scaffolding, establish formatting, lint, typecheck, unit/integration checks, and production build scripts. Add browser tests for critical flows when those flows exist. Do not invent successful test results or executable commands in advance.

## 10. Observability and release

- Log structured internal IDs, state transitions, durations, and classified failures. Keep full content and personal data out of routine logs.
- Measure source discovery separately from review, generation, publication, and dispatch latency.
- Expose stuck queues, stale sources, correction counts, and provider budget use to operators.
- Maintain channel-specific kill switches, a tested backup/restore process, and migration recovery procedures before production.
- Separate development/staging/production destinations and tokens. Default nonproduction sending to a sandbox allowlist.
- Complete relevant tests, check the final diff, and describe changes, validation, and limitations. Update docs when behavior or provider choices change.

## 11. Definition of done

A change is complete when its applicable acceptance criteria pass, errors and access boundaries are handled, relevant checks run successfully, documentation reflects actual behavior, and no secrets or unintended artifacts are included. Public deployment and subscriber communication require the user's launch authorization; ordinary authorized local development does not require repeated approval.
