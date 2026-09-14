import { SubscriptionForm } from "@/components/subscription-form";
export default async function Subscribe({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  return (
    <div className="form-layout shell">
      <div className="form-intro">
        <p className="eyebrow">A little more informed</p>
        <h1>
          Your world.
          <br />
          <em>Your update.</em>
        </h1>
        <p>
          Follow the fields that matter to you. We’ll keep the updates useful
          and the controls simple.
        </p>
        <div className="process-note">
          <p>
            <strong>First, the brief.</strong>
            <br />
            Telegram after a development is verified.
          </p>
          <p>
            <strong>Then, the context.</strong>
            <br />A full article and an optional daily email.
          </p>
        </div>
      </div>
      <div>
        {(await searchParams).requested && (
          <p className="notice">
            If this email is already subscribed, use your existing preferences
            link or Telegram settings. No new account has been linked.
          </p>
        )}
        <SubscriptionForm />
      </div>
    </div>
  );
}
