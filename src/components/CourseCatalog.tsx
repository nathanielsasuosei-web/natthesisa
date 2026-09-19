"use client";

import { useMemo, useState } from "react";
import type { Course, CourseCategory } from "@/lib/courses";
import { CATEGORIES } from "@/lib/courses";
import type { PlanId } from "@/lib/plans";
import { canAccessCourse } from "@/lib/courses";
import CourseCard from "./CourseCard";
import Icon from "./Icon";

interface Props {
  courses: Course[];
  planId: PlanId;
  progress: Record<string, number>;
}

export default function CourseCatalog({ courses, planId, progress }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | CourseCategory>("All");
  const [level, setLevel] = useState<"All" | Course["level"]>("All");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesQuery = !needle || `${course.title} ${course.description} ${course.tags.join(" ")}`.toLowerCase().includes(needle);
      return matchesQuery && (category === "All" || course.category === category) && (level === "All" || course.level === level);
    });
  }, [courses, query, category, level]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-y border-[#dfdbe3] py-4 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1"><Icon name="search" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><span className="sr-only">Search courses</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search courses, tools or skills…" className="w-full rounded-xl border border-transparent bg-[#f7f6f8] py-2.5 pl-10 pr-3 text-xs font-medium transition placeholder:text-[#a19aa7] focus:border-violet-300 focus:bg-white" /></label>
        <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="rounded-xl border border-[#e3dfe6] bg-white px-3.5 py-2.5 text-xs font-bold text-[#5f5965]"><option value="All">All categories</option>{CATEGORIES.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}</select>
        <select value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="rounded-xl border border-[#e3dfe6] bg-white px-3.5 py-2.5 text-xs font-bold text-[#5f5965]"><option value="All">All levels</option><option>Beginner</option><option>Intermediate</option></select>
      </div>

      <div className="mt-5 flex items-center justify-between"><p className="text-xs font-semibold text-[#817a87]">Showing <strong className="text-[#332e39]">{visible.length}</strong> course{visible.length === 1 ? "" : "s"}</p>{(query || category !== "All" || level !== "All") && <button onClick={() => { setQuery(""); setCategory("All"); setLevel("All"); }} className="text-[11px] font-bold text-[#6543e8]">Clear filters</button>}</div>

      {visible.length ? (
        <div className="mt-5 grid gap-x-7 gap-y-9 md:grid-cols-2">
          {visible.map((course) => <CourseCard key={course.id} course={course} progress={progress[course.id]} locked={!canAccessCourse(planId, course)} />)}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center border-y border-dashed border-[#d9d4de] px-6 py-16 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#f0edf4] text-[#817a87]"><Icon name="search" size={22} /></span><h3 className="mt-4 text-sm font-extrabold">No courses found</h3><p className="mt-1 text-xs text-[#918a97]">Try another keyword or clear your filters.</p></div>
      )}
    </div>
  );
}
