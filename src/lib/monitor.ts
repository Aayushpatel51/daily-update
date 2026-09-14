import { SaxesParser } from "saxes";
import { retrieve } from "../../experiments/source-monitor/transport";
import {
  observe,
  readCursor,
  sourceId,
} from "../../experiments/source-monitor/core";
import { query, tx } from "./db";
import { createStory } from "./editorial";
import { digest } from "./security";
import type { StoryInput } from "./models";
export const sourceRegistry = [
  {
    id: "S07",
    name: "GitHub Changelog",
    url: "https://github.blog/changelog/feed/",
    topics: ["coding"],
  },
  {
    id: "S12",
    name: "CISA Known Exploited Vulnerabilities",
    url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    topics: ["it-security"],
  },
  {
    id: "S14",
    name: "Google Cloud release notes",
    url: "https://docs.cloud.google.com/feeds/gcp-release-notes.xml",
    topics: ["it-security"],
  },
  {
    id: "S04",
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog",
    topics: ["ai"],
  },
  {
    id: "S20",
    name: "Windows Blog",
    url: "https://blogs.windows.com/",
    topics: ["consumer-tech"],
  },
  {
    id: "S22",
    name: "Microsoft Investor Relations",
    url: "https://www.microsoft.com/en-us/investor/default",
    topics: ["tech-business"],
  },
];
export interface Source {
  id: string;
  name: string;
  url: string;
  topics: string[];
  enabled: boolean;
  access_note: string;
  interval_minutes: number;
  cursor: unknown;
  checked_at: Date | null;
  success_at: Date | null;
  error: string | null;
}
export async function initSources() {
  for (const s of sourceRegistry)
    await query(
      "INSERT INTO sources(id,name,url,topics) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
      [s.id, s.name, s.url, s.topics],
    );
}
function details(
  body: string,
): Map<string, { title: string; url: string; note: string }> {
  const result = new Map<
    string,
    { title: string; url: string; note: string }
  >();
  const p = new SaxesParser({ xmlns: true });
  let current: Record<string, string> | null = null;
  const stack: string[] = [];
  p.on("doctype", () => {
    throw new Error("doctype_forbidden");
  });
  p.on("opentag", (t) => {
    stack.push(t.local);
    if (t.local === "item" || t.local === "entry") current = {};
    if (current && t.local === "link") {
      const href = Object.values(t.attributes).find(
        (a) => a.local === "href",
      )?.value;
      if (href) current.link = href;
    }
  });
  const text = (s: string) => {
    if (current) {
      const key = stack.at(-1)!;
      current[key] = (current[key] ?? "") + s;
    }
  };
  p.on("text", text);
  p.on("cdata", text);
  p.on("closetag", (t) => {
    if (current && (t.local === "item" || t.local === "entry")) {
      result.set((current.guid ?? current.id ?? "").trim(), {
        title: (current.title ?? "Untitled source record").trim(),
        url: (current.link ?? "").trim(),
        note: (current.description ?? current.content ?? current.summary ?? "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 3000),
      });
      current = null;
    }
    stack.pop();
  });
  p.write(body).close();
  return result;
}
export async function monitorOnce() {
  const list = await query<Source>(
    "SELECT * FROM sources WHERE enabled=true AND (checked_at IS NULL OR checked_at<now()-interval_minutes*interval '1 minute') ORDER BY id",
  );
  let count = 0;
  for (const s of list) {
    try {
      const id = sourceId(s.id),
        previous = s.cursor ? readCursor(s.cursor, id) : undefined,
        reply = await retrieve(id, previous);
      await query("UPDATE sources SET checked_at=now() WHERE id=$1", [id]);
      if (reply.status === 304) {
        await query(
          "UPDATE sources SET success_at=now(),error=NULL WHERE id=$1",
          [id],
        );
        continue;
      }
      const next = observe(id, reply.body, previous, {
        etag: reply.headers.etag,
        modified: reply.headers["last-modified"],
      });
      const map =
        id === "S12"
          ? new Map<string, { title: string; url: string; note: string }>(
              JSON.parse(reply.body).vulnerabilities.map(
                (v: {
                  cveID: string;
                  vendorProject: string;
                  product: string;
                  requiredAction: string;
                }) => [
                  v.cveID,
                  {
                    title: `${v.vendorProject} ${v.product}: ${v.cveID}`,
                    url: s.url,
                    note: v.requiredAction,
                  },
                ],
              ),
            )
          : details(reply.body);
      for (const candidate of next.candidates) {
        const entry = [...map.entries()].find(
          ([key]) => digest(key) === candidate.idHash,
        );
        if (!entry) continue;
        const [key, data] = entry;
        let url = data.url;
        try {
          if (new URL(url).protocol !== "https:") url = s.url;
        } catch {
          url = s.url;
        }
        await createStory(
          {
            title:
              (id === "S14" ? "Daily source bundle: " : "") +
              data.title.slice(0, 150),
            topics: s.topics,
            brief: "",
            article: { changed: "", audience: "", matters: "", unknowns: "" },
            evidence: [
              {
                url,
                note: `Unverified source record. ${data.note || "Open the source for research."}`,
                publishedAt: candidate.date ?? "",
              },
            ],
            evidence_label: "Awaiting verification",
            major: false,
            synthetic: false,
          },
          `${id}:${digest(key)}:${next.cursor.seen[digest(key)]}`,
        );
        count++;
      }
      // A crash before cursor commit repeats idempotent candidate keys instead of losing work.
      await query(
        "UPDATE sources SET cursor=$2,success_at=now(),error=NULL WHERE id=$1",
        [id, JSON.stringify(next.cursor)],
      );
    } catch {
      await query(
        "UPDATE sources SET checked_at=now(),error='Fetch or parsing failed; previous cursor retained' WHERE id=$1",
        [s.id],
      );
    }
  }
  return count;
}
