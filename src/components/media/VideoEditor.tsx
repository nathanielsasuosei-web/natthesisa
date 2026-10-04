"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_VIDEO_EDITS, VideoEdits, canvasToFile, clipLength, formatClock, posterFileName } from "@/lib/media";
import Icon from "../Icon";

export interface VideoEditResult {
  edits: VideoEdits;
  posterFile: File | null;
  posterPreview: string | null;
  removePoster: boolean;
}

interface Props {
  /** Object URL of a local file, or the href of an already-uploaded video. */
  src: string;
  name: string;
  initial?: Partial<VideoEdits>;
  existingPoster?: string | null;
  onApply: (result: VideoEditResult) => void;
  onCancel: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function VideoEditor({ src, name, initial, existingPoster = null, onApply, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<"start" | "end" | "scrub" | null>(null);

  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(initial?.trimStart ?? DEFAULT_VIDEO_EDITS.trimStart);
  const [trimEnd, setTrimEnd] = useState<number | null>(initial?.trimEnd ?? DEFAULT_VIDEO_EDITS.trimEnd);
  const [muted, setMuted] = useState(initial?.muted ?? DEFAULT_VIDEO_EDITS.muted);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edits: VideoEdits = useMemo(() => ({ trimStart, trimEnd, muted }), [trimStart, trimEnd, muted]);
  const effectiveEnd = trimEnd ?? duration;
  const kept = clipLength(edits, duration);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key === " " && event.target instanceof HTMLElement && event.target.tagName !== "BUTTON") {
        event.preventDefault();
        void togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCancel]);

  useEffect(() => {
    return () => {
      if (posterPreview) URL.revokeObjectURL(posterPreview);
    };
  }, [posterPreview]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.currentTime < trimStart || video.currentTime >= effectiveEnd) video.currentTime = trimStart;
      void video.play();
    } else {
      video.pause();
    }
  }

  function onTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrent(video.currentTime);
    if (video.currentTime >= effectiveEnd - 0.04) {
      video.pause();
      video.currentTime = trimStart;
      setCurrent(trimStart);
    }
  }

  function timeFromClientX(clientX: number): number {
    const track = trackRef.current;
    if (!track || !duration) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return ratio * duration;
  }

  function onTrackPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).dataset.handle) return;
    const time = timeFromClientX(event.clientX);
    dragRef.current = "scrub";
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = clamp(time, trimStart, effectiveEnd);
    }
    setCurrent(video?.currentTime ?? time);
    trackRef.current?.setPointerCapture(event.pointerId);
  }

  function onTrackPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const time = timeFromClientX(event.clientX);
    if (dragRef.current === "start") {
      const next = clamp(time, 0, effectiveEnd - 0.3);
      setTrimStart(next);
      if (videoRef.current) videoRef.current.currentTime = next;
    } else if (dragRef.current === "end") {
      const next = clamp(time, trimStart + 0.3, duration);
      setTrimEnd(next);
      if (videoRef.current) videoRef.current.currentTime = next;
    } else {
      const video = videoRef.current;
      if (video) video.currentTime = clamp(time, trimStart, effectiveEnd);
    }
  }

  function onTrackPointerUp() {
    dragRef.current = null;
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Play the video for a moment, then capture the frame again.");
      return;
    }
    const scale = Math.min(1, 1280 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const file = await canvasToFile(canvas, posterFileName(name), "image/jpeg", 0.86);
      if (posterPreview) URL.revokeObjectURL(posterPreview);
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
      setRemovePoster(false);
      setError(null);
    } catch {
      setError("That frame could not be captured.");
    }
  }

  function apply() {
    if (busy) return;
    setBusy(true);
    onApply({
      edits: { trimStart, trimEnd, muted },
      posterFile,
      posterPreview,
      removePoster: removePoster && !posterFile,
    });
  }

  const startPercent = duration ? (trimStart / duration) * 100 : 0;
  const endPercent = duration ? (effectiveEnd / duration) * 100 : 100;
  const playPercent = duration ? (current / duration) * 100 : 0;
  const poster = posterPreview ?? (existingPoster && !removePoster ? existingPoster : null);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#15121c]/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="w-full max-w-3xl rounded-[22px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#ece9ee] p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#6d4aff]">Video editor</p>
            <h2 className="mt-1 truncate text-base font-black tracking-[-.03em]">{name}</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">Trim the clip, mute it, and choose the thumbnail learners see.</p>
          </div>
          <button onClick={onCancel} className="grid size-8 shrink-0 place-items-center rounded-xl text-[#8a8390] transition hover:bg-[#f3f1f5]" aria-label="Close editor"><Icon name="close" size={15} /></button>
        </header>

        <div className="space-y-5 p-5">
          <div className="overflow-hidden rounded-2xl bg-[#191621]">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              src={src}
              muted={muted}
              playsInline
              preload="metadata"
              className="mx-auto max-h-[46vh] w-full bg-black"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                setDuration(Number.isFinite(video.duration) ? video.duration : 0);
                video.currentTime = clamp(initial?.trimStart ?? 0, 0, video.duration || 0);
              }}
              onTimeUpdate={onTimeUpdate}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          </div>

          {/* Timeline */}
          <div>
            <div
              ref={trackRef}
              onPointerDown={onTrackPointerDown}
              onPointerMove={onTrackPointerMove}
              onPointerUp={onTrackPointerUp}
              onPointerCancel={onTrackPointerUp}
              className="relative h-12 cursor-pointer touch-none select-none rounded-xl bg-[#eeeaf1]"
            >
              <div className="absolute inset-y-0 left-0 rounded-l-xl bg-[#dcd6e4]/70" style={{ width: `${startPercent}%` }} />
              <div className="absolute inset-y-0 right-0 rounded-r-xl bg-[#dcd6e4]/70" style={{ width: `${100 - endPercent}%` }} />
              <div className="absolute inset-y-0 bg-[#e6ddff]" style={{ left: `${startPercent}%`, width: `${Math.max(0, endPercent - startPercent)}%` }} />
              <div className="absolute inset-y-0 w-0.5 bg-[#1b1822]" style={{ left: `${playPercent}%` }} />
              <button
                data-handle="start"
                onPointerDown={(event) => { event.stopPropagation(); dragRef.current = "start"; trackRef.current?.setPointerCapture(event.pointerId); }}
                className="absolute inset-y-0 -ml-2 w-4 cursor-ew-resize rounded-lg bg-[#6d4aff] shadow"
                style={{ left: `${startPercent}%` }}
                aria-label="Trim start"
              />
              <button
                data-handle="end"
                onPointerDown={(event) => { event.stopPropagation(); dragRef.current = "end"; trackRef.current?.setPointerCapture(event.pointerId); }}
                className="absolute inset-y-0 -ml-2 w-4 cursor-ew-resize rounded-lg bg-[#6d4aff] shadow"
                style={{ left: `${endPercent}%` }}
                aria-label="Trim end"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-[#817a87]">
              <span>{formatClock(current)} / {formatClock(duration)}</span>
              <span className="rounded-lg bg-[#f0ecff] px-2 py-1 font-black text-[#5e3de0]">{formatClock(trimStart)} → {formatClock(effectiveEnd)} · keeps {formatClock(kept)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={togglePlay} className="inline-flex items-center gap-1.5 rounded-xl bg-[#1b1822] px-3.5 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#2b2733]"><Icon name="play" size={11} /> {playing ? "Pause" : "Preview"}</button>
            <button onClick={() => { setTrimStart(current); if (trimEnd !== null && trimEnd < current + 0.3) setTrimEnd(null); }} className="rounded-xl border border-[#ddd9e2] px-3.5 py-2.5 text-[11px] font-bold text-[#5e5864] transition hover:border-violet-300">Set start here</button>
            <button onClick={() => { if (current > trimStart + 0.3) setTrimEnd(current); }} className="rounded-xl border border-[#ddd9e2] px-3.5 py-2.5 text-[11px] font-bold text-[#5e5864] transition hover:border-violet-300">Set end here</button>
            <button onClick={() => { setTrimStart(0); setTrimEnd(null); }} className="rounded-xl border border-[#ddd9e2] px-3.5 py-2.5 text-[11px] font-bold text-[#5e5864] transition hover:border-violet-300">Full clip</button>
            <button onClick={() => setMuted((value) => !value)} className={`rounded-xl border px-3.5 py-2.5 text-[11px] font-bold transition ${muted ? "border-[#6d4aff] bg-[#f0ecff] text-[#5e3de0]" : "border-[#ddd9e2] text-[#5e5864] hover:border-violet-300"}`}>{muted ? "Muted" : "Sound on"}</button>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#e8e4ec] bg-[#fbfafc] p-4">
            <span className="grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e4e0e8] bg-[#191621]">
              {poster ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={poster} alt="Video thumbnail" className="size-full object-cover" />
              ) : (
                <Icon name="video" size={20} className="text-[#6f6880]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold text-[#332e39]">Thumbnail</p>
              <p className="mt-0.5 text-[10px] leading-4 text-[#918a97]">Pause on the frame you like, then capture it. Learners see it before the video plays.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={captureFrame} className="rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#5e5864] transition hover:border-violet-300">Capture frame</button>
              {poster && (
                <button onClick={() => { if (posterPreview) URL.revokeObjectURL(posterPreview); setPosterFile(null); setPosterPreview(null); setRemovePoster(true); }} className="rounded-xl border border-[#f0c9c9] bg-white px-3.5 py-2.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50">Remove</button>
              )}
            </div>
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold text-red-700">{error}</p>}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#ece9ee] pt-4">
            <button onClick={onCancel} className="rounded-xl border border-[#ddd9e2] px-4 py-2.5 text-xs font-bold text-[#5e5864]">Cancel</button>
            <button onClick={apply} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#5e3ce8] disabled:opacity-60"><Icon name="check" size={14} /> {busy ? "Saving…" : "Apply edits"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
