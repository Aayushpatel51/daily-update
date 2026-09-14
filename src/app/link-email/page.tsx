import { ActionForm } from "@/components/forms";
export default async function LinkEmail({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <div className="narrow page-heading">
      <p className="eyebrow">Connect your daily email</p>
      <h1>Keep your updates together.</h1>
      <p>
        Move this email to the subscription where you requested the link. Your
        current topics, timezone and Telegram connection stay unchanged. The
        earlier subscription stops daily email; its Telegram settings and
        history are preserved.
      </p>
      <p>
        Open this page in the same subscriber browser that requested the link.
        In this local MVP, email is captured in the editor’s delivery previews.
      </p>
      <ActionForm
        action="confirm-email-link"
        values={{ token: (await searchParams).token ?? "" }}
        label="Confirm and link my email"
      />
    </div>
  );
}
