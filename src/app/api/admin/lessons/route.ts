import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCourse } from "@/lib/courses";
import { getCurrentOwner } from "@/lib/session";
import { OWNER_ONLY_ERROR } from "@/lib/owner";
import {
  MAX_FILES_PER_LESSON,
  UploadError,
  createUploadedLesson,
  listUploadedLessons,
  saveUploadedFile,
  uploadedLessonToLesson,
  type UploadedFileRecord,
} from "@/lib/lesson-uploads";
import { ownerLessonSummaries } from "@/lib/course-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Owner-only: list the lessons published from the owner console. */
export async function GET() {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });
  const lessons = ownerLessonSummaries().map(({ record, courseTitle, moduleTitle }) => ({
    id: record.id,
    title: record.title,
    courseId: record.courseId,
    courseTitle,
    moduleTitle,
    duration: record.duration,
    preview: record.preview,
    createdAt: record.createdAt,
    createdBy: record.createdBy,
    files: record.files.map((file) => ({
      id: file.id,
      name: file.name,
      kind: file.kind,
      size: file.size,
      href: `/api/lesson-files/${record.id}/${file.id}`,
    })),
  }));
  return NextResponse.json({ ok: true, count: lessons.length, lessons });
}

/**
 * Owner-only: publish a new lesson, optionally with uploaded materials
 * (video, PDF, slide deck, image or zip).
 */
export async function POST(req: NextRequest) {
  const owner = await getCurrentOwner();
  if (!owner) return NextResponse.json(OWNER_ONLY_ERROR, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "The upload could not be read. Please try again." }, { status: 400 });
  }

  const courseId = text(form.get("courseId"));
  const course = getCourse(courseId);
  if (!course) return NextResponse.json({ error: "Choose a course for this lesson." }, { status: 400 });

  const title = text(form.get("title")).slice(0, 140);
  const summary = text(form.get("summary")).slice(0, 600);
  const body = text(form.get("body")).slice(0, 6000);
  const challenge = text(form.get("challenge")).slice(0, 600);
  const code = text(form.get("code")).slice(0, 4000);
  const language = text(form.get("language")).slice(0, 30);
  const preview = text(form.get("preview")) === "true";
  const durationRaw = Number.parseInt(text(form.get("duration")), 10);
  const duration = Number.isFinite(durationRaw) ? Math.min(Math.max(durationRaw, 1), 600) : 20;

  if (title.length < 3) return NextResponse.json({ error: "Give the lesson a title of at least 3 characters." }, { status: 400 });
  if (summary.length < 10) return NextResponse.json({ error: "Add a short summary (at least 10 characters)." }, { status: 400 });
  if (body.length < 10) return NextResponse.json({ error: "Add the lesson content (at least 10 characters)." }, { status: 400 });

  const moduleChoice = text(form.get("moduleId"));
  const existingModule = course.modules.find((module) => module.id === moduleChoice);
  const newModuleTitle = text(form.get("moduleTitle")).slice(0, 90);
  if (!existingModule && !newModuleTitle) {
    return NextResponse.json({ error: "Pick an existing module or name a new one." }, { status: 400 });
  }

  const objectives = text(form.get("objectives"))
    .split("\n")
    .map((line) => line.replace(/^[-•\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((line) => line.slice(0, 160));

  const uploads = form.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (uploads.length > MAX_FILES_PER_LESSON) {
    return NextResponse.json({ error: `Attach at most ${MAX_FILES_PER_LESSON} files to one lesson.` }, { status: 400 });
  }

  const lessonId = randomUUID();
  const files: UploadedFileRecord[] = [];
  try {
    for (const file of uploads) {
      const saved = await saveUploadedFile(file, lessonId);
      files.push(saved.record);
    }
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("lesson upload failed", error);
    return NextResponse.json({ error: "The lesson materials could not be saved." }, { status: 500 });
  }

  try {
    const record = createUploadedLesson({
      courseId: course.id,
      moduleId: existingModule ? existingModule.id : "new",
      moduleTitle: existingModule ? null : newModuleTitle,
      moduleDescription: existingModule ? null : "Newest material published by the course owner.",
      title,
      duration,
      summary,
      body,
      code: code || null,
      language: language || null,
      objectives,
      challenge: challenge || "Practise the idea from this lesson in your own project.",
      preview,
      files,
      createdBy: owner.name,
      createdByEmail: owner.email,
    });
    return NextResponse.json({ ok: true, lesson: uploadedLessonToLesson(record), record });
  } catch (error) {
    console.error("lesson could not be stored", error);
    return NextResponse.json(
      {
        error: `The lesson was uploaded but could not be saved to disk. Check that the server can write to its data folder.`,
      },
      { status: 500 }
    );
  }
}
