import { NextRequest, NextResponse } from "next/server";
import { getPayment, verifyAndFulfill } from "@/lib/payments";

/**
 * Where Paystack returns the student's browser after payment.
 *
 * Paystack appends `?trxref=<reference>&reference=<reference>`. This route
 * verifies the transaction against Paystack's API (a redirect URL proves
 * nothing on its own — only the API answer counts), fulfils the purchase when
 * the money is confirmed, and redirects to the verify page, which shows the
 * outcome and polls until it is final.
 */
export async function GET(req: NextRequest) {
  const reference =
    req.nextUrl.searchParams.get("reference")?.trim() ||
    req.nextUrl.searchParams.get("trxref")?.trim() ||
    "";
  const verifyUrl = (status: string) =>
    `${req.nextUrl.origin}/checkout/verify?reference=${encodeURIComponent(reference)}&from=${status}`;

  if (!reference) {
    return NextResponse.redirect(`${req.nextUrl.origin}/dashboard/billing?checkout=missing`);
  }

  try {
    const payment = await getPayment(reference);
    if (!payment) {
      return NextResponse.redirect(`${req.nextUrl.origin}/dashboard/billing?checkout=unknown`);
    }
    if (payment.provider !== "paystack") {
      return NextResponse.redirect(verifyUrl("demo"));
    }
    const outcome = await verifyAndFulfill(reference);
    return NextResponse.redirect(verifyUrl(outcome.payment.status));
  } catch (error) {
    console.error("[codemasterghana] checkout callback failed", error);
    // Never strand the student on an error page: the verify page polls the
    // provider again, and the webhook fulfils independently.
    return NextResponse.redirect(verifyUrl("pending"));
  }
}
