import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { config } from "@/lib/config";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await query<{ slug: string; updated_at: Date }>(
    "SELECT slug,updated_at FROM stories WHERE state='published'",
  );
  return rows.map((r) => ({
    url: config().APP_URL + "/articles/" + r.slug,
    lastModified: r.updated_at,
  }));
}
