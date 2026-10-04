import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { readState, writeState } from "./app-state";
import { blobBackend, blobUrl, deleteBlob, diskPath, putBlob, readDiskBlob, statBlob } from "./blob-store";
import { pipeline } from "node:stream/promises";
import type { Lesson, LessonFile, LessonSection } from "./courses";

/**
 * Disk-backed store for lessons published by the site owner.
 *
 * Everything lives in a `.data` folder at the project root (override with
 * LESSON_DATA_DIR):
 *
 *   .data/lessons.json   lesson records + uploaded file metadata
 *   .data/uploads/*      the uploaded videos, PDFs, slide decks and images
 *
 * The folder is git-ignored and survives server restarts. It is written with
 * ordinary Node file system calls, so on a read-only host (for example a
 * serverless platform's default file system) writes fail with a clear error -
 * point LESSON_DATA_DIR at a writable volume before deploying there.
 */

export type UploadedFileKind = LessonFile["kind"];

export interface UploadedFileRecord {
  id: string;
  name: string;
  storedName: string;
  mime: string;
  size: number;
  kind: UploadedFileKind;
  uploadedAt: string;
  /** Video trimming applied in the owner's video editor. */
  trimStart?: number;
  /** Seconds; missing/null means "play to the end". */
  trimEnd?: number | null;
  /** True when the owner muted the clip. */
  muted?: boolean;
  /** Thumbnail captured in the video editor. */
  poster?: UploadedFileRecord | null;
  /** When the owner last edited this file. */
  editedAt?: string;
}

export interface UploadedLessonRecord {
  id: string;
  courseId: string;
  /** Id of an existing course module, or a generated id when moduleTitle is set. */
  moduleId: string;
  moduleTitle: string | null;
  moduleDescription: string | null;
  title: string;
  duration: number;
  summary: string;
  objectives: string[];
  sections: LessonSection[];
  challenge: string;
  preview: boolean;
  files: UploadedFileRecord[];
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
}

export const MAX_FILES_PER_LESSON = 5;
export const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB per file

const ALLOWED_EXTENSIONS: Record<string, UploadedFileKind> = {
  mp4: "video",
  webm: "video",
  mov: "video",
  m4v: "video",
  ogv: "video",
  pdf: "pdf",
  ppt: "slides",
  pptx: "slides",
  key: "slides",
  odp: "slides",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  avif: "image",
  zip: "other",
  txt: "other",
  md: "other",
};

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  ogv: "video/ogg",
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  key: "application/vnd.apple.keynote",
  odp: "application/vnd.oasis.opendocument.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  zip: "application/zip",
  txt: "text/plain",
  md: "text/markdown",
};

export function dataDir(): string {
  return process.env.LESSON_DATA_DIR?.trim() || path.join(process.cwd(), ".data");
}


const STATE_KEY = "lessons";

function isRecord(value: unknown): value is UploadedLessonRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<UploadedLessonRecord>;
  return typeof record.id === "string" && typeof record.courseId === "string" && typeof record.title === "string";
}

/**
 * The lesson index, cached in memory and stored in the database.
 *
 * It used to be `.data/lessons.json`, which vanished on hosts that reset the
 * filesystem between deploys. Reading stays synchronous (the content helpers
 * that call this are synchronous); the cache is filled by `hydrateState()`
 * during first-run setup, before any authenticated request is served.
 */
export function listUploadedLessons(): UploadedLessonRecord[] {
  const stored = readState<unknown>(STATE_KEY, []);
  return Array.isArray(stored) ? stored.filter(isRecord) : [];
}

/** Writes the index through to the database. Callers await this. */
async function persist(lessons: UploadedLessonRecord[]): Promise<void> {
  await writeState(STATE_KEY, lessons);
}

/** Removes a stored object, logging rather than throwing. */
export async function removeStoredBlob(storedName: string): Promise<void> {
  try {
    await deleteBlob(storedName);
  } catch (error) {
    console.error(`Could not delete stored file ${storedName}`, error);
  }
}

export function getUploadedLessonsForCourse(courseId: string): UploadedLessonRecord[] {
  return listUploadedLessons().filter((lesson) => lesson.courseId === courseId);
}

export function getUploadedLesson(lessonId: string): UploadedLessonRecord | undefined {
  return listUploadedLessons().find((lesson) => lesson.id === lessonId);
}

export function uploadedLessonToLesson(record: UploadedLessonRecord): Lesson {
  return {
    id: record.id,
    title: record.title,
    duration: record.duration,
    summary: record.summary,
    objectives: record.objectives,
    sections: record.sections,
    challenge: record.challenge,
    preview: record.preview,
    source: "owner",
    files: record.files.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      mime: file.mime,
      kind: file.kind,
      uploadedAt: file.uploadedAt,
      href: `/api/lesson-files/${record.id}/${file.id}`,
      trimStart: file.trimStart ?? 0,
      trimEnd: file.trimEnd ?? null,
      muted: file.muted ?? false,
      poster: file.poster ? `/api/lesson-files/${record.id}/${file.id}/poster` : null,
      edited: Boolean(file.editedAt || file.trimStart || file.muted || file.poster),
    })),
  };
}

export interface NewUploadedLessonInput {
  /** Reuse the id the upload route already gave the files. */
  id?: string;
  courseId: string;
  moduleId: string;
  moduleTitle: string | null;
  moduleDescription: string | null;
  title: string;
  duration: number;
  summary: string;
  body: string;
  code: string | null;
  language: string | null;
  objectives: string[];
  challenge: string;
  preview: boolean;
  files: UploadedFileRecord[];
  createdBy: string;
  createdByEmail: string;
}

export async function createUploadedLesson(input: NewUploadedLessonInput): Promise<UploadedLessonRecord> {
  const objectives = input.objectives.length
    ? input.objectives
    : [
        `Explain the purpose of ${input.title.toLowerCase()}`,
        "Apply the idea in a small working example",
        "Recognize the pattern in a real project",
      ];

  const sections: LessonSection[] = [
    { heading: "Start with the idea", body: input.summary },
    {
      heading: "How it works",
      body: input.body,
      ...(input.code ? { code: input.code, language: input.language ?? "text" } : {}),
    },
  ];

  const record: UploadedLessonRecord = {
    id: input.id ?? randomUUID(),
    courseId: input.courseId,
    moduleId: input.moduleId,
    moduleTitle: input.moduleTitle,
    moduleDescription: input.moduleDescription,
    title: input.title,
    duration: input.duration,
    summary: input.summary,
    objectives,
    sections,
    challenge: input.challenge,
    preview: input.preview,
    files: input.files,
    createdBy: input.createdBy,
    createdByEmail: input.createdByEmail,
    createdAt: new Date().toISOString(),
  };

  await persist([...listUploadedLessons(), record]);
  return record;
}

export async function deleteUploadedLesson(lessonId: string): Promise<UploadedLessonRecord | null> {
  const lessons = listUploadedLessons();
  const record = lessons.find((lesson) => lesson.id === lessonId);
  if (!record) return null;

  for (const file of record.files) {
    for (const stored of [file.storedName, file.poster?.storedName]) {
      if (!stored) continue;
      await removeStoredBlob(stored);
    }
  }
  await persist(lessons.filter((lesson) => lesson.id !== lessonId));
  return record;
}

async function persistWithFile(lessonId: string, fileId: string, update: (file: UploadedFileRecord) => UploadedFileRecord): Promise<UploadedFileRecord | null> {
  const lessons = listUploadedLessons();
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  const index = lesson.files.findIndex((item) => item.id === fileId);
  if (index === -1) return null;
  const updated = update(lesson.files[index]);
  lesson.files[index] = updated;
  await persist(lessons);
  return updated;
}

/** Saves video edits (trim / mute / poster) for an already-uploaded file. */
export async function saveFileEdits(
  lessonId: string,
  fileId: string,
  edits: { trimStart: number; trimEnd: number | null; muted: boolean },
  poster: UploadedFileRecord | null | undefined
): Promise<UploadedFileRecord | null> {
  const previousPosterStored = listUploadedLessons()
    .find((lesson) => lesson.id === lessonId)
    ?.files.find((item) => item.id === fileId)?.poster?.storedName;
  const updated = await persistWithFile(lessonId, fileId, (file) => {
    if (file.kind !== "video") return file;
    return {
      ...file,
      trimStart: Math.max(0, edits.trimStart),
      trimEnd: edits.trimEnd,
      muted: edits.muted,
      ...(poster !== undefined ? { poster } : {}),
      editedAt: new Date().toISOString(),
    };
  });
  // The replaced poster object is removed only after the new record is stored,
  // so a failure here cannot leave the file pointing at nothing.
  if (poster !== undefined && previousPosterStored && previousPosterStored !== poster?.storedName) {
    await removeStoredBlob(previousPosterStored);
  }
  return updated;
}

/** Swaps in an edited picture, keeping the file's id and place in the lesson. */
export async function replaceFileContents(
  lessonId: string,
  fileId: string,
  saved: UploadedFileRecord
): Promise<UploadedFileRecord | null> {
  const previous = listUploadedLessons()
    .find((lesson) => lesson.id === lessonId)
    ?.files.find((file) => file.id === fileId);
  if (!previous) return null;

  const updated = await persistWithFile(lessonId, fileId, (file) => ({
    ...file,
    name: saved.name,
    storedName: saved.storedName,
    mime: saved.mime,
    size: saved.size,
    kind: "image",
    editedAt: new Date().toISOString(),
  }));

  if (updated && previous.storedName !== saved.storedName) {
    await removeStoredBlob(previous.storedName);
  }
  return updated;
}

export async function removeFilePoster(lessonId: string, fileId: string): Promise<UploadedFileRecord | null> {
  const posterStored = listUploadedLessons()
    .find((lesson) => lesson.id === lessonId)
    ?.files.find((item) => item.id === fileId)?.poster?.storedName;
  const updated = await persistWithFile(lessonId, fileId, (file) => ({
    ...file,
    poster: null,
    editedAt: new Date().toISOString(),
  }));
  if (posterStored) await removeStoredBlob(posterStored);
  return updated;
}

export function fileKindForName(fileName: string): UploadedFileKind | null {
  const extension = path.extname(fileName).replace(".", "").toLowerCase();
  return ALLOWED_EXTENSIONS[extension] ?? null;
}

export function mimeForUpload(fileName: string, reported: string): string {
  const extension = path.extname(fileName).replace(".", "").toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? (reported || "application/octet-stream");
}

function safeExtension(fileName: string): string {
  const extension = path.extname(fileName).replace(".", "").toLowerCase();
  return /^[a-z0-9]{1,8}$/.test(extension) ? `.${extension}` : "";
}

export interface SavedFileResult {
  record: UploadedFileRecord;
}

/**
 * Stores a browser upload, enforcing the type and size limits while writing.
 *
 * On the disk backend the bytes stream straight to a file, so a large video
 * never sits in memory. On Supabase Storage the bytes are sent in one request
 * (`putBlob`), which is what the Storage REST API expects.
 */
export async function saveUploadedFile(file: File, lessonId: string): Promise<SavedFileResult> {
  const kind = fileKindForName(file.name || "");
  if (!kind) {
    throw new UploadError(
      `“${file.name || "That file"}” is not a supported file type. Upload video, PDF, slide decks, images or a zip archive.`,
      415
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError(`“${file.name}” is larger than the 200 MB limit.`, 413);
  }

  const extension = safeExtension(file.name || "");
  const digest = createHash("sha256").update(`${lessonId}:${file.name}:${Date.now()}`).digest("hex").slice(0, 12);
  const storedName = `${lessonId}__${digest}${extension}`;
  const mime = mimeForUpload(file.name || "", file.type);
  let written = 0;

  if (blobBackend() === "supabase") {
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      throw new UploadError(`“${file.name}” could not be read. Try uploading it again.`, 500);
    }
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw new UploadError(`“${file.name}” is larger than the 200 MB limit.`, 413);
    }
    try {
      await putBlob(storedName, bytes, mime);
      written = bytes.byteLength;
    } catch (error) {
      throw new UploadError(
        `“${file.name}” could not be uploaded to Supabase Storage. ${
          error instanceof Error ? error.message : "Check the storage settings."
        }`,
        500
      );
    }
  } else {
    const destination = diskPath(storedName);
    mkdirSync(path.dirname(destination), { recursive: true });
    const source = Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]);
    try {
      await pipeline(
        source,
        async function* (chunks) {
          for await (const chunk of chunks) {
            written += (chunk as Buffer).length;
            if (written > MAX_FILE_BYTES) throw new UploadError(`“${file.name}” is larger than the 200 MB limit.`, 413);
            yield chunk as Buffer;
          }
        },
        createWriteStream(destination)
      );
    } catch (error) {
      try {
        if (existsSync(destination)) rmSync(destination);
      } catch {
        /* ignore cleanup failures */
      }
      if (error instanceof UploadError) throw error;
      throw new UploadError(
        `“${file.name}” could not be saved. Check that the server can write to ${dataDir()}.`,
        500
      );
    }
  }

  return {
    record: {
      id: randomUUID(),
      name: path.basename(file.name || storedName).slice(0, 160),
      storedName,
      mime,
      size: written,
      kind,
      uploadedAt: new Date().toISOString(),
    },
  };
}

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type StoredContent =
  | { kind: "redirect"; url: string }
  | { kind: "stream"; body: ReadableStream; size: number };

/**
 * Opens a stored object for a response.
 *
 * With Supabase Storage the caller redirects the browser to a URL on the CDN —
 * permanent when the bucket is public, otherwise a one-hour signed URL. Either
 * way the bytes come from Supabase, which supports range requests natively, so
 * a lesson video seeks properly and the server does not proxy gigabytes. On the
 * disk backend the caller streams the file itself, honouring the range the
 * player asked for.
 */
export async function openStoredFile(
  record: UploadedFileRecord,
  options: { range?: { start: number; end: number }; downloadName?: string } = {}
): Promise<StoredContent | null> {
  const stat = await statBlob(record.storedName);
  if (!stat) return null;

  if (blobBackend() === "supabase") {
    const url = await blobUrl(record.storedName, 3600, options.downloadName);
    return url ? { kind: "redirect", url } : null;
  }
  const stream = readDiskBlob(record.storedName, options.range);
  return stream ? { kind: "stream", body: stream.body, size: stream.size } : null;
}

/**
 * The URL to send the browser to when object storage is in use, or null to
 * stream from disk. Also null when the object is missing, so the caller can
 * answer 410 rather than redirecting to a broken link.
 */
export async function storedBlobRedirect(
  record: UploadedFileRecord,
  downloadName?: string
): Promise<string | null> {
  if (blobBackend() !== "supabase") return null;
  if (!(await statBlob(record.storedName))) return null;
  return blobUrl(record.storedName, 3600, downloadName);
}

/** Size of a stored object, or null when it is not there. */
export async function storedBlobSize(record: UploadedFileRecord): Promise<number | null> {
  const stat = await statBlob(record.storedName);
  return stat ? stat.size : null;
}

/** Reads a byte range from the disk backend. */
export function diskBlobRange(record: UploadedFileRecord, start: number, end: number): ReadableStream | null {
  return readDiskBlob(record.storedName, { start, end })?.body ?? null;
}
