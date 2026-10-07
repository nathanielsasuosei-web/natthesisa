import { NextRequest, NextResponse } from "next/server";
import { accessMessage, lessonAccess } from "@/lib/access";
import { findContentLesson } from "@/lib/course-content";
import { getCourse } from "@/lib/courses";
import { lessonVideo } from "@/lib/lesson-videos";
import { diskBlobRange, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the video that belongs to a catalog lesson.
 *
 * The bytes live in the same storage as the owner's uploads, but the *rule* is
 * the lesson rule: the video is part of the lesson, so whoever may open the
 * lesson may watch it, and nobody else. That check happens here rather than in
 * the page, because a browser can be pointed straight at this URL — the
 * redirect below is only handed out after `lessonAccess()` says yes, which is
 * also what stops a locked lesson's video being fetched by copying a link.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ lessonId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to watch this lesson video." }, { status: 401 });

  const { lessonId } = await context.params;
  const entry = lessonVideo(lessonId);
  if (!entry) return NextResponse.json({ error: "This lesson has no video." }, { status: 404 });

  const course = getCourse(entry.courseId);
  const lesson = course ? findContentLesson(course, lessonId) : undefined;
  if (!course || !lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const access = lessonAccess(user, course, lesson);
  if (!access.allowed) {
    return NextResponse.json(
      { error: accessMessage(access, course.shortTitle), code: "ACCESS_REQUIRED", reason: access.reason },
      { status: 402 }
    );
  }

  const download = req.nextUrl.searchParams.get("download") === "1";
  const record = {
    id: "lesson-video",
    name: entry.name,
    storedName: entry.key,
    mime: entry.format,
    size: entry.size,
    kind: "video" as const,
    uploadedAt: entry.generatedAt,
  };

  // With Supabase Storage the browser is sent to the CDN: a public bucket URL,
  // or a one-hour signed one. Supabase serves range requests itself, so the
  // player can seek inside a two-minute clip without the server proxying it.
  const redirect = await storedBlobRedirect(record, download ? entry.name : undefined);
  if (redirect) return NextResponse.redirect(redirect, 302);

  const size = await storedBlobSize(record);
  if (size === null) {
    return NextResponse.json(
      { error: "The lesson video is missing from storage.", code: "STORAGE_MISSING" },
      { status: 410 }
    );
  }

  const asciiName = entry.name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  const headers = new Headers({
    "Content-Type": entry.format || "video/mp4",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(entry.name)}`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  });

  const range = req.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      let start = match[1] ? Number.parseInt(match[1], 10) : 0;
      let end = match[2] ? Number.parseInt(match[2], 10) : size - 1;
      if (!Number.isFinite(start) || start < 0) start = 0;
      if (!Number.isFinite(end) || end > size - 1) end = size - 1;
      if (start > end) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      }
      headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
      headers.set("Content-Length", String(end - start + 1));
      return new NextResponse(diskBlobRange(record, start, end), { status: 206, headers });
    }
  }

  headers.set("Content-Length", String(size));
  return new NextResponse(diskBlobRange(record, 0, size - 1), { status: 200, headers });
}
