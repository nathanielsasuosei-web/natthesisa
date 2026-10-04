"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtBytes, fmtDate } from "@/lib/format";
import Icon from "./Icon";

export interface OwnerBrandingView {
  displayName: string;
  roleTitle: string;
  hasPhoto: boolean;
  hasLogo: boolean;
  photoHref: string | null;
  logoHref: string | null;
  photoName: string | null;
  logoName: string | null;
  photoSize: number | null;
  logoSize: number | null;
  updatedAt: string | null;
}

interface Props {
  initial: OwnerBrandingView;
}

const FIELD =
  "w-full rounded-xl border border-[#dcd8e2] bg-white px-3.5 py-2.5 text-xs text-[#211d27] transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100";
const LABEL = "mb-1.5 block text-[10px] font-black uppercase tracking-[.11em] text-[#6d6672]";

export default function OwnerBrandingCard({ initial }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [roleTitle, setRoleTitle] = useState(initial.roleTitle);
  const [state, setState] = useState(initial);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);

  function pick(setter: (file: File | null) => void, list: FileList | null) {
    const file = list?.[0] ?? null;
    if (file && !file.type.startsWith("image/")) {
      setMessage({ error: true, text: "Choose an image file (PNG, JPG, WEBP, GIF or AVIF)." });
      return;
    }
    if (file && file.size > 200 * 1024 * 1024) {
      setMessage({ error: true, text: "That image is larger than the 200 MB limit." });
      return;
    }
    setMessage(null);
    setter(file);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    const payload = new FormData();
    payload.set("displayName", displayName.trim());
    payload.set("roleTitle", roleTitle.trim());
    if (photoFile) payload.set("photo", photoFile);
    if (logoFile) payload.set("logo", logoFile);
    if (removePhoto && !photoFile) payload.set("removePhoto", "true");
    if (removeLogo && !logoFile) payload.set("removeLogo", "true");

    setBusy(true);
    setProgress(1);
    setMessage(null);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/branding");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      setBusy(false);
      setProgress(0);
      let data: { error?: string; branding?: OwnerBrandingView; assets?: { photo: string | null; logo: string | null } } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.branding) {
        const saved = data.branding;
        setState({
          ...saved,
          photoName: data.assets?.photo ?? (removePhoto ? null : state.photoName),
          logoName: data.assets?.logo ?? (removeLogo ? null : state.logoName),
          photoSize: photoFile?.size ?? (removePhoto ? null : state.photoSize),
          logoSize: logoFile?.size ?? (removeLogo ? null : state.logoSize),
        });
        setPhotoFile(null);
        setLogoFile(null);
        setRemovePhoto(false);
        setRemoveLogo(false);
        setMessage({ text: "Saved. Your photo and logo now appear on the lessons you publish." });
        router.refresh();
        return;
      }
      setMessage({ error: true, text: data.error ?? "Your photo and logo could not be saved." });
    };
    xhr.onerror = () => {
      setBusy(false);
      setProgress(0);
      setMessage({ error: true, text: "Network error. Nothing was changed." });
    };
    xhr.send(payload);
  }

  return (
    <section className="open-surface rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffcf59]/25 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-[#8a6d00]">
            <Icon name="user" size={12} /> Your branding
          </span>
          <h2 className="mt-3 text-base font-black tracking-[-.03em]">Photo &amp; logo</h2>
          <p className="mt-1 text-[11px] leading-5 text-[#8a8390]">
            Add your picture and logo once — they are attached to every lesson you publish, so learners always see who is teaching.
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f0ecff] text-[#5e3de0]"><Icon name="spark" size={20} /></span>
      </div>

      <form onSubmit={save} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Photo */}
          <div className="rounded-2xl border border-[#e8e4ec] bg-[#fbfafc] p-4">
            <span className={LABEL}>Profile photo</span>
            <div className="mt-1 flex items-center gap-4">
              <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#e4e0e8] bg-white">
                {photoFile ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={URL.createObjectURL(photoFile)} alt="New profile photo" className="size-full object-cover" />
                ) : state.hasPhoto && state.photoHref && !removePhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={`${state.photoHref}?v=${state.updatedAt ?? ""}`} alt="Profile photo" className="size-full object-cover" />
                ) : (
                  <Icon name="user" size={26} className="text-[#b3acb9]" />
                )}
              </span>
              <div className="min-w-0">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#ddd9e2] bg-white px-3 py-2 text-[10px] font-bold text-[#5e5864] transition hover:border-violet-300">
                  <Icon name="upload" size={12} /> {state.hasPhoto ? "Replace photo" : "Choose photo"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => { pick(setPhotoFile, event.target.files); event.target.value = ""; }} />
                </label>
                {(state.hasPhoto || photoFile) && (
                  <button type="button" onClick={() => { setPhotoFile(null); setRemovePhoto(true); }} className={`mt-2 block text-[10px] font-bold ${removePhoto ? "text-[#9a939f]" : "text-red-600"}`}>
                    {removePhoto ? "Will be removed on save" : "Remove photo"}
                  </button>
                )}
                {photoFile ? (
                  <p className="mt-2 text-[9px] text-[#817a87]">{photoFile.name} · {fmtBytes(photoFile.size)}</p>
                ) : state.photoName && state.hasPhoto && !removePhoto ? (
                  <p className="mt-2 text-[9px] text-[#817a87]">Saved{state.photoSize ? ` · ${fmtBytes(state.photoSize)}` : ""}</p>
                ) : (
                  <p className="mt-2 text-[9px] text-[#a19aa7]">Square images look best</p>
                )}
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="rounded-2xl border border-[#e8e4ec] bg-[#fbfafc] p-4">
            <span className={LABEL}>Logo</span>
            <div className="mt-1 flex items-center gap-4">
              <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#e4e0e8] bg-[#1b1822]">
                {logoFile ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={URL.createObjectURL(logoFile)} alt="New logo" className="size-full object-contain p-2" />
                ) : state.hasLogo && state.logoHref && !removeLogo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={`${state.logoHref}?v=${state.updatedAt ?? ""}`} alt="Logo" className="size-full object-contain p-2" />
                ) : (
                  <Icon name="layers" size={24} className="text-[#6f6880]" />
                )}
              </span>
              <div className="min-w-0">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#ddd9e2] bg-white px-3 py-2 text-[10px] font-bold text-[#5e5864] transition hover:border-violet-300">
                  <Icon name="upload" size={12} /> {state.hasLogo ? "Replace logo" : "Choose logo"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => { pick(setLogoFile, event.target.files); event.target.value = ""; }} />
                </label>
                {(state.hasLogo || logoFile) && (
                  <button type="button" onClick={() => { setLogoFile(null); setRemoveLogo(true); }} className={`mt-2 block text-[10px] font-bold ${removeLogo ? "text-[#9a939f]" : "text-red-600"}`}>
                    {removeLogo ? "Will be removed on save" : "Remove logo"}
                  </button>
                )}
                {logoFile ? (
                  <p className="mt-2 text-[9px] text-[#817a87]">{logoFile.name} · {fmtBytes(logoFile.size)}</p>
                ) : state.logoName && state.hasLogo && !removeLogo ? (
                  <p className="mt-2 text-[9px] text-[#817a87]">Saved{state.logoSize ? ` · ${fmtBytes(state.logoSize)}` : ""}</p>
                ) : (
                  <p className="mt-2 text-[9px] text-[#a19aa7]">Transparent PNG works best</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL}>Name shown on lessons</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Nathaniel Asuosei" className={FIELD} />
          </label>
          <label className="block">
            <span className={LABEL}>Role line</span>
            <input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="Lead instructor" className={FIELD} />
          </label>
        </div>

        {busy && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeaf1]"><div className="h-full rounded-full bg-[#6d4aff] transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="mt-1.5 text-[10px] font-semibold text-[#817a87]">Uploading {progress}%…</p>
          </div>
        )}

        {message && (
          <p role="status" className={`rounded-xl px-3.5 py-2.5 text-[11px] font-semibold ${message.error ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{message.text}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] text-[#9a939f]">{state.updatedAt ? `Last updated ${fmtDate(state.updatedAt)}` : "Not saved yet"}</p>
          <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1b1822] px-4 py-3 text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#2b2733] disabled:translate-y-0 disabled:opacity-60">
            {busy ? "Saving…" : <><Icon name="check" size={14} /> Save photo &amp; logo</>}
          </button>
        </div>
      </form>
    </section>
  );
}
