import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { observe, readCursor } from "./core.ts";
import type { SourceId, Cursor } from "./core.ts";
import { retrieve } from "./transport.ts";

function missing(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
export async function loadCursor(
  directory: string,
  id: SourceId,
): Promise<Cursor | undefined> {
  const path = join(directory, `${id}.json`);
  try {
    if ((await stat(path)).size > 8 * 1024 * 1024)
      throw new Error("state_limit");
    return readCursor(JSON.parse(await readFile(path, "utf8")), id);
  } catch (error) {
    if (missing(error)) return undefined;
    throw error;
  }
}
export async function withLock<T>(
  directory: string,
  id: SourceId,
  action: () => Promise<T>,
): Promise<T> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const lock = join(directory, `${id}.lock`);
  try {
    await mkdir(lock);
  } catch {
    throw new Error("source_locked");
  }
  try {
    return await action();
  } finally {
    await rm(lock, { recursive: true });
  }
}
async function saveCursor(
  directory: string,
  id: SourceId,
  cursor: Cursor,
): Promise<void> {
  const temp = join(directory, `${id}.${randomUUID()}.tmp`);
  try {
    await writeFile(temp, JSON.stringify(cursor, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    });
    await rename(temp, join(directory, `${id}.json`));
  } finally {
    await rm(temp, { force: true });
  }
}
export async function probe(
  id: SourceId,
  directory: string,
  fetcher: typeof retrieve = retrieve,
) {
  return withLock(directory, id, async () => {
    const previous = await loadCursor(directory, id);
    const reply = await fetcher(id, previous);
    const observedAt = new Date().toISOString();
    if (reply.status === 304) {
      if (!previous) throw new Error("unexpected_304");
      return {
        source: id,
        observedAt,
        status: "unchanged",
        httpStatus: 304,
        finalUrl: reply.finalUrl,
        candidates: [],
      };
    }
    const result = observe(id, reply.body, previous, {
      etag: reply.headers.etag,
      modified: reply.headers["last-modified"],
    });
    await saveCursor(directory, id, result.cursor);
    return {
      source: id,
      observedAt,
      status: result.status,
      httpStatus: reply.status,
      finalUrl: reply.finalUrl,
      documentHash: result.cursor.documentHash,
      records: result.records,
      candidates: result.candidates,
    };
  });
}
