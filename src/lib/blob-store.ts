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
 * The keys are stored as the same relative names on both backends, so switching
 * backends does not change the metadata a lesson record holds.
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
  if (storageConfigured()) return `Supabase Storage · bucket “${bucketName()}” · ${supabaseUrl()}/storage/v1`;
  const relative = path.relative(process.cwd(), uploadsDir());
  return `local disk · ${relative && !relative.startsWith("..") ? relative : uploadsDir()}`;
}

export function blobBackend(): BlobBackend {
  return storageConfigured() ? "supabase" : "disk";
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

/**
 * A short-lived URL the browser can fetch directly.
 *
 * Storage only: the browser streams from Supabase's CDN instead of through the
 * app, which is what makes large videos seek properly and keeps the bytes off
 * the server. Returns null on the disk backend, where the caller streams the
 * file itself.
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
  return downloadName ? `${absolute}${absolute.includes("?") ? "&" : "?"}download=${encodeURIComponent(downloadName)}` : absolute;
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
