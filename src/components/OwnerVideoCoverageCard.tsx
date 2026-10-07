import type { Course } from "@/lib/courses";
import { COURSES } from "@/lib/courses";
import { courseVideoCount } from "@/lib/course-videos";
import { lessonVideoCount } from "@/lib/lesson-videos";
import Icon from "./Icon";
import RefreshStorageButton from "./RefreshStorageButton";

interface Props {
  /** Slugs of the courses that have a welcome video. */
  coursesWithVideo: string[];
  /** Course ids that still have lessons waiting for a walkthrough. */
  coursesWithGaps: { courseId: string; shortTitle: string; missing: number }[];
  /**
   * Whether the bytes behind the manifest entries are in this deployment's
   * storage. Absent on callers that only know the manifest.
   */
  storageStatus?: {
    unreachable: boolean;
    /** Why storage could not be answered, when it could not. */
    failure?: string | null;
    /** The fix for that reason, in plain language. */
    hint?: string | null;
    missingVideos: number;
    missingPosters: number;
    missingWelcomes: number;
    sizeMismatches: number;
  };
}

/**
 * How much of the library has a video.
 *
 * The videos are generated, not uploaded, so the teacher cannot see progress in
 * the lesson manager — and a course half-covered looks exactly like a course
 * that is finished. This panel counts what is left and names the command that
 * renders it.
 */
export default function OwnerVideoCoverageCard({ coursesWithVideo, coursesWithGaps, storageStatus }: Props) {
  const lessons = COURSES.reduce((sum, course) => sum + course.modules.reduce((count, module) => count + module.lessons.length, 0), 0);
  const missingTotal = coursesWithGaps.reduce((sum, item) => sum + item.missing, 0);
  const withVideo = lessons - missingTotal;
  const covered = coursesWithVideo.length;
  const storageMissing = (storageStatus?.missingVideos ?? 0) + (storageStatus?.missingWelcomes ?? 0);
  const storageUnknown = storageStatus?.unreachable ?? false;
  const storageHint = storageStatus?.hint ?? null;
  // "Complete" means students can actually press play: listed in the manifest
  // *and* present in this deployment's storage.
  const complete = missingTotal === 0 && covered === COURSES.length && storageMissing === 0;
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

      {storageMissing > 0 && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-[10px] font-extrabold text-red-700">
            {storageMissing} video{storageMissing === 1 ? " file is" : " files are"} missing from this
            deployment&apos;s storage
          </p>
          <p className="mt-1 text-[10px] leading-5 text-red-600/90">
            The video list names them, but the bytes never reached storage, so those lessons show the written
            material only. Run{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[9px]">npm run videos:verify</code> for
            the full list, then rebuild with this deployment&apos;s storage variables set — or, without a terminal,
            run the <strong>Lesson videos</strong> workflow (Actions → Lesson videos → Run workflow), which renders
            every video and uploads it to this bucket.
          </p>
        </div>
      )}

      {storageUnknown && storageMissing === 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] leading-5 text-amber-800">
          <p>
            <span className="block font-extrabold">
              Video storage could not be reached, so these counts come from the video list only.
            </span>
            <span className="block">
              Students see “Video unavailable right now” on every lesson until this is fixed — the written lesson
              still reads in full.
            </span>
          </p>
          {storageHint && (
            <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-[10px] leading-5 text-amber-900">
              <span className="block font-extrabold">What to do</span>
              {storageHint}
            </p>
          )}
          <p className="mt-2 text-[9px] text-amber-700/90">
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[9px]">/api/health</code> reports the
            same finding as JSON, straight from this deployment.
          </p>
          <RefreshStorageButton />
        </div>
      )}

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
