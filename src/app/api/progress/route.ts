import { NextRequest, NextResponse } from "next/server";
import { canAccessLesson, coursePercent, getCourse, getLesson } from "@/lib/courses";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { getOrCreateProgress, recordLessonProgress } from "@/lib/store";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save your progress." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const courseId = typeof body.courseId === "string" ? body.courseId : "";
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  const course = getCourse(courseId);
  const lesson = course ? getLesson(course, lessonId) : undefined;
  if (!course || !lesson) return NextResponse.json({ error: "Course or lesson not found." }, { status: 404 });
  if (!canAccessLesson(user.subscription.planId, course, lesson)) {
    return NextResponse.json(
      { error: "This lesson is included with Pro. Upgrade to keep learning.", code: "UPGRADE_REQUIRED" },
      { status: 402 }
    );
  }

  const completed = body.completed !== false;
  const progress = recordLessonProgress(user, course.id, lesson.id, completed);
  return NextResponse.json({
    ok: true,
    completed,
    percent: coursePercent(course, progress.completedLessonIds),
    completedLessonIds: progress.completedLessonIds,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to start learning." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const course = getCourse(typeof body.courseId === "string" ? body.courseId : "");
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  const progress = getOrCreateProgress(user, course.id);
  return NextResponse.json({ ok: true, progress });
}
