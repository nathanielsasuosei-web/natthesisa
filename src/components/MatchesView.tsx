"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Match } from "@/lib/store";

interface Props {
  matches: Match[];
  maxMatches: number | null;
  likesUsed: number;
  likeLimit: number | null;
}

interface ApiError {
  error: string;
  code?: string;
}

export default function MatchesView({ matches, maxMatches, likesUsed, likeLimit }: Props) {
  const router = useRouter();
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [newMatch, setNewMatch] = useState<string | null>(null);
  const [ideaDraft, setIdeaDraft] = useState<Record<string, string>>({});

  const blocked = error?.code === "MATCH_LIMIT" || error?.code === "LIKE_LIMIT";
  const atMatchLimit = maxMatches !== null && matches.length >= maxMatches;
  const likesLeft = likeLimit === null ? null : Math.max(likeLimit - likesUsed, 0);

  async function call(url: string, init: RequestInit): Promise<Response | null> {
    setError(null);
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Something went wrong." }));
        setError(data as ApiError);
        return null;
      }
      router.refresh();
      return res;
    } catch {
      setError({ error: "Network error — please try again." });
      return null;
    }
  }

  async function discover() {
    if (discovering || atMatchLimit) return;
    setDiscovering(true);
    setNewMatch(null);
    const res = await call("/api/matches", { method: "POST" });
    setDiscovering(false);
    if (res) {
      const data = await res.json().catch(() => null);
      if (data?.match?.name) setNewMatch(`It's a match — you and ${data.match.name} liked each other! 💘`);
    }
  }

  return (
    <div className="space-y-4">
      {/* Discover */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={discover}
          disabled={discovering || atMatchLimit}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
            <path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.7 4c1.6 0 3.2.8 4.3 2.2C13.1 4.8 14.7 4 16.3 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" />
          </svg>
          {discovering ? "Finding your spark…" : atMatchLimit ? "Match limit reached" : "Discover someone new"}
        </button>
        {atMatchLimit && (
          <span className="text-xs text-slate-500">
            Match slots full —{" "}
            <Link href="/dashboard/plans" className="font-semibold text-rose-600 hover:text-rose-500">
              upgrade to meet more people
            </Link>
          </span>
        )}
      </div>

      {/* New match banner */}
      {newMatch && !error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {newMatch}
        </div>
      )}

      {/* Error / upsell banner */}
      {error && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
            blocked
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className="font-medium">{error.error}</span>
          {blocked && (
            <Link
              href="/dashboard/plans"
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500"
            >
              View membership →
            </Link>
          )}
        </div>
      )}

      {/* Likes meter */}
      <p className="text-xs text-slate-500">
        Likes used this period: <span className="font-semibold text-slate-700">{likesUsed.toLocaleString("en-US")}</span>
        {likesLeft !== null && <> · {likesLeft.toLocaleString("en-US")} left on the current plan</>}
      </p>

      {/* Matches */}
      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-300 bg-white p-12 text-center text-slate-500">
          No matches yet — tap “Discover someone new” to find your first spark.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              ideaDraft={ideaDraft[match.id] ?? ""}
              onDraft={(v) => setIdeaDraft((d) => ({ ...d, [match.id]: v }))}
              onAddIdea={async () => {
                const title = (ideaDraft[match.id] ?? "").trim();
                if (!title) return;
                const ok = await call(`/api/matches/${match.id}/dates`, {
                  method: "POST",
                  body: JSON.stringify({ title }),
                });
                if (ok) setIdeaDraft((d) => ({ ...d, [match.id]: "" }));
              }}
              onToggleIdea={(ideaId, done) =>
                call(`/api/dates/${ideaId}`, { method: "PATCH", body: JSON.stringify({ done: !done }) })
              }
              onDeleteIdea={(ideaId) => call(`/api/dates/${ideaId}`, { method: "DELETE" })}
              onUnmatch={() => {
                if (confirm(`Unmatch with ${match.name}? Your planned dates go too.`))
                  call(`/api/matches/${match.id}`, { method: "DELETE" });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  ideaDraft,
  onDraft,
  onAddIdea,
  onToggleIdea,
  onDeleteIdea,
  onUnmatch,
}: {
  match: Match;
  ideaDraft: string;
  onDraft: (v: string) => void;
  onAddIdea: () => void;
  onToggleIdea: (ideaId: string, done: boolean) => void;
  onDeleteIdea: (ideaId: string) => void;
  onUnmatch: () => void;
}) {
  const been = match.dateIdeas.filter((t) => t.done).length;
  return (
    <div className="flex flex-col rounded-2xl border border-rose-100 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-rose-50 text-xl">
            {match.emoji}
          </span>
          <div>
            <h3 className="font-semibold">
              {match.name}, {match.age}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">{match.bio}</p>
            <p className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                {match.compatibility}% compatible
              </span>
              <span className="text-slate-400">
                {been}/{match.dateIdeas.length} dates
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={onUnmatch}
          title={`Unmatch with ${match.name}`}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M17 7 7 17M7 7l10 10" />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">Date ideas</p>
      <ul className="mt-2 flex-1 space-y-1.5">
        {match.dateIdeas.map((idea) => (
          <li key={idea.id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-rose-50/60">
            <button
              onClick={() => onToggleIdea(idea.id, idea.done)}
              aria-label={idea.done ? "Mark as not been" : "Mark as been on"}
              className={[
                "grid size-5 shrink-0 place-items-center rounded-md border transition",
                idea.done
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-slate-300 bg-white hover:border-rose-400",
              ].join(" ")}
            >
              {idea.done && (
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
                  <path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.7 4c1.6 0 3.2.8 4.3 2.2C13.1 4.8 14.7 4 16.3 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" />
                </svg>
              )}
            </button>
            <span className={`min-w-0 flex-1 truncate text-sm ${idea.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
              {idea.title}
            </span>
            <button
              onClick={() => onDeleteIdea(idea.id)}
              title="Remove idea"
              className="rounded-md p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-600"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-3.5">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </li>
        ))}
        {match.dateIdeas.length === 0 && (
          <li className="py-2 text-xs text-slate-400">No dates planned yet — make the first move.</li>
        )}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAddIdea();
        }}
        className="mt-4 flex gap-2 border-t border-rose-100 pt-4"
      >
        <input
          value={ideaDraft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder="Plan a date…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        />
        <button
          type="submit"
          disabled={!ideaDraft.trim()}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
