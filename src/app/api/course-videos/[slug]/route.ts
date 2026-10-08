import { NextRequest, NextResponse } from "next/server";
import { refuseUnlessCourseOpen } from "@/lib/course-guard";
import { getCourse } from "@/lib/courses";
import { courseVideo } from "@/lib/course-videos";
import { diskBlobRange, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the teacher's welcome video for a course.
 *
 * The welcome video is shown only inside the signed-in course, so it is gated
 * the same way as the lessons.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const entry = courseVideo(slug);
  const course = entry ? getCourse(entry.courseId) : undefined;
  if (!entry || !course) return NextResponse.json({ error: "This course has no video." }, { status: 404 });
  const refused = await refuseUnlessCourseOpen(course);
  if (refused) return refused;

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
    return NextResponse.json(
      { error: "The course video is missing from storage.", code: "STORAGE_MISSING" },
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
