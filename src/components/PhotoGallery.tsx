"use client";

import { useRef, useState } from "react";
import { AVATAR_PRESETS, PHOTO_MAX_COUNT } from "@/lib/profile";
import { Alert, Button } from "./forms";

/**
 * Multi-photo gallery editor.
 *
 * The browser does the heavy lifting: each file is centre-cropped to a square,
 * downscaled to 640px and encoded as a JPEG data URL, so the in-memory store
 * stays small. Nothing is uploaded from here — the parent owns the array and
 * saves it with PUT /api/profile/gallery, and the server re-validates every
 * entry (type + size), which makes the resize a courtesy rather than a rule.
 *
 * First photo is the primary one: it's what the deck and the header show.
 */

const MAX_SIDE = 640;
const QUALITY = 0.82;
const MAX_FILE_BYTES = 12 * 1024 * 1024;

export default function PhotoGallery({
  photos,
  onChange,
  avatar,
  onAvatarChange,
  readOnly = false,
  aspect = "square",
}: {
  photos: string[];
  onChange?: (next: string[]) => void;
  avatar: string;
  onAvatarChange?: (next: string) => void;
  /** view-only (used by the "how others see you" sheet) */
  readOnly?: boolean;
  aspect?: "square" | "tall";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const full = photos.length >= PHOTO_MAX_COUNT;
  const cell = aspect === "tall" ? "aspect-[3/4]" : "aspect-square";

  async function addFiles(files: FileList | File[] | null) {
    if (!files || readOnly) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    const room = PHOTO_MAX_COUNT - photos.length;
    if (list.length > room) setError(`You can add ${room} more ${room === 1 ? "photo" : "photos"} — the gallery holds ${PHOTO_MAX_COUNT}.`);
    setBusy(true);
    const next = [...photos];
    for (const file of list.slice(0, Math.max(room, 0))) {
      if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
        setError(`${file.name || "That file"} isn't a JPEG, PNG or WebP image.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`${file.name} is over 12 MB — pick a smaller one.`);
        continue;
      }
      try {
        next.push(await toSquareJpeg(file));
      } catch {
        setError(`Could not read ${file.name || "that image"}. Try another file.`);
      }
    }
    setBusy(false);
    if (next.length !== photos.length) onChange?.(next);
  }

  function removeAt(i: number) {
    onChange?.(photos.filter((_, idx) => idx !== i));
  }

  function makePrimary(i: number) {
    if (i === 0) return;
    const next = [...photos];
    const [pick] = next.splice(i, 1);
    next.unshift(pick);
    onChange?.(next);
  }

  function moveBack(i: number) {
    if (i === 0) return;
    const next = [...photos];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange?.(next);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void addFiles(e.dataTransfer.files);
        }}
        className={`grid grid-cols-3 gap-2 rounded-3xl p-2 transition ${
          readOnly ? "" : dragOver ? "bg-rose-500/10 ring-2 ring-rose-400/60" : "bg-white/[0.04] ring-1 ring-white/10"
        }`}
      >
        {photos.map((src, i) => (
          <div
            key={`${i}-${src.slice(-24)}`}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/20 to-indigo-500/20 ${cell}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={i === 0 ? `${"Your primary photo"}` : `Photo ${i + 1}`} className="size-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                Primary
              </span>
            )}
            {!readOnly && (
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    className="press rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-[#1b1017]"
                  >
                    ★ Primary
                  </button>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveBack(i)}
                    aria-label="Move photo earlier"
                    className="press ml-auto rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="press rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}

        {!readOnly && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={full || busy}
            className={`press grid place-items-center rounded-2xl border border-dashed transition disabled:opacity-40 ${cell} ${
              full ? "border-white/10 text-white/25" : "border-white/25 bg-white/[0.03] text-white/70 hover:border-rose-400/70 hover:bg-rose-500/10"
            }`}
          >
            <span className="text-center">
              <span aria-hidden className="block text-2xl leading-none">
                {busy ? "⏳" : "+"}
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide">
                {busy ? "Adding" : full ? "Full" : "Add"}
              </span>
            </span>
          </button>
        )}

        {readOnly && photos.length === 0 && (
          <p className="col-span-3 py-6 text-center text-sm text-white/40">No photos yet.</p>
        )}
      </div>

      {!readOnly && (
        <>
          <p className="text-xs text-white/40">
            Up to {PHOTO_MAX_COUNT} photos · the first is your main one · JPG, PNG or WebP, resized to {MAX_SIDE}px in your
            browser
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {error && <Alert tone="error">{error}</Alert>}
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()} disabled={full || busy}>
                {full ? "Gallery is full" : "Add another"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => onChange?.([])} disabled={busy}>
                Clear all
              </Button>
            </div>
          )}
          {photos.length === 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                No photo yet? Pick an avatar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onAvatarChange?.(emoji)}
                    aria-label={`Use the ${emoji} avatar`}
                    aria-pressed={emoji === avatar}
                    className={`press grid size-9 place-items-center rounded-2xl text-lg ring-1 transition ${
                      emoji === avatar ? "bg-rose-500/25 ring-rose-400/60" : "bg-white/[0.05] ring-white/10 hover:bg-white/[0.1]"
                    }`}
                  >
                    <span aria-hidden>{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas resize — square centre crop, then downscale + JPEG encode.   */
/* ------------------------------------------------------------------ */

export async function toSquareJpeg(file: File): Promise<string> {
  const bitmap = await loadImage(file);
  const w = "width" in bitmap ? bitmap.width : 0;
  const h = "height" in bitmap ? bitmap.height : 0;
  const side = Math.max(1, Math.min(w, h));
  const sx = Math.round((w - side) / 2);
  const sy = Math.round((h - side) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = MAX_SIDE;
  canvas.height = MAX_SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");
  ctx.fillStyle = "#1b1017";
  ctx.fillRect(0, 0, MAX_SIDE, MAX_SIDE);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap as CanvasImageSource, sx, sy, side, side, 0, 0, MAX_SIDE, MAX_SIDE);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}

function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).catch(() => fallbackImage(file));
  }
  return fallbackImage(file);
}

function fallbackImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode that image."));
    };
    img.src = url;
  });
}
