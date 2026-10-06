"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/pass-periods";
import Icon from "./Icon";
import CheckoutModal from "./CheckoutModal";

export interface ProgramOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  courseCount: number;
  lessonCount: number;
  price: number;
  owned: boolean;
}

interface Props {
  programs: ProgramOption[];
  /** Last MoMo number on the account, pre-filled at checkout when there is one. */
  momoPhone?: string;
  momoNetwork?: string;
}

/**
 * Buying programs — the only thing students pay for.
 *
 * One card per program: what it contains, what it costs, and a button that
 * opens it. A program priced at GH₵0 joins with one tap; anything else goes
 * through the MoMo checkout. An owned program is never sold twice.
 */
export default function ProgramOptions({ programs, momoPhone, momoNetwork }: Props) {
  const router = useRouter();
  const [checkout, setCheckout] = useState<ProgramOption | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // A GH₵0 program needs no money: one tap joins it.
  async function joinFree(option: ProgramOption) {
    if (busy) return;
    setBusy(option.id);
    setError(null);
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId: option.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "This program could not be joined.");
        setBusy(null);
        return;
      }
      setDone(`The ${option.name} program is yours now. Pick a course and start learning.`);
      setBusy(null);
      router.refresh();
    } catch {
      setError("This program could not be joined. Check your connection and try again.");
      setBusy(null);
    }
  }

  function choose(option: ProgramOption) {
    setError(null);
    if (option.price <= 0) {
      void joinFree(option);
      return;
    }
    setCheckout(option);
  }

  return (
    <div>
      {done && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
          <Icon name="check" size={16} className="shrink-0 text-emerald-700" />
          {done}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <Icon name="close" size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {programs.map((option) => (
          <div
            key={option.id}
            className={`relative flex flex-col rounded-[24px] border bg-white p-6 ${
              option.owned ? "border-emerald-200" : "border-[#e5e1e8]"
            }`}
          >
            {option.owned && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-800">
                <Icon name="check" size={10} /> Yours
              </span>
            )}
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#6d4aff]">Program</p>
            <h2 className="mt-2 text-xl font-black tracking-[-.03em]">{option.name}</h2>
            <p className="mt-1 text-xs font-semibold text-[#817a87]">{option.tagline}</p>
            <p className="mt-3 text-xs leading-6 text-[#77717e]">{option.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] font-bold text-[#5f5965]">
              <span className="inline-flex items-center gap-1.5"><Icon name="courses" size={13} /> {option.courseCount} course{option.courseCount === 1 ? "" : "s"}</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="book" size={13} /> {option.lessonCount} lesson{option.lessonCount === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[#f0edf2] pt-5">
              <p>
                <span className="text-3xl font-black tracking-[-.05em]">{formatMoney(option.price)}</span>
                <span className="ml-1.5 text-[11px] font-semibold text-[#8d8694]">once, yours forever</span>
              </p>
            </div>
            {option.owned ? (
              <Link
                href="/dashboard/courses"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-800 transition hover:-translate-y-0.5"
              >
                Open your courses <Icon name="arrow-right" size={14} />
              </Link>
            ) : (
              <button
                onClick={() => choose(option)}
                disabled={busy === option.id}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#7959f1] disabled:opacity-60"
              >
                <Icon name="mobile" size={14} />
                {busy === option.id ? "Please wait…" : option.price <= 0 ? "Join for free" : `Buy for ${formatMoney(option.price)}`}
              </button>
            )}
          </div>
        ))}
      </div>

      {checkout && (
        <CheckoutModal
          title={`Buy the ${checkout.name} program`}
          subtitle={`Every course and lesson inside, yours forever`}
          amount={checkout.price}
          payload={{ kind: "program", programId: checkout.id }}
          defaultPhone={momoPhone}
          defaultNetwork={momoNetwork}
          successMessage={`The ${checkout.name} program is yours now. Pick a course and start learning.`}
          onClose={() => setCheckout(null)}
          onSuccess={() => {
            setCheckout(null);
            setDone(`The ${checkout.name} program is yours now. Pick a course and start learning.`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
