import Link from "next/link";
import { ActionForm } from "./forms";
export function AdminNav() {
  return (
    <div className="admin-nav">
      <nav aria-label="Editorial navigation">
        <Link href="/admin">Review queue</Link>
        <Link href="/admin/story/new">Add candidate</Link>
        <Link href="/admin/sources">Sources</Link>
        <Link href="/admin/deliveries">Deliveries</Link>
        <Link href="/admin/operations">Operations</Link>
      </nav>
      <ActionForm action="logout" label="Sign out" />
    </div>
  );
}
