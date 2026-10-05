import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyPayment from "@/components/VerifyPayment";

export const metadata: Metadata = { title: "Confirming your payment" };

export const dynamic = "force-dynamic";

/**
 * Where the student lands after paying.
 *
 * Paystack returns the browser to `/api/checkout/callback`, which verifies
 * and redirects here with the reference. This page then polls
 * `/api/checkout/status` until the payment is final — paid, failed, or still
 * pending — so a slow provider response never looks like lost money.
 */
export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center p-6">
          <p className="text-sm font-bold text-[#756f7b]">Confirming your payment…</p>
        </div>
      }
    >
      <VerifyPayment />
    </Suspense>
  );
}
