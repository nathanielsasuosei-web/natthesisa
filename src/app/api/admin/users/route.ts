import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/session";
import { computeStats, estimateMrr, toAdminRow } from "@/lib/admin";
import { getStore } from "@/lib/store";

/** Admin-only: list every account plus site-wide stats. */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required.", code: "FORBIDDEN" }, { status: 403 });
  }
  const users = [...getStore().users.values()]
    .map(toAdminRow)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return NextResponse.json({ users, stats: computeStats(), mrr: estimateMrr() });
}
