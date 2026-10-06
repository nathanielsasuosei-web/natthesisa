import { NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { countPendingPayments, listRecentPayments } from "@/lib/payments";
import { isPaystackConfigured, paystackKeyMode } from "@/lib/paystack";

/** The teacher's payment register: provider status + recent checkouts. */
export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json({ error: "Owner only.", code: "OWNER_ONLY" }, { status: 403 });
  const [payments, pending] = await Promise.all([listRecentPayments(50), countPendingPayments()]);
  return NextResponse.json({
    ok: true,
    provider: isPaystackConfigured() ? "paystack" : "demo",
    keyMode: paystackKeyMode(),
    pending,
    payments,
  });
}
