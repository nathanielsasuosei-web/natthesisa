import { NextResponse } from "next/server";
import { getCourse } from "@/lib/courses";
import { findContentLesson } from "@/lib/course-content";
import { lessonVideo } from "@/lib/lesson-videos";
import { diskBlobRange, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The frame the player shows before a lesson video starts. Public, like the lesson. */
export async function GET(_req: Request, context: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await context.params;
  const entry = lessonVideo(lessonId);
  if (!entry) return NextResponse.json({ error: "This lesson has no video." }, { status: 404 });

  const course = getCourse(entry.courseId);
  const lesson = course ? findContentLesson(course, lessonId) : undefined;
  if (!course || !lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const record = {
    id: "lesson-video-poster",
    name: entry.poster.name,
    storedName: entry.poster.key,
    mime: entry.poster.format,
    size: entry.poster.size,
    kind: "image" as const,
    uploadedAt: entry.generatedAt,
  };

  const redirect = await storedBlobRedirect(record);
  if (redirect) return NextResponse.redirect(redirect, 302);

  const size = await storedBlobSize(record);
  if (size === null) {
    return NextResponse.json(
      { error: "The video thumbnail is missing from storage.", code: "STORAGE_MISSING" },
      { status: 410 }
    );
  }

  return new NextResponse(diskBlobRange(record, 0, size - 1), {
    status: 200,
    headers: {
      "Content-Type": entry.poster.format || "image/jpeg",
      "Content-Length": String(size),
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
