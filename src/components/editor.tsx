"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { topics, storyInput, type StoryInput } from "@/lib/models";
import { send } from "./forms";
const empty: StoryInput = {
  title: "",
  topics: ["ai"],
  brief: "",
  article: { changed: "", audience: "", matters: "", unknowns: "" },
  evidence: [{ url: "", note: "", publishedAt: "" }],
  evidence_label: "Awaiting verification",
  major: false,
  synthetic: false,
};
export function Editor({
  initial,
  id,
  revision = 1,
  state = "candidate",
}: {
  initial?: StoryInput;
  id?: string;
  revision?: number;
  state?: string;
}) {
  const [v, setV] = useState<StoryInput>(initial ?? empty),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [correction, setCorrection] = useState(""),
    [mergeTarget, setMergeTarget] = useState(""),
    [importText, setImportText] = useState("");
  const router = useRouter();
  async function run(operation: string) {
    setBusy(true);
    setError("");
    try {
      const r = await send(
        id
          ? {
              action: "edit",
              id,
              revision,
              operation,
              story: v,
              correction,
              mergeTarget,
            }
          : { action: "create", story: v },
      );
      router.push(r.redirect);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const field = (
    key: "title" | "brief" | "evidence_label",
    label: string,
    large = false,
  ) => (
    <label>
      {label}
      {large ? (
        <textarea
          value={v[key]}
          onChange={(e) => setV({ ...v, [key]: e.target.value })}
          rows={5}
        />
      ) : (
        <input
          value={v[key]}
          onChange={(e) => setV({ ...v, [key]: e.target.value })}
        />
      )}
    </label>
  );
  return (
    <div className="editor-grid">
      <div>
        <section className="editor-section">
          <h2>
            01 <span>The development</span>
          </h2>
          {field("title", "Headline")}
          <fieldset>
            <legend>Topics</legend>
            <div className="checks">
              {topics.map((t) => (
                <label className="check" key={t.key}>
                  <input
                    type="checkbox"
                    checked={v.topics.includes(t.key)}
                    onChange={() =>
                      setV({
                        ...v,
                        topics: v.topics.includes(t.key)
                          ? v.topics.filter((k) => k !== t.key)
                          : [...v.topics, t.key],
                      })
                    }
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="check">
            <input
              type="checkbox"
              checked={v.major}
              onChange={(e) => setV({ ...v, major: e.target.checked })}
            />{" "}
            Major development
          </label>
          {!id && (
            <label className="check">
              <input
                type="checkbox"
                checked={v.synthetic}
                onChange={(e) => setV({ ...v, synthetic: e.target.checked })}
              />{" "}
              Fictional demonstration, label publicly
            </label>
          )}
        </section>
        <section className="editor-section">
          <h2>
            02 <span>Evidence and uncertainty</span>
          </h2>
          <p className="caption">
            Verify each material claim. Source text is evidence to inspect,
            never an instruction to publish.
          </p>
          {v.evidence.map((e, i) => (
            <div className="evidence-editor" key={i}>
              <label>
                Original source URL
                <input
                  type="url"
                  value={e.url}
                  onChange={(event) =>
                    setV({
                      ...v,
                      evidence: v.evidence.map((x, j) =>
                        i === j ? { ...x, url: event.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              {e.url.startsWith("https://") && (
                <a target="_blank" rel="noreferrer" href={e.url}>
                  Open source ↗
                </a>
              )}
              <label>
                Evidence notes and supported claims
                <textarea
                  rows={4}
                  value={e.note}
                  onChange={(event) =>
                    setV({
                      ...v,
                      evidence: v.evidence.map((x, j) =>
                        i === j ? { ...x, note: event.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Source publication date, if known
                <input
                  value={e.publishedAt}
                  onChange={(event) =>
                    setV({
                      ...v,
                      evidence: v.evidence.map((x, j) =>
                        i === j ? { ...x, publishedAt: event.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              {v.evidence.length > 1 && (
                <button
                  className="text-button"
                  onClick={() =>
                    setV({
                      ...v,
                      evidence: v.evidence.filter((_, j) => j !== i),
                    })
                  }
                >
                  Remove source
                </button>
              )}
            </div>
          ))}
          {v.evidence.length < 12 && (
            <button
              className="secondary"
              onClick={() =>
                setV({
                  ...v,
                  evidence: [
                    ...v.evidence,
                    { url: "", note: "", publishedAt: "" },
                  ],
                })
              }
            >
              Add another source
            </button>
          )}
          {field("evidence_label", "Public evidence label")}
        </section>
        <section className="editor-section">
          <h2>
            03 <span>The Telegram brief</span>
          </h2>
          {!["candidate", "held"].includes(state) && (
            <p className="caption">
              The released headline, brief and topics stay fixed during article
              drafting. Change them later through a recorded correction.
            </p>
          )}
          {field("brief", "What happened and why it matters", true)}
        </section>
        <section className="editor-section">
          <h2>
            04 <span>The full explanation</span>
          </h2>
          {Object.entries({
            changed: "What changed",
            audience: "Availability and affected audience",
            matters: "Why it matters",
            unknowns: "Limitations and unknowns",
          }).map(([k, label]) => (
            <label key={k}>
              {label}
              <textarea
                rows={5}
                value={v.article[k as keyof typeof v.article]}
                onChange={(e) =>
                  setV({ ...v, article: { ...v.article, [k]: e.target.value } })
                }
              />
            </label>
          ))}
        </section>
      </div>
      <aside className="editor-sidebar">
        <div className="sticky">
          <span className={"status " + state}>
            {state.replaceAll("_", " ")}
          </span>
          <h2>Keep the order clear.</h2>
          <ol>
            <li>Verify the source and approve the brief.</li>
            <li>Prepare and submit the article.</li>
            <li>Review once more, then publish.</li>
          </ol>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="editor-actions">
            {!id ? (
              <button disabled={busy} onClick={() => run("save")}>
                Create candidate
              </button>
            ) : (
              <>
                {!["published", "merged", "retracted", "rejected"].includes(
                  state,
                ) && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => run("save")}
                  >
                    Save draft
                  </button>
                )}
                {["candidate", "held"].includes(state) && (
                  <>
                    <button disabled={busy} onClick={() => run("release")}>
                      Approve and release brief
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => run("hold")}
                    >
                      Hold for more evidence
                    </button>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => run("reject")}
                    >
                      Reject candidate
                    </button>
                  </>
                )}
                {state === "brief_released" && (
                  <button disabled={busy} onClick={() => run("submit")}>
                    Submit article for review
                  </button>
                )}
                {state === "article_review" && (
                  <button disabled={busy} onClick={() => run("publish")}>
                    Approve and publish article
                  </button>
                )}
                {state === "published" && (
                  <>
                    <label>
                      Correction explanation
                      <textarea
                        value={correction}
                        onChange={(e) => setCorrection(e.target.value)}
                      />
                    </label>
                    <button disabled={busy} onClick={() => run("correct")}>
                      Publish recorded correction
                    </button>
                    <button
                      className="danger"
                      disabled={busy}
                      onClick={() => run("retract")}
                    >
                      Retract with this reason
                    </button>
                  </>
                )}
                {["candidate", "held"].includes(state) && (
                  <details>
                    <summary>Merge duplicate candidate</summary>
                    <label>
                      Target story ID
                      <input
                        value={mergeTarget}
                        onChange={(e) => setMergeTarget(e.target.value)}
                      />
                    </label>
                    <button disabled={busy} onClick={() => run("merge")}>
                      Merge into existing story
                    </button>
                  </details>
                )}
                {state === "rejected" && (
                  <button disabled={busy} onClick={() => run("reopen")}>
                    Reopen candidate
                  </button>
                )}
              </>
            )}
          </div>
          <details className="import">
            <summary>Import your research</summary>
            <p>
              Paste a JSON draft matching the fields below. It always remains
              subject to your review.
            </p>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              aria-label="Research JSON"
            />
            <button
              className="secondary"
              onClick={() => {
                try {
                  setV(storyInput.parse(JSON.parse(importText)));
                  setError("");
                } catch {
                  setError("Invalid research JSON. Use the supplied template.");
                }
              }}
            >
              Load into form
            </button>
            <a href="/research-template.json" download>
              Download draft template
            </a>
          </details>
        </div>
      </aside>
    </div>
  );
}
