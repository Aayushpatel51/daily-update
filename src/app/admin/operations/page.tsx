import { requireEditor } from "@/lib/auth";
import { query } from "@/lib/db";
import { config } from "@/lib/config";
import { AdminNav } from "@/components/admin-nav";
import { ActionForm } from "@/components/forms";
export const dynamic = "force-dynamic";
export default async function Operations() {
  await requireEditor();
  const sw = (
    await query<{ value: Record<string, boolean> }>(
      "SELECT value FROM settings WHERE key='switches'",
    )
  )[0].value;
  const worker = (
    await query<{ value: { lastRun: string } }>(
      "SELECT value FROM settings WHERE key='worker'",
    )
  )[0];
  return (
    <div className="shell admin">
      <AdminNav />
      <div className="page-heading compact">
        <p className="eyebrow">Local operations</p>
        <h1>Stay in control.</h1>
        <p>
          Independent switches let you pause a stage without losing its pending
          work.
        </p>
      </div>
      <div className="metrics">
        <div>
          <strong>$0</strong>
          <span>Paid-service budget</span>
        </div>
        <div>
          <strong>{config().DELIVERY_MODE}</strong>
          <span>Telegram mode</span>
        </div>
        <div>
          <strong>{config().EMAIL_MODE}</strong>
          <span>Email delivery</span>
        </div>
      </div>
      <p>Last worker cycle: {worker?.value.lastRun ?? "Not run yet"}</p>
      <ActionForm action="tick" label="Run a worker cycle" />
      {Object.entries(sw).map(([key, enabled]) => (
        <div className="operation" key={key}>
          <div>
            <h2>{key}</h2>
            <p>{enabled ? "Enabled" : "Paused"}</p>
          </div>
          <ActionForm
            action="switch"
            values={{ key, enabled: !enabled }}
            label={enabled ? "Pause" : "Enable"}
          />
        </div>
      ))}
      <section className="notice">
        <h2>Testing boundaries</h2>
        <p>
          No hosted search, model or paid broadcast API is enabled. Research is
          imported by the editor. Telegram sandbox sends require a bot token and
          an explicit recipient allowlist in .env. Email stays captured locally.
        </p>
        <p>
          For backups and recovery, follow docs/LOCAL_TESTING.md. This
          installation is not approved for public launch.
        </p>
      </section>
    </div>
  );
}
