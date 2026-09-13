import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { observe, parseRecords, readCursor, MAX_BYTES } from "./core.ts";
const rss = await readFile(
  new URL("./fixtures/github.xml", import.meta.url),
  "utf8",
);
const atom = await readFile(
  new URL("./fixtures/google.xml", import.meta.url),
  "utf8",
);
const kev = await readFile(
  new URL("./fixtures/kev.json", import.meta.url),
  "utf8",
);

test("three formats baseline silently and repeated bodies produce no candidates", () => {
  for (const [id, body] of [
    ["S07", rss],
    ["S12", kev],
    ["S14", atom],
  ] as const) {
    const first = observe(id, body);
    assert.equal(first.status, "baseline");
    assert.deepEqual(first.candidates, []);
    assert.equal(observe(id, body, first.cursor).status, "unchanged");
    assert.deepEqual(
      readCursor(JSON.parse(JSON.stringify(first.cursor)), id),
      first.cursor,
    );
  }
});
test("new and changed records are candidates; disappeared records remain remembered", () => {
  const first = observe("S07", rss);
  const newBody = rss.replace("fixture:tool-1", "fixture:tool-2");
  const second = observe("S07", newBody, first.cursor);
  assert.equal(second.candidates[0]?.change, "new");
  assert.equal(observe("S07", rss, second.cursor).status, "unchanged");
  const changed = observe(
    "S07",
    rss.replace("adds a command", "removes a command"),
    second.cursor,
  );
  assert.equal(changed.candidates[0]?.change, "updated");
});
test("feed metadata and whitespace between tags do not create candidates", () => {
  const first = observe("S07", rss);
  assert.equal(
    observe(
      "S07",
      rss
        .replace("GitHub-shaped", "Different")
        .replace("</item>", "</item>\n\n"),
      first.cursor,
    ).status,
    "unchanged",
  );
});
test("content attributes count as changes and Atom daily bundles are not events", () => {
  const first = observe("S14", atom);
  const changed = observe(
    "S14",
    atom.replace('type="html"', 'type="text"'),
    first.cursor,
  );
  assert.equal(changed.candidates[0]?.change, "updated");
  assert.equal(changed.candidates[0]?.unit, "daily-bundle");
  assert.equal(changed.candidates[0]?.date, "2026-09-11T00:00:00-07:00");
});
test("KEV object key order does not create changes; mitigation does", () => {
  const data = JSON.parse(kev);
  const first = observe("S12", kev);
  data.vulnerabilities[0] = Object.fromEntries(
    Object.entries(data.vulnerabilities[0]).reverse(),
  );
  assert.equal(
    observe("S12", JSON.stringify(data), first.cursor).status,
    "unchanged",
  );
  data.vulnerabilities[0].requiredAction = "SYNTHETIC revised guidance";
  assert.equal(
    observe("S12", JSON.stringify(data), first.cursor).candidates[0]?.change,
    "updated",
  );
});
test("unknown dates stay unknown; invalid or timezone-less dates fail", () => {
  assert.equal(
    parseRecords("S07", rss.replace(/<pubDate>.*?<\/pubDate>/, ""))[0]
      ?.datePrecision,
    "unknown",
  );
  assert.throws(
    () =>
      parseRecords(
        "S07",
        rss.replace("Fri, 11 Sep 2026 12:00:00 +0000", "2026-09-11T12:00:00"),
      ),
    /invalid_timestamp/,
  );
  assert.throws(
    () =>
      parseRecords(
        "S12",
        kev.replace('"dateAdded": "2026-09-11"', '"dateAdded": "2026-02-30"'),
      ),
    /invalid_date/,
  );
});
test("malformed, hostile, oversized, empty and duplicate records are rejected", () => {
  for (const body of [
    "<rss>",
    "<html/>",
    "<rss><channel/></rss>",
    rss.replace(
      "</channel>",
      rss.match(/<item>.*<\/item>/s)?.[0] + "</channel>",
    ),
    '<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]>' +
      rss.replace(/<\?xml.*?\?>/, ""),
    "<x>".repeat(33) + "</x>".repeat(33),
    " ".repeat(MAX_BYTES + 1),
  ]) {
    assert.throws(() => parseRecords("S07", body));
  }
  assert.throws(
    () => parseRecords("S12", kev.replace('"count": 1', '"count": 2')),
    /invalid_catalog/,
  );
  assert.throws(
    () => parseRecords("S12", kev.replace('"vendorProject"', '"missing"')),
    /missing_field/,
  );
});
test("corrupt and mismatched cursors fail instead of resetting history", () => {
  const cursor = observe("S07", rss).cursor;
  assert.throws(() => readCursor(cursor, "S12"), /invalid_cursor/);
  assert.throws(
    () => readCursor({ ...cursor, etag: "bad\r\nheader" }, "S07"),
    /invalid_validator/,
  );
  assert.throws(
    () => readCursor({ ...cursor, seen: { invalid: "bad" } }, "S07"),
    /invalid_cursor_hash/,
  );
});
