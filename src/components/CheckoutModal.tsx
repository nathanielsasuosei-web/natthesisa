"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/pass-periods";
import {
  MOMO_NETWORKS,
  MOMO_NETWORK_LABEL,
  checkMomoPhone,
  detectNetwork,
  formatPhone,
  normalizeGhanaPhone,
  type MomoNetwork,
} from "@/lib/momo";
import Icon from "./Icon";

export interface CheckoutPayload {
  kind: "pass" | "course" | "lesson" | "program";
  period?: string;
  courseId?: string;
  lessonId?: string;
  programId?: string;
}

interface Props {
  title: string;
  subtitle: string;
  amount: number;
  payload: CheckoutPayload;
  /** Last MoMo number on the account, pre-filled when there is one. */
  defaultPhone?: string;
  defaultNetwork?: string;
  successMessage: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "details" | "redirecting" | "demo-wait" | "done";

const NETWORK_STYLE: Record<MomoNetwork, { badge: string; ring: string }> = {
  MTN: { badge: "bg-[#ffcc00] text-[#1a1a1a]", ring: "border-[#ffcc00] ring-2 ring-[#ffcc00]/40" },
  Telecel: { badge: "bg-[#e40000] text-white", ring: "border-[#e40000] ring-2 ring-[#e40000]/25" },
  AirtelTigo: { badge: "bg-[#0057a8] text-white", ring: "border-[#0057a8] ring-2 ring-[#0057a8]/25" },
};

/**
 * Paying for a pass, a course or a lesson with Mobile Money.
 *
 * The student picks their network and enters the number to charge. With live
 * payments on, the browser then moves to Paystack's secure page, where the
 * MoMo approval (or card / bank transfer) happens — the PIN is entered on the
 * student's own phone, never here. Without a provider configured, the approval
 * prompt is simulated so the whole flow can be tried end to end.
 */
export default function CheckoutModal({
  title,
  subtitle,
  amount,
  payload,
  defaultPhone,
  defaultNetwork,
  successMessage,
  onClose,
  onSuccess,
}: Props) {
  const [network, setNetwork] = useState<MomoNetwork | null>(
    defaultNetwork === "MTN" || defaultNetwork === "Telecel" || defaultNetwork === "AirtelTigo"
      ? defaultNetwork
      : "MTN"
  );
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [step, setStep] = useState<Step>("details");
  const [live, setLive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/checkout")
      .then((response) => response.json().catch(() => ({})))
      .then((data) => {
        if (!cancelled) setLive(data?.live === true);
      })
      .catch(() => {
        if (!cancelled) setLive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Typing a number from another network follows the number, not the button.
  useEffect(() => {
    const normalized = normalizeGhanaPhone(phone);
    if (!normalized) return;
    const detected = detectNetwork(normalized);
    if (detected && detected !== network) setNetwork(detected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const phoneCheck = useMemo(() => (phone.trim() ? checkMomoPhone(phone) : null), [phone]);

  async function startCheckout() {
    if (busy) return;
    const check = checkMomoPhone(phone);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    if (!network) {
      setError("Choose your Mobile Money network.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, phone: check.phone, network }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "The checkout could not be started.");
        setBusy(false);
        return;
      }
      setReference(data.reference ?? null);
      if (data.authorizationUrl) {
        setStep("redirecting");
        setBusy(false);
        // A beat so the student sees where they are going, then hand over.
        window.setTimeout(() => {
          window.location.href = data.authorizationUrl as string;
        }, 900);
        return;
      }
      // Demo mode: simulate the MoMo approval prompt on their phone.
      setStep("demo-wait");
      setBusy(false);
    } catch {
      setError("The checkout could not be started. Check your connection and try again.");
      setBusy(false);
    }
  }

  async function confirmDemo() {
    if (!reference || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "The payment could not be completed.");
        setBusy(false);
        return;
      }
      setStep("done");
      setBusy(false);
    } catch {
      setError("The payment could not be completed. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#15121c]/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy && step !== "redirecting") onClose();
      }}
    >
      <div role="dialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#ece8ef] p-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#6d4aff]">
              {step === "done" ? "Payment complete" : "Secure checkout"}
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-[-.035em]">{step === "done" ? "Thank you!" : title}</h2>
          </div>
          {step !== "redirecting" && (
            <button
              onClick={() => !busy && (step === "done" ? onSuccess() : onClose())}
              className="grid size-8 place-items-center rounded-lg bg-[#f3f1f5] text-[#77717e]"
              aria-label="Close"
            >
              <Icon name="close" size={15} />
            </button>
          )}
        </div>

        <div className="p-6">
          {step !== "done" && step !== "demo-wait" && (
            <>
              <div className="rounded-2xl bg-[#f7f5fa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold">{title}</p>
                    <p className="mt-1 text-[10px] text-[#918a97]">{subtitle}</p>
                  </div>
                  <p className="shrink-0 text-lg font-black">{formatMoney(amount)}</p>
                </div>
              </div>

              {step === "details" && (
                <>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-[#817a87]">
                    Pay with Mobile Money
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Mobile Money network">
                    {MOMO_NETWORKS.map((item) => {
                      const selected = network === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setNetwork(item)}
                          className={`rounded-xl border bg-white p-2.5 text-center transition hover:-translate-y-0.5 ${
                            selected ? NETWORK_STYLE[item].ring : "border-[#ded9e3]"
                          }`}
                        >
                          <span
                            className={`mx-auto grid size-9 place-items-center rounded-lg text-[10px] font-black ${NETWORK_STYLE[item].badge}`}
                          >
                            {item === "MTN" ? "MTN" : item === "Telecel" ? "TEL" : "AT"}
                          </span>
                          <span className="mt-1.5 block text-[9px] font-extrabold text-[#4f4956]">
                            {MOMO_NETWORK_LABEL[item]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-4 block">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#817a87]">
                      MoMo number to charge
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="054 123 4567"
                      className="mt-2 w-full rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-3 text-sm font-bold tracking-wide outline-none placeholder:font-medium placeholder:text-[#b3adb8] focus:border-[#6d4aff]"
                    />
                  </label>
                  {phoneCheck && !phoneCheck.ok && phoneCheck.error && (
                    <p role="alert" className="mt-2 text-[10px] font-semibold text-red-600">{phoneCheck.error}</p>
                  )}

                  {error && (
                    <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="mt-5 flex items-start gap-2 text-[9px] leading-4 text-[#918a97]">
                    <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                    {live === null ? (
                      "Preparing secure checkout…"
                    ) : live ? (
                      <span>
                        You will approve this payment with your MoMo PIN on your own phone, on Paystack's secure
                        page. We never see or store your PIN{reference ? ` (ref ${reference})` : ""}.
                      </span>
                    ) : (
                      "Demonstration checkout: approving is simulated and no real money moves. Cards and bank transfer appear here once live payments are connected."
                    )}
                  </div>

                  <button
                    onClick={startCheckout}
                    disabled={busy}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:opacity-60"
                  >
                    {busy ? "Starting checkout…" : `Pay ${formatMoney(amount)} with MoMo`}
                    {!busy && <Icon name="arrow-right" size={16} />}
                  </button>
                  {live && (
                    <p className="mt-3 text-center text-[10px] text-[#918a97]">
                      Prefer a card or bank transfer? You can choose it on the secure page.
                    </p>
                  )}
                </>
              )}

              {step === "redirecting" && (
                <div className="py-6 text-center">
                  <span className="mx-auto grid size-12 animate-pulse place-items-center rounded-2xl bg-[#f0ecff] text-[#6d4aff]">
                    <Icon name="shield" size={22} />
                  </span>
                  <p className="mt-4 text-sm font-extrabold">Opening the secure payment page…</p>
                  <p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-[#918a97]">
                    Approve the {formatMoney(amount)} charge{phoneCheck?.phone ? ` on ${formatPhone(phoneCheck.phone)}` : ""} with
                    your MoMo PIN. You will come straight back here afterwards.
                  </p>
                </div>
              )}
            </>
          )}

          {step === "demo-wait" && (
            <div className="py-2 text-center">
              <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-[#ffcf59]/25 text-[#8a6d00]">
                <Icon name="mobile" size={26} />
                <span className="absolute -right-1 -top-1 grid size-6 animate-ping place-items-center rounded-full bg-[#6d4aff] text-[10px] font-black text-white">
                  !
                </span>
              </span>
              <p className="mt-4 text-sm font-extrabold">Check your phone</p>
              <p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-[#756f7b]">
                An approval prompt for <strong>{formatMoney(amount)}</strong> was sent to{" "}
                <strong>{phoneCheck?.phone ? formatPhone(phoneCheck.phone) : phone}</strong>
                {network ? ` (${MOMO_NETWORK_LABEL[network]})` : ""}. Enter your MoMo PIN on your phone to approve.
              </p>
              <div className="mx-auto mt-4 max-w-xs rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[10px] leading-5 text-amber-800">
                Demonstration mode — no real prompt was sent. Press “I've approved” to simulate entering your PIN.
              </div>
              {error && (
                <div role="alert" className="mx-auto mt-4 max-w-xs rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}
              <button
                onClick={confirmDemo}
                disabled={busy}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:opacity-60"
              >
                {busy ? "Confirming…" : "I've approved on my phone"}
                {!busy && <Icon name="check" size={16} />}
              </button>
              <button
                onClick={onClose}
                disabled={busy}
                className="mt-2 w-full rounded-xl border border-[#ded9e3] px-4 py-3 text-xs font-extrabold text-[#655f6b] disabled:opacity-60"
              >
                Cancel payment
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="py-2 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Icon name="check" size={26} />
              </span>
              <p className="mx-auto mt-4 max-w-xs text-sm font-bold leading-6 text-[#413a4a]">{successMessage}</p>
              {reference && (
                <p className="mt-2 font-mono text-[10px] text-[#918a97]">Ref {reference}</p>
              )}
              <button
                onClick={onSuccess}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5e3ce8]"
              >
                Continue <Icon name="arrow-right" size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
