# Bounded source experiment (T08)

An isolated TypeScript CLI for three structured public sources. This is not the application, scheduler or a publishing service. It makes no search/model API calls and sends no messages. Default demo/test commands are offline and use explicitly synthetic fixtures.

## Setup and offline checks

Run from the repository root with Node 24 (tested on 24.20.0) and npm:

```sh
npm ci --prefix experiments/source-monitor --ignore-scripts
npm --prefix experiments/source-monitor run check
npm --prefix experiments/source-monitor test
npm --prefix experiments/source-monitor run format:check
npm --prefix experiments/source-monitor run demo
```

Dependencies are pinned in the experiment's package-lock.json. Native Node TypeScript execution avoids a build step; `tsc` checks strict project types separately. This does not choose the future web application's dependencies.

`demo` parses one synthetic fixture for each format, establishes a baseline and repeats it. Output is JSON lines marked `synthetic: true`, with zero candidates. Tests additionally exercise new/updated records and failures. To save an offline report:

```sh
mkdir -p tmp/source-monitor
npm --silent --prefix experiments/source-monitor run demo > tmp/source-monitor/synthetic-demo.jsonl
```

## Optional single live probe

First review current source access guidance in [T07](../../docs/research/T07_SOURCE_VALIDATION.md). Each invocation is one operator-initiated experiment, not permission to schedule crawling or retain publisher text. The flag acknowledges this check; it does not establish legal rights or override a block.

```sh
npm --prefix experiments/source-monitor run probe -- S07 --acknowledge-access-review
npm --prefix experiments/source-monitor run probe -- S12 --acknowledge-access-review
npm --prefix experiments/source-monitor run probe -- S14 --acknowledge-access-review
```

- S07: GitHub Changelog RSS.
- S12: CISA KEV JSON catalog.
- S14: Google Cloud release notes Atom, using its canonical docs.cloud.google.com endpoint.

No arbitrary URL argument is supported. The runtime state directory is repository-root `tmp/source-monitor/`, already ignored by Git. Keep it private and local; do not point other applications at it. A successful first fetch seeds a baseline with **no candidates**. Later runs return hashed record IDs marked `new` or `updated`; these are source-level changes requiring review, not verified news. Only hashes, validators and minimal metadata persist, not full source bodies or article text.

Source record IDs are remembered even after they disappear from a rolling feed. Up to 50,000 identities per source are retained, then the experiment fails closed rather than silently forgetting history. CISA changes use CVE IDs and sorted record fields. XML uses stable item/entry IDs and content trees including attributes; feed metadata and inter-tag whitespace do not trigger changes. Other cosmetic changes can still be candidates; semantic novelty and cross-source event grouping belong to T27.

Google's daily entry is deliberately labelled `daily-bundle`. A changed bundle needs product/release splitting in a later connector and must never directly become a subscriber alert. Publisher timestamps are retained with their stated offset; missing dates stay unknown, timezone-less timestamps fail. A source timestamp is not evidence of minute-level publication precision or detection latency.

## Fetch and failure boundaries

- HTTPS on a fixed exact URL allowlist; no credentials, alternate ports or arbitrary paths. Only the recorded Google feed endpoints may redirect between one another.
- Resolve IPv4 addresses for every hop, reject any non-unicast answer, then pin a validated address in the request lookup. TLS still verifies the original hostname. IPv6-only sources are unsupported; proxy configuration is not used.
- One 20-second deadline includes DNS, all redirects and transfer; at most three redirects. A timed-out OS DNS request may finish in the background but cannot dispatch an HTTP request afterward.
- Limit headers to 16 KiB and body to 3 MiB; request identity encoding and reject compressed responses. Check streaming byte counts, declared length, MIME and UTF-8 decoding.
- Reject XML DTDs, malformed XML, unexpected roots, duplicate IDs, excessive depth/nodes and empty feeds. Limit records to 10,000. A feed that genuinely becomes empty requires operator inspection; it cannot erase the baseline.
- Conditional requests use saved ETag/Last-Modified only for the exact resource. Unexpected 304 fails. Successful parsing must complete before a new cursor is saved by atomic rename.
- No automatic retries. HTTP errors, including 429, return a nonzero exit and leave the cursor untouched. Respect the source's rate-limit guidance before manually trying again; this CLI does not schedule Retry-After recovery.
- Per-source lock directories prevent concurrent cursor writes. Ordinary failures release the lock. After a process kill, verify no run remains active before manually removing its `.lock` directory. Corrupt state fails rather than resetting. Back up state before repair; deleting it deliberately starts a fresh silent baseline.

JSON stdout is a diagnostic report, not a durable event queue. A process crash after cursor save but before stdout delivery can lose that report; this is acceptable only for this experiment. Production must transactionally store candidate/revision records alongside cursors before notification work (T17–T20). Atomic rename is not a tested power-loss backup or multi-machine lock.

## Validation and remaining limitations

See [T08 results](../../docs/research/T08_SOURCE_HARNESS.md). Offline tests exercise parser/state behavior, injected DNS/transport failures and the same streaming body reader used live. They do not establish internet-wide SSRF coverage, every TLS/network failure, robots/terms approval, seven-day reliability or semantic news quality.

`saxes` 6.0.0 is a strict XML parser whose upstream is archived. It is contained to this experiment with DTD/depth/body limits; reassess maintenance and alternatives at T12 before production reuse. Its declarations are incompatible with the installed TypeScript's dependency checks, so `skipLibCheck` is enabled; strict checking remains enabled for all experiment code. The dependency audit at installation reported no vulnerabilities, which is not a security guarantee.

References: [Node HTTPS](https://nodejs.org/api/https.html), [saxes behavior and limits](https://github.com/lddubeau/saxes), [ipaddr.js ranges](https://github.com/whitequark/ipaddr.js).
