import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { CheckoutError, getPayment, verifyAndFulfill } from "@/lib/payments";
import { hasActivePass } from "@/lib/access";
import { getUserById } from "@/lib/store";

/**
 * Polls a payment: `GET /api/checkout/status?reference=CMG-…`.
 *
 * Used by the verify page while the student waits. For live payments this
 * re-checks Paystack on every call and fulfils the moment the money is
 * confirmed — so even if the webhook is slow (or the student closed the
 * Paystack tab right after approving), the purchase still lands. Students can
 * only poll their own references; the owner can poll any.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to check a payment." }, { status: 401 });

  const reference = req.nextUrl.searchParams.get("reference")?.trim() ?? "";
  if (!reference) return NextResponse.json({ error: "A payment reference is needed." }, { status: 400 });

  try {
    const payment = await getPayment(reference);
    if (!payment) return NextResponse.json({ error: "That payment does not exist." }, { status: 404 });
    const mine = payment.userId === user.id;
    const owner = user.role === "owner";
    if (!mine && !owner) return NextResponse.json({ error: "That payment is not yours." }, { status: 403 });

    // Live + still pending: ask the provider — the money may have landed
    // since the row was last checked.
    if (payment.provider === "paystack" && payment.status === "pending") {
      try {
        const outcome = await verifyAndFulfill(reference);
        const holder = await getUserById(outcome.payment.userId);
        return NextResponse.json({
          ok: true,
          status: outcome.payment.status,
          reference: outcome.payment.reference,
          kind: outcome.payment.kind,
          amount: outcome.payment.amount,
          description: outcome.payment.description,
          invoiceNumber: outcome.payment.invoiceNumber,
          passActive: holder ? hasActivePass(holder) : false,
          courseId: outcome.payment.courseId,
        });
      } catch (error) {
        // Verification failing must not fail the poll: the webhook may still
        // confirm the payment. Report the stored state instead.
        console.error("[codemasterghana] payment verification failed", error);
      }
    }

    const current = (await getPayment(reference))!;
    const holder = await getUserById(current.userId);
    return NextResponse.json({
      ok: true,
      status: current.status,
      reference: current.reference,
      kind: current.kind,
      amount: current.amount,
      description: current.description,
      invoiceNumber: current.invoiceNumber,
      passActive: holder ? hasActivePass(holder) : false,
      courseId: current.courseId,
      authorizationUrl: current.status === "pending" ? current.authorizationUrl : null,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[codemasterghana] payment status failed", error);
    return NextResponse.json({ error: "The payment could not be checked." }, { status: 500 });
  }
}
