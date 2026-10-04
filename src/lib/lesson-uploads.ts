import { createHash, randomUUID } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
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

function lessonsFile(): string {
  return path.join(dataDir(), "lessons.json");
}

export function uploadsDir(): string {
  return path.join(dataDir(), "uploads");
}

const g = globalThis as unknown as { __codaraUploadedLessons?: UploadedLessonRecord[] };

function isRecord(value: unknown): value is UploadedLessonRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<UploadedLessonRecord>;
  return typeof record.id === "string" && typeof record.courseId === "string" && typeof record.title === "string";
}

/** Reads (and caches) the lesson index. Never throws, so pages cannot crash on a bad file. */
export function listUploadedLessons(): UploadedLessonRecord[] {
  if (g.__codaraUploadedLessons) return g.__codaraUploadedLessons;
  let lessons: UploadedLessonRecord[] = [];
  try {
    const file = lessonsFile();
    if (existsSync(file)) {
      const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
      if (Array.isArray(parsed)) lessons = parsed.filter(isRecord);
    }
  } catch (error) {
    console.error("Could not read uploaded lessons from disk", error);
    lessons = [];
  }
  g.__codaraUploadedLessons = lessons;
  return lessons;
}

function persist(lessons: UploadedLessonRecord[]): void {
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(lessonsFile(), `${JSON.stringify(lessons, null, 2)}\n`, "utf8");
  g.__codaraUploadedLessons = lessons;
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
    })),
  };
}

export interface NewUploadedLessonInput {
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

export function createUploadedLesson(input: NewUploadedLessonInput): UploadedLessonRecord {
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
    id: randomUUID(),
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

  persist([...listUploadedLessons(), record]);
  return record;
}

export function deleteUploadedLesson(lessonId: string): UploadedLessonRecord | null {
  const lessons = listUploadedLessons();
  const record = lessons.find((lesson) => lesson.id === lessonId);
  if (!record) return null;

  for (const file of record.files) {
    try {
      const target = uploadedFilePath(file.storedName);
      if (existsSync(target)) rmSync(target);
    } catch (error) {
      console.error(`Could not delete uploaded file ${file.storedName}`, error);
    }
  }
  persist(lessons.filter((lesson) => lesson.id !== lessonId));
  return record;
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

/** Streams a browser upload onto disk, enforcing the size limit while writing. */
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
  const destination = uploadedFilePath(storedName);

  mkdirSync(uploadsDir(), { recursive: true });

  let written = 0;
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

  return {
    record: {
      id: randomUUID(),
      name: path.basename(file.name || storedName).slice(0, 160),
      storedName,
      mime: mimeForUpload(file.name || "", file.type),
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

export function uploadedFilePath(storedName: string): string {
  // path.basename keeps a crafted stored name from escaping the data folder.
  return path.join(uploadsDir(), path.basename(storedName));
}

export interface StoredFile {
  path: string;
  size: number;
}

export function locateUploadedFile(record: UploadedFileRecord): StoredFile | null {
  const target = uploadedFilePath(record.storedName);
  if (!existsSync(target)) return null;
  const stats = statSync(target);
  if (!stats.isFile()) return null;
  return { path: target, size: stats.size };
}

export function readFileRange(filePath: string, start: number, end: number): ReadableStream {
  const stream = createReadStream(filePath, { start, end });
  return Readable.toWeb(stream) as unknown as ReadableStream;
}
