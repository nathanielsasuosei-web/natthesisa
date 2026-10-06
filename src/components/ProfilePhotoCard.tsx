"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtBytes } from "@/lib/format";
import ImageEditor from "./media/ImageEditor";
import AvatarImage from "./AvatarImage";
import Icon from "./Icon";

interface Props {
  name: string;
  /** The current picture, or null for initials. */
  initialSrc: string | null;
  /** Size of the stored picture, so the card can say what is saved. */
  initialSize?: number | null;
  /** Original file name of the stored picture. */
  initialName?: string | null;
}

/** What the editor exports: a 512px square, the largest place a photo appears. */
const OUTPUT_LONG_EDGE = 512;
const CLIENT_MAX_BYTES = 4 * 1024 * 1024;

/**
 * The profile-picture control on the account page.
 *
 * Choosing a file opens the same picture editor the owner's branding uses
 * (crop, zoom, rotate, tune), and the edited square is uploaded and saved as
 * soon as it is applied — a photo is not part of the profile form, so there is
 * nothing else to submit. Removing it is one click and puts the initials back.
 *
 * The upload uses XMLHttpRequest rather than fetch for one reason: it reports
 * progress, and a picture sent from a phone on mobile data is worth a bar.
 */
export default function ProfilePhotoCard({ name, initialSrc, initialSize = null, initialName = null }: Props) {
  const router = useRouter();
  const [src, setSrc] = useState(initialSrc);
  const [stored, setStored] = useState<{ name: string | null; size: number | null }>({
    name: initialName,
    size: initialSize,
  });
  const [editor, setEditor] = useState<{ source: File | string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);

  function pick(list: FileList | null) {
    const file = list?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ error: true, text: "Choose an image file (PNG, JPG, WEBP, GIF or AVIF)." });
      return;
    }
    if (file.size > CLIENT_MAX_BYTES) {
      setMessage({ error: true, text: "That picture is larger than the 4 MB limit. Try a smaller one." });
      return;
    }
    setMessage(null);
    setEditor({ source: file, name: file.name });
  }

  function upload(file: File) {
    if (busy) return;
    const payload = new FormData();
    payload.set("file", file);
    setBusy(true);
    setProgress(1);
    setMessage(null);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/account/avatar");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      setBusy(false);
      setProgress(0);
      let data: { error?: string; avatarUrl?: string | null } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        setSrc(data.avatarUrl ?? null);
        setStored({ name: file.name, size: file.size });
        setMessage({ text: "Saved. Your picture now appears next to your name." });
        router.refresh();
        return;
      }
      setMessage({ error: true, text: data.error ?? "Your picture could not be saved. Please try again." });
    };
    xhr.onerror = () => {
      setBusy(false);
      setProgress(0);
      setMessage({ error: true, text: "Network error. Your picture was not changed." });
    };
    xhr.send(payload);
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account/avatar", { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ error: true, text: data.error ?? "Your picture could not be removed. Please try again." });
        return;
      }
      setSrc(null);
      setStored({ name: null, size: null });
      setMessage({ text: "Picture removed. Your initials are shown instead." });
      router.refresh();
    } catch {
      setMessage({ error: true, text: "Network error. Your picture was not changed." });
    } finally {
      setBusy(false);
    }
  }

  if (editor) {
    return (
      <ImageEditor
        source={editor.source}
        name={editor.name}
        title="Edit your profile picture"
        hint="Square works best · drag to reposition, scroll or pinch to zoom"
        defaultPreset="square"
        outputLongEdge={OUTPUT_LONG_EDGE}
        onApply={(result) => {
          setEditor(null);
          upload(result.file);
        }}
        onCancel={() => setEditor(null)}
      />
    );
  }

  return (
    <section className="open-surface">
      <div className="border-b border-[#ece9ef] py-4">
        <h2 className="text-sm font-extrabold">Profile picture</h2>
        <p className="mt-1 text-[10px] text-[#918a97]">
          Your picture appears next to your name in the dashboard. Only you and your teacher can see it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-5 py-6">
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[22px] bg-[#1b1822] text-xl font-black text-[#c3b6ff]">
          <AvatarImage name={name} src={src} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-[10px] font-bold text-[#5e5864] transition hover:border-violet-300">
              <Icon name="upload" size={13} /> {src ? "Replace picture" : "Add a picture"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(event) => {
                  pick(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            {src && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-[10px] font-bold text-red-600 transition hover:border-red-300 disabled:opacity-50"
              >
                <Icon name="close" size={13} /> Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-[9px] leading-4 text-[#a19aa7]">
            {stored.name && src
              ? `${stored.name}${stored.size ? ` · ${fmtBytes(stored.size)}` : ""}`
              : "PNG, JPG, WEBP, GIF or AVIF · cropped square · up to 4 MB"}
          </p>
        </div>
      </div>

      {busy && (
        <div className="pb-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeaf1]">
            <div className="h-full rounded-full bg-[#6d4aff] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-[10px] font-semibold text-[#817a87]">
            {progress ? `Uploading ${progress}%…` : "Saving…"}
          </p>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`mb-5 rounded-xl border px-4 py-3 text-xs font-semibold ${
            message.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
