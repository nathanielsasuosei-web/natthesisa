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
import { lessonPrice, pricing, saveContentPrice } from "@/lib/plans";

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
    price: lessonPrice(record.id),
    createdAt: record.createdAt,
    createdBy: record.createdBy,
    files: record.files.map((file) => ({
      id: file.id,
      name: file.name,
      kind: file.kind,
      size: file.size,
      href: `/api/lesson-files/${record.id}/${file.id}`,
      trimStart: file.trimStart ?? 0,
      trimEnd: file.trimEnd ?? null,
      muted: file.muted ?? false,
      poster: file.poster ? `/api/lesson-files/${record.id}/${file.id}/poster` : null,
      edited: Boolean(file.editedAt),
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
  // The owner prices the lesson before publishing it. An empty field falls
  // back to the owner's default lesson price, so a lesson can never be
  // published without a price.
  const priceRaw = text(form.get("price"));
  const price = priceRaw === "" ? pricing().lesson : Number(priceRaw);
  if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
    return NextResponse.json({ error: "Enter the lesson price as a number (0 or more)." }, { status: 400 });
  }
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

  // The console sends one set of edit fields per file, indexed in upload order:
  //   edit_0_trimStart / edit_0_trimEnd / edit_0_muted and poster_0 (an image).
  function editNumber(index: number, key: string): number | null {
    const raw = form.get(`edit_${index}_${key}`);
    if (typeof raw !== "string" || raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  const lessonId = randomUUID();
  const files: UploadedFileRecord[] = [];
  try {
    for (const [index, file] of uploads.entries()) {
      const saved = await saveUploadedFile(file, lessonId);
      const record = saved.record;

      if (record.kind === "video") {
        const trimStart = Math.max(0, editNumber(index, "trimStart") ?? 0);
        const trimEnd = form.get(`edit_${index}_trimEnd`) === "null" ? null : editNumber(index, "trimEnd");
        if (trimEnd !== null && trimEnd <= trimStart + 0.1) {
          return NextResponse.json({ error: `The trim end for “${file.name}” must come after the trim start.` }, { status: 400 });
        }
        const posterEntry = form.get(`poster_${index}`);
        let poster: UploadedFileRecord | null = null;
        if (posterEntry instanceof File && posterEntry.size > 0) {
          poster = (await saveUploadedFile(posterEntry, lessonId)).record;
        }
        record.trimStart = trimStart;
        record.trimEnd = trimEnd;
        record.muted = form.get(`edit_${index}_muted`) === "true";
        record.poster = poster;
        if (trimStart > 0 || trimEnd !== null || record.muted || poster) record.editedAt = new Date().toISOString();
      }

      files.push(record);
    }
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("lesson upload failed", error);
    return NextResponse.json({ error: "The lesson materials could not be saved." }, { status: 500 });
  }

  try {
    const record = await createUploadedLesson({
      id: lessonId,
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
      price: Math.round(price),
      files,
      createdBy: owner.name,
      createdByEmail: owner.email,
    });
    // The price the owner set at publish time becomes the live price, so it can
    // still be changed later from the pricing console.
    await saveContentPrice("lesson", record.id, price);
    return NextResponse.json({ ok: true, lesson: uploadedLessonToLesson(record), record });
  } catch (error) {
    console.error("lesson could not be stored", error);
    return NextResponse.json(
      {
        error: `The lesson was uploaded but its details could not be saved. Check the database connection and try again.`,
      },
      { status: 500 }
    );
  }
}
