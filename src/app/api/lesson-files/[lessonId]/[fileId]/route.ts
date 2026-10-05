import { NextRequest, NextResponse } from "next/server";
import { accessMessage, lessonAccess } from "@/lib/access";
import { findContentLesson, findUploadedLessonCourse } from "@/lib/course-content";
import { diskBlobRange, getUploadedLesson, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves materials attached to an owner-published lesson.
 *
 * Access is checked on the server with the same rule as the lesson itself
 * (`access.ts`): an active pass AND the course or lesson paid for, unless the
 * owner marked the lesson a free preview. A page cannot be trusted to gate a
 * video, so the rule is repeated here.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ lessonId: string; fileId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to open this lesson material." }, { status: 401 });

  const { lessonId, fileId } = await context.params;
  const record = getUploadedLesson(lessonId);
  if (!record) return NextResponse.json({ error: "Lesson material not found." }, { status: 404 });

  const located = findUploadedLessonCourse(lessonId);
  if (!located) return NextResponse.json({ error: "This lesson is no longer part of a course." }, { status: 404 });

  const lesson = located.record;
  const course = located.course;
  const mergedLesson = findContentLesson(course, lessonId);
  if (!mergedLesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  const access = lessonAccess(user, course, mergedLesson);
  if (!access.allowed) {
    return NextResponse.json(
      { error: accessMessage(access, course.shortTitle), code: "ACCESS_REQUIRED", reason: access.reason },
      { status: 402 }
    );
  }

  const file = lesson.files.find((candidate) => candidate.id === fileId);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const download = req.nextUrl.searchParams.get("download") === "1";

  // With Supabase Storage the browser is sent to a URL on Supabase's CDN — the
  // bucket's permanent public URL, or a one-hour signed one when it is private.
  // Either way the CDN serves range requests itself, so a long video seeks
  // properly, and the bytes never pass through this route.
  const redirect = await storedBlobRedirect(file, download ? file.name : undefined);
  if (redirect) return NextResponse.redirect(redirect, 302);

  const size = await storedBlobSize(file);
  if (size === null) {
    return NextResponse.json({ error: "The uploaded file is missing from storage." }, { status: 410 });
  }
  const stored = { size };
  const disposition = download ? "attachment" : "inline";
  const asciiName = file.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  const headers = new Headers({
    "Content-Type": file.mime || "application/octet-stream",
    "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  });

  const range = req.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      const startRaw = match[1];
      const endRaw = match[2];
      let start = startRaw ? Number.parseInt(startRaw, 10) : 0;
      let end = endRaw ? Number.parseInt(endRaw, 10) : stored.size - 1;
      if (!Number.isFinite(start) || start < 0) start = 0;
      if (!Number.isFinite(end) || end > stored.size - 1) end = stored.size - 1;
      if (start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${stored.size}` },
        });
      }
      headers.set("Content-Range", `bytes ${start}-${end}/${stored.size}`);
      headers.set("Content-Length", String(end - start + 1));
      return new NextResponse(diskBlobRange(file, start, end), { status: 206, headers });
    }
  }

  headers.set("Content-Length", String(stored.size));
  return new NextResponse(diskBlobRange(file, 0, stored.size - 1), { status: 200, headers });
}
