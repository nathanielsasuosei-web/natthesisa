import { NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import { computeOwnerStats, estimateMonthlyRevenue, toStudentRow } from "@/lib/owner-console";
import { listUsers } from "@/lib/store";

/** The owner's student list, with the platform-wide figures beside it. */
export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const users = (await listUsers()).map(toStudentRow);
  return NextResponse.json({
    users,
    stats: await computeOwnerStats(),
    monthlyValue: await estimateMonthlyRevenue(),
  });
}
