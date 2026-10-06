import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { blobBackend, diskPath, putBlob } from "./blob-store";
import {
  UploadError,
  UploadedFileRecord,
  fileKindForName,
  mimeForUpload,
  removeStoredBlob,
} from "./lesson-uploads";

/**
 * Student profile photos.
 *
 * The picture itself lives where every other uploaded image lives — Supabase
 * Storage when it is configured, `.data/uploads` otherwise (see
 * `blob-store.ts`) — and the account row keeps only the small record below in
 * `users.avatar`. That is the same split the owner's branding uses: the
 * database never holds image bytes, so an account row stays cheap to read.
 *
 * Photos are sized for the places they appear (a 96px card, a 36px header
 * chip), so the editor in the browser exports a 512px square before it is
 * uploaded. 512 is kept rather than shrunk further so the picture still looks
 * sharp on a phone with a 3× display; a JPEG at that size is around 60–120 KB.
 *
 * Nothing here is public: `/api/account/avatar` requires a session, and a
 * student can only load their own picture — the teacher, who sees the student
 * list, may load any.
 */

/**
 * The stored picture. Deliberately shaped like every other uploaded file
 * (`UploadedFileRecord`) so the access-checked routes can serve it with the
 * same helpers they use for lesson images, with one addition: `updatedAt`,
 * which is also the cache-busting version in the URL.
 */
export interface AvatarRecord extends UploadedFileRecord {
  /** When the picture was last replaced. */
  updatedAt: string;
}

/**
 * The largest photo the server will accept. Well above what the browser edit
 * step produces, and low enough to pass a serverless host's request-body limit
 * (Vercel refuses bodies over ~4.5 MB before the route ever runs).
 */
export const AVATAR_MAX_BYTES = 4 * 1024 * 1024;

const MAX_PIXELS_NOTE = "Choose a picture the editor can open, or a smaller one.";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

/**
 * The URL for an account's photo, or null when there is none (the UI then
 * shows initials). `v` is the upload time: a replaced photo gets a new URL, so
 * a browser that already has the old one cached fetches the new one instead.
 *
 * Relative on purpose — the browser asks this app, which decides whether the
 * viewer is allowed to see it and then redirects to storage or streams the
 * file, so no bucket URL or signed link ever reaches the page.
 */
export function avatarHref(user: { id: string; avatar: AvatarRecord | null } | null | undefined): string | null {
  if (!user?.avatar) return null;
  return `/api/account/avatar?u=${encodeURIComponent(user.id)}&v=${encodeURIComponent(user.avatar.updatedAt)}`;
}

/** True when this record looks like an avatar written by this module. */
export function isAvatarRecord(value: unknown): value is AvatarRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<AvatarRecord>;
  return typeof record.storedName === "string" && record.storedName.length > 0;
}

function extensionFor(file: File, mime: string): string {
  const fromName = path.extname(file.name || "").toLowerCase();
  if (/^\.[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  return EXTENSION_BY_MIME[mime] ?? ".jpg";
}

/**
 * Stores one photo and returns the record to keep on the account row.
 *
 * Throws an `UploadError` (with a status) when the file is not an image or is
 * too large; the route turns that into a JSON error the form can show. Avatars
 * are small, so the bytes are read into memory and written in one go — no
 * streaming pipeline, unlike the lesson videos.
 */
export async function saveAvatarImage(userId: string, file: File): Promise<AvatarRecord> {
  const kind = fileKindForName(file.name || "");
  if (kind !== "image") {
    throw new UploadError("Your profile picture must be an image (PNG, JPG, WEBP, GIF or AVIF).", 415);
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new UploadError(
      `“${file.name || "That picture"}” is larger than the 4 MB limit for a profile picture. ${MAX_PIXELS_NOTE}`,
      413
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new UploadError("That picture could not be read. Try choosing it again.", 400);
  }
  if (bytes.byteLength === 0) {
    throw new UploadError("That picture is empty. Try choosing it again.", 400);
  }

  const mime = mimeForUpload(file.name || "", file.type || "image/jpeg");
  const extension = extensionFor(file, mime);
  const now = new Date().toISOString();
  const owner = userId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 60) || "account";
  const digest = createHash("sha256").update(`${userId}:${now}:${bytes.byteLength}`).digest("hex").slice(0, 12);
  const storedName = `avatar-${owner}__${digest}${extension}`;

  if (blobBackend() === "supabase") {
    try {
      await putBlob(storedName, bytes, mime);
    } catch (error) {
      throw new UploadError(
        `Your picture could not be uploaded to the storage bucket. ${
          error instanceof Error ? error.message : "Check the storage settings."
        }`,
        500
      );
    }
  } else {
    try {
      const destination = diskPath(storedName);
      mkdirSync(/* turbopackIgnore: true */ path.dirname(destination), { recursive: true });
      writeFileSync(/* turbopackIgnore: true */ destination, bytes);
    } catch {
      throw new UploadError("Your picture could not be saved. Check that the server can write to its data folder.", 500);
    }
  }

  return {
    id: randomUUID(),
    kind: "image",
    storedName,
    name: path.basename(file.name || storedName).slice(0, 160),
    mime,
    size: bytes.byteLength,
    uploadedAt: now,
    updatedAt: now,
  };
}

/**
 * Deletes the bytes behind a record. Called only after the account row no
 * longer points at them, so a failure here leaves an unreferenced file rather
 * than an account pointing at nothing.
 */
export async function removeAvatarImage(record: AvatarRecord | null | undefined): Promise<void> {
  if (!record?.storedName) return;
  // `removeStoredBlob` logs a failure rather than throwing: the account has
  // already stopped pointing at the file, so the worst case is one unreferenced
  // object in the bucket.
  await removeStoredBlob(record.storedName);
}
