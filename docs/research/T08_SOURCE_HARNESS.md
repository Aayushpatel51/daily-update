# T08: Bounded source harness results

September 13, 2026. Status: ready for PR review. Prerequisite [PR #3](https://github.com/Aayushpatel51/daily-update/pull/3) merged at 03:38:21 UTC. No paid APIs, real messages or public publishing were used.

Implementation and reproducible commands: [experiment README](../../experiments/source-monitor/README.md). Sources and access limitations: [T07](T07_SOURCE_VALIDATION.md). Free-service constraint: [free MVP plan](../FREE_MVP_PLAN.md).

## Live observations

| Source | First observation UTC | Initial HTTP / records | Repeat observation UTC | Repeat result |
| --- | --- | --- | --- | --- |
| S07 GitHub | 2026-09-13T03:45:16.381Z | 200 / 10 | 2026-09-13T03:45:57.776Z | 304; unchanged; zero candidates |
| S12 CISA KEV | 2026-09-13T03:45:17.054Z | 200 / 1,709 | 2026-09-13T03:45:58.000Z | 304; unchanged; zero candidates |
| S14 Google Cloud | 2026-09-13T03:45:18.576Z | 200 / 30 daily bundles | 2026-09-13T03:45:59.938Z | 200; identical hash; zero candidates |

First runs seeded baselines without reporting historical entries as new. SHA-256 hashes matched the earlier T07 evidence for all three sources. These are two observations per source, not an uptime or latency benchmark. Google did not return 304 on the observed repeat; we verified content-based suppression instead.

## Automated verification

17 offline tests pass, covering:

- Three parser formats, silent initial baseline and unchanged repetitions.
- New and updated record candidates, retained rolling-feed history, XML content attributes, stable KEV key ordering and changed mitigation fields.
- Missing/invalid dates, malformed/hostile XML, size/depth limits, duplicate records, empty feeds and schema failures.
- Exact destination allowlist, private/reserved/mixed DNS rejection, address pinning at the exchange boundary, redirect revalidation and loop cap.
- Conditional headers, unexpected 304, HTTP 429 without retry amplification, wrong MIME, global timeout and abort signal.
- Streaming size enforcement, compression rejection, truncated data, invalid UTF-8 and stream errors.
- Restart persistence, corrupt cursor rejection, state preservation after parse/network errors and exclusive lock recovery after ordinary failure.

Strict project type checking and formatting checks pass. Synthetic demo produces baseline then unchanged for every source. Runtime bodies and cursor files are excluded from Git; committed fixtures are fictional and labelled.

## Acceptance boundary

T08 establishes a reproducible bounded diagnostic. It does not implement the source scheduler, broad search, LLM drafting, review notifications, article publication, Telegram or email. HTML candidates remain disabled; Google daily-bundle splitting, production source permissions/retention and semantic event deduplication remain later work. The archived XML dependency and skipped dependency declaration checking are documented for T12 reevaluation.

PR #4 holds the accepted product defaults and editor-notification decisions and remains separate. T09 depends on those T04 decisions being merged; T10 also needs scoped free access. Do not mark those tasks complete based on this harness.
