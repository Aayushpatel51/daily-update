import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { session } from "./security";
export async function currentUser() {
  return session((await cookies()).get("daily_session")?.value);
}
export async function requireEditor() {
  const user = await currentUser();
  if (user?.role !== "editor") redirect("/admin/login");
  return user;
}
