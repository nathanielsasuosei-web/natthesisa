import { createReadStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

/**
 * Where lesson videos, slide decks, posters and branding images actually live.
 *
 * Two backends, chosen by configuration:
 *
 *   Supabase Storage   when NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and
 *                      SUPABASE_BUCKET are all set. Durable, and survives a
 *                      redeploy on hosts with an ephemeral filesystem.
 *   Local disk         otherwise: `.data/uploads`. Right for development, and
 *                      fine on a host with a persistent volume.
 *
 * On the Storage backend there are two ways to hand a file to the browser,
 * chosen by SUPABASE_BUCKET_PUBLIC:
 *
 *   Public bucket URL  a stable `/object/public/{bucket}/{key}` URL. Supabase's
 *                      CDN caches it, so the second viewer of a video is served
 *                      from the edge. Chosen when SUPABASE_BUCKET_PUBLIC=1.
 *   Signed URL         a one-hour URL created per view. Works with a private
 *                      bucket, and expires, so a copied link stops working.
 *
 * Either way the app decides who gets a URL in the first place: the route checks
 * the viewer's account, plan and lesson access before redirecting. The keys are
 * stored as the same relative names on all paths, so switching backends — or
 * switching a bucket between public and private — changes no stored metadata.
 */

export type BlobBackend = "supabase" | "disk";

const BUCKET_FALLBACK = "lesson-files";

function supabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
}

function secretKey(): string {
  return (process.env.SUPABASE_SECRET_KEY ?? "").trim();
}

export function bucketName(): string {
  return (process.env.SUPABASE_BUCKET ?? "").trim() || BUCKET_FALLBACK;
}

/** True when object storage is configured; disk is used otherwise. */
export function storageConfigured(): boolean {
  return Boolean(supabaseUrl() && secretKey() && process.env.SUPABASE_BUCKET?.trim());
}

/** One line describing where files go right now, for status output. */
export function storageSummary(): string {
  if (storageConfigured()) {
    const style = publicBucket() ? "public bucket URLs" : "signed URLs";
    return `Supabase Storage · bucket “${bucketName()}” · ${style} · ${supabaseUrl()}/storage/v1`;
  }
  const relative = path.relative(process.cwd(), uploadsDir());
  return `local disk · ${relative && !relative.startsWith("..") ? relative : uploadsDir()}`;
}

export function blobBackend(): BlobBackend {
  return storageConfigured() ? "supabase" : "disk";
}

/**
 * True when the bucket is public and the app should hand out its permanent
 * object URLs. Opt in with `SUPABASE_BUCKET_PUBLIC=1` *after* clicking "Make
 * public" on the bucket in the dashboard: if the flag is set but the bucket is
 * still private, the URLs the app hands out are refused by Supabase, so the
 * default stays on signed URLs, which work either way.
 */
export function publicBucket(): boolean {
  return /^(1|true|yes|on)$/i.test((process.env.SUPABASE_BUCKET_PUBLIC ?? "").trim());
}

export function backendReason(): string {
  if (storageConfigured()) return `Supabase Storage bucket “${bucketName()}”`;
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl()],
    ["SUPABASE_SECRET_KEY", secretKey()],
    ["SUPABASE_BUCKET", (process.env.SUPABASE_BUCKET ?? "").trim()],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  return missing.length === 3
    ? "no object storage configured — files are written to the local disk"
    : `object storage incomplete (set ${missing.join(", ")}) — falling back to the local disk`;
}

/* -------------------------------------------------------------------------- */
/* Disk backend                                                               */
/* -------------------------------------------------------------------------- */

function uploadsDir(): string {
  return path.join(process.env.LESSON_DATA_DIR?.trim() || path.join(process.cwd(), ".data"), "uploads");
}

/** Absolute path on disk. `basename` stops a crafted key escaping the folder. */
export function diskPath(key: string): string {
  return path.join(uploadsDir(), path.basename(key));
}

/* -------------------------------------------------------------------------- */
/* Supabase Storage                                                           */
/* -------------------------------------------------------------------------- */

function storageHeaders(contentType?: string): Record<string, string> {
  const key = secretKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

async function storageFetch(pathname: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${supabaseUrl()}/storage/v1${pathname}`, {
    ...init,
    headers: { ...storageHeaders(), ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(60_000),
    cache: "no-store",
  });
  return response;
}

function describeStorageError(response: Response, body: string): string {
  const detail = body.slice(0, 200).replace(/\s+/g, " ");
  if (response.status === 400 && /bucket/i.test(body)) {
    return `Storage bucket “${bucketName()}” was not found. Create it in the Supabase dashboard (Storage → New bucket).`;
  }
  if (response.status === 401 || response.status === 403) {
    return `Supabase rejected SUPABASE_SECRET_KEY (${response.status}). ${detail}`;
  }
  return `Supabase Storage answered ${response.status}. ${detail}`;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/** Writes bytes. Throws with a readable message; callers turn that into a 500. */
export async function putBlob(key: string, data: Uint8Array, contentType: string): Promise<void> {
  if (blobBackend() === "disk") {
    mkdirSync(uploadsDir(), { recursive: true });
    writeFileSync(diskPath(key), data);
    return;
  }
  const response = await storageFetch(`/object/${bucketName()}/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": contentType, "x-upsert": "true" },
    body: data as unknown as BodyInit,
  });
  if (!response.ok) {
    throw new Error(describeStorageError(response, await response.text().catch(() => "")));
  }
}

/** Removes an object. Missing objects are not an error. */
export async function deleteBlob(key: string): Promise<void> {
  if (blobBackend() === "disk") {
    const target = diskPath(key);
    if (existsSync(target)) rmSync(target);
    return;
  }
  const response = await storageFetch(`/object/${bucketName()}/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(describeStorageError(response, await response.text().catch(() => "")));
  }
}

export interface BlobStat {
  size: number;
  contentType: string | null;
}

export async function statBlob(key: string): Promise<BlobStat | null> {
  if (blobBackend() === "disk") {
    const target = diskPath(key);
    if (!existsSync(target)) return null;
    const stats = statSync(target);
    return stats.isFile() ? { size: stats.size, contentType: null } : null;
  }
  const response = await storageFetch(`/object/info/${bucketName()}/${encodeURIComponent(key)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(describeStorageError(response, await response.text().catch(() => "")));
  }
  const info = (await response.json().catch(() => ({}))) as {
    size?: number;
    metadata?: { size?: number; mimetype?: string };
  };
  return {
    size: info.size ?? info.metadata?.size ?? 0,
    contentType: info.metadata?.mimetype ?? null,
  };
}

/** Appends Supabase's `?download=<name>` suffix, which makes the CDN answer
 * with `Content-Disposition: attachment` instead of displaying the file. */
function withDownload(url: string, downloadName?: string): string {
  return downloadName
    ? `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(downloadName)}`
    : url;
}

/**
 * The permanent URL of an object in a public bucket. No request is made: this
 * is string building, exactly as Supabase's own `getPublicUrl` does. The bucket
 * itself has to be public for the URL to be served.
 */
export function publicBlobUrl(key: string, downloadName?: string): string | null {
  if (blobBackend() === "disk") return null;
  return withDownload(`${supabaseUrl()}/storage/v1/object/public/${bucketName()}/${encodeURIComponent(key)}`, downloadName);
}

/**
 * The URL to send the browser to, whichever style this deployment uses.
 *
 * Storage only: the browser streams from Supabase's CDN instead of through the
 * app, which is what makes large videos seek properly and keeps the bytes off
 * the server. Returns null on the disk backend, where the caller streams the
 * file itself.
 */
export async function blobUrl(
  key: string,
  expiresInSeconds = 3600,
  downloadName?: string
): Promise<string | null> {
  if (blobBackend() === "disk") return null;
  if (publicBucket()) return publicBlobUrl(key, downloadName);
  return signedBlobUrl(key, expiresInSeconds, downloadName);
}

/**
 * A one-hour URL the browser can fetch directly, for private buckets.
 *
 * Storage only. Costs one request to Supabase per view; a public bucket with
 * `SUPABASE_BUCKET_PUBLIC=1` skips it (see `blobUrl`).
 */
export async function signedBlobUrl(
  key: string,
  expiresInSeconds = 3600,
  downloadName?: string
): Promise<string | null> {
  if (blobBackend() === "disk") return null;
  const response = await storageFetch(`/object/sign/${bucketName()}/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });
  if (!response.ok) {
    throw new Error(describeStorageError(response, await response.text().catch(() => "")));
  }
  const body = (await response.json().catch(() => ({}))) as { signedURL?: string; signedUrl?: string };
  const relative = body.signedURL ?? body.signedUrl;
  if (!relative) throw new Error("Supabase Storage did not return a signed URL.");
  const absolute = relative.startsWith("http")
    ? relative
    : `${supabaseUrl()}/storage/v1${relative.startsWith("/") ? "" : "/"}${relative}`;
  // Storage honours `download` on a signed URL, so a "Download" click still
  // saves the file under its real name even though the bytes come from Supabase.
  return withDownload(absolute, downloadName);
}

export interface BlobStream {
  body: ReadableStream;
  size: number;
}

/** Reads bytes from the disk backend, optionally a byte range. */
export function readDiskBlob(key: string, range?: { start: number; end: number }): BlobStream | null {
  const target = diskPath(key);
  if (!existsSync(target)) return null;
  const stats = statSync(target);
  if (!stats.isFile()) return null;
  const stream = range ? createReadStream(target, range) : createReadStream(target);
  return { body: Readable.toWeb(stream) as unknown as ReadableStream, size: stats.size };
}
