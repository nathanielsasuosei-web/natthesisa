/**
 * The ffmpeg side of the lesson-video pipeline.
 *
 * One rule shapes this module: **the binary is the only external tool**. A
 * static ffmpeg already contains everything the pipeline needs — libx264 for
 * the picture, the AAC encoder for the voice, freetype for the lettering — so
 * there is no image library, no browser and no headless renderer to install.
 *
 * Where ffmpeg comes from, in order:
 *
 *   FFMPEG_PATH                    explicit, wins always
 *   node_modules/.cache/lesson-videos/ffmpeg   the copy `npm run videos:setup` fetches
 *   ffmpeg                         whatever is on PATH
 *
 * `ffprobe` is deliberately not required: this build of ffmpeg reports the same
 * facts (duration, silence, stream layout) on its own stderr, and parsing that
 * output keeps the pipeline to a single dependency.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const CACHED_BINARY = "node_modules/.cache/lesson-videos/ffmpeg";

export function ffmpegPath(): string {
  const explicit = process.env.FFMPEG_PATH?.trim();
  if (explicit) return explicit;
  const cached = path.join(process.cwd(), CACHED_BINARY);
  if (existsSync(cached)) return cached;
  return "ffmpeg";
}

export interface RunResult {
  code: number;
  stdout: Buffer;
  stderr: string;
}

/** Runs ffmpeg and collects both streams. Never throws on a non-zero exit. */
export function run(args: string[], options: { collectStdout?: boolean } = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath(), args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      if (options.collectStdout) stdout.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 0, stdout: Buffer.concat(stdout), stderr }));
  });
}

/** Runs ffmpeg and throws with the tail of its output when it fails. */
export async function runOrThrow(args: string[], options: { collectStdout?: boolean } = {}): Promise<RunResult> {
  const result = await run(args, options);
  if (result.code !== 0) {
    const tail = result.stderr.split("\n").filter(Boolean).slice(-12).join("\n");
    throw new Error(`ffmpeg exited ${result.code}\n  ${args.slice(0, 6).join(" ")} …\n${tail}`);
  }
  return result;
}

/** Duration in seconds, read from ffmpeg's header line for the file. */
export async function mediaDuration(file: string): Promise<number> {
  // `-t 0` stops after the container header: read the final duration without
  // decoding every frame in a two-and-a-half-minute video.
  const result = await run(["-hide_banner", "-i", file, "-t", "0", "-f", "null", "-"]);
  const match = /Duration: (\d+):(\d\d):(\d\d(?:\.\d+)?)/.exec(result.stderr);
  if (!match) throw new Error(`Could not read the duration of ${file}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

export interface Silence {
  start: number;
  end: number;
}

/**
 * Every pause in a narration track.
 *
 * This is what synchronises the slides with the voice. The script is written in
 * paragraphs — one per slide — and a reader pauses at a paragraph break, so the
 * long pauses are the slide boundaries. When the detector finds fewer pauses
 * than the script expects, the timeline falls back to a proportional split; see
 * `timeline.ts`.
 */
export async function detectSilences(file: string, options: { noise?: string; minDuration?: number } = {}): Promise<{ silences: Silence[]; duration: number }> {
  const noise = options.noise ?? "-32dB";
  const minDuration = options.minDuration ?? 0.28;
  const result = await run([
    "-hide_banner",
    "-i",
    file,
    "-af",
    `silencedetect=noise=${noise}:d=${minDuration}`,
    "-f",
    "null",
    "-",
  ]);
  const silences: Silence[] = [];
  let open: number | null = null;
  for (const line of result.stderr.split("\n")) {
    const start = /silence_start:\s*(-?[\d.]+)/.exec(line);
    if (start) open = Math.max(0, Number(start[1]));
    const end = /silence_end:\s*([\d.]+)/.exec(line);
    if (end && open !== null) {
      silences.push({ start: open, end: Number(end[1]) });
      open = null;
    }
  }
  const durationMatch = /Duration: (\d+):(\d\d):(\d\d(?:\.\d+)?)/.exec(result.stderr);
  const duration = durationMatch
    ? Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3])
    : silences.length
      ? silences[silences.length - 1].end
      : 0;
  return { silences, duration };
}

/**
 * The rendered width, in pixels, of a string drawn with `drawtext`.
 *
 * The alternative is guessing character widths, and a guess that is a few
 * percent out shows up as a paragraph that runs off the side of the video. So
 * the text is drawn once onto a throwaway black frame and the ink is measured
 * directly. Rendering a frame is a couple of milliseconds of work; the results
 * are cached by `draw.ts` because the same line is measured several times while
 * a paragraph is wrapped.
 */
export async function measureInk(text: string, fontFile: string, size: number, textFile: string): Promise<number> {
  // Both dimensions are forced even: a YUV frame with an odd width is padded
  // when it is converted to grayscale, and the extra column per row would
  // smear the scan across the image and report nonsense widths.
  const maxWidth = Math.ceil((Math.max(200, Math.ceil(text.length * size * 1.2) + 40)) / 2) * 2;
  const height = Math.ceil(size * 2 / 2) * 2;
  const result = await runOrThrow(
    [
      "-hide_banner",
      "-f",
      "lavfi",
      "-i",
      `color=c=black:s=${maxWidth}x${height}`,
      "-vf",
      `drawtext=fontfile=${fontFile}:textfile=${textFile}:fontcolor=white:fontsize=${size}:x=10:y=${Math.ceil(size / 3)}`,
      "-frames:v",
      "1",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "gray",
      "-",
    ],
    { collectStdout: true }
  );
  const frame = result.stdout;
  // The stride is taken from the buffer rather than assumed, so the scan stays
  // correct whatever padding the encoder added.
  const stride = Math.floor(frame.length / height) || maxWidth;
  let first = -1;
  let last = -1;
  for (let x = 0; x < stride; x++) {
    let inked = false;
    for (let y = 0; y < height; y++) {
      if (frame[y * stride + x] > 24) {
        inked = true;
        break;
      }
    }
    if (inked) {
      if (first === -1) first = x;
      last = x;
    }
  }
  return first === -1 ? 0 : last - first + 1;
}
