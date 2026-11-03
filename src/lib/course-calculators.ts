/** Pure calculations used by the course workbenches. */
export function gameBudget(fps: number, width: number, height: number, scale: number) {
  if (![fps, width, height, scale].every(Number.isFinite) || fps <= 0 || width <= 0 || height <= 0 || scale <= 0 || scale > 100 || fps > 1000 || width > 32768 || height > 32768 || !Number.isInteger(width) || !Number.isInteger(height)) return null;
  const renderWidth = Math.round(width * scale / 100);
  const renderHeight = Math.round(height * scale / 100);
  if (!renderWidth || !renderHeight) return null;
  const pixels = renderWidth * renderHeight;
  return { frameMs: 1000 / fps, renderWidth, renderHeight, pixels, rgbaMiB: pixels * 4 / 1024 ** 2 };
}

export function classificationMetrics(tp: number, fp: number, tn: number, fn: number) {
  if (![tp, fp, tn, fn].every((n) => Number.isSafeInteger(n) && n >= 0 && n <= 1_000_000_000)) return null;
  const ratio = (a: number, b: number) => b === 0 ? null : a / b;
  return { total: tp + fp + tn + fn, accuracy: ratio(tp + tn, tp + fp + tn + fn), precision: ratio(tp, tp + fp), recall: ratio(tp, tp + fn), f1: ratio(2 * tp, 2 * tp + fp + fn) };
}

export function capacityEstimate(rps: number, kb: number, instances: number, perInstance: number) {
  if (![rps, kb, instances, perInstance].every(Number.isFinite) || rps < 0 || kb < 0 || instances <= 0 || !Number.isInteger(instances) || perInstance <= 0 || Math.max(rps, kb, instances, perInstance) > 1_000_000) return null;
  return { requestsDay: rps * 86400, dailyGB: rps * 86400 * kb / 1_000_000, utilization: rps / (instances * perInstance) };
}

export function bubbleTrace(values: number[]) {
  if (!values.length || values.length > 15 || !values.every(Number.isFinite)) return null;
  const sorted = [...values];
  const passes: number[][] = [];
  let comparisons = 0, swaps = 0;
  for (let end = sorted.length - 1; end > 0; end--) {
    let changed = false;
    for (let i = 0; i < end; i++) {
      comparisons++;
      if (sorted[i] > sorted[i + 1]) {
        [sorted[i], sorted[i + 1]] = [sorted[i + 1], sorted[i]];
        swaps++;
        changed = true;
      }
    }
    passes.push([...sorted]);
    if (!changed) break;
  }
  return { sorted, passes, comparisons, swaps };
}

export function touchTarget(width: number, height: number, scale: number, platform: "android" | "ios") {
  if (![width, height, scale].every((n) => Number.isFinite(n) && n > 0 && n <= 10000)) return null;
  const minimum = platform === "android" ? 48 : 44;
  return { minimum, pass: width >= minimum && height >= minimum, pixelWidth: width * scale, pixelHeight: height * scale };
}
