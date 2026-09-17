"use client";

import { useState } from "react";
import { Button } from "./forms";

/**
 * Full-bleed photo viewer for the profile hero: tap to open, swipe or use the
 * arrows to move through the gallery. Presentation only — the ordering and the
 * primary photo are owned by PUT /api/profile/gallery.
 */
export default function Lightbox({ photos, name }: { photos: string[]; name: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;

  const show = (i: number) => setIndex(((i % photos.length) + photos.length) % photos.length);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${name}'s photos`}
        className="relative block w-full cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt={`${name}'s primary photo`} className="h-72 w-full object-cover" />
        {photos.length > 1 && (
          <span className="glass absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/15">
            1/{photos.length} ⤢
          </span>
        )}
      </button>

      {open && (
        <div
          className="animate-card-in fixed inset-0 z-[70] mx-auto flex max-w-[430px] flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={`${name}'s photos`}
          onClick={() => show(index + 1)}
        >
          <div className="flex items-center gap-1.5 p-3">
            {photos.map((_, i) => (
              <span key={i} className={`h-0.5 flex-1 rounded-full ${i <= index ? "bg-white" : "bg-white/25"}`} />
            ))}
            <Button variant="ghost" className="ml-2 !px-3 !py-1.5 text-xs" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
              Done
            </Button>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[index]} alt={`Photo ${index + 1} of ${photos.length}`} className="max-h-full max-w-full rounded-2xl object-contain" />
          </div>
          <div className="flex items-center justify-between p-4" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" onClick={() => show(index - 1)} disabled={photos.length < 2}>
              ← Prev
            </Button>
            <span className="text-xs tabular-nums text-white/45">
              {index + 1} / {photos.length}
            </span>
            <Button variant="ghost" onClick={() => show(index + 1)} disabled={photos.length < 2}>
              Next →
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
