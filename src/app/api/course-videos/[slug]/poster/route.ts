import { NextResponse } from "next/server";
import { accessMessage, lessonAccess } from "@/lib/access";
import { getCourse } from "@/lib/courses";
import { contentLessons } from "@/lib/course-content";
import { courseVideo } from "@/lib/course-videos";
import { diskBlobRange, storedBlobRedirect, storedBlobSize } from "@/lib/lesson-uploads";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The welcome video's own artwork, shown before it plays. Access-gated the same way. */
export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
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
