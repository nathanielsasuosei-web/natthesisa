import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { CheckoutError, confirmDemoPayment } from "@/lib/payments";

/**
 * Completes a DEMO payment — the "I approved on my phone" button.
 *
 * Only exists while no provider is configured. The moment
 * `PAYSTACK_SECRET_KEY` is set this endpoint refuses everything, so a demo
 * confirm can never mint a real entitlement.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to complete a payment." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  if (!reference) return NextResponse.json({ error: "A payment reference is needed." }, { status: 400 });

  try {
    const fulfilment = await confirmDemoPayment(reference, user.id);
    return NextResponse.json({
      ok: true,
      alreadyPaid: fulfilment.alreadyPaid,
      reference: fulfilment.payment.reference,
      invoiceNumber: fulfilment.invoiceNumber,
      passActive: fulfilment.passActive,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] demo confirm failed", error);
    return NextResponse.json({ error: "The payment could not be completed." }, { status: 500 });
  }
}
