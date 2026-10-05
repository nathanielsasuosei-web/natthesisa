import { NextRequest, NextResponse } from "next/server";
import {
  fulfillPayment,
  getPayment,
  markPaymentFailed,
} from "@/lib/payments";
import { isPaystackConfigured, parseWebhookEvent, verifyWebhookSignature } from "@/lib/paystack";

/**
 * Paystack webhook — the source of truth for live payments.
 *
 * Configure it in the Paystack dashboard as:
 *   `https://<your-domain>/api/webhooks/paystack`
 *
 * Every delivery is signature-checked (HMAC-SHA512 of the raw body under the
 * secret key) before anything is read from it. `charge.success` fulfils the
 * payment idempotently — the return-URL verification may already have done so,
 * in which case this is a no-op. Anything else is acknowledged and ignored.
 *
 * Always answers 200 once the signature checks out, so Paystack stops
 * retrying; failures are logged for the teacher to reconcile from the
 * console's payment list.
 */
export async function POST(req: NextRequest) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("[codemasterghana] paystack webhook rejected: bad signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = parseWebhookEvent(rawBody);
  if (!event) return NextResponse.json({ ok: true });

  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true });
  }

  const data = event.data;
  const eventId = `paystack:${data.id}`;
  try {
    const payment = await getPayment(data.reference);
    if (!payment) {
      // Not one of ours (a test delivery from the dashboard, or another
      // integration sharing the key). Acknowledge so it is not retried.
      console.warn(`[codemasterghana] paystack webhook for unknown reference ${data.reference}`);
      return NextResponse.json({ ok: true });
    }

    // Belt and braces: the money must match what checkout asked for.
    const paidPesewas = Math.round(Number(data.amount ?? 0));
    const expectedPesewas = Math.round(payment.amount * 100);
    if (data.currency !== "GHS" || paidPesewas < expectedPesewas || data.status !== "success") {
      console.error(
        `[codemasterghana] paystack webhook amount mismatch for ${data.reference}: ` +
          `got ${data.amount} ${data.currency} (${data.status}), expected ${expectedPesewas} pesewas`
      );
      await markPaymentFailed(data.reference);
      return NextResponse.json({ ok: true });
    }

    const auth = data.authorization;
    await fulfillPayment(data.reference, {
      providerEventId: eventId,
      channel: (data.channel as "mobile_money" | "card" | "bank_transfer" | "ussd" | "qr" | "bank") ?? "mobile_money",
      brand:
        auth?.brand ??
        (data.channel === "mobile_money" ? (payment.network ?? "Mobile Money") : undefined),
      last4: auth?.last4 ?? (auth?.mobile_money_number ? auth.mobile_money_number.slice(-4) : undefined),
      phone: auth?.mobile_money_number ?? payment.phone ?? undefined,
      paidAt: data.paid_at ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[codemasterghana] paystack webhook fulfilment failed for ${data.reference}`, error);
    // Still acknowledge: the return-URL verification fulfils independently,
    // and the teacher can see the pending row in the console. A 500 here
    // would only cause Paystack to retry the same delivery.
    return NextResponse.json({ ok: true });
  }
}
