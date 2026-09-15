import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { subscriber } from "@/lib/subscriptions";
import { config } from "@/lib/config";
import {
  SubscriptionForm,
  TelegramConnect,
} from "@/components/subscription-form";
import { ActionForm } from "@/components/forms";
export const dynamic = "force-dynamic";
export default async function Preferences() {
  const user = await currentUser(),
    s = user?.subscriber_id ? await subscriber(user.subscriber_id) : null;
  if (!s)
    return (
      <div className="narrow page-heading">
        <h1>Your preferences</h1>
        <p>
          Open the private preferences link from your Telegram bot, or start a
          subscription on this browser.
        </p>
        <ActionForm action="recover-email" label="Request a private email link">
          <label>
            Email address
            <input type="email" name="email" required />
          </label>
        </ActionForm>
        <Link className="button" href="/subscribe">
          Choose your topics
        </Link>
      </div>
    );
  return (
    <div className="form-layout shell">
      <div className="form-intro">
        <p className="eyebrow">Always in your control</p>
        <h1>
          Your update,
          <br />
          <em>your way.</em>
        </h1>
        <div className="status-block">
          <p>
            Telegram <strong>{s.telegram_state}</strong>
          </p>
          <p>
            Daily email <strong>{s.email_state}</strong>
          </p>
        </div>
        {s.email_state === "off" && (
          <ActionForm action="add-email" label="Add daily email">
            <label>
              Email address
              <input
                type="email"
                name="email"
                defaultValue={s.email ?? ""}
                required
              />
            </label>
          </ActionForm>
        )}
        {!s.chat_id && (
          <TelegramConnect preview={config().DELIVERY_MODE === "preview"} />
        )}{" "}
        {s.email_state === "unverified" && (
          <div className="notice">
            <p>
              Confirm your email using its verification link. In local testing,
              it appears in the editor’s delivery previews. In the live pilot,
              check your configured test inbox.
            </p>
            <ActionForm
              action="verify-again"
              label="Create a new verification link"
            />
          </div>
        )}
      </div>
      <SubscriptionForm
        reader={{
          topics: s.topics,
          timezone: s.timezone,
          major_only: s.major_only,
          quiet_start: s.quiet_start,
          quiet_end: s.quiet_end,
          email_state: s.email_state,
          telegram_state: s.telegram_state,
        }}
      />
    </div>
  );
}
