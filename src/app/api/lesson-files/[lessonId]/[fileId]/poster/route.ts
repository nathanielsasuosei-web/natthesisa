import { NextResponse } from "next/server";
import { findUploadedLessonCourse } from "@/lib/course-content";
import { diskBlobRange, getUploadedLesson, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serves the thumbnail the owner captured in the video editor. */
export async function GET(_req: Request, context: { params: Promise<{ lessonId: string; fileId: string }> }) {
  const { lessonId, fileId } = await context.params;
  const record = getUploadedLesson(lessonId);
  if (!record) return NextResponse.json({ error: "Lesson material not found." }, { status: 404 });

  const located = findUploadedLessonCourse(lessonId);
  if (!located) return NextResponse.json({ error: "This lesson is no longer part of a course." }, { status: 404 });

  const file = record.files.find((candidate) => candidate.id === fileId);
  const poster = file?.poster;
  if (!poster) return NextResponse.json({ error: "This video has no thumbnail." }, { status: 404 });

  const redirect = await storedBlobRedirect(poster);
  if (redirect) return NextResponse.redirect(redirect, 302);

  const size = await storedBlobSize(poster);
  if (size === null) return NextResponse.json({ error: "The thumbnail is missing from storage." }, { status: 410 });
  const stored = { size };

  return new NextResponse(diskBlobRange(poster, 0, size - 1), {
    status: 200,
    headers: {
      "Content-Type": poster.mime || "image/jpeg",
      "Content-Length": String(stored.size),
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
