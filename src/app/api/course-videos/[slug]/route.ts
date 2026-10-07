import { NextRequest, NextResponse } from "next/server";
import { accessMessage, lessonAccess } from "@/lib/access";
import { getCourse } from "@/lib/courses";
import { contentLessons } from "@/lib/course-content";
import { courseVideo } from "@/lib/course-videos";
import { diskBlobRange, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the teacher's welcome video for a course.
 *
 * The rule is the course rule: the video describes the material, so it is for
 * the students who own the program the course belongs to (and for the owner).
 * It is not a preview — the clip talks about the course rather than teaching
 * it, and the site sells nothing by sample.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to watch this course video." }, { status: 401 });

  const { slug } = await context.params;
  const entry = courseVideo(slug);
  const course = entry ? getCourse(entry.courseId) : undefined;
  if (!entry || !course) return NextResponse.json({ error: "This course has no video." }, { status: 404 });

  const first = contentLessons(course)[0];
  if (!first) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  const access = lessonAccess(user, course, first);
  if (!access.allowed) {
    return NextResponse.json(
      { error: accessMessage(access, course.shortTitle), code: "ACCESS_REQUIRED", reason: access.reason },
      { status: 402 }
    );
  }

  const download = req.nextUrl.searchParams.get("download") === "1";
  const record = {
    id: "course-video",
    name: entry.name,
    storedName: entry.key,
    mime: entry.format,
    size: entry.size,
    kind: "video" as const,
    uploadedAt: entry.generatedAt,
  };

  const redirect = await storedBlobRedirect(record, download ? entry.name : undefined);
  if (redirect) return NextResponse.redirect(redirect, 302);

  const size = await storedBlobSize(record);
  if (size === null) {
    return NextResponse.json({ error: "The course video is missing from storage." }, { status: 410 });
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
