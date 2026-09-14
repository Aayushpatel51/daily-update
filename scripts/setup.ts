import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { access, writeFile } from "node:fs/promises";
const secret = () => randomBytes(24).toString("hex");
try {
  await access(".env");
  console.log("Existing .env preserved.");
} catch {
  await writeFile(
    ".env",
    `APP_URL=http://127.0.0.1:3000\nDATABASE_URL=postgresql://daily:${secret()}@127.0.0.1:54329/daily_update\nADMIN_PASSWORD=${secret()}\nSESSION_SECRET=${secret()}\nDELIVERY_MODE=preview\nTELEGRAM_BOT_TOKEN=\nTELEGRAM_BOT_NAME=\nTELEGRAM_ALLOWLIST=\nEDITOR_CHAT_ID=\n`,
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    "Created private .env. Read ADMIN_PASSWORD there to sign in; do not commit it.",
  );
}

const platform = process.platform === "win32" ? "windows" : process.platform;
const binary = resolve(
  "node_modules/@embedded-postgres/" + platform + "-" + process.arch,
);
const result = spawnSync(process.execPath, ["scripts/hydrate-symlinks.js"], {
  cwd: binary,
  stdio: "ignore",
});
if (result.status !== 0)
  console.log(
    "Bundled PostgreSQL setup unavailable on this platform; see the external PostgreSQL option in LOCAL_TESTING.md.",
  );
