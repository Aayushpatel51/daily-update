import { createStory, editStory } from "../src/lib/editorial";
import { initSources } from "../src/lib/monitor";
import { query, pool } from "../src/lib/db";
import { type StoryInput } from "../src/lib/models";
await initSources();
const examples = [
  [
    "ai",
    "A smaller language model, designed to run on your own machine",
    "A fictional research team introduces a compact model for offline experiments. This demonstration explores what a local release would mean, and which claims an editor should verify.",
  ],
  [
    "coding",
    "A familiar workflow, with fewer steps between idea and release",
    "A fictional developer tool adds a simpler release workflow. This demonstration separates the announced feature from assumptions about performance and reliability.",
  ],
  [
    "it-security",
    "A security advisory is only useful when the next step is clear",
    "A fictional advisory highlights a software issue and a proposed mitigation. This demonstration shows how affected versions and official guidance belong in a useful brief.",
  ],
  [
    "consumer-tech",
    "A device announcement is not the same as availability",
    "A fictional device maker previews a new product. This demonstration explains how an editor would distinguish an announcement, preorder and actual regional availability.",
  ],
  [
    "tech-business",
    "An acquisition announcement, and the questions still open",
    "Two fictional technology companies announce a proposed acquisition. This demonstration distinguishes the agreement from a completed transaction and its possible implications.",
  ],
] as const;
for (const [topic, title, brief] of examples) {
  const key = "demo:" + topic;
  if (
    (
      await query(
        "SELECT id FROM stories WHERE source_key=$1 AND state='published'",
        [key],
      )
    ).length
  )
    continue;
  const v: StoryInput = {
    title,
    topics: [topic],
    brief,
    article: {
      changed:
        "This is a fictional example created to test Daily Update. It illustrates a development that would first be supported by a primary source and reviewed by an editor. No company, product launch or research result described here is real.",
      audience:
        "This example is intended for people testing the application. Real stories must specify who can access a product, which regions and versions are affected, and whether availability has been confirmed. India-specific availability should be recorded when relevant.",
      matters:
        "A useful update connects the announcement to a concrete decision. In an actual story, this section would explain the practical implications while separating editorial interpretation from the evidence.",
      unknowns:
        "There are no verified external facts behind this demonstration. Do not cite it as news. Before approving a real story, open every source, check dates and numbers, and record any unanswered questions.",
    },
    evidence: [
      {
        url: "https://example.invalid/daily-update-demo/" + topic,
        note: "Synthetic fixture authored for local testing. This is not an external news source and is never presented as a real development.",
        publishedAt: "",
      },
    ],
    evidence_label: "Fictional demonstration, not news",
    major: false,
    synthetic: true,
  };
  let s = await createStory(v, key);
  if (s.state === "candidate")
    s = await editStory(s.id, s.revision, "release", v);
  if (s.state === "brief_released")
    s = await editStory(s.id, s.revision, "submit", v);
  if (s.state === "article_review")
    await editStory(s.id, s.revision, "publish", v);
}
console.log(
  "Five labelled demonstration articles are ready. Real monitoring remains disabled until source review.",
);
await pool().end();
