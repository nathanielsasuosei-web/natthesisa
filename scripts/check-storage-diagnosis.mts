/**
 * Proves the storage *diagnosis* tells five different states apart.
 *
 *   npm run storage:diagnose
 *
 * The bug this exists to stop: Supabase answers a missing object's metadata with
 * **HTTP 400** and the 404 inside the body
 *
 *   {"statusCode":"404","error":"not_found","message":"Object not found","code":"NoSuchKey"}
 *
 * so a reader that only checks `response.status` files "this video was never
 * built" under "unrecognised failure" — and every layer above then treats
 * "unknown" as "storage is broken". In production that surfaced as
 * `/api/health` blaming an empty bucket, a teacher console warning that no video
 * could be watched, and a 410 "missing from storage" for files sitting in the
 * bucket.
 *
 * It runs against `scripts/stub-storage.mts`, in this process, on a free port —
 * no network, no credentials, no Supabase project. Each case asserts on what a
 * person reads (`failure`, `playable`, `samplePresent`, `hint`) rather than on
 * internals, because those are what the fix has to get right.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => (port ? resolve(port) : reject(new Error("no free port"))));
    });
    server.on("error", reject);
  });
}

async function startStub(port: number, env: Record<string, string> = {}): Promise<ChildProcess> {
  const child = spawn(process.execPath, ["--import", "tsx", path.join("scripts", "stub-storage.mts"), String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("the stub storage did not start")), 20_000);
    child.stdout?.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes("listening")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on("exit", (code) => reject(new Error(`the stub storage exited (${code})`)));
  });
  return child;
}

let failures = 0;
function expect(label: string, actual: unknown, ...allowed: unknown[]): void {
  const ok = allowed.some((value) => JSON.stringify(value) === JSON.stringify(actual));
  console.log(`  ${ok ? "✔" : "✘"} ${label}: ${JSON.stringify(actual)}${ok ? "" : ` (expected ${allowed.map((v) => JSON.stringify(v)).join(" or ")})`}`);
  if (!ok) failures += 1;
}

const SAMPLE = "lessonvideo__how-the-web-works.mp4";
const SAMPLE_2 = "lessonvideo__a-second-lesson.mp4";

async function main(): Promise<void> {
  const port = await freePort();
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.SUPABASE_SECRET_KEY = "stub-secret-key";
  process.env.SUPABASE_BUCKET = "lesson-files";
  delete process.env.SUPABASE_BUCKET_PUBLIC;

  let stub = await startStub(port);
  const store = await import("../src/lib/blob-store");
  const { GET } = await import("../src/app/api/health/route");

  const health = async () => (await GET()).json() as Promise<{ storage: Record<string, any> }>;
  const probe = () => store.probeStorage(SAMPLE);

  console.log(`storage diagnosis · stub on 127.0.0.1:${port}\n`);

  // ── 1. An ordinary "not built yet" answer must read as ABSENT, not broken ──
  console.log("1. empty bucket — the sample was never rendered");
  expect("statBlob", await store.statBlob(SAMPLE), null);
  let p = await probe();
  expect("probe.failure", p.failure, null);
  expect("probe.sample", p.sample, { present: false, size: null });
  expect("probe.playable", p.playable, false);
  let h = await health();
  expect("health.storage.ok", h.storage.ok, false);
  expect("health.storage.videos.samplePresent", h.storage.videos.samplePresent, false);
  expect("health hint offers the render", /Lesson videos|videos:build/.test(String(h.storage.hint)), true);

  // ── 2. A file that is there plays ──
  console.log("\n2. the sample is in the bucket");
  await store.putBlob(SAMPLE, new Uint8Array(4096), "video/mp4");
  expect("statBlob size", (await store.statBlob(SAMPLE))?.size, 4096);
  p = await probe();
  expect("probe.failure", p.failure, null);
  expect("probe.sample.present", p.sample?.present, true);
  expect("probe.playable", p.playable, true);
  h = await health();
  expect("health.storage.ok", h.storage.ok, true);
  await store.deleteBlob(SAMPLE);

  // ── 3. A broken metadata endpoint is NOT an empty bucket ──
  // The production shape: the bucket and the listing answer, `/object/info`
  // refuses to describe objects that exist.
  stub.kill();
  stub = await startStub(port, { STUB_INFO_BROKEN: "1" });
  await store.putBlob(SAMPLE, new Uint8Array(4096), "video/mp4");
  console.log("\n3. video present, but the metadata endpoint answers 404-for-everything");
  p = await probe();
  expect("probe.sample.present (listing wins)", p.sample?.present, true);
  expect("probe.failure is named, not 'unknown'", p.failure, "metadata-unavailable");
  expect("hint says do not re-render", /[Dd]o not re-render/.test(String(p.hint)), true);
  h = await health();
  expect("health.storage.videos.samplePresent", h.storage.videos.samplePresent, true);
  expect("health.storage.ok", h.storage.ok, false);
  expect("hint does not say the bucket is empty", /bucket is empty|are not in it/.test(String(h.storage.hint)), false);

  // ── 4. …and with the bucket genuinely empty, the answer flips back ──
  await store.deleteBlob(SAMPLE);
  console.log("\n4. empty bucket while the metadata endpoint is broken");
  p = await probe();
  expect("probe.sample.present", p.sample?.present, false);
  expect("probe.playable", p.playable, false);
  h = await health();
  expect("health.storage.videos.samplePresent", h.storage.videos.samplePresent, false);
  stub.kill();

  // ── 5. The path a student actually hits: the redirect, then the 410 ──
  const { storedBlobRedirect, storedBlobSize } = await import("../src/lib/lesson-uploads");
  const record = (storedName: string) => ({
    id: "check",
    name: storedName,
    storedName,
    mime: "video/mp4",
    size: 1,
    kind: "video" as const,
    uploadedAt: new Date().toISOString(),
  });

  console.log("\n5. the file routes: a redirect when it plays, but 410 only when storage says so");
  stub = await startStub(port);
  expect("absent  -> no redirect, and a null size (410)", [
    await storedBlobRedirect(record(SAMPLE)),
    await storedBlobSize(record(SAMPLE)),
  ], [null, null]);
  await store.putBlob(SAMPLE, new Uint8Array(2048), "video/mp4");
  expect("present -> a redirect to storage (302), not a 410", Boolean(await storedBlobRedirect(record(SAMPLE))), true);
  stub.kill();

  // The production shape, and the regression this file exists for: the metadata
  // endpoint refuses every object, but signing works — so the video plays, and
  // the route must redirect rather than answer 410 "missing from storage".
  stub = await startStub(port, { STUB_INFO_BROKEN: "1" });
  await store.putBlob(SAMPLE, new Uint8Array(2048), "video/mp4");
  expect("metadata broken, file present -> still a redirect (the video plays)", Boolean(await storedBlobRedirect(record(SAMPLE))), true);
  await store.deleteBlob(SAMPLE);
  expect("metadata broken, file absent  -> no redirect (410 is the honest answer)", await storedBlobRedirect(record(SAMPLE)), null);
  stub.kill();

  // ── 6. The lesson page itself: a student must get the player when the file is
  // there, whatever one Storage endpoint thinks. ──
  const { lessonVideoAvailability } = await import("../src/lib/video-availability");
  console.log("\n6. the lesson page: does the student get a player?");
  stub = await startStub(port, { STUB_INFO_BROKEN: "1" });
  const sample = SAMPLE; // the same key the manifest uses for "how-the-web-works"
  await store.putBlob(sample, new Uint8Array(1024), "video/mp4");
  const { LESSON_VIDEOS, clearVideoAvailabilityCache } = {
    LESSON_VIDEOS: (await import("../src/content/lesson-videos")).LESSON_VIDEOS,
    clearVideoAvailabilityCache: (await import("../src/lib/video-availability")).clearVideoAvailabilityCache,
  };
  const first = Object.values(LESSON_VIDEOS)[0];
  const availability = await lessonVideoAvailability(first.lessonId);
  expect("player shown for a video that is in the bucket", availability?.video, true);
  expect("…and the endpoint fault is still reported", availability?.failure, "metadata-unavailable");
  await store.deleteBlob(sample);
  clearVideoAvailabilityCache();
  const gone = await lessonVideoAvailability(first.lessonId);
  expect("no player when the video really is absent", gone?.video, false);
  expect("…and that is not reported as a broken connection", gone?.unreachable, false);
  stub.kill();

  console.log("");
  if (failures) {
    console.log(`✘ ${failures} check${failures === 1 ? "" : "s"} failed — storage diagnosis is regressing.`);
    process.exit(1);
  }
  console.log("✓ storage diagnosis holds: absent is reported as absent, unknown as unknown, to every caller.");
  process.exit(0);
}

main().catch((error) => {
  console.error("✘ the check itself failed:", error);
  process.exit(1);
});
