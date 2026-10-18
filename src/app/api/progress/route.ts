import { NextRequest, NextResponse } from "next/server";
import { getCourse } from "@/lib/courses";
import { contentPercent, findContentLesson } from "@/lib/course-content";
import { accessMessage, lessonAccess } from "@/lib/access";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { getOrCreateProgress, recordLessonProgress, saveUser } from "@/lib/store";
import { hasFinishedCourse } from "@/lib/certificates";
import { notifyCourseCompleted } from "@/lib/email";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save your progress." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const courseId = typeof body.courseId === "string" ? body.courseId : "";
  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  const course = getCourse(courseId);
  const lesson = course ? findContentLesson(course, lessonId) : undefined;
  if (!course || !lesson) return NextResponse.json({ error: "Course or lesson not found." }, { status: 404 });
  const access = lessonAccess(user, course, lesson);
  if (!access.allowed) {
    return NextResponse.json(
      { error: accessMessage(access, course.shortTitle), code: "ACCESS_REQUIRED", reason: access.reason },
      { status: 402 }
    );
  }

  const completed = body.completed !== false;
  const progress = recordLessonProgress(user, course.id, lesson.id, completed);
  await saveUser(user);

  // The last lesson was just finished: send the one-time congratulations
  // email. The flag on the progress record keeps it to exactly one, even if
  // the student unmarks and re-marks the lesson later.
  let courseFinished = false;
  if (completed && !progress.completionEmailedAt && hasFinishedCourse(user, course.id)) {
    courseFinished = true;
    progress.completionEmailedAt = new Date().toISOString();
    await saveUser(user);
    await notifyCourseCompleted({
      to: user.email,
      toName: user.name,
      courseId: course.id,
      courseTitle: course.title,
    });
  }

  return NextResponse.json({
    ok: true,
    completed,
    courseFinished,
    percent: contentPercent(course, progress.completedLessonIds),
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
  await saveUser(user);
  return NextResponse.json({ ok: true, progress });
}
