import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { COURSES } from "@/lib/courses";
import { ownerLessonCount, ownerLessonSummaries } from "@/lib/course-content";
import { getCurrentAdmin } from "@/lib/session";
import { OWNER_ONLY_ERROR, isOwner } from "@/lib/owner";
import { MAX_FILES_PER_LESSON } from "@/lib/lesson-uploads";
import Icon from "@/components/Icon";
import OwnerLessonManager, { type OwnerCourseOption, type OwnerLessonRow } from "@/components/OwnerLessonManager";

export const metadata: Metadata = { title: "Lesson uploads" };

export default async function AdminLessonsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin-sign-in");

  // Lessons can only be published by the owner. Administrators who are not the
  // owner are sent back to the console (and every upload API re-checks this).
  if (!isOwner(admin)) {
    return (
      <div className="mx-auto max-w-lg border-y border-[#ded9e3] py-10 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f4f1ff] text-[#5e3de0]"><Icon name="lock" size={24} /></span>
        <h1 className="mt-5 text-xl font-black tracking-[-.035em]">Owner access required</h1>
        <p className="mt-2 text-sm leading-6 text-[#756f7b]">{OWNER_ONLY_ERROR.error}</p>
        <Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#6d1aff] px-4 py-3 text-xs font-extrabold text-white">Back to the admin console <Icon name="arrow-right" size={15} /></Link>
      </div>
    );
  }

  const courses: OwnerCourseOption[] = COURSES.map((course) => ({
    id: course.id,
    title: course.title,
    shortTitle: course.shortTitle,
    modules: course.modules.map((module) => ({ id: module.id, title: module.title })),
  }));

  const lessons: OwnerLessonRow[] = ownerLessonSummaries().map(({ record, courseTitle, moduleTitle }) => ({
    id: record.id,
    title: record.title,
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

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">Lesson publishing</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Upload a lesson</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#756f7b]">
            Signed in as <strong>{admin.name}</strong> — the site owner. This is the only account that can add lessons or materials to the catalog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="border-l-2 border-[#6d4aff] pl-3 text-xs font-bold text-[#6d6673]">{ownerLessonCount()} published<br /><span className="font-medium text-[#9a939f]">Max {MAX_FILES_PER_LESSON} files per lesson</span></div>
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#5e5864]"><Icon name="arrow-left" size={14} /> Console</Link>
        </div>
      </header>

      <OwnerLessonManager courses={courses} lessons={lessons} />

      <div className="open-callout flex gap-3">
        <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-[#3f67c8]" />
        <p className="text-[10px] leading-5 text-[#5870a5]">
          <strong className="text-[#294a96]">Uploads are locked to the owner.</strong> Every request to publish, list or delete a lesson checks the owner account on the server, so signing in as a learner — or as an administrator who is not the owner — cannot add content. Uploaded lessons and their files are stored on the server’s disk and survive restarts.
        </p>
      </div>
    </div>
  );
}
