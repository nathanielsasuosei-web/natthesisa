import type { Metadata } from "next";
import { COURSES, coursePercent } from "@/lib/courses";
import { requireCurrentUser } from "@/lib/require-user";
import CourseCatalog from "@/components/CourseCatalog";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage() {
  const user = await requireCurrentUser();
  const progress = Object.fromEntries(
    Object.values(user.progress).map((item) => {
      const course = COURSES.find((candidate) => candidate.id === item.courseId);
      return [item.courseId, course ? coursePercent(course, item.completedLessonIds) : 0];
    })
  );
  return (
    <div>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold text-[#8a8390]">Course library</p><h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">What will you build next?</h1><p className="mt-1.5 max-w-2xl text-sm text-[#756f7b]">Follow a complete path or learn the exact skill your next project needs.</p></div>
        <div className="border-l-2 border-[#6d4aff] pl-3 text-xs font-bold text-[#6d6673]">{COURSES.length} paths<br /><span className="font-medium text-[#9a939f]">Updated regularly</span></div>
      </header>
      <CourseCatalog courses={COURSES} planId={user.subscription.planId} progress={progress} />
    </div>
  );
}
