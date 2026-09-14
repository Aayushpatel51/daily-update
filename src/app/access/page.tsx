import { ActionForm } from "@/components/forms";
export default async function Access({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <div className="narrow page-heading">
      <h1>Open your preferences.</h1>
      <p>This private link expires after 30 minutes and works once.</p>
      <ActionForm
        action="access"
        values={{ token: (await searchParams).token ?? "" }}
        label="Continue to preferences"
      />
    </div>
  );
}
