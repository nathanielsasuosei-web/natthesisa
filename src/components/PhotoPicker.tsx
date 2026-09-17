"use client";

import { useRef, useState } from "react";
import { AVATAR_PRESETS } from "@/lib/profile";
import Avatar from "./Avatar";
import { Alert, Button, fieldsFrom, sendJson } from "./forms";

/**
 * Profile photo picker.
 *
 * The browser does the heavy lifting: the chosen file is centre-cropped to a
 * square, downscaled to 640px and turned into a JPEG data URL before it is
 * uploaded, which keeps the in-memory store small. The server re-validates the
 * data URL (type + size) so the client-side resize is a courtesy, not a rule.
 */

const MAX_SIDE = 640;
const QUALITY = 0.82;
const MAX_FILE_BYTES = 12 * 1024 * 1024;

export default function PhotoPicker({
  name,
  photo,
  avatar,
  onChange,
  compact = false,
}: {
  name: string;
  photo: string | null;
  avatar: string;
  /** lets the parent refresh completeness + preview after a change */
  onChange?: (next: { photo: string | null; avatar: string }) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(photo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File | undefined | null) {
    setError(null);
    if (!file) return;
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
      setError("That file isn't a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That image is over 12 MB — pick a smaller one.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await toSquareJpeg(file);
      setPreview(dataUrl);
      const { ok, body } = await sendJson("/api/profile/photo", {
        method: "PUT",
        body: JSON.stringify({ dataUrl }),
      });
      if (!ok) {
        setError(body.error ? String(body.error) : "Upload failed — try another image.");
        setPreview(photo);
        return;
      }
      onChange?.({ photo: dataUrl, avatar });
    } catch {
      setError("Could not read that file. Try another image.");
      setPreview(photo);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const { ok, body } = await sendJson("/api/profile/photo", {
      method: "DELETE",
      body: JSON.stringify({ avatar }),
    });
    setBusy(false);
    if (!ok) {
      setError(fieldsFrom(body).photo ?? "Could not remove the photo.");
      return;
    }
    setPreview(null);
    onChange?.({ photo: null, avatar });
  }

  async function pickAvatar(next: string) {
    setError(null);
    const { ok } = await sendJson("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ avatar: next }),
    });
    if (!ok) {
      setError("Could not save that avatar.");
      return;
    }
    onChange?.({ photo: preview, avatar: next });
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex ${compact ? "flex-row items-center gap-4" : "flex-col items-center gap-4 sm:flex-row sm:gap-6"} rounded-2xl border-2 border-dashed p-5 transition ${
          dragOver ? "border-rose-500 bg-rose-50" : "border-rose-200 bg-rose-50/40"
        }`}
      >
        <div className="relative shrink-0">
          <Avatar
            name={name}
            photo={preview}
            emoji={preview ? undefined : avatar}
            size={compact ? 64 : 96}
            rounded="2xl"
          />
          {busy && (
            <span className="absolute inset-0 grid place-items-center rounded-2xl bg-white/70">
              <svg viewBox="0 0 24 24" className="size-6 animate-spin text-rose-600" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-slate-700">
            {preview ? "Looking good." : "Add a clear, recent photo — profiles with one get far more likes."}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            JPG, PNG or WebP. We crop to a square and resize to {MAX_SIDE}px in your browser.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button type="button" variant="subtle" onClick={() => inputRef.current?.click()} busy={busy}>
              {preview ? "Replace photo" : "Choose photo"}
            </Button>
            {preview && (
              <Button type="button" variant="ghost" onClick={remove} disabled={busy}>
                Remove
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {!preview && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            No photo? Pick an avatar instead
          </p>
          <div className="flex flex-wrap gap-1.5">
            {AVATAR_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => void pickAvatar(emoji)}
                aria-label={`Use the ${emoji} avatar`}
                aria-pressed={emoji === avatar}
                className={`grid size-9 place-items-center rounded-xl border text-lg transition ${
                  emoji === avatar
                    ? "border-rose-500 bg-rose-100"
                    : "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50"
                }`}
              >
                <span aria-hidden>{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas resize — square centre crop, then downscale + JPEG encode.   */
/* ------------------------------------------------------------------ */

async function toSquareJpeg(file: File): Promise<string> {
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
  ctx.fillStyle = "#fff7f8";
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
