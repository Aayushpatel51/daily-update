import test from "node:test";
import assert from "node:assert/strict";
import { retrieve, safeUrl, publicAddress, readBody } from "./transport.ts";
import type { Exchange } from "./transport.ts";
import { observe, sources, MAX_BYTES } from "./core.ts";
import { readFile } from "node:fs/promises";
const body = await readFile(
  new URL("./fixtures/github.xml", import.meta.url),
  "utf8",
);
const resolve = async () => ["93.184.216.34"];
const ok = {
  status: 200,
  headers: { "content-type": "application/rss+xml" },
  body,
};

test("reject arbitrary URLs, credentials, ports, fragments and encoded path variants", () => {
  for (const url of [
    "http://github.blog/changelog/feed/",
    "https://localhost/",
    "https://github.blog.evil.test/changelog/feed/",
    "https://u:p@github.blog/changelog/feed/",
    "https://github.blog:444/changelog/feed/",
    "https://github.blog/changelog/feed/#x",
    "https://github.blog/%63hangelog/feed/",
  ])
    assert.throws(() => safeUrl(url));
});
test("reject private, reserved, mapped and mixed DNS answers", async () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "192.0.2.1",
    "::1",
    "::ffff:127.0.0.1",
  ]) {
    await assert.rejects(
      publicAddress("fixture.test", async () => ["93.184.216.34", ip]),
      /address_forbidden/,
    );
  }
  await assert.rejects(publicAddress("fixture.test", async () => []));
});
test("transport receives pinned public address and conditional validators", async () => {
  const cursor = observe("S07", body, undefined, {
    etag: '"fixture"',
    modified: "Fri, 11 Sep 2026 12:00:00 GMT",
  }).cursor;
  const response = await retrieve("S07", cursor, {
    resolve,
    exchange: async (url, address, headers) => {
      assert.equal(url.href, sources.S07.url);
      assert.equal(address, "93.184.216.34");
      assert.equal(headers["if-none-match"], '"fixture"');
      assert.ok(headers["if-modified-since"]);
      return { status: 304, headers: {}, body: "" };
    },
  });
  assert.equal(response.status, 304);
});
test("unexpected 304, HTTP errors, wrong MIME and large responses fail", async () => {
  for (const reply of [
    { status: 304, headers: {}, body: "" },
    { status: 429, headers: { "retry-after": "60" }, body: "" },
    { ...ok, headers: { "content-type": "text/html" } },
    { ...ok, body: " ".repeat(MAX_BYTES + 1) },
  ]) {
    let calls = 0;
    await assert.rejects(
      retrieve("S07", undefined, {
        resolve,
        exchange: async () => {
          calls++;
          return reply;
        },
      }),
    );
    assert.equal(calls, 1);
  }
});
test("redirect destinations and DNS are revalidated; loops have a hard cap", async () => {
  let requests = 0;
  await assert.rejects(
    retrieve("S07", undefined, {
      resolve,
      exchange: async () => {
        requests++;
        return {
          status: 302,
          headers: { location: "https://127.0.0.1/" },
          body: "",
        };
      },
    }),
    /destination_forbidden/,
  );
  assert.equal(requests, 1);
  let resolutions = 0;
  await assert.rejects(
    retrieve("S14", undefined, {
      resolve: async () =>
        ++resolutions === 1 ? ["93.184.216.34"] : ["10.0.0.1"],
      exchange: async () => ({
        status: 302,
        headers: {
          location: "https://cloud.google.com/feeds/gcp-release-notes.xml",
        },
        body: "",
      }),
    }),
    /address_forbidden/,
  );
  requests = 0;
  await assert.rejects(
    retrieve("S14", undefined, {
      resolve,
      exchange: async () => {
        requests++;
        return {
          status: 302,
          headers: { location: sources.S14.url },
          body: "",
        };
      },
    }),
    /redirect_limit/,
  );
  assert.equal(requests, 4);
});
test("deadline covers DNS and transport, with abort signaled to exchange", async () => {
  await assert.rejects(
    retrieve("S07", undefined, {
      timeoutMs: 15,
      resolve: async () => new Promise(() => {}),
    }),
    /request_timeout/,
  );
  let signal: AbortSignal | undefined;
  const exchange: Exchange = async (_url, _address, _headers, s) => {
    signal = s;
    return new Promise(() => {});
  };
  await assert.rejects(
    retrieve("S07", undefined, { resolve, exchange, timeoutMs: 15 }),
    /request_timeout/,
  );
  assert.equal(signal?.aborted, true);
});

test("stream reader bounds chunked data and rejects compressed, truncated or invalid UTF-8 bodies", async () => {
  async function* chunks(...items: Uint8Array[]) {
    yield* items;
  }
  assert.equal(
    await readBody(chunks(Buffer.from("ok")), { "content-length": "2" }),
    "ok",
  );
  await assert.rejects(
    readBody(chunks(Buffer.from("x")), { "content-encoding": "gzip" }),
    /encoding_forbidden/,
  );
  await assert.rejects(
    readBody(chunks(Buffer.alloc(MAX_BYTES), Buffer.from("x")), {}),
    /body_limit/,
  );
  await assert.rejects(
    readBody(chunks(), { "content-length": String(MAX_BYTES + 1) }),
    /body_limit/,
  );
  await assert.rejects(
    readBody(chunks(Buffer.from("x")), { "content-length": "2" }),
    /truncated_body/,
  );
  await assert.rejects(
    readBody(chunks(Uint8Array.from([0xff])), {}),
    /invalid_utf8/,
  );
  async function* broken() {
    yield Buffer.from("partial");
    throw new Error("fixture_reset");
  }
  await assert.rejects(readBody(broken(), {}), /fixture_reset/);
});
