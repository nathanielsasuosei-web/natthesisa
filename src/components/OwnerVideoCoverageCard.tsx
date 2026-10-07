import type { Course } from "@/lib/courses";
import { COURSES } from "@/lib/courses";
import { courseVideoCount } from "@/lib/course-videos";
import { lessonVideoCount } from "@/lib/lesson-videos";
import Icon from "./Icon";

interface Props {
  /** Slugs of the courses that have a welcome video. */
  coursesWithVideo: string[];
  /** Course ids that still have lessons waiting for a walkthrough. */
  coursesWithGaps: { courseId: string; shortTitle: string; missing: number }[];
}

/**
 * How much of the library has a video.
 *
 * The videos are generated, not uploaded, so the teacher cannot see progress in
 * the lesson manager — and a course half-covered looks exactly like a course
 * that is finished. This panel counts what is left and names the command that
 * renders it.
 */
export default function OwnerVideoCoverageCard({ coursesWithVideo, coursesWithGaps }: Props) {
  const lessons = COURSES.reduce((sum, course) => sum + course.modules.reduce((count, module) => count + module.lessons.length, 0), 0);
  const missingTotal = coursesWithGaps.reduce((sum, item) => sum + item.missing, 0);
  const withVideo = lessons - missingTotal;
  const covered = coursesWithVideo.length;
  const complete = missingTotal === 0 && covered === COURSES.length;
  const percent = lessons ? Math.round((withVideo / lessons) * 100) : 0;
  const firstGap = coursesWithGaps[0];

  return (
    <section className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${complete ? "bg-emerald-100 text-emerald-700" : "bg-[#f0ecff] text-[#5e3de0]"}`}>
            <Icon name="video" size={19} />
          </span>
          <div>
            <h2 className="text-sm font-extrabold">Lesson videos</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">
              {withVideo} of {lessons} lessons · {covered} of {COURSES.length} course welcomes
            </p>
          </div>
        </div>
        <span className={`rounded-lg px-2.5 py-1.5 text-[9px] font-black ${complete ? "bg-emerald-50 text-emerald-700" : "bg-[#fff4e8] text-[#a65a1f]"}`}>
          {complete ? "Every lesson has a walkthrough" : `${percent}% of lessons`}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eeeaf1]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#6d4aff] to-[#9c83ff]" style={{ width: `${percent}%` }} />
      </div>

      {complete ? (
        <p className="mt-4 text-[10px] leading-5 text-[#817a87]">
          Every lesson in the catalog opens with a walkthrough, and every course page has a welcome video. Add a course and
          run <code className="rounded bg-[#f5f3f7] px-1 py-0.5 font-mono text-[9px]">npm run videos:build</code> to keep it that
          way.
        </p>
      ) : (
        <>
          <p className="mt-4 text-[10px] leading-5 text-[#817a87]">
            Videos are generated from the narration scripts in{" "}
            <code className="rounded bg-[#f5f3f7] px-1 py-0.5 font-mono text-[9px]">content/lesson-videos/</code>. Render the
            lessons below with:
          </p>
          <pre className="dashboard-scroll mt-3 overflow-x-auto rounded-xl bg-[#1d1a23] px-4 py-3 font-mono text-[10px] leading-5 text-[#d9d2e1]">
            {`npm run videos:build -- --course ${firstGap?.courseId ?? "web-foundations"}`}
          </pre>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {coursesWithGaps.slice(0, 8).map((item) => (
              <span key={item.courseId} className="rounded-full border border-[#e6e2e9] px-2 py-1 text-[8px] font-bold text-[#7d7683]">
                {item.shortTitle} · {item.missing} left
              </span>
            ))}
            {coursesWithGaps.length > 8 && (
              <span className="rounded-full bg-[#f5f3f7] px-2 py-1 text-[8px] font-black text-[#7d7683]">
                +{coursesWithGaps.length - 8} more courses
              </span>
            )}
          </div>
          {covered < COURSES.length && (
            <p className="mt-3 text-[10px] leading-5 text-[#817a87]">
              Course welcome videos are still to come for{" "}
              {COURSES.filter((course: Course) => !coursesWithVideo.includes(course.slug))
                .slice(0, 4)
                .map((course) => course.shortTitle)
                .join(", ")}
              {COURSES.length - covered > 4 ? ` and ${COURSES.length - covered - 4} more` : ""}.
            </p>
          )}
        </>
      )}
    </section>
  );
}
