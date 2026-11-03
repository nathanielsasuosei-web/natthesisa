"use client";

import { useState } from "react";
import { bubbleTrace, capacityEstimate, classificationMetrics, gameBudget, touchTarget } from "@/lib/course-calculators";
import { Field, Hint, inputClass, storageKey, usePersistentState, type ToolProps } from "./shared";

function NumberField({ label, value, set, min = 0, step = "any" }: { label: string; value: string; set: (v: string) => void; min?: number; step?: string }) {
  return <Field label={label}><input className={inputClass} type="number" value={value} min={min} step={step} onChange={(e) => set(e.target.value)} /></Field>;
}
function number(value: string) { return value.trim() === "" ? NaN : Number(value); }
function Result({ children }: { children: React.ReactNode }) {
  return <div aria-live="polite" className="rounded-2xl border border-[#ddd8e4] bg-white p-4 text-sm leading-7 text-[#383044]">{children}</div>;
}
function Invalid() { return <p role="alert" className="text-sm text-red-700">Enter valid values in every field within the stated limits.</p>; }
function useField(props: ToolProps, tool: string, field: string, initial: string) {
  return usePersistentState(storageKey(props.courseId, props.lessonId, tool, field), initial);
}

export function GameBudgetLab(props: ToolProps) {
  const [fps, setFps] = useField(props, "game-budget", "fps", "60");
  const [width, setWidth] = useField(props, "game-budget", "width", "3840");
  const [height, setHeight] = useField(props, "game-budget", "height", "2160");
  const [scale, setScale] = useField(props, "game-budget", "scale", "50");
  const result = gameBudget(number(fps), number(width), number(height), number(scale));
  return <div className="grid gap-4">
    <div className="grid gap-3 sm:grid-cols-2"><NumberField label="Target frames per second" value={fps} set={setFps} /><NumberField label="Render scale (%)" value={scale} set={setScale} /><NumberField label="Output width (pixels)" value={width} set={setWidth} step="1" /><NumberField label="Output height (pixels)" value={height} set={setHeight} step="1" /></div>
    {result ? <Result><p><strong>Frame budget:</strong> {result.frameMs.toFixed(2)} ms</p><p><strong>Internal resolution:</strong> {result.renderWidth} × {result.renderHeight} ({result.pixels.toLocaleString()} pixels)</p><p><strong>One RGBA8 buffer:</strong> {result.rgbaMiB.toFixed(2)} MiB</p></Result> : <Invalid />}
    <Hint>Scale applies to each axis, not total pixels. Buffer size assumes four bytes per pixel, without depth, extra buffers or overhead. Inputs: 1–1000 fps, integer dimensions up to 32768 and scale above 0–100%.</Hint>
  </div>;
}

export function ClassificationLab(props: ToolProps) {
  const [tp, setTp] = useField(props, "classification", "tp", "80");
  const [fp, setFp] = useField(props, "classification", "fp", "20");
  const [tn, setTn] = useField(props, "classification", "tn", "850");
  const [fn, setFn] = useField(props, "classification", "fn", "50");
  const result = classificationMetrics(number(tp), number(fp), number(tn), number(fn));
  const pct = (value: number | null) => value === null ? "Undefined (zero denominator)" : `${(value * 100).toFixed(2)}%`;
  return <div className="grid gap-4"><div className="grid gap-3 sm:grid-cols-2"><NumberField label="True positives (TP)" value={tp} set={setTp} step="1" /><NumberField label="False positives (FP)" value={fp} set={setFp} step="1" /><NumberField label="True negatives (TN)" value={tn} set={setTn} step="1" /><NumberField label="False negatives (FN)" value={fn} set={setFn} step="1" /></div>
    {result ? <Result><p><strong>Total:</strong> {result.total.toLocaleString()}</p><p><strong>Accuracy:</strong> {pct(result.accuracy)}</p><p><strong>Precision:</strong> {pct(result.precision)}</p><p><strong>Recall:</strong> {pct(result.recall)}</p><p><strong>F1:</strong> {pct(result.f1)}</p></Result> : <Invalid />}
    <Hint>Enter non-negative whole-number counts up to one billion. Accuracy can hide poor recall in imbalanced data. These calculations do not train a model or assess fairness.</Hint>
  </div>;
}

export function CapacityLab(props: ToolProps) {
  const [rps, setRps] = useField(props, "capacity", "rps", "100");
  const [kb, setKb] = useField(props, "capacity", "kb", "20");
  const [instances, setInstances] = useField(props, "capacity", "instances", "4");
  const [capacity, setCapacity] = useField(props, "capacity", "capacity", "50");
  const result = capacityEstimate(number(rps), number(kb), number(instances), number(capacity));
  return <div className="grid gap-4"><div className="grid gap-3 sm:grid-cols-2"><NumberField label="Requests per second" value={rps} set={setRps} /><NumberField label="Average response size (KB)" value={kb} set={setKb} /><NumberField label="Instances" value={instances} set={setInstances} step="1" /><NumberField label="Capacity per instance (requests/s)" value={capacity} set={setCapacity} /></div>
    {result ? <Result><p><strong>Requests per day:</strong> {result.requestsDay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><p><strong>Response data per day:</strong> {result.dailyGB.toFixed(2)} GB</p><p><strong>Estimated utilization:</strong> {(result.utilization * 100).toFixed(1)}% {result.utilization > 1 ? "— demand exceeds capacity" : ""}</p></Result> : <Invalid />}
    <Hint>Assumes constant traffic, evenly shared load, decimal KB and GB, and identical instances. Excludes headers, bursts and overhead; measure capacity under realistic load. Values are limited to one million; instances must be a positive integer.</Hint>
  </div>;
}

export function SortLab(props: ToolProps) {
  const [text, setText] = useField(props, "sort", "values", "7, 2, 5, 1");
  const values = text.split(",").map((v) => number(v));
  const result = bubbleTrace(values);
  return <div className="grid gap-4"><Field label="Numbers to sort" hint="1–15 comma-separated numbers"><input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} /></Field>
    {result ? <Result><p><strong>Start:</strong> {values.join(", ")}</p>{result.passes.map((pass, i) => <p key={i}><strong>Pass {i + 1}:</strong> {pass.join(", ")}</p>)}<p><strong>Sorted:</strong> {result.sorted.join(", ")}</p><p>{result.comparisons} comparisons · {result.swaps} swaps</p></Result> : <Invalid />}
    <Hint>Bubble sort compares adjacent values and swaps out-of-order pairs. This implementation stops early after a pass with no swaps; its worst-case time is quadratic.</Hint>
  </div>;
}

export function TouchTargetLab(props: ToolProps) {
  const [platform, setPlatform] = useState<"android" | "ios">("android");
  const [width, setWidth] = useField(props, "touch-target", "width", "48");
  const [height, setHeight] = useField(props, "touch-target", "height", "48");
  const [scale, setScale] = useField(props, "touch-target", "scale", "2");
  const result = touchTarget(number(width), number(height), number(scale), platform);
  const unit = platform === "android" ? "dp" : "pt";
  return <div className="grid gap-4"><Field label="Platform"><select value={platform} onChange={(e) => setPlatform(e.target.value as "android" | "ios")} className={inputClass}><option value="android">Android (dp)</option><option value="ios">iOS (points)</option></select></Field><div className="grid gap-3 sm:grid-cols-3"><NumberField label={`Width (${unit})`} value={width} set={setWidth} /><NumberField label={`Height (${unit})`} value={height} set={setHeight} /><NumberField label="Device pixel scale" value={scale} set={setScale} /></div>
    {result ? <Result><p><strong>Target:</strong> {result.pass ? "Meets" : "Below"} the {result.minimum} × {result.minimum} {unit} guideline.</p><p><strong>Approximate physical pixels:</strong> {result.pixelWidth.toFixed(1)} × {result.pixelHeight.toFixed(1)} at the supplied scale.</p></Result> : <Invalid />}
    <Hint>Android and iOS use different logical units; changing platforms does not convert the input. The tappable area can be larger than the visible control. Check spacing, accessibility and real devices too.</Hint>
  </div>;
}
