import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { observe, sourceId } from "./core.ts";
import { probe } from "./store.ts";

const args = process.argv.slice(2);
try {
  if (args.length === 1 && args[0] === "--demo") {
    for (const [id, file] of [
      ["S07", "github.xml"],
      ["S12", "kev.json"],
      ["S14", "google.xml"],
    ]) {
      if (!id || !file) throw new Error("invalid_fixture");
      const body = await readFile(
        new URL(`./fixtures/${file}`, import.meta.url),
        "utf8",
      );
      const baseline = observe(sourceId(id), body);
      const repeat = observe(sourceId(id), body, baseline.cursor);
      console.log(
        JSON.stringify({
          synthetic: true,
          source: id,
          records: baseline.records,
          firstRun: baseline.status,
          repeatRun: repeat.status,
          candidates: repeat.candidates,
        }),
      );
    }
  } else if (
    args.length === 3 &&
    args[0] === "--live" &&
    args[2] === "--acknowledge-access-review"
  ) {
    const id = sourceId(args[1] ?? "");
    const directory = fileURLToPath(
      new URL("../../tmp/source-monitor/", import.meta.url),
    );
    console.log(JSON.stringify(await probe(id, directory), null, 2));
  } else {
    throw new Error(
      "usage: npm run demo OR npm run probe -- S07|S12|S14 --acknowledge-access-review",
    );
  }
} catch (error) {
  // Do not echo arbitrary source content, URLs from errors, or transport internals.
  const message = error instanceof Error ? error.message : "";
  const safe = /^(?:[a-z_]+|http_\d{3}|usage:.*)$/.test(message)
    ? message
    : "experiment_failed";
  console.error(JSON.stringify({ status: "failed", reason: safe }));
  process.exitCode = 1;
}
