import { NextResponse } from "next/server";
import { getCourse } from "@/lib/courses";
import { courseVideo } from "@/lib/course-videos";
import { diskBlobRange, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The welcome video's own artwork, shown before it plays. Public, like the course. */
export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const entry = courseVideo(slug);
  const course = entry ? getCourse(entry.courseId) : undefined;
  if (!entry || !course) return NextResponse.json({ error: "This course has no video." }, { status: 404 });

  const record = {
    id: "course-video-poster",
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
    return NextResponse.json({ error: "The course video thumbnail is missing from storage." }, { status: 410 });
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
