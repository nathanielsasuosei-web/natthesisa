"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Match } from "@/lib/store";
import { interestEmoji, sharedInterests } from "@/lib/profile";
import { Alert, Button, EmptyState, IconButton, Panel, Sheet, messageFrom, sendJson, useToast } from "./forms";

/**
 * Matches — the people who liked you back.
 *
 * Everything here goes through the existing endpoints: DELETE /api/matches/[id]
 * (unmatch), POST /api/matches/[id]/dates and PATCH|DELETE /api/dates/[id]
 * (date ideas). Those all spend from the plan's like allowance, so a rejected
 * call is rolled back locally and the server's message is shown.
 */

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 3;

export default function MatchesApp({
  matches,
  matchLimit,
  planName,
  firstName,
  now,
  suspended,
  myInterests = [],
}: {
  matches: Match[];
  matchLimit: number | null;
  planName: string;
  firstName: string;
  /** server timestamp — keeps "matched 2 days ago" identical on both renders */
  now: number;
  suspended: boolean;
  /** used to highlight what you and a match both like */
  myInterests?: string[];
}) {
  const router = useRouter();
  const [list, setList] = useState<Match[]>(matches);
  const [open, setOpen] = useState<Match | null>(null);
  const [idea, setIdea] = useState("");
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const sorted = [...list].sort((a, b) => {
    const aNew = now - new Date(a.createdAt).getTime() < NEW_WINDOW_MS ? 1 : 0;
    const bNew = now - new Date(b.createdAt).getTime() < NEW_WINDOW_MS ? 1 : 0;
    if (aNew !== bNew) return bNew - aNew;
    return b.compatibility - a.compatibility;
  });
  const fresh = sorted.filter((m) => now - new Date(m.createdAt).getTime() < NEW_WINDOW_MS);

  async function run(fn: () => Promise<{ ok: boolean; body: Record<string, unknown> }>, fallback: string) {
    setBusy(true);
    const { ok, body } = await fn();
    setBusy(false);
    if (!ok) {
      toast.show(messageFrom(body, fallback));
      router.refresh();
      return false;
    }
    router.refresh();
    return true;
  }

  async function addIdea(m: Match) {
    const title = idea.trim();
    if (!title) return;
    const before = m.dateIdeas;
    const next = { id: `tmp-${Date.now()}`, title, done: false, createdAt: new Date().toISOString() };
    setList((ls) => ls.map((x) => (x.id === m.id ? { ...x, dateIdeas: [...x.dateIdeas, next] } : x)));
    setOpen((o) => (o && o.id === m.id ? { ...o, dateIdeas: [...o.dateIdeas, next] } : o));
    setIdea("");
    const saved = await run(
      () => sendJson(`/api/matches/${m.id}/dates`, { method: "POST", body: JSON.stringify({ title }) }),
      "Could not save that date idea."
    );
    if (!saved) {
      setList((ls) => ls.map((x) => (x.id === m.id ? { ...x, dateIdeas: before } : x)));
      setOpen((o) => (o && o.id === m.id ? { ...o, dateIdeas: before } : o));
    }
  }

  async function toggleIdea(m: Match, id: string, done: boolean) {
    const patch = (v: boolean) =>
      setList((ls) => ls.map((x) => (x.id === m.id ? { ...x, dateIdeas: x.dateIdeas.map((d) => (d.id === id ? { ...d, done: v } : d)) } : x)));
    patch(done);
    setOpen((o) =>
      o && o.id === m.id
        ? { ...o, dateIdeas: o.dateIdeas.map((d) => (d.id === id ? { ...d, done } : d)) }
        : o
    );
    const saved = await run(
      () => sendJson(`/api/dates/${id}`, { method: "PATCH", body: JSON.stringify({ done }) }),
      "Could not update that."
    );
    if (!saved) patch(!done);
  }

  async function removeIdea(m: Match, id: string) {
    const before = m.dateIdeas;
    setList((ls) => ls.map((x) => (x.id === m.id ? { ...x, dateIdeas: x.dateIdeas.filter((d) => d.id !== id) } : x)));
    setOpen((o) => (o && o.id === m.id ? { ...o, dateIdeas: o.dateIdeas.filter((d) => d.id !== id) } : o));
    const saved = await run(() => sendJson(`/api/dates/${id}`, { method: "DELETE" }), "Could not delete that.");
    if (!saved) {
      setList((ls) => ls.map((x) => (x.id === m.id ? { ...x, dateIdeas: before } : x)));
      setOpen((o) => (o && o.id === m.id ? { ...o, dateIdeas: before } : o));
    }
  }

  async function unmatch(m: Match) {
    const before = list;
    setList((ls) => ls.filter((x) => x.id !== m.id));
    setOpen(null);
    setConfirmUnmatch(false);
    const saved = await run(() => sendJson(`/api/matches/${m.id}`, { method: "DELETE" }), "Could not unmatch.");
    if (!saved) setList(before);
    else toast.show(`Unmatched with ${m.name}.`);
  }

  async function opener(m: Match) {
    const shared = sharedInterests(myInterests, m.interests);
    const text = `Hey ${m.name.split(" ")[0]} — ${m.compatibility}% match${
      shared.length ? ` and ${shared.length} thing${shared.length === 1 ? "" : "s"} we both like (${shared.slice(0, 2).join(", ")})` : ""
    }. ${m.city} this week?`.replace(/\s+/g, " ").trim();
    try {
      await navigator.clipboard.writeText(text);
      toast.show("Opener copied — paste it in the app you two move to 💬");
    } catch {
      toast.show(text.slice(0, 60) + "…");
    }
  }

  return (
    <div className="pb-6">
      <header className="px-5 pb-3 pt-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">
              {list.length > 0 ? `Your ${list.length}` : "No matches yet"}
            </h1>
            <p className="mt-0.5 text-sm text-white/50">
              {list.length > 0
                ? `mutual likes on the ${planName} plan · ${
                    matchLimit === null ? "unlimited slots" : `${list.length}/${matchLimit} slots used`
                  }`
                : `${firstName.split(" ")[0]}, matches show up here the moment it's mutual`}
            </p>
          </div>
          <Link
            href="/app/discover"
            className="press shrink-0 rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/12"
          >
            + Find more
          </Link>
        </div>
      </header>

      {suspended && (
        <div className="px-5 pb-3">
          <Alert tone="warn">Suspended accounts can review matches but not change them.</Alert>
        </div>
      )}

      {fresh.length > 0 && (
        <section className="pb-2">
          <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            New this week
          </p>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
            {fresh.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setOpen(m)}
                className="press flex w-[74px] shrink-0 flex-col items-center gap-1.5"
              >
                <span className="relative grid size-14 place-items-center rounded-full bg-gradient-to-br from-rose-500/40 to-indigo-500/30 text-2xl ring-2 ring-rose-400/70">
                  {m.emoji}
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px]">
                    💘
                  </span>
                </span>
                <span className="w-full truncate text-center text-[11px] font-medium text-white/70">
                  {m.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {list.length === 0 ? (
        <EmptyState
          emoji="💌"
          title="Nothing here yet"
          body="Keep swiping — a match needs both of you. Your deck is waiting with people who fit your age range and distance."
          action={<Button full href="/app/discover">Back to the deck</Button>}
        />
      ) : (
        <ul className="space-y-2 px-4">
          {sorted.map((m) => {
            const isNew = now - new Date(m.createdAt).getTime() < NEW_WINDOW_MS;
            const done = m.dateIdeas.filter((d) => d.done).length;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(m);
                    setConfirmUnmatch(false);
                  }}
                  className="press flex w-full items-center gap-3 rounded-3xl bg-white/[0.05] p-3 text-left ring-1 ring-white/10 transition hover:bg-white/[0.09]"
                >
                  <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500/35 to-indigo-500/25 text-2xl">
                    {m.emoji}
                    {isNew && (
                      <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-rose-500 ring-2 ring-[#120a11]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="truncate font-semibold">{m.name}</span>
                      <span className="text-sm text-white/45">{m.age}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-white/50">
                      {m.city} · {m.dateIdeas.length > 0
                        ? `${done}/${m.dateIdeas.length} dates been on`
                        : `matched ${ago(m.createdAt, now)}`}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-bold text-emerald-200 ring-1 ring-emerald-300/25">
                    {m.compatibility}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {list.length > 0 && matchLimit !== null && list.length >= matchLimit && (
        <div className="mt-4 px-5">
          <Alert
            tone="warn"
            action={
              <Link href="/app/membership" className="press rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                More slots
              </Link>
            }
          >
            All {matchLimit} {planName} match slots are in use — like-to-like needs a free slot.
          </Alert>
        </div>
      )}

      {/* ------------------------------ match sheet ----------------------------- */}
      <Sheet
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? `${open.name}, ${open.age}` : ""}
        subtitle={open ? `${open.city} · ${open.distanceKm} km away · ${open.compatibility}% compatible` : undefined}
      >
        {open && (
          <div className="space-y-5">
            <Panel>
              <p className="text-[15px] leading-relaxed text-white/80">{open.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {open.interests.map((tag) => {
                  const shared = myInterests.some((t) => t.toLowerCase() === tag.toLowerCase());
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${
                        shared
                          ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/25"
                          : "bg-white/[0.07] text-white/65"
                      }`}
                    >
                      <span aria-hidden>{interestEmoji(tag)}</span>
                      {tag}
                      {shared && <span className="text-[9px] font-bold uppercase tracking-wide">shared</span>}
                    </span>
                  );
                })}
              </div>
            </Panel>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Date ideas
              </p>
              <ul className="space-y-2">
                {open.dateIdeas.length === 0 && (
                  <li className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-white/45">
                    No plans yet. Suggest something specific — “jollof at Canteen, Friday”.
                  </li>
                )}
                {open.dateIdeas.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.05] px-3 py-2.5 ring-1 ring-white/10"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={d.done}
                      aria-label={d.done ? `Mark “${d.title}” as not been on` : `Mark “${d.title}” as been on`}
                      disabled={suspended || busy}
                      onClick={() => void toggleIdea(open, d.id, !d.done)}
                      className={`press grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold transition ${
                        d.done ? "bg-emerald-400 text-[#0d1a16]" : "bg-white/10 text-transparent ring-1 ring-white/20"
                      }`}
                    >
                      ✓
                    </button>
                    <span className={`min-w-0 flex-1 text-sm ${d.done ? "text-white/40 line-through" : "text-white/85"}`}>
                      {d.title}
                    </span>
                    <IconButton label="Delete date idea" tone="ghost" size={28} disabled={suspended || busy} onClick={() => void removeIdea(open, d.id)}>
                      <span className="text-xs">✕</span>
                    </IconButton>
                  </li>
                ))}
              </ul>
              {!suspended && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void addIdea(open);
                      }
                    }}
                    maxLength={140}
                    placeholder="Add a date idea…"
                    className="min-w-0 flex-1 rounded-2xl bg-white/[0.07] px-4 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-2 focus:ring-rose-400/70"
                  />
                  <Button variant="ghost" onClick={() => void addIdea(open)} busy={busy} disabled={!idea.trim()}>
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Button full onClick={() => void opener(open)}>
                Copy an opener
              </Button>
              {confirmUnmatch ? (
                <div className="rounded-2xl bg-rose-500/10 p-3 ring-1 ring-rose-400/25">
                  <p className="text-sm text-rose-100">
                    Unmatch {open.name}? Your date ideas with them go too, and this can&apos;t be undone.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="danger" full onClick={() => void unmatch(open)} busy={busy}>
                      Yes, unmatch
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmUnmatch(false)}>
                      Keep
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmUnmatch(true)}
                  disabled={suspended}
                  className="press mx-auto mt-1 text-xs font-medium text-white/35 underline-offset-4 hover:text-rose-300 hover:underline disabled:opacity-40"
                >
                  Unmatch {open.name.split(" ")[0]}
                </button>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {toast.node}
    </div>
  );
}

function ago(iso: string, now: number): string {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} week${days < 14 ? "" : "s"} ago`;
  return `${Math.round(days / 30)} month(s) ago`;
}
