# Confirmed MVP decisions

Confirmed by the owner on September 13, 2026. These decisions override earlier provisional defaults and cost estimates. They define planned behavior; no application or notification service is running yet.

| Decision | Accepted value |
| --- | --- |
| Name | Daily Update for the MVP; domain purchase deferred |
| Topics | AI (`ai`), Coding & Developer Tools (`coding`), Cybersecurity & IT (`it-security`), Consumer Technology (`consumer-tech`), Tech Business (`tech-business`) |
| Coverage | English, global technology news; explain India availability where relevant; Tech Business covers technology companies |
| Research | Owner-assisted research and drafting using the existing Plus subscription; evidence reviewed before approval; local-model evaluation later |
| Editorial owner | Repository owner reviews upon receiving a notification; no fixed response-time or 24/7 promise |
| Delivery sequence | Verified and approved Telegram brief, separately approved website article, eligible end-of-day email |
| Digest | 21:00 in the subscriber's confirmed IANA timezone; preselect Asia/Kolkata; skip empty days |
| Test environment | Existing local computer; monitoring pauses while asleep/offline; local email preview initially |
| Budget | $0 additional service spend for MVP/testing; existing subscription use only within its allowance; live spending needs a later explicit decision |
| Review workflow | Separate branches and PRs; owner reviews and merges |

## Editor notification contract

Send a private Telegram notification when a filtered candidate first needs research/review. It links to the authenticated review queue and clearly says the candidate is unverified. This notification must work before AI drafting, so the manual research workflow can begin. The owner supplies/reviews evidence and a brief, then approves the exact revision in the review interface.

After brief release, the article task enters the queue. In manual mode the queue offers an explicit article-preparation task; it must not claim an unwritten draft is ready. Notify separately when an article draft is submitted for review. The owner reviews it before publication. Draft saves do not create repeated notifications; each notification is keyed by editor, event, stage and revision.

Editor notifications are distinct from subscriber news alerts. They go only to the configured editor allowlist, contain minimal candidate metadata and no private evidence excerpts, and never grant approval privileges. Opening a link cannot publish or approve anything. Server-side editor authorization and current-revision checks apply to every approval. Untrusted source text cannot choose recipients or review URLs.

Delivery failures remain visible in the queue with bounded retries and explicit ambiguous outcomes. No automatic approval or public send occurs because a notification was accepted, missed or timed out. Persist review tasks while the owner is unavailable. Measure observation-to-review separately from approval-to-dispatch.

## Local review access

A localhost review URL is usable on the development computer, not automatically on a phone. Initial Telegram review links are intended to be opened on that computer. Phone access needs a separately configured authenticated HTTPS endpoint; do not expose the local admin server or create an unauthenticated tunnel just to make links work.

Bot credentials and the owner's verified Telegram connection are still needed during integration. Store them outside Git. This decision establishes the feature, not a completed connection or permission to send messages to arbitrary recipients.

## Remaining stage gates

T04 is ready for review. T06 is only partly decided: the initial editor is known, but retention/deletion, support ownership and operating policies remain unresolved before a real pilot. T05 still needs scoped free credentials. T07 and T08 are merged in PR #3 and PR #5 respectively. Search/model/worker evaluation precedes application stack selection under T12. No paid service or public launch is authorized by these defaults.
