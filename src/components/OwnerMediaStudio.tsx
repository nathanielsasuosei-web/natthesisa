"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageEditor, { PHOTO_PRESETS } from "@/components/media/ImageEditor";
import VideoEditor from "@/components/media/VideoEditor";
import { canvasToFile, DEFAULT_VIDEO_EDITS, formatClock, posterFileName, type VideoEdits } from "@/lib/media";
import Icon from "@/components/Icon";

/**
 * The teacher's studio: standalone picture and video editing.
 *
 * The lesson upload form has editors built in for the files attached to a
 * lesson. This page is the same machinery without a lesson attached — open a
 * picture or a video from the device, edit it, and take the result away:
 *
 *   pictures → crop, zoom, rotate, flip, brightness/contrast/saturation,
 *              exported at a chosen long edge (PNG or JPEG)
 *   videos   → trim, mute, capture a thumbnail, export the edited clip
 *
 * Nothing is uploaded. Files stay in the browser and the exports are
 * downloads, which is what makes it safe to try on a client's footage.
 */

type Tab = "picture" | "video";

const LONG_EDGES = [720, 1280, 1920, 2560];

export default function OwnerMediaStudio() {
  const [tab, setTab] = useState<Tab>("picture");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // ---- picture -------------------------------------------------------------
  const [imageSource, setImageSource] = useState<{ url: string; name: string } | null>(null);
  const [imageResult, setImageResult] = useState<{ url: string; name: string; size: number; width: number; height: number } | null>(null);
  const [longEdge, setLongEdge] = useState(1280);
  const [preferPng, setPreferPng] = useState(false);

  // ---- video ---------------------------------------------------------------
  const [videoSource, setVideoSource] = useState<{ url: string; name: string } | null>(null);
  const [videoResult, setVideoResult] = useState<{ edits: VideoEdits; posterUrl: string | null; posterName: string | null } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Object URLs are revoked when they are replaced or when the page unmounts.
  useEffect(() => {
    return () => {
      if (imageSource) URL.revokeObjectURL(imageSource.url);
      if (videoSource) URL.revokeObjectURL(videoSource.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = useCallback((file: File | undefined, kind: Tab) => {
    if (!file) return;
    if (kind === "picture" && !file.type.startsWith("image/")) {
      setMessage({ tone: "error", text: "That file is not a picture. Choose a PNG, JPEG, WebP or GIF." });
      return;
    }
    if (kind === "video" && !file.type.startsWith("video/")) {
      setMessage({ tone: "error", text: "That file is not a video. Choose an MP4, WebM or MOV." });
      return;
    }
    const url = URL.createObjectURL(file);
    setMessage(null);
    if (kind === "picture") {
      if (imageSource) URL.revokeObjectURL(imageSource.url);
      setImageSource({ url, name: file.name });
      setImageResult(null);
    } else {
      if (videoSource) URL.revokeObjectURL(videoSource.url);
      setVideoSource({ url, name: file.name });
      setVideoResult(null);
    }
  }, [imageSource, videoSource]);

  const download = useCallback((url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  }, []);

  // ---- export a trimmed video, muted or not, recorded in the browser -------
  const exportVideo = useCallback(async () => {
    if (!videoSource || !videoResult) return;
    const video = document.querySelector<HTMLVideoElement>("[data-studio-video]");
    if (!video) return;

    const start = videoResult.edits.trimStart ?? 0;
    const end = videoResult.edits.trimEnd ?? video.duration;
    const canCapture = typeof (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream === "function";
    const Recorder = typeof window !== "undefined" ? window.MediaRecorder : undefined;
    if (!canCapture || !Recorder) {
      setMessage({
        tone: "error",
        text: "This browser cannot record the edited clip. The trim settings and the thumbnail still work — download the poster and apply the trim when you attach the video to a lesson.",
      });
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setMessage(null);
    try {
      const stream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
      if (videoResult.edits.muted) stream.getAudioTracks().forEach((track) => track.enabled = false);
      const recorder = new Recorder(stream, { mimeType: pickMime(Recorder) });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };

      const done = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });

      video.currentTime = start;
      video.muted = true; // only for monitoring; the stream carries its own audio
      await video.play();
      recorder.start(250);

      const tick = window.setInterval(() => {
        const span = Math.max(0.1, end - start);
        setExportProgress(Math.min(100, Math.round(((video.currentTime - start) / span) * 100)));
      }, 200);

      await new Promise<void>((resolve) => {
        const check = window.setInterval(() => {
          if (video.currentTime >= end || video.ended) {
            window.clearInterval(check);
            window.clearInterval(tick);
            video.pause();
            resolve();
          }
        }, 100);
      });

      recorder.stop();
      await done;
      setExportProgress(100);
      const blob = new Blob(chunks, { type: chunks.length ? recorder.mimeType : "video/webm" });
      const url = URL.createObjectURL(blob);
      const base = videoSource.name.replace(/\.[^.]+$/, "");
      download(url, `${base}-edited.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
      setMessage({ tone: "ok", text: `Exported ${formatClock(end - start)} of video. Check your downloads.` });
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error(error);
      setMessage({ tone: "error", text: "The export stopped early. Try trimming a shorter section, or use a smaller file." });
    } finally {
      setExporting(false);
    }
  }, [download, videoResult, videoSource]);

  const poster = useMemo(() => videoResult?.posterUrl ?? null, [videoResult]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">Teacher tools</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Studio</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#756f7b]">
            Edit pictures and videos right here. Nothing is uploaded — open a file, edit it, and download the
            result. The same editors are built into lesson uploads.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-[#e4e0e8] bg-white p-1">
          {(["picture", "video"] as Tab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => { setTab(value); setMessage(null); }}
              className={`inline-flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-xs font-bold transition ${tab === value ? "bg-[#6d4aff] text-white" : "text-[#6d6673] hover:bg-[#f5f3f7]"}`}
            >
              <Icon name={value === "picture" ? "file" : "video"} size={14} />
              {value === "picture" ? "Picture" : "Video"}
            </button>
          ))}
        </div>
      </header>

      {message && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${message.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-white/70 text-xs font-black">{message.tone === "ok" ? "✓" : "!"}</span>
          <p className="leading-6">{message.text}</p>
        </div>
      )}

      {tab === "picture" && (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[22px] border border-[#e8e4ec] bg-white p-5">
            <h2 className="text-sm font-extrabold">1. Open a picture</h2>
            <p className="mt-1 text-xs leading-5 text-[#817a87]">PNG, JPEG, WebP or GIF. Everything happens in this browser.</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ddd7e6] bg-[#fbfafc] px-5 py-9 text-center transition hover:border-[#b9a9ff] hover:bg-[#f8f6ff]">
              <Icon name="upload" size={22} className="text-[#6d4aff]" />
              <span className="text-xs font-bold text-[#4a4450]">{imageSource ? "Choose a different picture" : "Choose a picture from your device"}</span>
              <span className="text-[10px] text-[#918a97]">Up to about 20 MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={(event) => pick(event.target.files?.[0], "picture")} />
            </label>

            <div className="mt-5 space-y-4 border-t border-[#eeeaf1] pt-5">
              <div>
                <p className="text-[11px] font-bold text-[#4a4450]">Export size (long edge)</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {LONG_EDGES.map((size) => (
                    <button key={size} type="button" onClick={() => setLongEdge(size)} className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${longEdge === size ? "bg-[#6d4aff] text-white" : "border border-[#e2dee6] text-[#6d6673] hover:bg-[#f6f4f8]"}`}>
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-5 text-[#5d5763]">
                <input type="checkbox" checked={preferPng} onChange={(event) => setPreferPng(event.target.checked)} className="mt-0.5 size-4 accent-[#6d4aff]" />
                <span><strong className="block text-[#332e39]">Export as PNG</strong>Keeps transparency, larger file. Off, the export is a JPEG at 92% quality.</span>
              </label>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8e4ec] bg-white p-5">
            <h2 className="text-sm font-extrabold">2. Edit and export</h2>
            {!imageSource && <p className="mt-2 text-xs leading-5 text-[#918a97]">Choose a picture and the editor opens here.</p>}
            {imageSource && !imageResult && (
              <p className="mt-2 text-xs leading-5 text-[#918a97]">
                The editor is open over the page — crop, zoom, rotate or adjust the colours, then press Apply to
                get the download.
              </p>
            )}
            {imageResult && (
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageResult.url} alt="" className="w-full rounded-xl border border-[#e8e4ec] object-contain" />
                <p className="mt-3 text-[11px] text-[#6d6673]">{imageResult.name} · {imageResult.width}×{imageResult.height} · {(imageResult.size / 1024).toFixed(0)} KB</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => download(imageResult.url, imageResult.name)} className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#7a5aff]">
                    <Icon name="download" size={14} /> Download again
                  </button>
                  <button type="button" onClick={() => { if (imageSource) setImageResult(null); }} className="rounded-xl border border-[#ddd9e2] px-4 py-2.5 text-xs font-bold text-[#5e5864] transition hover:bg-[#f7f5f9]">
                    Edit it again
                  </button>
                </div>
              </div>
            )}
          </div>

          {imageSource && !imageResult && (
            <ImageEditor
              source={imageSource.url}
              name={imageSource.name}
              title="Edit picture"
              hint="Drag to reposition · scroll to zoom · apply to download"
              presets={PHOTO_PRESETS}
              outputLongEdge={longEdge}
              preferPng={preferPng}
              onCancel={() => setImageSource(null)}
              onApply={(result) => {
                const url = URL.createObjectURL(result.file);
                setImageResult({ url, name: result.file.name, size: result.file.size, width: result.width, height: result.height });
                setImageSource(null);
                setMessage({ tone: "ok", text: "Picture edited. Your download has started — you can edit it again from the panel." });
                download(url, result.file.name);
              }}
            />
          )}
        </section>
      )}

      {tab === "video" && (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[22px] border border-[#e8e4ec] bg-white p-5">
            <h2 className="text-sm font-extrabold">1. Open a video</h2>
            <p className="mt-1 text-xs leading-5 text-[#817a87]">MP4, WebM or MOV. Trim it, mute it, capture a thumbnail.</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ddd7e6] bg-[#fbfafc] px-5 py-9 text-center transition hover:border-[#b9a9ff] hover:bg-[#f8f6ff]">
              <Icon name="video" size={22} className="text-[#6d4aff]" />
              <span className="text-xs font-bold text-[#4a4450]">{videoSource ? "Choose a different video" : "Choose a video from your device"}</span>
              <span className="text-[10px] text-[#918a97]">Long clips export slowly — trim first</span>
              <input type="file" accept="video/*" className="hidden" onChange={(event) => pick(event.target.files?.[0], "video")} />
            </label>

            {videoSource && (
              <div className="mt-5 border-t border-[#eeeaf1] pt-5">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wide text-[#8a8390]">Preview</h3>
                <video data-studio-video src={videoSource.url} controls playsInline className="mt-2 w-full rounded-xl border border-[#e8e4ec] bg-black" />
                <p className="mt-2 text-[10px] text-[#918a97]">{videoSource.name}</p>
                {videoSource && !videoResult && (
                  <p className="mt-3 text-xs leading-5 text-[#918a97]">The trim editor is open over the page — set the start and end, capture a thumbnail, then Apply.</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[22px] border border-[#e8e4ec] bg-white p-5">
            <h2 className="text-sm font-extrabold">2. Export</h2>
            {!videoResult && <p className="mt-2 text-xs leading-5 text-[#918a97]">Your edit summary and the export buttons appear here after you apply an edit.</p>}
            {videoResult && (
              <div className="mt-3 space-y-4">
                <dl className="space-y-2 rounded-xl border border-[#eeeaf1] bg-[#fbfafc] p-4 text-[11px]">
                  <div className="flex justify-between gap-3"><dt className="text-[#817a87]">Trim start</dt><dd className="font-bold text-[#332e39]">{formatClock(videoResult.edits.trimStart ?? 0)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[#817a87]">Trim end</dt><dd className="font-bold text-[#332e39]">{videoResult.edits.trimEnd == null ? "End of clip" : formatClock(videoResult.edits.trimEnd)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[#817a87]">Audio</dt><dd className="font-bold text-[#332e39]">{videoResult.edits.muted ? "Muted" : "Kept"}</dd></div>
                </dl>

                {poster && (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={poster} alt="Captured thumbnail" className="w-40 rounded-lg border border-[#e8e4ec]" />
                    <button
                      type="button"
                      onClick={() => { if (poster && videoResult.posterName) downloadFile(poster, videoResult.posterName); }}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] px-3.5 py-2.5 text-[11px] font-bold text-[#5e5864] transition hover:bg-[#f7f5f9]"
                    >
                      <Icon name="download" size={13} /> Download thumbnail
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={exportVideo}
                  disabled={exporting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#7a5aff] disabled:opacity-60"
                >
                  <Icon name="video" size={15} />
                  {exporting ? `Recording the edited clip… ${exportProgress}%` : "Export the edited video"}
                </button>
                {exporting && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#eeeaf1]"><div className="h-full rounded-full bg-[#6d4aff] transition-all" style={{ width: `${exportProgress}%` }} /></div>
                )}
                <p className="text-[10px] leading-4 text-[#918a97]">
                  The export plays the trimmed section once and records it, so a long clip takes as long as the
                  trimmed part. The file arrives in your downloads as WebM (or MP4 where the browser supports it).
                </p>
              </div>
            )}
          </div>

          {videoSource && !videoResult && (
            <VideoEditor
              src={videoSource.url}
              name={videoSource.name}
              initial={DEFAULT_VIDEO_EDITS}
              onCancel={() => setVideoSource(null)}
              onApply={(result) => {
                const posterUrl = result.posterPreview ?? null;
                setVideoResult({
                  edits: result.edits,
                  posterUrl,
                  posterName: result.posterFile ? posterFileName(videoSource.name) : null,
                });
                setVideoSource(null);
                setMessage({ tone: "ok", text: "Edit applied. Export the clip or download the thumbnail on the right." });
              }}
            />
          )}
        </section>
      )}

      <section className="rounded-[22px] border border-[#e8e4ec] bg-white p-5">
        <h2 className="text-sm font-extrabold">What the studio does</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Crop & resize", "Square, wide, portrait or freeform crops, pan, zoom, rotate and flip. Export at 720p to 2560px."],
            ["Colour", "Brightness, contrast and saturation with live preview, exported into the file."],
            ["Trim & mute", "Set the start and end of a clip, mute it, and record the trimmed result as a new file."],
            ["Thumbnails", "Capture any frame as the poster learners see — downloadable on its own."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-[#eeeaf1] bg-[#fbfafc] p-4">
              <p className="text-xs font-extrabold text-[#332e39]">{title}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#7d7683]">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#918a97]">
          Attaching a picture or video to a lesson? Use the same editors inside <strong>Upload lessons</strong> — there the
          edits are saved with the lesson, so learners see the cropped picture and the trimmed clip.
        </p>
      </section>
    </div>
  );
}

/** MediaRecorder codec preference: MP4 where it is supported, WebM otherwise. */
function pickMime(Recorder: typeof MediaRecorder): string | undefined {
  const candidates = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const type of candidates) {
    if (typeof Recorder.isTypeSupported === "function" && Recorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

/** Downloads a blob URL under a chosen name. */
function downloadFile(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
}

// `canvasToFile` is re-exported for callers that want the canvas helpers too.
export { canvasToFile };
