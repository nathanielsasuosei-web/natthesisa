/**
 * Downloads the one external tool the video build needs: `npm run videos:setup`.
 *
 * ffmpeg is a large static binary and it changes on its own schedule, so it is
 * not a dependency of this project — it is fetched once, into
 * `node_modules/.cache/lesson-videos/`, and used from there. The build looks for
 * it in that order:
 *
 *   FFMPEG_PATH                                     use this binary
 *   node_modules/.cache/lesson-videos/ffmpeg        the copy this script fetches
 *   ffmpeg on PATH                                  whatever the machine has
 *
 * Any build with libx264, AAC and the freetype-dependent `drawtext` filter will
 * do; the copy fetched here is a static build of all three, so a machine with
 * nothing installed can still render the videos.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { ffmpegPath, run } from "./lib/ffmpeg";

const CACHE = path.join(process.cwd(), "node_modules/.cache/lesson-videos");
const BINARY = path.join(CACHE, "ffmpeg");
const ARCHIVE = path.join(CACHE, "ffmpeg.tgz");

/**
 * The package that ships the binary.
 *
 * `@ffmpeg-installer/linux-x64` publishes a static ffmpeg as a tarball on the
 * npm registry — the same network the project already installs from, which is
 * what makes this work on a machine that cannot reach the release hosts where
 * the bigger builds live. Its version is asked for rather than pinned, because
 * the pipeline only relies on filters that have been in ffmpeg for years.
 */
const PACKAGE = "@ffmpeg-installer/linux-x64";

async function download(url: string, file: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const body = response.body;
  if (!body) throw new Error(`${url} returned no body`);
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(file);
    // Node's fetch body is a web ReadableStream; `pipe` needs the node stream
    // form, which is what `Readable.fromWeb` gives.
    Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]).pipe(stream);
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });
}

async function main(): Promise<void> {
  const existing = ffmpegPath();
  if (existing !== "ffmpeg" && existsSync(existing)) {
    const version = await run(["-hide_banner", "-version"]);
    console.log(`ffmpeg already available: ${existing}`);
    console.log(`  ${version.stderr.split("\n")[0]}`);
    return;
  }

  mkdirSync(CACHE, { recursive: true });
  console.log("Looking for a static ffmpeg to fetch…");
  const meta = await fetch(`https://registry.npmjs.org/${PACKAGE.replace("/", "%2f")}`).then((response) => {
    if (!response.ok) throw new Error(`The npm registry answered ${response.status}`);
    return response.json() as Promise<{ "dist-tags": { latest: string }; versions: Record<string, { dist: { tarball: string } }> }>;
  });
  const version = meta["dist-tags"].latest;
  const tarball = meta.versions[version]?.dist.tarball;
  if (!tarball) throw new Error(`No tarball published for ${PACKAGE}@${version}`);

  console.log(`Fetching ${PACKAGE}@${version}…`);
  await download(tarball, ARCHIVE);

  const extract = path.join(CACHE, "extract");
  rmSync(extract, { recursive: true, force: true });
  mkdirSync(extract, { recursive: true });
  const unpack = spawnSync("tar", ["-xzf", ARCHIVE, "-C", extract], { stdio: "inherit" });
  if (unpack.status !== 0) throw new Error("Could not unpack the ffmpeg archive (is `tar` installed?)");

  const source = path.join(extract, "package", "ffmpeg");
  if (!existsSync(source)) throw new Error("The archive did not contain a package/ffmpeg binary");
  renameSync(source, BINARY);
  chmodSync(BINARY, 0o755);
  rmSync(ARCHIVE, { force: true });
  rmSync(extract, { recursive: true, force: true });

  const check = await run(["-hide_banner", "-version"]);
  if (check.code !== 0) throw new Error("The downloaded ffmpeg did not run");
  console.log(`Installed ${BINARY}`);
  console.log(`  ${check.stderr.split("\n")[0]}`);
  console.log("Run `npm run videos:build -- --list` to see what is ready to render.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
