"use client";

import { useMemo, useState } from "react";
import { INTEREST_GROUPS, INTEREST_MAX, INTEREST_MIN, interestEmoji } from "@/lib/profile";
import { Chip } from "./forms";

/**
 * Interest selection used by profile creation and the profile editor.
 * Pick from the curated list or type your own — either way the value is a list
 * of short, de-duplicated tags, and the server re-validates them on save.
 */
export default function InterestPicker({
  selected,
  onChange,
  error,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  error?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const selectedLower = useMemo(() => new Set(selected.map((t) => t.toLowerCase())), [selected]);

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INTEREST_GROUPS.map((group) => ({
      group: group.group,
      items: group.items.filter((i) => !needle || i.tag.toLowerCase().includes(needle)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  function toggle(tag: string) {
    setCustomError(null);
    if (selectedLower.has(tag.toLowerCase())) {
      onChange(selected.filter((t) => t.toLowerCase() !== tag.toLowerCase()));
      return;
    }
    if (selected.length >= INTEREST_MAX) {
      setCustomError(`That's ${INTEREST_MAX} already — remove one to swap it out.`);
      return;
    }
    onChange([...selected, tag]);
  }

  function addCustom() {
    const tag = custom.trim().replace(/\s+/g, " ").slice(0, 24);
    if (!tag) return;
    if (!/^[\p{L}\p{N}][\p{L}\p{N} '&().,+!-]*$/u.test(tag)) {
      setCustomError("Letters, numbers and a few punctuation marks only.");
      return;
    }
    if (selectedLower.has(tag.toLowerCase())) {
      setCustomError("You already have that one.");
      return;
    }
    if (selected.length >= INTEREST_MAX) {
      setCustomError(`Profiles show up to ${INTEREST_MAX} interests.`);
      return;
    }
    setCustomError(null);
    setCustom("");
    onChange([...selected, tag]);
  }

  const enough = selected.length >= INTEREST_MIN;

  return (
    <div className="space-y-4">
      {/* chosen */}
      <div className="rounded-2xl border ring-white/10 bg-white/[0.05] p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-white/85">
            Your interests
            <span className={`ml-2 text-xs font-semibold ${enough ? "text-emerald-600" : "text-rose-600"}`}>
              {selected.length}/{INTEREST_MAX}
            </span>
          </p>
          <p className="text-xs text-white/55">
            {enough ? "Nice spread — this drives your compatibility score." : `Pick at least ${INTEREST_MIN}.`}
          </p>
        </div>
        {selected.length === 0 ? (
          <p className="mt-3 text-sm text-white/55">Nothing chosen yet. Tap a suggestion below or add your own.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.map((tag) => (
              <Chip
                key={tag}
                active
                emoji={interestEmoji(tag)}
                onRemove={() => onChange(selected.filter((t) => t !== tag))}
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}
        {error && <p className="mt-2 text-xs font-medium text-rose-300">{error}</p>}
        {customError && <p className="mt-2 text-xs font-medium text-rose-300">{customError}</p>}
      </div>

      {/* add your own */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <label htmlFor="custom-interest" className="mb-1.5 block text-xs font-medium text-white/70">
            Something not on the list?
          </label>
          <input
            id="custom-interest"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="e.g. Kente weaving"
            maxLength={24}
            className="w-full rounded-xl ring-1 ring-white/10 bg-white/[0.06] text-white placeholder:text-white/30 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-rose-400/70 focus:bg-white/[0.1]"
          />
        </div>
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="rounded-xl bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* browse the catalogue */}
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search interests — hiking, jollof, karaoke…"
          className="mb-3 w-full rounded-xl ring-1 ring-white/10 bg-white/[0.06] text-white placeholder:text-white/30 px-4 py-2 text-sm outline-none transition focus:ring-2 focus:ring-rose-400/70 focus:bg-white/[0.1]"
        />
        <div className="space-y-3">
          {suggestions.length === 0 && (
            <p className="text-sm text-white/55">
              Nothing matches “{query}”. Add it as your own interest above — unique is good.
            </p>
          )}
          {suggestions.map((group) => (
            <div key={group.group}>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-white/40">{group.group}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Chip
                    key={item.tag}
                    emoji={item.emoji}
                    active={selectedLower.has(item.tag.toLowerCase())}
                    onClick={() => toggle(item.tag)}
                  >
                    {item.tag}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
