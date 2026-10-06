"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/pass-periods";
import Icon from "./Icon";

interface Status {
  status: "pending" | "paid" | "failed" | "abandoned";
  reference: string;
  kind: string;
  amount: number;
  description: string;
  invoiceNumber: string | null;
  passActive: boolean;
  courseId: string | null;
  authorizationUrl: string | null;
}

/** Polls one payment until it is final, then says plainly what happened. */
export default function VerifyPayment() {
  const params = useSearchParams();
  const reference = params.get("reference")?.trim() ?? "";
  const [state, setState] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState(0);
  const timer = useRef<number | null>(null);

  const poll = useCallback(async () => {
    if (!reference) {
      setError("No payment reference was given.");
      return;
    }
    try {
      const response = await fetch(`/api/checkout/status?reference=${encodeURIComponent(reference)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        // A signed-out student lands here from the provider: say so plainly.
        if (response.status === 401) {
          setError("Sign in to see this payment — it is attached to your account.");
          return;
        }
        setError(data?.error ?? "The payment could not be checked.");
        return;
      }
      setState(data as Status);
      setChecks((count) => count + 1);
    } catch {
      setError("The payment could not be checked. Check your connection and refresh.");
    }
  }, [reference]);

  useEffect(() => {
    void poll();
    timer.current = window.setInterval(() => {
      void poll();
    }, 4000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [poll]);

  useEffect(() => {
    if (state && state.status !== "pending" && timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    // After ~2 minutes of pending, stop polling but leave the page usable.
    if (checks >= 30 && timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, [state, checks]);

  // Where "continue" goes: a paid program opens the course library, anything
  // else the billing history (a failure to retry).
  const continueHref = state?.status === "paid" ? "/dashboard/courses" : "/dashboard/billing";

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center p-6">
      <div className="w-full rounded-[24px] border border-[#e5e1e8] bg-white p-8 text-center shadow-[0_18px_44px_rgba(31,24,45,.06)]">
        {error && !state ? (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-100 text-red-600">
              <Icon name="close" size={24} />
            </span>
            <h1 className="mt-5 text-xl font-black tracking-[-.035em]">Something went wrong</h1>
            <p className="mt-2 text-xs leading-5 text-[#756f7b]">{error}</p>
            <Link
              href="/dashboard/billing"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b1822] px-4 py-3 text-xs font-extrabold text-white"
            >
              Back to billing
            </Link>
          </>
        ) : !state ? (
          <>
            <span className="mx-auto grid size-14 animate-pulse place-items-center rounded-full bg-[#f0ecff] text-[#6d4aff]">
              <Icon name="clock" size={24} />
            </span>
            <h1 className="mt-5 text-xl font-black tracking-[-.035em]">Confirming your payment…</h1>
            <p className="mt-2 text-xs leading-5 text-[#756f7b]">
              The provider is confirming the money reached us. This usually takes a few seconds — do not close
              this page.
            </p>
          </>
        ) : state.status === "paid" ? (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Icon name="check" size={26} />
            </span>
            <h1 className="mt-5 text-xl font-black tracking-[-.035em]">Payment confirmed</h1>
            <p className="mt-2 text-xs leading-5 text-[#756f7b]">
              {state.description} — <strong>{formatMoney(state.amount)}</strong>
              {state.invoiceNumber ? (
                <>
                  {" "}· invoice <strong className="font-mono">{state.invoiceNumber}</strong>
                </>
              ) : null}
              . A receipt is on its way to your email.
            </p>
            <Link
              href={continueHref}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-xs font-extrabold text-white"
            >
              Open my courses
              <Icon name="arrow-right" size={14} />
            </Link>
            <p className="mt-3 font-mono text-[10px] text-[#918a97]">Ref {state.reference}</p>
          </>
        ) : state.status === "failed" || state.status === "abandoned" ? (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-100 text-red-600">
              <Icon name="close" size={24} />
            </span>
            <h1 className="mt-5 text-xl font-black tracking-[-.035em]">Payment did not go through</h1>
            <p className="mt-2 text-xs leading-5 text-[#756f7b]">
              No money left your account for <strong>{state.description}</strong>. This usually means the MoMo
              approval expired, was declined, or had insufficient funds — try again.
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-xs font-extrabold text-white"
            >
              Try again <Icon name="arrow-right" size={14} />
            </Link>
            <p className="mt-3 font-mono text-[10px] text-[#918a97]">Ref {state.reference}</p>
          </>
        ) : (
          <>
            <span className="mx-auto grid size-14 animate-pulse place-items-center rounded-full bg-[#ffcf59]/25 text-[#8a6d00]">
              <Icon name="mobile" size={24} />
            </span>
            <h1 className="mt-5 text-xl font-black tracking-[-.035em]">Waiting for approval…</h1>
            <p className="mt-2 text-xs leading-5 text-[#756f7b]">
              Approve the <strong>{formatMoney(state.amount)}</strong> charge for{" "}
              <strong>{state.description}</strong> with your MoMo PIN. This page confirms itself the moment
              the provider reports the payment.
            </p>
            {state.authorizationUrl && (
              <a
                href={state.authorizationUrl}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#ded9e3] px-4 py-3 text-xs font-extrabold text-[#655f6b]"
              >
                Back to the payment page
              </a>
            )}
            {checks >= 30 && (
              <p className="mt-4 text-[10px] leading-5 text-[#918a97]">
                Still waiting after a few minutes? If you approved on your phone, the money is safe — refresh
                this page or check your billing history.
              </p>
            )}
            <p className="mt-3 font-mono text-[10px] text-[#918a97]">Ref {state.reference}</p>
          </>
        )}
      </div>
    </div>
  );
}
