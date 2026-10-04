import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import {
  UploadError,
  getUploadedLesson,
  removeFilePoster,
  replaceFileContents,
  saveFileEdits,
  saveUploadedFile,
  uploadedLessonToLesson,
  fileKindForName,
  type UploadedFileRecord,
} from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function numberField(form: FormData, key: string): number | null {
  const raw = form.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * Owner-only: apply picture or video edits to a file that is already attached
 * to a published lesson.
 *
 *  - picture → multipart with a replacement `file` (the edited image)
 *  - video   → `trimStart`, `trimEnd`, `muted`, optional `poster` image,
 *              or `removePoster=true`
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ lessonId: string; fileId: string }> }) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });

  const { lessonId, fileId } = await context.params;
  const lesson = getUploadedLesson(lessonId);
  const existing = lesson?.files.find((file) => file.id === fileId);
  if (!lesson || !existing) return NextResponse.json({ error: "That file no longer exists." }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "The edit could not be read. Please try again." }, { status: 400 });
  }

  try {
    let poster: UploadedFileRecord | undefined;
    const posterEntry = form.get("poster");
    if (posterEntry instanceof File && posterEntry.size > 0) {
      const saved = await saveUploadedFile(posterEntry, lessonId);
      poster = saved.record;
    }

    if (existing.kind === "image") {
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "Attach the edited picture to save it." }, { status: 400 });
      }
      if (fileKindForName(file.name) !== "image") {
        return NextResponse.json({ error: "Edited files must be images." }, { status: 415 });
      }
      const saved = await saveUploadedFile(file, lessonId);
      const updated = replaceFileContents(lessonId, fileId, saved.record);
      if (!updated) return NextResponse.json({ error: "That file no longer exists." }, { status: 404 });
    } else if (existing.kind === "video") {
      const trimStart = numberField(form, "trimStart") ?? existing.trimStart ?? 0;
      const trimEnd = form.get("trimEnd") === "null" ? null : numberField(form, "trimEnd") ?? existing.trimEnd ?? null;
      const muted = form.get("muted") === "true";
      if (trimEnd !== null && trimEnd <= trimStart + 0.1) {
        return NextResponse.json({ error: "The trim end must come after the trim start." }, { status: 400 });
      }
      if (form.get("removePoster") === "true") removeFilePoster(lessonId, fileId);
      const updated = saveFileEdits(lessonId, fileId, { trimStart, trimEnd, muted }, poster);
      if (!updated) return NextResponse.json({ error: "That file no longer exists." }, { status: 404 });
    } else {
      return NextResponse.json({ error: "Only pictures and videos can be edited." }, { status: 415 });
    }

    const refreshed = getUploadedLesson(lessonId);
    const lessonView = refreshed ? uploadedLessonToLesson(refreshed) : null;
    return NextResponse.json({
      ok: true,
      file: lessonView?.files?.find((file) => file.id === fileId) ?? null,
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("file edit failed", error);
    return NextResponse.json({ error: "The edit could not be saved." }, { status: 500 });
  }
}
