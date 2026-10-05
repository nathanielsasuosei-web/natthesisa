import { NextResponse } from "next/server";
import { COURSES } from "@/lib/courses";
import { contentLessons, contentPercent } from "@/lib/course-content";
import { getCurrentUser } from "@/lib/session";

/**
 * A student's own progress as CSV. There is one level of access now, so this
 * is available to any signed-in student rather than being held back as an
 * upgrade.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const rows = ["course,status,progress_percent,lessons_completed,total_lessons,last_accessed"];
  for (const progress of Object.values(user.progress)) {
    const course = COURSES.find((item) => item.id === progress.courseId);
    if (!course) continue;
    const percent = contentPercent(course, progress.completedLessonIds);
    rows.push(
      [
        course.title,
        percent === 100 ? "completed" : "in progress",
        String(percent),
        String(progress.completedLessonIds.length),
        String(contentLessons(course).length),
        progress.lastAccessedAt,
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(",")
    );
  }
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="codemasterghana-learning-progress.csv"',
    },
  });
}
