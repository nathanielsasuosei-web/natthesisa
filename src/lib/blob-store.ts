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

/**
 * Uploads get the long timeout — a 200 MB video on a slow link needs it.
 * Metadata reads do not: they happen while a page is rendering, and a probe
 * that waits a minute turns a storage blip into a platform timeout, so the
 * reader sees an error page instead of the lesson. Ten seconds is already far
 * longer than a healthy `/object/info` call takes.
 */
const WRITE_TIMEOUT_MS = 60_000;
const READ_TIMEOUT_MS = 10_000;

async function storageFetch(pathname: string, init: RequestInit = {}, timeoutMs = WRITE_TIMEOUT_MS): Promise<Response> {
  try {
    return await fetch(`${supabaseUrl()}/storage/v1${pathname}`, {
      ...init,
      headers: { ...storageHeaders(), ...(init.headers as Record<string, string> | undefined) },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    // A connection that never got as far as an answer is still a Storage
    // failure, and the category is what tells a paused project from a typo.
    throw storageErrorFromException(error);
  }
}

/**
 * What actually went wrong, as a category rather than a message.
 *
 * "Storage could not be reached" is four different problems wearing one coat,
 * and only one of them is fixed by trying again: a bucket that does not exist,
 * a key Supabase refuses, a project that is paused, and a genuine outage all
 * look identical to a `catch`. Naming the cause is what lets the teacher
 * console and `/api/health` say which knob to turn instead of shrugging.
 */
export type StorageFailureKind =
  | "bucket-missing"
  | "auth-rejected"
  | "not-public"
  | "rate-limited"
  | "server-error"
  | "timeout"
  | "network"
  | "invalid-url"
  | "unknown";

/** Thrown by every Storage call that fails, carrying its category and a fix. */
export class StorageError extends Error {
  readonly kind: StorageFailureKind;
  readonly status: number | null;
  /** Plain-language next step, safe to show the owner (never a credential). */
  readonly hint: string;

  constructor(kind: StorageFailureKind, message: string, hint: string, status: number | null = null) {
    super(message);
    this.name = "StorageError";
    this.kind = kind;
    this.hint = hint;
    this.status = status;
  }
}

/** The fix for each failure category, written for the person who has to act. */
export function storageHint(kind: StorageFailureKind, status: number | null = null): string {
  const bucket = bucketName();
  switch (kind) {
    case "bucket-missing":
      return (
        `Supabase has no bucket called “${bucket}” in this project. Either create it ` +
        "(Storage → New bucket) or point SUPABASE_BUCKET at the bucket that does exist — the name " +
        "must match exactly, including case — then redeploy."
      );
    case "auth-rejected":
      return (
        `Supabase refused SUPABASE_SECRET_KEY${status ? ` (${status})` : ""}. Use the *secret* key ` +
        "(sb_secret_…, Project settings → API keys) — the publishable/anon key cannot read object " +
        "metadata or sign URLs. If the key was rotated, replace it in the host's environment " +
        "variables and redeploy; and if the project is paused, restore it first."
      );
    case "not-public":
      return (
        `SUPABASE_BUCKET_PUBLIC is on but the bucket “${bucket}” is private, so the permanent URLs ` +
        "the app hands out are refused. Click Storage → the bucket → Make public, or unset " +
        "SUPABASE_BUCKET_PUBLIC to go back to one-hour signed URLs (which work either way)."
      );
    case "rate-limited":
      return (
        "Supabase Storage rate-limited the request (429). This is usually a burst of parallel " +
        "checks on a cold start and settles by itself; the app already retries once."
      );
    case "server-error":
      return (
        `Supabase Storage answered ${status ?? "5xx"} — a problem on Supabase's side, not in this ` +
        "deployment's configuration. Check https://status.supabase.com and try again in a minute."
      );
    case "timeout":
      return (
        `Supabase Storage did not answer within ${READ_TIMEOUT_MS / 1000}s. The project may be ` +
        "overloaded, or the host's region may have a slow route to it."
      );
    case "network":
      return (
        `This deployment could not reach ${supabaseHost() || "the Supabase project"} at all — the ` +
        "connection failed before any HTTP answer. On the free plan a Supabase project pauses " +
        "after a week of inactivity and stops answering: open the dashboard and restore it. " +
        "Otherwise check NEXT_PUBLIC_SUPABASE_URL for a typo, and the host's egress/network rules."
      );
    case "invalid-url":
      return (
        `NEXT_PUBLIC_SUPABASE_URL (${supabaseUrl() || "(empty)"}) is not a complete URL, so every ` +
        "Storage request fails before it is even sent. It must include the scheme — " +
        "https://abcdefghijklmnop.supabase.co — not just the host or the project ref. Copy it " +
        "from Supabase dashboard → Project settings → Data API → Project URL, then redeploy."
      );
    default:
      return "Storage failed for a reason this app does not recognise yet. Read the error above.";
  }
}

/** Hostname only — never the project ref in a place a stranger could read. */
function supabaseHost(): string {
  try {
    return new URL(supabaseUrl()).host;
  } catch {
    return "";
  }
}

/** Turns a Storage response into a categorised, actionable error. */
function storageErrorFromResponse(response: Response, body: string): StorageError {
  const detail = body.slice(0, 200).replace(/\s+/g, " ").trim();
  const status = response.status;
  if (status === 400 && /bucket not found|bucket_id|does not exist|invalid bucket/i.test(body)) {
    const kind: StorageFailureKind = "bucket-missing";
    return new StorageError(kind, `Storage bucket “${bucketName()}” was not found. ${detail}`, storageHint(kind, status), status);
  }
  if (status === 400 && /not public|public bucket/i.test(body)) {
    const kind: StorageFailureKind = "not-public";
    return new StorageError(kind, `The bucket “${bucketName()}” is not public. ${detail}`, storageHint(kind, status), status);
  }
  if (status === 401 || status === 403) {
    const kind: StorageFailureKind = "auth-rejected";
    return new StorageError(kind, `Supabase rejected SUPABASE_SECRET_KEY (${status}). ${detail}`, storageHint(kind, status), status);
  }
  if (status === 429) {
    const kind: StorageFailureKind = "rate-limited";
    return new StorageError(kind, `Supabase Storage rate-limited the request. ${detail}`, storageHint(kind, status), status);
  }
  if (status >= 500) {
    const kind: StorageFailureKind = "server-error";
    return new StorageError(kind, `Supabase Storage answered ${status}. ${detail}`, storageHint(kind, status), status);
  }
  // A 400 that mentions the bucket is still most likely a bucket problem;
  // anything else is reported as unrecognised rather than guessed at.
  const kind: StorageFailureKind = status === 400 && /bucket/i.test(body) ? "bucket-missing" : "unknown";
  return new StorageError(kind, `Supabase Storage answered ${status}. ${detail}`, storageHint(kind, status), status);
}

/** Categorises whatever a failed `fetch` threw (DNS, refusal, abort). */
export function storageErrorFromException(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";
  // A URL that does not parse never reaches the network, so "network" would be
  // a lie: no amount of retrying or restoring a paused project fixes a value
  // that is missing its https:// scheme. Call it what it is.
  if (/Failed to parse URL|Invalid URL/i.test(message)) {
    const kind: StorageFailureKind = "invalid-url";
    return new StorageError(kind, `Could not reach Supabase Storage: ${message}`, storageHint(kind));
  }
  const kind: StorageFailureKind =
    name === "TimeoutError" || name === "AbortError" || /timeout|aborted/i.test(message) ? "timeout" : "network";
  return new StorageError(kind, `Could not reach Supabase Storage: ${message}`, storageHint(kind));
}

/** Reads a failed response's body and throws the categorised error for it. */
async function throwStorageError(response: Response): Promise<never> {
  throw storageErrorFromResponse(response, await response.text().catch(() => ""));
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
    await throwStorageError(response);
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
    await throwStorageError(response);
  }
}

export interface BlobStat {
  size: number;
  contentType: string | null;
}

/**
 * Asks the public object URL whether a file is there, without any credentials.
 *
 * Only used as a second opinion when the authenticated metadata call was
 * refused: a public bucket serves its objects to anyone, so a deployment with
 * a rotated or wrong `SUPABASE_SECRET_KEY` can still tell "present" from
 * "absent" — and still play the video — instead of reporting the whole library
 * as unavailable. Returns `undefined` when it cannot tell (the bucket is not
 * public after all, or the network failed), which leaves the original error in
 * charge.
 */
async function publicStat(key: string): Promise<BlobStat | null | undefined> {
  const url = publicBlobUrl(key);
  if (!url) return undefined;
  let response: Response;
  try {
    // A one-byte range: enough to prove the object exists and read its length
    // from `Content-Range`, without pulling a video down to find that out.
    response = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return undefined;
  }
  if (response.ok || response.status === 206) {
    await response.body?.cancel().catch(() => {});
    const range = /\/(\d+)\s*$/.exec(response.headers.get("content-range") ?? "");
    const size = range ? Number.parseInt(range[1], 10) : Number(response.headers.get("content-length") ?? 0);
    return { size: Number.isFinite(size) ? size : 0, contentType: response.headers.get("content-type") };
  }
  const body = await response.text().catch(() => "");
  if (response.status === 404 || /object not found/i.test(body)) return null;
  // "Bucket not public", or anything else: this route cannot answer, so let the
  // authenticated error stand rather than claiming the file is missing.
  return undefined;
}

export async function statBlob(key: string): Promise<BlobStat | null> {
  if (blobBackend() === "disk") {
    const target = diskPath(key);
    if (!existsSync(target)) return null;
    const stats = statSync(target);
    return stats.isFile() ? { size: stats.size, contentType: null } : null;
  }
  let response: Response;
  try {
    response = await storageFetch(`/object/info/${bucketName()}/${encodeURIComponent(key)}`, {}, READ_TIMEOUT_MS);
  } catch (error) {
    throw storageErrorFromException(error);
  }
  if (response.status === 404) return null;  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const failure = storageErrorFromResponse(response, body);
    // A refused metadata call is not proof the file is gone: on a public bucket
    // the object URL needs no key at all, so ask it before giving up.
    if (failure.kind === "auth-rejected" || failure.kind === "not-public") {
      const second = await publicStat(key);
      if (second !== undefined) return second;
    }
    throw failure;
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
    await throwStorageError(response);
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

/* -------------------------------------------------------------------------- */
/* Diagnosis                                                                  */
/* -------------------------------------------------------------------------- */

export interface StorageProbe {
  backend: BlobBackend;
  /** All three Supabase variables are set. */
  configured: boolean;
  /** The variables that are missing, which is why the disk fallback is in use. */
  missingVars: string[];
  /** Bucket name, or null on the disk backend. */
  bucket: string | null;
  /** How the browser is sent to a file: a permanent CDN URL or a signed one. */
  urlStyle: "public" | "signed" | null;
  /** Hostname of the project — never a key, never a full URL with credentials. */
  host: string | null;
  /** Did the project answer at all? Null on the disk backend. */
  reachable: boolean | null;
  /** Did it accept SUPABASE_SECRET_KEY? */
  authOk: boolean | null;
  bucketExists: boolean | null;
  /** What Supabase says about the bucket, as opposed to what the env claims. */
  bucketIsPublic: boolean | null;
  /**
   * False only in the direction that breaks: the app is configured to hand out
   * permanent public URLs (`SUPABASE_BUCKET_PUBLIC=1`) for a bucket Supabase
   * says is private, so every one of those URLs is refused. A public bucket
   * with the flag *off* is fine — signed URLs work on it too — and reports
   * true, with the missed optimisation left to `npm run storage:check`.
   */
  publicUrlsWillWork: boolean | null;
  /**
   * One real object, checked: the difference between "storage is broken" and
   * "storage is fine and simply does not have the videos yet".
   */
  sample: { present: boolean; size: number | null } | null;
  failure: StorageFailureKind | null;
  /** The error text, for the logs and for `/api/health`. */
  error: string | null;
  /** What to do about it. Null when nothing is wrong. */
  hint: string | null;
  ms: number;
}

/**
 * Asks the configured storage how it is, in the terms a person can act on.
 *
 * Two requests at most: the bucket's own metadata (which proves the project is
 * reachable, the key is accepted, the bucket exists and whether it is public),
 * then one object from the manifest when a `sampleKey` is given. That pair
 * separates every reason a lesson page can say "video unavailable": a paused
 * project, a wrong key, a bucket that was never created, a bucket that is
 * private while the app assumes it is public, and a healthy bucket that simply
 * has not been filled yet.
 *
 * `sampleKey` is optional so this module never has to import the manifests.
 */
export async function probeStorage(sampleKey?: string): Promise<StorageProbe> {
  const started = Date.now();
  const probe: StorageProbe = {
    backend: blobBackend(),
    configured: storageConfigured(),
    missingVars: [],
    bucket: null,
    urlStyle: null,
    host: null,
    reachable: null,
    authOk: null,
    bucketExists: null,
    bucketIsPublic: null,
    publicUrlsWillWork: null,
    sample: null,
    failure: null,
    error: null,
    hint: null,
    ms: 0,
  };
  const finish = (): StorageProbe => {
    probe.ms = Date.now() - started;
    return probe;
  };

  if (!probe.configured) {
    probe.missingVars = [
      ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl()],
      ["SUPABASE_SECRET_KEY", secretKey()],
      ["SUPABASE_BUCKET", (process.env.SUPABASE_BUCKET ?? "").trim()],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);
    probe.reachable = true; // the disk is always reachable; the question is whether it persists
    if (sampleKey) {
      const stat = await statBlob(sampleKey).catch(() => null);
      probe.sample = { present: stat !== null, size: stat?.size ?? null };
    }
    probe.hint =
      "Files are being written to this server's disk instead of object storage. That works in " +
      "development, but on a host with an ephemeral filesystem (Vercel, any container) everything " +
      "written disappears on the next deploy — which is why a video can be listed and still not " +
      "play. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and SUPABASE_BUCKET, create the " +
      "bucket once, and redeploy.";
    return finish();
  }

  probe.bucket = bucketName();
  probe.urlStyle = publicBucket() ? "public" : "signed";
  probe.host = supabaseHost();

  let info: { id?: string; name?: string; public?: boolean } | null = null;
  try {
    const response = await storageFetch(`/bucket/${encodeURIComponent(bucketName())}`, {}, READ_TIMEOUT_MS);
    const body = await response.text().catch(() => "");
    if (response.ok) {
      probe.reachable = true;
      probe.authOk = true;
      probe.bucketExists = true;
      info = body ? (JSON.parse(body) as { id?: string; name?: string; public?: boolean }) : null;
      probe.bucketIsPublic = Boolean(info?.public);
      probe.publicUrlsWillWork = publicBucket() ? probe.bucketIsPublic : true;
    } else {
      probe.reachable = true; // an answer, even a refusal, means the project is reachable
      const failure = storageErrorFromResponse(response, body);
      probe.authOk = failure.kind === "auth-rejected" ? false : null;
      probe.bucketExists = failure.kind === "bucket-missing" ? false : null;
      probe.failure = failure.kind;
      probe.error = failure.message;
      probe.hint = failure.hint;
    }
  } catch (error) {
    const failure = storageErrorFromException(error);
    probe.reachable = false;
    probe.failure = failure.kind;
    probe.error = failure.message;
    probe.hint = failure.hint;
  }

  // The public-flag mismatch is its own outage: every URL the app hands out is
  // refused, so videos fail at the player rather than at the metadata check.
  if (probe.publicUrlsWillWork === false && !probe.hint) {
    probe.failure = "not-public";
    probe.hint = storageHint("not-public");
  }

  if (sampleKey) {
    try {
      const stat = await statBlob(sampleKey);
      probe.sample = { present: stat !== null, size: stat?.size ?? null };
      // A refused key on a *public* bucket is a partial outage, and saying so
      // stops the owner replacing a working bucket: the files still play
      // through their permanent URLs, and it is uploads and signed downloads
      // that are broken.
      if (probe.failure === "auth-rejected" && stat !== null) {
        probe.hint =
          `${probe.hint ?? "Supabase refused SUPABASE_SECRET_KEY."} The bucket is public, so the videos that are already in it still play — ` +
          "existing files are served straight from the CDN. Uploads and signed downloads stay broken " +
          "until the key is replaced.";
      }
    } catch (error) {
      const failure = storageErrorFromException(error);
      probe.sample = null;
      if (!probe.failure) {
        probe.failure = failure.kind;
        probe.error = failure.message;
        probe.hint = failure.hint;
      }
    }
  }

  return finish();
}
