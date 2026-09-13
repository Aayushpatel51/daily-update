import { lookup } from "node:dns/promises";
import { request } from "node:https";
import ipaddr from "ipaddr.js";
import { MAX_BYTES, sources } from "./core.ts";
import type { SourceId, Cursor } from "./core.ts";

export interface Reply {
  status: number;
  headers: Record<string, string | undefined>;
  body: string;
}
export type Resolver = (host: string) => Promise<string[]>;
export type Exchange = (
  url: URL,
  address: string,
  headers: Record<string, string>,
  signal: AbortSignal,
) => Promise<Reply>;
const allowedUrls = new Set<string>([
  ...Object.values(sources).map((s) => s.url),
  "https://cloud.google.com/feeds/gcp-release-notes.xml",
]);
export function safeUrl(value: string): URL {
  const url = new URL(value);
  if (url.username || url.password || url.hash || !allowedUrls.has(url.href))
    throw new Error("destination_forbidden");
  return url;
}
export async function publicAddress(
  host: string,
  resolve: Resolver,
): Promise<string> {
  const addresses = await resolve(host);
  if (
    !addresses.length ||
    addresses.some(
      (address) =>
        !ipaddr.IPv4.isValid(address) ||
        ipaddr.parse(address).range() !== "unicast",
    )
  )
    throw new Error("address_forbidden");
  const first = addresses[0];
  if (!first) throw new Error("dns_empty");
  return first;
}
const resolve: Resolver = async (host) =>
  (await lookup(host, { all: true, family: 4 })).map((item) => item.address);
export async function readBody(
  stream: AsyncIterable<Uint8Array>,
  headers: Record<string, string | undefined>,
): Promise<string> {
  if (headers["content-encoding"] && headers["content-encoding"] !== "identity")
    throw new Error("encoding_forbidden");
  const length = headers["content-length"];
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES))
    throw new Error("body_limit");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.byteLength;
    if (size > MAX_BYTES) throw new Error("body_limit");
    chunks.push(chunk);
  }
  if (length && Number(length) !== size) throw new Error("truncated_body");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks),
    );
  } catch {
    throw new Error("invalid_utf8");
  }
}
export const exchange: Exchange = (url, address, headers, signal) =>
  new Promise((done, fail) => {
    const req = request(
      url,
      {
        method: "GET",
        headers,
        signal,
        agent: false,
        maxHeaderSize: 16_384,
        // Pin the validated address; TLS hostname verification still uses the original URL.
        lookup: (_host, options, callback) => {
          if (options.all) callback(null, [{ address, family: 4 }]);
          else callback(null, address, 4);
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const responseHeaders = Object.fromEntries(
          Object.entries(res.headers).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(",") : value,
          ]),
        );
        if (status !== 200) {
          res.destroy();
          done({ status, headers: responseHeaders, body: "" });
          return;
        }
        void readBody(res, responseHeaders).then(
          (body) => done({ status, headers: responseHeaders, body }),
          (error) => {
            res.destroy();
            fail(error);
          },
        );
      },
    );
    req.on("error", fail);
    req.end();
  });
export async function retrieve(
  id: SourceId,
  previous?: Cursor,
  dependencies: {
    resolve?: Resolver;
    exchange?: Exchange;
    timeoutMs?: number;
  } = {},
): Promise<Reply & { finalUrl: string }> {
  const timeout = dependencies.timeoutMs ?? 20_000;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_done, fail) => {
    timer = setTimeout(() => {
      controller.abort();
      fail(new Error("request_timeout"));
    }, timeout);
  });
  const run = async () => {
    let url = safeUrl(sources[id].url);
    for (let redirects = 0; ; redirects++) {
      controller.signal.throwIfAborted();
      const address = await publicAddress(
        url.hostname,
        dependencies.resolve ?? resolve,
      );
      controller.signal.throwIfAborted();
      const headers: Record<string, string> = {
        "user-agent": "DailyUpdateResearch/0.2 (bounded source experiment)",
        "accept-encoding": "identity",
        accept:
          id === "S12"
            ? "application/json"
            : "application/xml, text/xml, application/rss+xml, application/atom+xml",
      };
      // Validators belong to exactly the stored resource, never another redirected URL.
      if (url.href === previous?.url) {
        if (previous.etag) headers["if-none-match"] = previous.etag;
        if (previous.modified) headers["if-modified-since"] = previous.modified;
      }
      const reply = await (dependencies.exchange ?? exchange)(
        url,
        address,
        headers,
        controller.signal,
      );
      controller.signal.throwIfAborted();
      if ([301, 302, 303, 307, 308].includes(reply.status)) {
        if (redirects >= 3 || !reply.headers.location)
          throw new Error("redirect_limit");
        const next = safeUrl(new URL(reply.headers.location, url).href);
        // Only Google Cloud's documented feed move is a supported redirect.
        if (id !== "S14" || !next.pathname.endsWith("/gcp-release-notes.xml"))
          throw new Error("redirect_forbidden");
        url = next;
        continue;
      }
      if (reply.status === 304) {
        if (
          !previous ||
          url.href !== previous.url ||
          (!headers["if-none-match"] && !headers["if-modified-since"])
        )
          throw new Error("unexpected_304");
      } else if (reply.status !== 200) {
        // No automatic retries: the operator observes failures without amplification.
        throw new Error(`http_${reply.status}`);
      } else {
        const mime = reply.headers["content-type"]
          ?.split(";")[0]
          ?.trim()
          .toLowerCase();
        if (
          id === "S12"
            ? mime !== "application/json"
            : ![
                "application/xml",
                "text/xml",
                "application/rss+xml",
                "application/atom+xml",
              ].includes(mime ?? "")
        )
          throw new Error("content_type");
        if (Buffer.byteLength(reply.body) > MAX_BYTES)
          throw new Error("body_limit");
      }
      return { ...reply, finalUrl: url.href };
    }
  };
  try {
    return await Promise.race([run(), expired]);
  } finally {
    clearTimeout(timer);
  }
}
