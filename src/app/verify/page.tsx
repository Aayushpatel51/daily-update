import { ActionForm } from "@/components/forms";
export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <div className="narrow page-heading">
      <p className="eyebrow">One last step</p>
      <h1>Confirm your email.</h1>
      <p>
        Activate your optional daily digest. You can unsubscribe at any time.
      </p>
      <ActionForm
        action="verify"
        values={{ token: (await searchParams).token ?? "" }}
        label="Confirm my subscription"
      />
    </div>
  );
}
