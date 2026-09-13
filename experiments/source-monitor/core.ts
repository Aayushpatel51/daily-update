import { createHash } from "node:crypto";
import { SaxesParser } from "saxes";

export const MAX_BYTES = 3 * 1024 * 1024;
export const sources = {
  S07: { kind: "rss", url: "https://github.blog/changelog/feed/" },
  S12: {
    kind: "kev",
    url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
  },
  S14: {
    kind: "atom",
    url: "https://docs.cloud.google.com/feeds/gcp-release-notes.xml",
  },
} as const;
export type SourceId = keyof typeof sources;
export function sourceId(value: string): SourceId {
  if (value !== "S07" && value !== "S12" && value !== "S14")
    throw new Error("unknown_source");
  return value;
}
export function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid_object");
  return Object.fromEntries(Object.entries(value));
}
function required(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("missing_field");
  return value.trim();
}
export interface RecordItem {
  id: string;
  hash: string;
  date: string | null;
  datePrecision: "date" | "source-timestamp" | "unknown";
  unit: "source-record" | "daily-bundle";
}
function dateField(
  value: string | undefined,
  dayOnly = false,
): Pick<RecordItem, "date" | "datePrecision"> {
  if (!value?.trim()) return { date: null, datePrecision: "unknown" };
  const raw = value.trim();
  if (dayOnly) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(raw) ||
      !Number.isFinite(Date.parse(raw)) ||
      new Date(raw).toISOString().slice(0, 10) !== raw
    )
      throw new Error("invalid_date");
    return { date: raw, datePrecision: "date" };
  }
  // Preserve publisher text; no timezone inferred from the machine running the experiment.
  if (
    !/(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC)$/i.test(raw) ||
    !Number.isFinite(Date.parse(raw))
  )
    throw new Error("invalid_timestamp");
  return { date: raw, datePrecision: "source-timestamp" };
}
interface XmlNode {
  name: string;
  uri: string;
  attributes: string[][];
  text: string;
  children: XmlNode[];
}
function xmlTree(body: string): XmlNode {
  const parser = new SaxesParser({ xmlns: true });
  const stack: XmlNode[] = [];
  let root: XmlNode | undefined;
  let nodes = 0;
  parser.on("doctype", () => {
    throw new Error("doctype_forbidden");
  });
  parser.on("error", () => {
    throw new Error("invalid_xml");
  });
  parser.on("opentag", (tag) => {
    if (stack.length >= 32 || ++nodes > 50_000) throw new Error("xml_limit");
    const node: XmlNode = {
      name: tag.local,
      uri: tag.uri,
      attributes: Object.values(tag.attributes)
        .map((a) => [a.uri, a.local, a.value])
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      text: "",
      children: [],
    };
    stack.at(-1)?.children.push(node);
    root ??= node;
    stack.push(node);
  });
  const append = (text: string) => {
    const node = stack.at(-1);
    if (node) node.text += text;
  };
  parser.on("text", append);
  parser.on("cdata", append);
  parser.on("closetag", () => {
    stack.pop();
  });
  parser.write(body).close();
  if (!root) throw new Error("empty_xml");
  return root;
}
function children(node: XmlNode, name: string, uri = node.uri): XmlNode[] {
  return node.children.filter(
    (child) => child.name === name && child.uri === uri,
  );
}
function field(node: XmlNode, name: string): string | undefined {
  const values = children(node, name);
  if (values.length > 1) throw new Error("duplicate_field");
  return values[0]?.text.trim();
}
function treeContent(node: XmlNode): unknown {
  // Exclude feed-level timestamps/navigation, but retain per-record content changes.
  return [
    node.uri,
    node.name,
    node.attributes,
    node.text.trim(),
    node.children.map(treeContent),
  ];
}
export function parseRecords(id: SourceId, body: string): RecordItem[] {
  if (Buffer.byteLength(body) > MAX_BYTES) throw new Error("body_limit");
  let records: RecordItem[];
  if (id === "S12") {
    const catalog = object(JSON.parse(body));
    required(catalog.catalogVersion);
    dateField(required(catalog.dateReleased));
    if (
      !Array.isArray(catalog.vulnerabilities) ||
      catalog.count !== catalog.vulnerabilities.length
    )
      throw new Error("invalid_catalog");
    records = catalog.vulnerabilities.map((value: unknown) => {
      const item = object(value);
      const key = required(item.cveID);
      if (!/^CVE-\d{4}-\d{4,}$/.test(key)) throw new Error("invalid_cve");
      for (const key of ["vendorProject", "product", "requiredAction"])
        required(item[key]);
      const canonical = Object.keys(item)
        .sort()
        .map((key) => [key, item[key]]);
      return {
        id: key,
        hash: hash(JSON.stringify(canonical)),
        ...dateField(required(item.dateAdded), true),
        unit: "source-record",
      };
    });
  } else {
    const root = xmlTree(body);
    let entries: XmlNode[];
    if (id === "S07") {
      if (root.name !== "rss" || root.uri !== "")
        throw new Error("unexpected_root");
      const channels = children(root, "channel");
      if (channels.length !== 1 || !channels[0])
        throw new Error("invalid_channel");
      entries = children(channels[0], "item");
    } else {
      if (root.name !== "feed" || root.uri !== "http://www.w3.org/2005/Atom")
        throw new Error("unexpected_root");
      entries = children(root, "entry");
    }
    records = entries.map((entry) => {
      const key = required(field(entry, id === "S07" ? "guid" : "id"));
      required(field(entry, "title"));
      const date = dateField(
        field(entry, id === "S07" ? "pubDate" : "updated"),
      );
      return {
        id: key,
        hash: hash(JSON.stringify(treeContent(entry))),
        ...date,
        unit: id === "S14" ? "daily-bundle" : "source-record",
      };
    });
  }
  if (!records.length || records.length > 10_000)
    throw new Error("record_count");
  if (new Set(records.map((r) => r.id)).size !== records.length)
    throw new Error("duplicate_record_id");
  return records;
}
export interface Cursor {
  version: 1;
  source: SourceId;
  url: string;
  documentHash: string;
  etag?: string;
  modified?: string;
  seen: Record<string, string>;
}
export function readCursor(value: unknown, id: SourceId): Cursor {
  const state = object(value);
  if (
    state.version !== 1 ||
    state.source !== id ||
    state.url !== sources[id].url
  )
    throw new Error("invalid_cursor");
  const digest = (v: unknown): string => {
    if (typeof v !== "string" || !/^[a-f0-9]{64}$/.test(v))
      throw new Error("invalid_cursor_hash");
    return v;
  };
  const seen = Object.fromEntries(
    Object.entries(object(state.seen)).map(([key, val]) => [
      digest(key),
      digest(val),
    ]),
  );
  if (!Object.keys(seen).length || Object.keys(seen).length > 50_000)
    throw new Error("cursor_limit");
  const validator = (v: unknown): string | undefined => {
    if (v === undefined) return undefined;
    if (typeof v !== "string" || !/^[\x20-\x7e]{1,1024}$/.test(v))
      throw new Error("invalid_validator");
    return v;
  };
  return {
    version: 1,
    source: id,
    url: sources[id].url,
    documentHash: digest(state.documentHash),
    seen,
    etag: validator(state.etag),
    modified: validator(state.modified),
  };
}
export interface Observation {
  status: "baseline" | "changed" | "unchanged";
  records: number;
  candidates: Array<{
    idHash: string;
    change: "new" | "updated";
    unit: RecordItem["unit"];
    date: string | null;
    datePrecision: RecordItem["datePrecision"];
  }>;
  cursor: Cursor;
}
export function observe(
  id: SourceId,
  body: string,
  previous?: Cursor,
  validators: { etag?: string; modified?: string } = {},
): Observation {
  const records = parseRecords(id, body); // Validate even when a server repeats a body hash.
  const seen = { ...previous?.seen };
  const candidates: Observation["candidates"] = [];
  for (const record of records) {
    const key = hash(record.id);
    if (previous && seen[key] !== record.hash)
      candidates.push({
        idHash: key,
        change: seen[key] ? "updated" : "new",
        unit: record.unit,
        date: record.date,
        datePrecision: record.datePrecision,
      });
    seen[key] = record.hash;
  }
  if (Object.keys(seen).length > 50_000) throw new Error("cursor_limit");
  return {
    status: !previous
      ? "baseline"
      : candidates.length
        ? "changed"
        : "unchanged",
    records: records.length,
    candidates,
    cursor: readCursor(
      {
        version: 1,
        source: id,
        url: sources[id].url,
        documentHash: hash(body),
        seen,
        ...validators,
      },
      id,
    ),
  };
}
