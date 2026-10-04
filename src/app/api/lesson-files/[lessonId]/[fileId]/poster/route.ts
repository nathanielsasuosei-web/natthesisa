import { NextResponse } from "next/server";
import { canAccessLesson } from "@/lib/courses";
import { findContentLesson, findUploadedLessonCourse } from "@/lib/course-content";
import { getUploadedLesson, locateUploadedFile, readFileRange } from "@/lib/lesson-uploads";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serves the thumbnail the owner captured in the video editor. */
export async function GET(_req: Request, context: { params: Promise<{ lessonId: string; fileId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view this lesson material." }, { status: 401 });

  const { lessonId, fileId } = await context.params;
  const record = getUploadedLesson(lessonId);
  if (!record) return NextResponse.json({ error: "Lesson material not found." }, { status: 404 });

  const located = findUploadedLessonCourse(lessonId);
  if (!located) return NextResponse.json({ error: "This lesson is no longer part of a course." }, { status: 404 });
  const mergedLesson = findContentLesson(located.course, lessonId);
  if (!mergedLesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  if (!canAccessLesson(user.subscription.planId, located.course, mergedLesson)) {
    return NextResponse.json(
      { error: "This material is included with Pro. Upgrade to keep learning.", code: "UPGRADE_REQUIRED" },
      { status: 402 }
    );
  }

  const file = record.files.find((candidate) => candidate.id === fileId);
  const poster = file?.poster;
  if (!poster) return NextResponse.json({ error: "This video has no thumbnail." }, { status: 404 });

  const stored = locateUploadedFile(poster);
  if (!stored) return NextResponse.json({ error: "The thumbnail is missing from the server." }, { status: 410 });

  return new NextResponse(readFileRange(stored.path, 0, stored.size - 1), {
    status: 200,
    headers: {
      "Content-Type": poster.mime || "image/jpeg",
      "Content-Length": String(stored.size),
      "Cache-Control": "private, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
