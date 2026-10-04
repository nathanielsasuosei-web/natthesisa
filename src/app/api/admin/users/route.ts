import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/session";
import { computeStats, estimateMrr, toAdminRow } from "@/lib/admin";
import { listUsers } from "@/lib/store";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const users = (await listUsers()).map(toAdminRow);
  return NextResponse.json({ users, stats: await computeStats(), mrr: await estimateMrr() });
}
