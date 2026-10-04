/**
 * Proves that the file store the app is configured to use actually works.
 *
 *   npm run storage:check
 *
 * With Supabase Storage configured (`NEXT_PUBLIC_SUPABASE_URL`,
 * `SUPABASE_SECRET_KEY`, `SUPABASE_BUCKET`) this writes a tiny probe object,
 * reads it back through a signed URL, checks the bytes, then deletes it — the
 * same four calls a real lesson upload makes. Run it before uploading a large
 * video: it catches a missing bucket, a rejected key and a wrong project URL in
 * one second instead of at the end of a 200 MB upload.
 *
 * Without those variables it reports the local disk fallback and how much is
 * sitting in it.
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { loadEnv } from "./load-env.mts";
import {
  backendReason,
  blobBackend,
  bucketName,
  deleteBlob,
  diskPath,
  putBlob,
  signedBlobUrl,
  statBlob,
  storageSummary,
} from "../src/lib/blob-store";

loadEnv(); // .env.local, the same file the app reads

const PROBE_BYTES = new TextEncoder().encode("codemasterghana storage probe\n");
const probeKey = `storage-probe-${Date.now()}.txt`;

function fail(step: string, error: unknown): never {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`  ✘ ${step}: ${detail}`);
  console.error("");
  console.error("Fix the storage settings in .env.local (and in the host's environment variables),");
  console.error("then run this check again: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_BUCKET.");
  process.exit(1);
}

console.log(`backend  : ${blobBackend() === "supabase" ? "Supabase Storage" : "local disk (fallback)"}`);
console.log(`target   : ${storageSummary()}`);
if (blobBackend() === "disk") console.log(`reason   : ${backendReason()}`);

if (blobBackend() === "disk") {
  const folder = path.dirname(diskPath("x"));
  let files = 0;
  let bytes = 0;
  try {
    for (const entry of readdirSync(folder)) {
      files += 1;
      bytes += statSync(path.join(folder, entry)).size;
    }
  } catch {
    /* the folder is created on first upload */
  }
  console.log(`contents : ${files} file${files === 1 ? "" : "s"} · ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log("");
console.log("✓ files are being written to the local disk. That is fine in development; on a host");
console.log("  with an ephemeral filesystem set all three Supabase variables so uploads survive a redeploy.");
  process.exit(0);
}

console.log(`bucket   : ${bucketName()}`);
console.log("");

try {
  const before = await statBlob(probeKey);
  if (before) await deleteBlob(probeKey); // a previous crashed run
} catch (error) {
  fail("could not reach the bucket", error);
}

try {
  await putBlob(probeKey, PROBE_BYTES, "text/plain");
} catch (error) {
  fail("upload rejected", error);
}
console.log("  ✔ wrote a probe object");

let size: number | null = null;
try {
  size = (await statBlob(probeKey))?.size ?? null;
} catch (error) {
  await deleteBlob(probeKey).catch(() => {});
  fail("could not read the probe back", error);
}
if (size !== PROBE_BYTES.byteLength) {
  await deleteBlob(probeKey).catch(() => {});
  fail("the stored size does not match", new Error(`stored ${size ?? "nothing"} bytes, expected ${PROBE_BYTES.byteLength}`));
}
console.log("  ✔ read its metadata back");

let url: string | null = null;
try {
  url = await signedBlobUrl(probeKey, 60, "probe.txt");
} catch (error) {
  await deleteBlob(probeKey).catch(() => {});
  fail("could not sign a download URL", error);
}
if (!url) {
  await deleteBlob(probeKey).catch(() => {});
  fail("no signed URL came back", new Error("the storage API answered without a signedURL field"));
}
console.log("  ✔ signed a download URL");

try {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`the signed URL answered ${response.status}`);
  const body = new Uint8Array(await response.arrayBuffer());
  if (body.byteLength !== PROBE_BYTES.byteLength || !body.every((byte, index) => byte === PROBE_BYTES[index])) {
    throw new Error("the bytes that came back are not the bytes that went in");
  }
} catch (error) {
  await deleteBlob(probeKey).catch(() => {});
  fail("could not download through the signed URL", error);
}
console.log("  ✔ downloaded it again, bytes identical");

try {
  await deleteBlob(probeKey);
} catch (error) {
  fail("could not delete the probe object", error);
}
if (await statBlob(probeKey)) fail("the probe object is still there after deleting it", new Error("delete did not take effect"));
console.log("  ✔ deleted it again");

console.log("");
console.log("✓ Supabase Storage is ready: uploads, signed downloads and deletes all work against this bucket.");
console.log("  Lesson videos, slides, posters and branding images will live here instead of on the server disk.");
process.exit(0);
