# T07: Initial source validation

Observed September 13, 2026, approximately 03:01–03:04 UTC. Status: ready for PR review. This is an endpoint/access experiment, not a running monitoring service. No paid APIs, credentials, subscriptions or public messages were used.

## Results

Exact requested/final URLs, UTC observation times, HTTP status, content type, byte counts, SHA-256 hashes, cache headers and parsing observations are in [the evidence record](T07_SOURCE_OBSERVATIONS.json). Source IDs refer to the [source plan](../SOURCE_MONITORING_PLAN.md).

| Source / topic | Tested endpoint | Observed result | Connector follow-up |
| --- | --- | --- | --- |
| S07 GitHub / Coding | https://github.blog/changelog/feed/ | HTTP 200; RSS; 10 items, all dated; ETag and Last-Modified | GUID plus content hash; retain source timezone; test conditional requests |
| S12 CISA KEV / Cybersecurity & IT | https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json | HTTP 200; JSON; 1,709 entries; required fields present; ETag and Last-Modified | Key by CVE; compare changed records; initial catalog is baseline, not 1,709 new alerts |
| S14 Google Cloud / Cybersecurity & IT | https://cloud.google.com/feeds/gcp-release-notes.xml | HTTP 200 after redirect to https://docs.cloud.google.com/feeds/gcp-release-notes.xml; Atom; 30 dated entries | Daily entries contain multiple releases: split product sections into developments; midnight date is not precise announcement time |
| S04 Hugging Face / AI | https://huggingface.co/blog | HTTP 200; HTML with 72 distinct links and date elements | Exclude navigation/community index; distinguish community authors from company announcements; date samples lack timezone |
| S20 Windows / Consumer Technology | https://blogs.windows.com/ | HTTP 200; HTML with 136 distinct links | Follow selected device/consumer articles; homepage Last-Modified is not an article publication date |
| S22 Microsoft investor relations / Tech Business | https://www.microsoft.com/en-us/investor/default | HTTP 200; HTML with 168 distinct links | Follow earnings/announcement detail pages; casing variants require canonical checks; navigation changes are not events |

Link counts include navigation and are not article counts. Detail-page extraction was not tested. Samples in the JSON identify observed records, not verified or publishable news. All five proposed topics have an accessible candidate; this does not establish adequate topic coverage.

## Access and method

Six fixed public URLs were fetched without authentication using curl and a descriptive `DailyUpdateResearch/0.1` user agent. Bounds: HTTPS only, at most three redirects, 20 seconds, 3 MiB response limit and at most three concurrent requests. Python standard-library XML/JSON/HTML parsers inspected saved responses. CISA required fields checked were `cveID`, `dateAdded`, `vendorProject`, `product` and `requiredAction`.

A subsequent read of robots.txt on each final host returned HTTP 200. Python's basic RobotFileParser reported the tested path allowed for `DailyUpdateResearch` on all six. This is a limited robots observation, not permission to republish content or a complete interpretation of provider terms. Terms, permitted extraction/retention, detail-page access and source-specific pacing must be recorded before enabling production connectors in T25. Keep sources disabled until that review; never bypass a block.

Only metadata and limited record identifiers are committed; full publisher responses remain outside the repository. No article text is licensed for reuse by this experiment. Robots responses can change and must be rechecked before scheduled retrieval.

An initial sandbox request failed DNS resolution. The same public endpoint succeeded with network access; this was an environment failure, not evidence the source was down. All six bounded endpoint probes then returned 200 with exit code zero. A separate attempt to open CISA website policies through the research browser failed; access/retention policy review remains unresolved.

## Limits and next task

Single observations do not measure freshness, availability, detection latency or seven-day reliability. Request durations in the evidence are transfer timings only. Cache headers were observed; 304 behavior is untested. The temporary fixed-URL diagnostic is not the T08 reusable harness and does not establish SSRF protection or safe arbitrary-URL retrieval.

T08 should commit a reproducible bounded harness with synthetic parser fixtures, conditional requests, baseline/cursor handling, date provenance, redirect destination validation and changed/unchanged/error cases. Begin with the three structured sources. The HTML sources remain candidates pending detail extraction and policy review. Broader search and model evaluation remain T10–T12 under the [free MVP plan](../FREE_MVP_PLAN.md).
