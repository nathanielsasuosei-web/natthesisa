import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/session";
import { computeStats, estimateMrr, toAdminRow } from "@/lib/admin";
import { getStore } from "@/lib/store";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const users = [...getStore().users.values()]
    .map(toAdminRow)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ users, stats: computeStats(), mrr: estimateMrr() });
}
