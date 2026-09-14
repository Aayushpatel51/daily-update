/** Permit the configured origin, plus its same-port HTTP loopback alias for local testing. */
export function allowedOrigin(origin: string | null, appUrl: string): boolean {
  if (origin === appUrl) return true;
  if (!origin || origin === "null") return false;
  try {
    const expected = new URL(appUrl);
    const actual = new URL(origin);
    const loopback = new Set(["127.0.0.1", "localhost"]);
    return (
      expected.protocol === "http:" &&
      actual.protocol === "http:" &&
      loopback.has(expected.hostname) &&
      loopback.has(actual.hostname) &&
      expected.port === actual.port &&
      actual.origin === origin
    );
  } catch {
    return false;
  }
}
