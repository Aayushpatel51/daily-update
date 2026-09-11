# Design system

Status: initial proposal, September 11, 2026. No screens or components have been implemented. Revisit visual choices after brand and audience decisions; preserve accessibility and editorial clarity.

## 1. Principles

1. Lead with the development, not decoration.
2. Make topic, timing, evidence, and reading depth easy to distinguish.
3. Public reading needs no account wall.
4. Subscription controls are easy to find and reverse.
5. A feed has an understandable end; avoid engagement-driven infinite scrolling in the MVP.
6. Use a responsive editorial list, not a dashboard of nested cards.

## 2. Proposed tokens

### Color

| Token | Value | Use |
| --- | --- | --- |
| background | #F7F7F2 | Page canvas |
| surface | #FFFFFF | Forms and selected panels |
| text-primary | #182026 | Headings and body |
| text-secondary | #52606D | Metadata and secondary text |
| border | #D8DDD9 | Decorative separators |
| control-border | #738079 | Form boundaries on light backgrounds |
| accent | #174EA6 | Links, primary actions, focus |
| success | #176B46 | Verified action success, with label |
| warning | #8A4B08 | Review/pending notice, with label |
| danger | #B42318 | Errors and destructive action labels |

Validate actual foreground/background pairings during implementation. Do not use the decorative border token as the only boundary of an interactive control. Topic labels can share neutral styling initially; five unrelated bright colors are unnecessary.

### Typography

- UI and body: system sans-serif stack initially; avoid an external font dependency during the pilot.
- Article titles: Georgia or a comparable locally available serif as a proposed editorial accent.
- Body: 16–18px, line-height 1.55–1.7. Article reading measure: roughly 60–72 characters.
- Metadata: 13–14px, not low-contrast microtext.
- Headings: responsive scale of approximately 24/32/44px; avoid giant marketing text on article pages.
- Use sentence case and tabular numerals for operational timestamps where useful.

### Layout and spacing

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px.
- Public shell max width: approximately 1120px; article body max width: approximately 720px.
- Mobile gutter: 16–20px; desktop: 24–40px.
- Breakpoints follow content needs; begin testing at 360, 768, and 1280px viewport widths.
- Corners: 6–10px on controls and bounded panels; avoid pill-shaped containers everywhere.
- Prefer borders and whitespace to shadows. No fixed-height story summaries that truncate essential facts.

## 3. Information architecture

| Route concept | Content |
| --- | --- |
| / | Latest approved articles, topic navigation, concise subscription explanation |
| /topics/[slug] | Topic description, dated story list, pagination/archive access |
| /articles/[slug] | Stable article, sources, evidence status, publication/update times, correction history |
| /subscribe | Five-topic selection, Telegram connection, optional email, timezone confirmation |
| /preferences | Authorized channel controls and topic preferences |
| /about | Editorial approach and contact |
| /privacy | Actual data practices and deletion path |
| /admin | Protected source health, review queues, and delivery operations |

These are planned routes, not existing pages. Unsubscribe should work without account sign-in using an appropriate scoped mechanism. Private routes and drafts must not appear in search indexing or public caches.

## 4. Components and states

### Topic selector

Accessible checkboxes with descriptions, visible selection, and a concise error if no topic is chosen for active delivery. Do not use color alone. Selected topics persist across the subscription flow.

### Story row

Headline, short description, topic tags, event date where useful, publication time, and evidence text. Make the article link obvious without nested clickable containers. A story tagged twice appears once in a combined feed.

### Article

Title → summary → source/evidence metadata → substantive sections → sources → update/correction notes → related topic links. Sources remain easy to reach on mobile. Show published and updated timestamps separately; avoid resetting the date to manufacture freshness.

### Subscription panel

Explain Telegram alerts and optional daily email separately. States: not connected, waiting for bot start, connected, paused, blocked/disconnected; email unverified, active, unsubscribed, or suppressed. Opening Telegram is not proof of a successful connection.

### Preferences

Topic checkboxes, all/major-only alert choice, timezone, optional quiet hours, channel pause/stop, and deletion path. Show save success and failure. Warn only when an action has a real consequence; do not make unsubscribe difficult.

### Editorial desk

Two distinct queues: brief review and article review. Show source evidence alongside claims; identify unknown dates, stale sources, duplicate candidates, and unsent/ambiguous delivery states. Approval must identify the exact version being approved. Concurrent edits cannot silently overwrite approvals.

### Feedback

Simple useful/not useful action can be added during the pilot, with clear submission state. Do not require a public social profile or collect unnecessary personal data.

## 5. Channel presentation

Telegram: short readable text, limited formatting, original source link, then article link when ready. Escape platform formatting. Avoid excessive emoji and repeated calls to action. Website branding must not depend on Telegram client fonts or colors.

Email: single-column readable layout, topic headings, concise story entries, clear article links, and persistent unsubscribe/preferences. Support narrow screens, blocked images, dark-mode variations, and plain text. All essential content must work without images or scripts.

## 6. Accessibility and motion

- Target WCAG 2.2 AA; verify contrast, keyboard operation, focus visibility, labels, and status announcements.
- Use approximately 44px touch targets where practical and sufficient spacing around smaller text links.
- Preserve reading order and semantic heading hierarchy.
- Respect reduced motion. Use only short 120–180ms functional transitions; no auto-scrolling or animated news tickers.
- Do not auto-request notification permissions; web push is deferred.
- Localize displayed times to the confirmed preference and show timezone/absolute date when ambiguity matters.
- Test at 200% zoom, long headlines, empty topics, delayed data, and form errors.

## 7. Design review checklist

- A reader can identify the event and source without scrolling through promotional content.
- The article remains comfortable on a small phone and a laptop.
- Subscription choices and frequency are understandable before consent.
- Topic overlap does not duplicate stories.
- Every interactive state has a keyboard-accessible, readable outcome.
- No invented news, statistics, testimonials, logos, or success metrics appear as real content.
- Before implementation, refer to [BRAND.md](BRAND.md) for editorial tone and [REQUIREMENTS.md](../REQUIREMENTS.md) for behavior.
