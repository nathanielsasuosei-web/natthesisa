import Link from "next/link";
import type { Course } from "@/lib/courses";
import { getCourseLessons, getCourseMinutes } from "@/lib/courses";
import { fmtMinutes } from "@/lib/format";
import CourseVisual from "./CourseVisual";
import Icon from "./Icon";

interface Props {
  course: Course;
  progress?: number;
  locked?: boolean;
  hrefBase?: "public" | "dashboard";
}

export default function CourseCard({ course, progress, locked = false, hrefBase = "dashboard" }: Props) {
  const lessons = getCourseLessons(course);
  const href = hrefBase === "dashboard" ? `/dashboard/courses/${course.slug}` : "/login";
  const showVisual = hrefBase === "dashboard";
  return (
    <Link
      href={href}
      data-visual={showVisual}
      className="open-course-card group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#e8e5ed] bg-white shadow-[0_8px_30px_rgba(28,23,43,.04)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_45px_rgba(45,32,87,.11)]"
    >
      {showVisual && <CourseVisual course={course} className="h-40" />}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[.12em] text-[#6d4aff]">{course.category}</span>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0edf9] px-2.5 py-1 text-[10px] font-bold text-[#625c70]">
              <Icon name="lock" size={11} /> Pro
            </span>
          ) : progress === 100 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              <Icon name="check" size={11} /> Complete
            </span>
          ) : null}
        </div>
        <h3 className="mt-2.5 text-[17px] font-bold leading-snug tracking-[-.025em] text-[#1b1822] transition group-hover:text-[#5a39e7]">{course.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#716b7b]">{course.description}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-[#817b8b]">
          <span className="inline-flex items-center gap-1.5"><Icon name="book" size={14} /> {lessons.length} lessons</span>
          <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} /> {fmtMinutes(getCourseMinutes(course))}</span>
          <span>{course.level}</span>
        </div>
        {progress !== undefined ? (
          <div className="mt-auto pt-5">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
              <span className="text-[#706a79]">Your progress</span>
              <span className="text-[#4f2fd3]">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eeebf2]">
              <div className="h-full rounded-full bg-[#6d4aff] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-between pt-5 text-xs">
            <span className="inline-flex items-center gap-1 text-[#6d6671]"><Icon name="star" size={13} className="text-[#ffad32]" /> {course.rating}</span>
            <span className="font-semibold text-[#5a39e7] transition group-hover:translate-x-1">View course →</span>
          </div>
        )}
      </div>
    </Link>
  );
}
