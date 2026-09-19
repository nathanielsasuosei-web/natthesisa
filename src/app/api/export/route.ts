import { NextResponse } from "next/server";
import { COURSES, coursePercent, getCourseLessons } from "@/lib/courses";
import { getPlan } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const plan = getPlan(user.subscription.planId);
  if (!plan.entitlements.downloads) {
    return NextResponse.json(
      { error: "Progress export is available on Pro and Mentor.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const rows = ["course,status,progress_percent,lessons_completed,total_lessons,last_accessed"];
  for (const progress of Object.values(user.progress)) {
    const course = COURSES.find((item) => item.id === progress.courseId);
    if (!course) continue;
    const percent = coursePercent(course, progress.completedLessonIds);
    rows.push(
      [
        course.title,
        percent === 100 ? "completed" : "in progress",
        String(percent),
        String(progress.completedLessonIds.length),
        String(getCourseLessons(course).length),
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
