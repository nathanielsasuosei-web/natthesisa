"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canvasToFile, editedFileName, frameSize, naturalFrame } from "@/lib/media";
import Icon from "../Icon";

export interface ImageEditResult {
  file: File;
  width: number;
  height: number;
}

interface AspectPreset {
  id: string;
  label: string;
  ratio: number | null; // null = the image's own shape
}

interface Props {
  /** A File from the device, or a URL of an already-uploaded image. */
  source: File | string;
  name: string;
  title?: string;
  hint?: string;
  presets?: AspectPreset[];
  defaultPreset?: string;
  /** Long edge of the exported image, in pixels. */
  outputLongEdge?: number;
  /** Export as PNG (keeps transparency) instead of JPEG. */
  preferPng?: boolean;
  onApply: (result: ImageEditResult) => void;
  onCancel: () => void;
}

const SQUARE_PRESETS: AspectPreset[] = [
  { id: "square", label: "Square 1:1", ratio: 1 },
  { id: "portrait", label: "Portrait 4:5", ratio: 4 / 5 },
  { id: "landscape", label: "Wide 16:9", ratio: 16 / 9 },
  { id: "original", label: "Original", ratio: null },
];

const WIDE_PRESETS: AspectPreset[] = [
  { id: "wide", label: "Wide 3:1", ratio: 3 },
  { id: "banner", label: "Banner 4:1", ratio: 4 },
  { id: "square", label: "Square 1:1", ratio: 1 },
  { id: "original", label: "Original", ratio: null },
];

const PHOTO_PRESETS: AspectPreset[] = [
  { id: "free", label: "Freeform", ratio: null },
  { id: "square", label: "Square 1:1", ratio: 1 },
  { id: "landscape", label: "Landscape 16:9", ratio: 16 / 9 },
  { id: "portrait", label: "Portrait 4:5", ratio: 4 / 5 },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function ImageEditor({
  source,
  name,
  title = "Edit picture",
  hint = "Drag to reposition · scroll or pinch to zoom",
  presets = PHOTO_PRESETS,
  defaultPreset,
  outputLongEdge = 1280,
  preferPng = false,
  onApply,
  onCancel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [preset, setPreset] = useState(defaultPreset ?? presets[0].id);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePreset = useMemo(() => presets.find((item) => item.id === preset) ?? presets[0], [preset, presets]);

  const frame = useMemo(() => {
    const bitmap = bitmapRef.current;
    const ratio = activePreset.ratio;
    if (ratio) return frameSize(ratio, outputLongEdge);
    if (bitmap) return naturalFrame(bitmap.width, bitmap.height, outputLongEdge);
    return frameSize(1, outputLongEdge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePreset, outputLongEdge, ready]);

  // Load the picture once.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let blob: Blob;
        if (typeof source === "string") {
          const response = await fetch(source, { credentials: "same-origin" });
          if (!response.ok) throw new Error("The image could not be loaded.");
          blob = await response.blob();
        } else {
          blob = source;
        }
        const bitmap = await createImageBitmap(blob);
        if (cancelled) {
          bitmap.close();
          return;
        }
        bitmapRef.current = bitmap;
        setReady(true);
      } catch {
        if (!cancelled) setError("This picture could not be opened for editing.");
      }
    }
    load();
    return () => {
      cancelled = true;
      bitmapRef.current?.close();
      bitmapRef.current = null;
    };
  }, [source]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const bitmap = bitmapRef.current;
    if (!canvas || !bitmap) return;
    if (canvas.width !== frame.width || canvas.height !== frame.height) {
      canvas.width = frame.width;
      canvas.height = frame.height;
    }
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, frame.width, frame.height);
    context.save();
    context.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
    context.translate(frame.width / 2 + offset.x, frame.height / 2 + offset.y);
    context.rotate((rotation * Math.PI) / 180);
    context.scale(flip ? -1 : 1, 1);

    const rotated = rotation % 180 !== 0;
    const bitmapWidth = rotated ? bitmap.height : bitmap.width;
    const bitmapHeight = rotated ? bitmap.width : bitmap.height;
    const cover = Math.max(frame.width / bitmap.width, frame.height / bitmap.height);
    const scale = cover * zoom;
    context.drawImage(bitmap, (-bitmapWidth * scale) / 2, (-bitmapHeight * scale) / 2, bitmapWidth * scale, bitmapHeight * scale);
    context.restore();
  }, [brightness, contrast, flip, frame, offset, rotation, saturation, zoom]);

  useEffect(() => {
    if (ready) draw();
  }, [draw, ready]);

  function maxOffset(): { x: number; y: number } {
    const bitmap = bitmapRef.current;
    if (!bitmap) return { x: 0, y: 0 };
    const rotated = rotation % 180 !== 0;
    const bitmapWidth = rotated ? bitmap.height : bitmap.width;
    const bitmapHeight = rotated ? bitmap.width : bitmap.height;
    const cover = Math.max(frame.width / bitmap.width, frame.height / bitmap.height);
    const scale = cover * zoom;
    return {
      x: Math.max(0, (bitmapWidth * scale - frame.width) / 2),
      y: Math.max(0, (bitmapHeight * scale - frame.height) / 2),
    };
  }

  function panBy(dx: number, dy: number) {
    const limits = maxOffset();
    setOffset((current) => ({
      x: clamp(current.x + dx, -limits.x, limits.x),
      y: clamp(current.y + dy, -limits.y, limits.y),
    }));
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    const dx = (event.clientX - dragRef.current.x) * scaleX;
    const dy = (event.clientY - dragRef.current.y) * scaleY;
    dragRef.current = { x: event.clientX, y: event.clientY };
    panBy(dx, dy);
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onWheel(event: React.WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    setZoom((current) => clamp(current - event.deltaY * 0.0015, 0.4, 5));
  }

  function reset() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setFlip(false);
    setBrightness(1);
    setContrast(1);
    setSaturation(1);
  }

  async function apply() {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setBusy(true);
    setError(null);
    try {
      const mime = preferPng ? "image/png" : "image/jpeg";
      const file = await canvasToFile(canvas, editedFileName(name, mime), mime, 0.92);
      onApply({ file, width: canvas.width, height: canvas.height });
    } catch {
      setError("The edited picture could not be saved.");
      setBusy(false);
    }
  }

  const slider = "w-full accent-[#6d4aff]";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#15121c]/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="w-full max-w-3xl rounded-[22px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#ece9ee] p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#6d4aff]">Picture editor</p>
            <h2 className="mt-1 text-base font-black tracking-[-.03em]">{title}</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">{hint}</p>
          </div>
          <button onClick={onCancel} className="grid size-8 shrink-0 place-items-center rounded-xl text-[#8a8390] transition hover:bg-[#f3f1f5]" aria-label="Close editor"><Icon name="close" size={15} /></button>
        </header>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <div className="grid place-items-center overflow-hidden rounded-2xl border border-[#e4e0e8] bg-[#191621] p-3">
              {error ? (
                <p className="px-4 py-16 text-center text-xs font-semibold text-red-300">{error}</p>
              ) : (
                <canvas
                  ref={canvasRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onWheel={onWheel}
                  className="w-full max-w-full cursor-grab touch-none rounded-xl active:cursor-grabbing"
                  style={{ aspectRatio: `${frame.width} / ${frame.height}`, width: "100%", height: "auto" }}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {presets.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setPreset(item.id); setOffset({ x: 0, y: 0 }); }}
                  className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${preset === item.id ? "border-[#6d4aff] bg-[#f0ecff] text-[#5e3de0]" : "border-[#e2dee7] text-[#6d6673] hover:border-violet-300"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setRotation((value) => (value + 90) % 360)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ddd9e2] px-2 py-2.5 text-[10px] font-bold text-[#5e5864] transition hover:border-violet-300"><Icon name="spark" size={12} /> Rotate</button>
              <button onClick={() => setFlip((value) => !value)} className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10px] font-bold transition ${flip ? "border-[#6d4aff] bg-[#f0ecff] text-[#5e3de0]" : "border-[#ddd9e2] text-[#5e5864] hover:border-violet-300"}`}><Icon name="arrow-left" size={12} /> Flip</button>
              <button onClick={reset} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ddd9e2] px-2 py-2.5 text-[10px] font-bold text-[#5e5864] transition hover:border-violet-300"><Icon name="close" size={12} /> Reset</button>
            </div>

            <label className="block">
              <span className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-[.11em] text-[#6d6672]"><span>Zoom</span><span className="font-bold text-[#918a97]">{zoom.toFixed(2)}×</span></span>
              <input type="range" min={0.4} max={5} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className={slider} />
            </label>

            {[
              { label: "Brightness", value: brightness, set: setBrightness, min: 0.4, max: 1.8 },
              { label: "Contrast", value: contrast, set: setContrast, min: 0.4, max: 1.8 },
              { label: "Saturation", value: saturation, set: setSaturation, min: 0, max: 2 },
            ].map((control) => (
              <label key={control.label} className="block">
                <span className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-[.11em] text-[#6d6672]"><span>{control.label}</span><span className="font-bold text-[#918a97]">{Math.round(control.value * 100)}%</span></span>
                <input type="range" min={control.min} max={control.max} step={0.01} value={control.value} onChange={(event) => control.set(Number(event.target.value))} className={slider} />
              </label>
            ))}

            <div className="space-y-2 border-t border-[#ece9ee] pt-4">
              <p className="text-[10px] text-[#918a97]">Exporting <strong className="text-[#5e5864]">{frame.width} × {frame.height}</strong> when you apply.</p>
              <div className="flex gap-2">
                <button onClick={onCancel} className="flex-1 rounded-xl border border-[#ddd9e2] px-4 py-2.5 text-xs font-bold text-[#5e5864]">Cancel</button>
                <button onClick={apply} disabled={busy || !ready} className="flex-[1.4] rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#5e3ce8] disabled:opacity-60">{busy ? "Saving…" : "Apply edits"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SQUARE_PRESETS, WIDE_PRESETS, PHOTO_PRESETS };
