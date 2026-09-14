"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { topics } from "@/lib/models";
import { send } from "./forms";
interface Reader {
  topics: string[];
  timezone: string;
  major_only: boolean;
  quiet_start: string;
  quiet_end: string;
  email_state: string;
  telegram_state: string;
}
export function SubscriptionForm({ reader }: { reader?: Reader }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(
    reader?.topics ?? ["ai", "coding"],
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [telegram, setTelegram] = useState(true),
    [email, setEmail] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const operation =
      (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ?? "save";
    try {
      const r = await send({
        action: reader ? "preferences" : "subscribe",
        operation,
        topics: selected,
        timezone: f.get("timezone"),
        major_only: f.get("major") === "on",
        quiet_start: f.get("quiet_start") ?? "",
        quiet_end: f.get("quiet_end") ?? "",
        email: email ? f.get("email") : "",
        telegram,
      });
      if (r.redirect) {
        router.push(r.redirect);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="subscription-form" onSubmit={submit}>
      <fieldset>
        <legend>What do you want to follow?</legend>
        <div className="topic-choices">
          {topics.map((t, i) => (
            <label
              key={t.key}
              className={
                selected.includes(t.key)
                  ? "topic-choice selected"
                  : "topic-choice"
              }
            >
              <span className="topic-index">0{i + 1}</span>
              <span>
                <strong>{t.name}</strong>
                <small>{t.description}</small>
              </span>
              <input
                type="checkbox"
                checked={selected.includes(t.key)}
                onChange={() =>
                  setSelected(
                    selected.includes(t.key)
                      ? selected.filter((x) => x !== t.key)
                      : [...selected, t.key],
                  )
                }
              />
            </label>
          ))}
        </div>
      </fieldset>
      {!reader && (
        <fieldset>
          <legend>How would you like your updates?</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={telegram}
              onChange={(e) => setTelegram(e.target.checked)}
            />{" "}
            Telegram briefs after editorial review
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={email}
              onChange={(e) => setEmail(e.target.checked)}
            />{" "}
            One daily email with article links
          </label>
          {email && (
            <label>
              Email address
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
          )}
        </fieldset>
      )}
      <fieldset>
        <legend>Your schedule</legend>
        <label>
          Timezone
          <input
            name="timezone"
            list="timezones"
            defaultValue={reader?.timezone ?? "Asia/Kolkata"}
            required
          />
        </label>
        <datalist id="timezones">
          {[
            "Asia/Kolkata",
            "Europe/London",
            "America/New_York",
            "America/Los_Angeles",
            "Asia/Singapore",
            "Australia/Sydney",
            "UTC",
          ].map((z) => (
            <option key={z}>{z}</option>
          ))}
        </datalist>
        <p className="caption">
          The daily digest is prepared at 9 PM in this timezone. Days without
          published updates are skipped.
        </p>
        <label className="check">
          <input
            type="checkbox"
            name="major"
            defaultChecked={reader?.major_only}
          />{" "}
          Only major developments on Telegram
        </label>
        {reader && (
          <div className="two-col">
            <label>
              Quiet hours start
              <input
                type="time"
                name="quiet_start"
                defaultValue={reader.quiet_start}
              />
            </label>
            <label>
              Quiet hours end
              <input
                type="time"
                name="quiet_end"
                defaultValue={reader.quiet_end}
              />
            </label>
          </div>
        )}
      </fieldset>
      <button disabled={busy}>
        {busy ? "Saving…" : reader ? "Save preferences" : "Continue →"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {reader && (
        <div className="channel-actions">
          <button
            className="secondary"
            value={reader.telegram_state === "active" ? "pause" : "resume"}
            disabled={busy}
          >
            {reader.telegram_state === "active"
              ? "Pause Telegram"
              : "Resume Telegram"}
          </button>
          <button className="secondary" value="stop" disabled={busy}>
            Stop Telegram
          </button>
          <button className="secondary" value="unsubscribe" disabled={busy}>
            Unsubscribe email
          </button>
          <details>
            <summary>Delete subscription</summary>
            <p>This removes your saved preferences and delivery identity.</p>
            <button className="danger" value="delete" disabled={busy}>
              Delete my subscription
            </button>
          </details>
        </div>
      )}
    </form>
  );
}
export function TelegramConnect({ preview }: { preview: boolean }) {
  const [link, setLink] = useState<{
      token: string;
      url: string | null;
    } | null>(null),
    [error, setError] = useState("");
  const router = useRouter();
  return (
    <div>
      <button
        className="secondary"
        onClick={async () => {
          try {
            setLink(await send({ action: "link" }));
          } catch (e) {
            setError(String(e));
          }
        }}
      >
        Create Telegram connection
      </button>
      {link && (
        <div className="notice">
          {link.url && (
            <a href={link.url} target="_blank" rel="noreferrer">
              Open the bot in Telegram ↗
            </a>
          )}
          {preview ? (
            <button
              onClick={async () => {
                try {
                  await send({ action: "preview-connect", token: link.token });
                  router.refresh();
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              Connect a local test chat
            </button>
          ) : (
            <p>
              Start the bot, then refresh this page to check the connection.
            </p>
          )}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
