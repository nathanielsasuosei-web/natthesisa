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
  publicBlobUrl,
  publicBucket,
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
  // A network failure is not a configuration mistake, and the fix is different.
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|timeout|network/i.test(detail)) {
    console.error("The storage settings look complete, but this machine could not reach the project at all.");
    console.error("Run `npm run storage:check` from your own machine or from the host that deploys the app.");
    console.error("(The Arena preview sandbox has no route to supabase.com.)");
    process.exit(1);
  }
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
console.log(`urls     : ${publicBucket() ? "public bucket URLs (SUPABASE_BUCKET_PUBLIC=1)" : "one-hour signed URLs (SUPABASE_BUCKET_PUBLIC is not set)"}`);
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

// Is the bucket actually public, and does the app agree with it? These two have
// to match or files break: a public flag on a private bucket hands out URLs
// Supabase refuses, and a private flag on a public bucket gives up the CDN.
const publicUrl = publicBlobUrl(probeKey);
let bucketIsPublic = false;
if (publicUrl) {
  const response = await fetch(publicUrl, { cache: "no-store" }).catch(() => null);
  bucketIsPublic = Boolean(response?.ok);
  if (response?.ok) {
    const body = new Uint8Array(await response.arrayBuffer());
    if (body.byteLength !== PROBE_BYTES.byteLength) bucketIsPublic = false;
  }
}
if (publicBucket() && !bucketIsPublic) {
  await deleteBlob(probeKey).catch(() => {});
  console.error("  ✘ SUPABASE_BUCKET_PUBLIC is on, but the bucket is not public yet.");
  console.error("");
  console.error("Click Storage → " + bucketName() + " → Make public in the Supabase dashboard, or remove");
  console.error("SUPABASE_BUCKET_PUBLIC to go back to one-hour signed URLs (which work either way).");
  process.exit(1);
}
if (publicBucket()) {
  console.log("  ✔ the bucket is public: the app will hand out permanent CDN URLs");
  const downloadUrl = publicBlobUrl(probeKey, "probe.txt");
  const download = downloadUrl ? await fetch(downloadUrl, { cache: "no-store" }).catch(() => null) : null;
  if (!download?.ok || !/attachment/i.test(download.headers.get("content-disposition") ?? "")) {
    console.warn("  ! ?download= did not come back as an attachment — the Download button may open the file instead");
  } else {
    console.log("  ✔ ?download= still arrives as an attachment, so Download keeps the real file name");
  }
} else if (bucketIsPublic) {
  console.log("  ! the bucket is public, but SUPABASE_BUCKET_PUBLIC is not set");
  console.log("    set it to 1 to serve files straight from the CDN (one less signed request per view)");
} else {
  console.log("  · the bucket is private: the app will sign a one-hour URL per view");
}

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
console.log(
  publicBucket()
    ? "✓ Supabase Storage is ready: uploads, public CDN URLs and deletes all work against this bucket."
    : "✓ Supabase Storage is ready: uploads, signed downloads and deletes all work against this bucket."
);
console.log("  Lesson videos, slides, posters and branding images will live here instead of on the server disk.");
process.exit(0);
