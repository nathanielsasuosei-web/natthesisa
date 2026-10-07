import type { Course } from "@/lib/courses";
import { courseVideoAvailability } from "@/lib/video-availability";
import CoverVideo from "./CoverVideo";
import Icon from "./Icon";

/**
 * The welcome video on a course page.
 *
 * Renders nothing at all when the course has no video, so a course added to the
 * catalog before its clip is generated simply shows the page it always did —
 * and likewise when the clip is listed but its bytes never reached this
 * deployment's storage, which would otherwise render a player that can only
 * fail.
 */
export default async function CourseVideoWelcome({ course, className = "" }: { course: Course; className?: string }) {
  const availability = await courseVideoAvailability(course.slug);
  const entry = availability?.entry ?? null;
  if (!entry || !availability?.video) return null;
  const lessons = course.modules.flatMap((module) => module.lessons).length;

  return (
    <section className={`open-surface overflow-hidden rounded-[22px] border border-[#e6e2e9] bg-white ${className}`}>
      <div className="border-b border-[#ece9ee] p-5 sm:px-6">
        <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#6d4aff]">Welcome to the course</p>
        <h2 className="mt-1.5 text-base font-black tracking-[-.025em]">
          {course.instructor.name} introduces {course.shortTitle}
        </h2>
        <p className="mt-1.5 text-[11px] leading-5 text-[#817a87]">
          {Math.max(1, Math.round(entry.durationSeconds / 60))} minutes on what the course covers, what you will build, and how to work
          through its {lessons} lessons.
        </p>
      </div>
      <div className="p-4 sm:p-5">
        <CoverVideo
          src={`/api/course-videos/${course.slug}`}
          poster={availability.poster ? `/api/course-videos/${course.slug}/poster` : undefined}
          title={`${course.title} welcome`}
          durationSeconds={entry.durationSeconds}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-[#ece9ee] px-5 py-3 text-[10px] font-semibold text-[#817a87] sm:px-6">
        <Icon name="spark" size={12} className="text-[#6d4aff]" />
        Then start lesson one below — every lesson has its own walkthrough video.
      </div>
    </section>
  );
}
