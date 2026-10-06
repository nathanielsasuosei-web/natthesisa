import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import {
  CheckoutError,
  createCheckout,
  describeCheckoutFailure,
  quoteCheckout,
} from "@/lib/payments";
import { PurchaseError } from "@/lib/purchases";
import { checkMomoPhone, isMomoNetwork } from "@/lib/momo";
import { isPaystackConfigured } from "@/lib/paystack";

/**
 * Starts a checkout — the one door money enters through.
 *
 *   POST /api/checkout
 *   { kind: "program", programId, phone, network }
 *
 * Programs are the only checkout: passes, courses and lessons are retired
 * and the quote refuses them, while payments already in flight still fulfil.
 *
 * With Paystack configured the response carries an `authorizationUrl`: the
 * student's browser goes there, pays with Mobile Money / card / bank transfer
 * on Paystack's page, and comes back to `/api/checkout/callback`. Without a
 * provider the response is `{ demo: true }` and the UI simulates the MoMo
 * approval prompt instead (see `/api/checkout/confirm`).
 */

// A checkout may never be answered from a cache: the `live` flag decides
// whether the modal sends the student to Paystack or offers the demo prompt.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(req: NextRequest) {
  try {
    return await startCheckout(req);
  } catch (error) {
    if (error instanceof PurchaseError || error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    // Anything reaching here is a bug or a database the app has not met
    // before. It must still be JSON — a Next.js HTML error page is what made
    // this endpoint report "The checkout could not be started." with no way to
    // find out why — and it must say which layer refused, not just that
    // something did.
    console.error("[codemasterghana] checkout failed", error);
    return NextResponse.json(
      { error: `The checkout could not be started — ${describeCheckoutFailure(error)}.`, code: "CHECKOUT_FAILED" },
      { status: 500, headers: NO_STORE }
    );
  }
}

async function startCheckout(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to pay for this." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const kind =
    body.kind === "pass" || body.kind === "course" || body.kind === "lesson" || body.kind === "program"
      ? body.kind
      : null;
  if (!kind) {
    return NextResponse.json({ error: "Say what you are buying." }, { status: 400 });
  }

  const period = typeof body.period === "string" ? body.period : undefined;
  const courseId = typeof body.courseId === "string" ? body.courseId : undefined;
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : undefined;
  const programId = typeof body.programId === "string" ? body.programId : undefined;

  // The MoMo number is how we address the approval prompt (and the receipt).
  // It is validated here and stored on the payment row either way.
  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  const phoneCheck = rawPhone.trim() ? checkMomoPhone(rawPhone) : null;
  if (rawPhone.trim() && phoneCheck && !phoneCheck.ok) {
    return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
  }
  const network =
    typeof body.network === "string" && isMomoNetwork(body.network)
      ? body.network
      : (phoneCheck?.network ?? undefined);

  // Quote first so "already owned" answers before any row is written.
  quoteCheckout(user, { kind, period, courseId, lessonId, programId });
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || req.nextUrl.origin;
  const checkout = await createCheckout(
    user,
    { kind, period, courseId, lessonId, programId, phone: phoneCheck?.phone ?? undefined, network },
    { callbackBaseUrl: base }
  );
  return NextResponse.json(
    {
      ok: true,
      demo: checkout.demo,
      reference: checkout.payment.reference,
      amount: checkout.payment.amount,
      currency: checkout.payment.currency,
      description: checkout.payment.description,
      authorizationUrl: checkout.authorizationUrl,
    },
    { headers: NO_STORE }
  );
}

/** Whether live payments are on, so the checkout UI can say so honestly. */
export async function GET() {
  return NextResponse.json({ ok: true, live: isPaystackConfigured() }, { headers: NO_STORE });
}
