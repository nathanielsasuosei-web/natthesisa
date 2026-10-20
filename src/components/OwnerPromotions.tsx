"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/pass-periods";
import {
  PROMO_STATUS_LABEL,
  defaultPromotionWindow,
  isoToLocalInput,
  localInputToIso,
  normalizePromoCode,
  promotionStatus,
  promotionUsageLabel,
  promotionWindowLabel,
  promoDateLabel,
  promoDayLabel,
  type PromotionStatus,
  type PromotionWithStats,
} from "@/lib/promo-codes";
import Icon from "./Icon";

interface ProgramOption {
  id: string;
  name: string;
  price: number;
}

interface ClaimRow {
  code: string;
  programName: string;
  value: number;
  userName: string;
  userEmail: string;
  createdAt: string;
  paymentReference: string;
}

interface Props {
  initial: PromotionWithStats[];
  /** Claims already made, newest first — read on the server. */
  claims: ClaimRow[];
  programs: ProgramOption[];
  /** Server time — keeps the first render identical on server and browser. */
  now: string;
}

interface Draft {
  code: string;
  rewardProgramId: string;
  description: string;
  /** `datetime-local` values, in the browser's own timezone. */
  startsAt: string;
  endsAt: string;
  maxRedemptions: string;
}

const STATUS_STYLE: Record<PromotionStatus, string> = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  scheduled: "border-amber-200 bg-amber-50 text-amber-800",
  paused: "border-[#ddd8e2] bg-[#f3f1f5] text-[#6b6472]",
  ended: "border-[#ddd8e2] bg-[#f3f1f5] text-[#8b8492]",
  "used-up": "border-violet-200 bg-violet-50 text-violet-700",
};

function blankDraft(programs: ProgramOption[], now: string): Draft {
  const window = defaultPromotionWindow(Date.parse(now));
  return {
    code: "",
    rewardProgramId: programs[0]?.id ?? "",
    description: "",
    startsAt: isoToLocalInput(window.startsAt),
    endsAt: isoToLocalInput(window.endsAt),
    maxRedemptions: "0",
  };
}

/**
 * The first render's draft. The dates start blank and are filled on mount:
 * a `datetime-local` value depends on the viewer's timezone, and rendering
 * the server's timezone into it would be a hydration mismatch for any teacher
 * outside UTC.
 */
function emptyDraft(programs: ProgramOption[]): Draft {
  return {
    code: "",
    rewardProgramId: programs[0]?.id ?? "",
    description: "",
    startsAt: "",
    endsAt: "",
    maxRedemptions: "0",
  };
}

function draftFrom(promo: PromotionWithStats): Draft {
  return {
    code: promo.code,
    rewardProgramId: promo.rewardProgramId,
    description: promo.description,
    startsAt: isoToLocalInput(promo.startsAt),
    endsAt: isoToLocalInput(promo.endsAt),
    maxRedemptions: String(promo.maxRedemptions),
  };
}

const inputClass =
  "w-full rounded-lg border border-[#ddd9e2] bg-white px-2.5 py-2 text-xs font-semibold text-[#332e39] outline-none placeholder:font-medium placeholder:text-[#b3adb8] focus:border-[#6d4aff]";

/** The fields shared by the create form and each row's editor. */
function PromotionFields({
  draft,
  programs,
  onChange,
}: {
  draft: Draft;
  programs: ProgramOption[];
  onChange: (patch: Partial<Draft>) => void;
}) {
  const reward = programs.find((program) => program.id === draft.rewardProgramId);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block sm:col-span-1">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#817a87]">Free program</span>
        <select
          value={draft.rewardProgramId}
          onChange={(event) => onChange({ rewardProgramId: event.target.value })}
          className={`mt-1.5 ${inputClass}`}
        >
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name} — {formatMoney(program.price)}
            </option>
          ))}
        </select>
      </label>

      <label className="block sm:col-span-1">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#817a87]">
          Claim limit <span className="font-bold normal-case tracking-normal text-[#aaa4b0]">(0 = no limit)</span>
        </span>
        <input
          type="number"
          min={0}
          step={1}
          value={draft.maxRedemptions}
          onChange={(event) => onChange({ maxRedemptions: event.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>

      <label className="block">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#817a87]">Starts</span>
        <input
          type="datetime-local"
          value={draft.startsAt}
          onChange={(event) => onChange({ startsAt: event.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>

      <label className="block">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#817a87]">Ends</span>
        <input
          type="datetime-local"
          value={draft.endsAt}
          onChange={(event) => onChange({ endsAt: event.target.value })}
          className={`mt-1.5 ${inputClass}`}
        />
      </label>

      <label className="block sm:col-span-2">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#817a87]">
          Note for yourself <span className="font-bold normal-case tracking-normal text-[#aaa4b0]">(optional)</span>
        </span>
        <input
          value={draft.description}
          maxLength={160}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="e.g. Independence Day offer — share on WhatsApp"
          className={`mt-1.5 ${inputClass}`}
        />
      </label>

      <p className="rounded-lg bg-[#f6f3ff] px-3 py-2 text-[10px] leading-5 text-[#5e4a94] sm:col-span-2">
        <Icon name="spark" size={12} className="mr-1 inline-block" />
        Students who buy any program with this code also get{" "}
        <strong>{reward ? reward.name : "the chosen program"}</strong>
        {reward ? ` (${formatMoney(reward.price)})` : ""} free, the moment their payment is confirmed.
      </p>
    </div>
  );
}

/**
 * The teacher's promo-code desk.
 *
 * A code names one program that a student receives free when they buy any
 * other program with the code. The window — the start and end — belongs to
 * the teacher, as does the on/off switch. Claim counts are read from the
 * server on every change; nothing is guessed in the browser.
 */
export default function OwnerPromotions({ initial, claims, programs, now }: Props) {
  const [rows, setRows] = useState<PromotionWithStats[]>(initial);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(programs));
  const [busy, setBusy] = useState<"create" | string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  // The status is time-dependent; start from the server's clock so the first
  // paint is identical on both sides, then follow the browser's clock.
  const [nowMs, setNowMs] = useState(() => {
    const parsed = Date.parse(now);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  useEffect(() => {
    setNowMs(Date.now());
    setDraft((current) => (current.startsAt || current.endsAt ? current : blankDraft(programs, new Date().toISOString())));
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
    // Mount-only: the props describe the first render, and re-running this
    // would overwrite whatever the teacher has typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const live = rows.filter((row) => promotionStatus(row, nowMs) === "live").length;
    const claims = rows.reduce((sum, row) => sum + row.redeemedCount, 0);
    const given = rows.reduce((sum, row) => sum + row.redeemedCount * row.rewardValue, 0);
    return { live, claims, given };
  }, [rows, nowMs]);

  function buildPayload(source: Draft) {
    return {
      rewardProgramId: source.rewardProgramId,
      description: source.description,
      startsAt: localInputToIso(source.startsAt),
      endsAt: localInputToIso(source.endsAt),
      maxRedemptions: source.maxRedemptions.trim() === "" ? 0 : Number(source.maxRedemptions),
    };
  }

  async function create() {
    if (busy) return;
    const code = normalizePromoCode(draft.code);
    if (!code) {
      setMessage({ tone: "error", text: "Name the code first — students will type it at checkout." });
      return;
    }
    const payload = buildPayload(draft);
    if (!payload.startsAt || !payload.endsAt) {
      setMessage({ tone: "error", text: "Choose when the code starts and when it ends." });
      return;
    }
    setBusy("create");
    setMessage(null);
    try {
      const response = await fetch("/api/owner/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, code, active: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data?.error ?? "The promo code could not be saved." });
        setBusy(null);
        return;
      }
      setRows((current) => [data.promotion as PromotionWithStats, ...current]);
      setDraft(blankDraft(programs, new Date().toISOString()));
      setMessage({
        tone: "ok",
        text: `${data.promotion.code} is ready — it gives ${data.promotion.rewardProgramName} free while it runs.`,
      });
      setBusy(null);
    } catch {
      setMessage({ tone: "error", text: "The promo code could not be saved. Check your connection." });
      setBusy(null);
    }
  }

  async function saveEdit(row: PromotionWithStats) {
    if (!editDraft || busy) return;
    const payload = buildPayload(editDraft);
    if (!payload.startsAt || !payload.endsAt) {
      setMessage({ tone: "error", text: "Choose when the code starts and when it ends." });
      return;
    }
    setBusy(row.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/owner/promos/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data?.error ?? "The changes could not be saved." });
        setBusy(null);
        return;
      }
      setRows((current) => current.map((item) => (item.id === row.id ? (data.promotion as PromotionWithStats) : item)));
      setEditing(null);
      setEditDraft(null);
      setMessage({ tone: "ok", text: `${row.code} updated.` });
      setBusy(null);
    } catch {
      setMessage({ tone: "error", text: "The changes could not be saved. Check your connection." });
      setBusy(null);
    }
  }

  async function toggleActive(row: PromotionWithStats) {
    if (busy) return;
    setBusy(row.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/owner/promos/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data?.error ?? "The code could not be changed." });
        setBusy(null);
        return;
      }
      setRows((current) => current.map((item) => (item.id === row.id ? (data.promotion as PromotionWithStats) : item)));
      setMessage({ tone: "ok", text: `${row.code} is now ${row.active ? "paused" : "active"}.` });
      setBusy(null);
    } catch {
      setMessage({ tone: "error", text: "The code could not be changed. Check your connection." });
      setBusy(null);
    }
  }

  async function remove(row: PromotionWithStats) {
    if (busy) return;
    const warning =
      row.redeemedCount > 0
        ? `${row.code} has been claimed ${row.redeemedCount} time${row.redeemedCount === 1 ? "" : "s"}. Deleting it stops new claims; students who already claimed keep their free program. Delete it?`
        : `Delete the promo code ${row.code}?`;
    if (!window.confirm(warning)) return;
    setBusy(row.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/owner/promos/${row.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data?.error ?? "The code could not be deleted." });
        setBusy(null);
        return;
      }
      setRows((current) => current.filter((item) => item.id !== row.id));
      setMessage({ tone: "ok", text: `${row.code} deleted.` });
      setBusy(null);
    } catch {
      setMessage({ tone: "error", text: "The code could not be deleted. Check your connection." });
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="open-stat-strip grid gap-0 sm:grid-cols-3">
        {[
          { label: "Live codes", value: String(stats.live), note: "Usable at checkout right now" },
          { label: "Claims", value: String(stats.claims), note: "Free programs handed over" },
          { label: "Value given away", value: formatMoney(stats.given), note: "At today's program prices" },
        ].map((card) => (
          <article key={card.label} className="open-stat">
            <p className="text-lg font-black tracking-[-.035em]">{card.value}</p>
            <p className="mt-1 text-[9px] font-bold text-[#6c6672]">{card.label}</p>
            <p className="mt-1 text-[8px] text-[#aaa4b0]">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold">Create a promo code</h2>
            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#918a97]">
              A student buys any program, types this code at checkout, and the program you choose here is opened on
              their account free — no second payment. You decide when the code starts and ends.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0ecff] px-2.5 py-1.5 text-[9px] font-black text-[#5e3de0]">
            <Icon name="spark" size={12} /> Teacher offer
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#817a87]">Code</span>
            <input
              value={draft.code}
              onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
              placeholder="FREE300"
              maxLength={24}
              autoComplete="off"
              spellCheck={false}
              className={`mt-1.5 font-mono tracking-wider ${inputClass}`}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const words = ["LEARN", "SKILL", "BUILD", "CODE", "STUDY", "GH"];
              const word = words[Math.floor(Math.random() * words.length)];
              const number = String(Math.floor(100 + Math.random() * 900));
              setDraft((current) => ({ ...current, code: `${word}${number}` }));
            }}
            className="h-[34px] rounded-lg border border-[#ddd8e2] px-3 text-[10px] font-extrabold text-[#5f5965] transition hover:border-[#6d4aff] hover:text-[#6d4aff]"
          >
            Generate
          </button>
        </div>

        <div className="mt-4">
          <PromotionFields
            draft={draft}
            programs={programs}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
        </div>

        <button
          onClick={create}
          disabled={busy === "create"}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5d3ce2] disabled:opacity-60"
        >
          <Icon name="plus" size={14} />
          {busy === "create" ? "Creating…" : "Create promo code"}
        </button>

        {message && (
          <p
            role="status"
            className={`mt-3 text-[10px] font-semibold ${message.tone === "ok" ? "text-emerald-700" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}
      </section>

      <section className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold">Your promo codes</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">
              Checkout refuses a code before its start, after its end, when paused, or once its claim limit is reached.
            </p>
          </div>
          <span className="rounded-lg bg-[#f3f1f5] px-2.5 py-1.5 text-[9px] font-black text-[#6b6472]">
            {rows.length} code{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#ddd8e2] bg-[#faf9fb] px-4 py-8 text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-2xl bg-[#f0ecff] text-[#6d4aff]">
              <Icon name="spark" size={18} />
            </span>
            <p className="mt-3 text-xs font-extrabold">No promo codes yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-[#918a97]">
              Create one above, then share the code with your students. It only works inside the dates you set.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((row) => {
              const status = promotionStatus(row, nowMs);
              const isEditing = editing === row.id;
              const rewardProgram = programs.find((program) => program.id === row.rewardProgramId);
              return (
                <article key={row.id} className="rounded-2xl border border-[#ece8ef] bg-[#fdfcfe] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black tracking-wider text-[#332e39]">{row.code}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${STATUS_STYLE[status]}`}
                        >
                          {PROMO_STATUS_LABEL[status]}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[10px] font-semibold text-[#5f5965]">
                        Free: {rewardProgram ? rewardProgram.name : row.rewardProgramName}
                        {rewardProgram ? ` · worth ${formatMoney(rewardProgram.price)}` : ""}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#9a939f]">
                        {promotionWindowLabel(row)} · {promotionUsageLabel(row)}
                      </p>
                      {row.description && (
                        <p className="mt-1 text-[9px] italic text-[#918a97]">“{row.description}”</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditing(isEditing ? null : row.id);
                          setEditDraft(isEditing ? null : draftFrom(row));
                          setMessage(null);
                        }}
                        className="rounded-lg border border-[#ddd8e2] px-2.5 py-1.5 text-[9px] font-extrabold text-[#5f5965] transition hover:border-[#6d4aff] hover:text-[#6d4aff]"
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>
                      <button
                        onClick={() => toggleActive(row)}
                        disabled={busy === row.id}
                        className="rounded-lg border border-[#ddd8e2] px-2.5 py-1.5 text-[9px] font-extrabold text-[#5f5965] transition hover:border-[#6d4aff] hover:text-[#6d4aff] disabled:opacity-50"
                      >
                        {row.active ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => remove(row)}
                        disabled={busy === row.id}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[9px] font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isEditing && editDraft && (
                    <div className="mt-4 border-t border-[#ece8ef] pt-4">
                      <PromotionFields
                        draft={editDraft}
                        programs={programs}
                        onChange={(patch) => setEditDraft((current) => (current ? { ...current, ...patch } : current))}
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(row)}
                          disabled={busy === row.id}
                          className="rounded-lg bg-[#1b1822] px-3.5 py-2 text-[10px] font-extrabold text-white disabled:opacity-50"
                        >
                          {busy === row.id ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(null);
                            setEditDraft(null);
                          }}
                          className="rounded-lg border border-[#ddd8e2] px-3.5 py-2 text-[10px] font-extrabold text-[#655f6b]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {status === "scheduled" && (
                    <p className="mt-2 text-[9px] text-amber-700">
                      Opens {promoDateLabel(row.startsAt)}.
                    </p>
                  )}
                  {status === "ended" && (
                    <p className="mt-2 text-[9px] text-[#9a939f]">Closed {promoDateLabel(row.endsAt)}.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {claims.length > 0 && (
        <section className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-extrabold">Recent claims</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">
              Every free program handed over with a code, with the payment that unlocked it.
            </p>
          </div>
          <div className="mt-3 divide-y divide-[#f1eef2] border-y border-[#ece9ef]">
            {claims.map((claim) => (
              <div
                key={`${claim.paymentReference}-${claim.code}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-extrabold text-[#332e39]">
                    {claim.userName} · <span className="font-mono tracking-wide">{claim.code}</span>
                  </p>
                  <p className="mt-0.5 truncate text-[9px] text-[#918a97]">
                    {claim.programName} — free, worth {formatMoney(claim.value)} · {claim.userEmail}
                  </p>
                </div>
                <p className="shrink-0 text-[9px] text-[#aaa4b0]">{promoDayLabel(claim.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
