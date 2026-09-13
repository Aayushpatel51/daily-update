import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { probe, withLock } from "./store.ts";
import { sources } from "./core.ts";
const body = await readFile(
  new URL("./fixtures/github.xml", import.meta.url),
  "utf8",
);
const reply = {
  status: 200,
  headers: { etag: '"fixture"' },
  body,
  finalUrl: sources.S07.url,
};
test("baseline survives restart; failures preserve cursor; 304 creates no candidates", async () => {
  const directory = await mkdtemp(join(tmpdir(), "daily-monitor-"));
  try {
    assert.equal(
      (await probe("S07", directory, async () => reply)).status,
      "baseline",
    );
    const saved = await readFile(join(directory, "S07.json"), "utf8");
    assert.equal(
      (await probe("S07", directory, async () => reply)).status,
      "unchanged",
    );
    await assert.rejects(
      probe("S07", directory, async () => ({ ...reply, body: "broken" })),
    );
    assert.equal(await readFile(join(directory, "S07.json"), "utf8"), saved);
    await assert.rejects(
      probe("S07", directory, async () => {
        throw new Error("http_429");
      }),
    );
    assert.equal(await readFile(join(directory, "S07.json"), "utf8"), saved);
    assert.deepEqual(
      (
        await probe("S07", directory, async () => ({
          ...reply,
          status: 304,
          body: "",
        }))
      ).candidates,
      [],
    );
    await writeFile(join(directory, "S07.json"), "{}");
    let called = false;
    await assert.rejects(
      probe("S07", directory, async () => {
        called = true;
        return reply;
      }),
      /invalid_cursor/,
    );
    assert.equal(called, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test("exclusive source lock rejects concurrent runs and releases after failure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "daily-monitor-"));
  try {
    await withLock(directory, "S07", async () => {
      await assert.rejects(
        probe("S07", directory, async () => reply),
        /source_locked/,
      );
    });
    await assert.rejects(
      withLock(directory, "S07", async () => {
        throw new Error("fixture_failure");
      }),
    );
    assert.equal(
      (await probe("S07", directory, async () => reply)).status,
      "baseline",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
