import { ActionForm } from "@/components/forms";
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const p = await searchParams;
  return (
    <div className="narrow page-heading">
      <h1>A quieter inbox.</h1>
      <p>Stop daily emails. This won’t change your Telegram subscription.</p>
      <ActionForm
        action="unsubscribe"
        values={{ id: p.id ?? "", token: p.token ?? "" }}
        label="Unsubscribe from email"
      />
    </div>
  );
}
