import { getCourse } from "@/lib/courses";
import type { Lesson } from "@/lib/courses";
import { lessonVideoFile } from "@/lib/lesson-videos";
import { lessonVideoAvailability } from "@/lib/video-availability";
import CoverVideo from "./CoverVideo";
import Icon from "./Icon";
import LessonActions from "./LessonActions";

interface Props {
  lesson: Lesson;
  courseId: string;
  /** Whether this lesson is already marked complete, so the button matches. */
  complete: boolean;
  nextHref: string;
  nextLabel: string;
  suspended?: boolean;
  /** False for a signed-out reader: the video stays, the progress button does not. */
  track?: boolean;
}

function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;
  return remainingSeconds ? `${minutes} min ${remainingSeconds} sec` : `${minutes} min`;
}

/**
 * The video a lesson opens with: the walkthrough, right under the title.
 *
 * A student lands on a lesson, presses play, and a couple of minutes later
 * knows what the lesson is about, has seen the worked example and has the practice task in
 * front of them. The "mark complete" control sits with the clip rather than
 * only at the foot of the page, because that is the moment the student is ready
 * to move on — and the same button is at the bottom for anyone who reads first.
 */
export default async function LessonVideoGuide({ lesson, courseId, complete, nextHref, nextLabel, suspended, track = true }: Props) {
  // The manifest alone is not enough to promise a player: the bytes live in a
  // storage that does not travel with a deploy, so a video can be listed but
  // unplayable. Only render the player when the file is really there; anything
  // else falls back to the written lesson, which is always complete.
  const availability = await lessonVideoAvailability(lesson.id);
  const entry = availability?.entry ?? null;
  const playable = availability?.video === true;
  const unreachable = availability?.unreachable === true;
  const video = entry && playable ? lessonVideoFile(entry) : null;
  const course = entry ? getCourse(entry.courseId) : undefined;

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#6d4aff]">
          {video ? "Watch the walkthrough" : unreachable ? "Video unavailable right now" : "No video yet"}
        </p>
        {video && entry && (
          <span className="rounded-full bg-[#f0ecff] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[#5e3de0]">
            {entry.durationSeconds >= 120 && entry.durationSeconds <= 180
              ? "2–3 min video"
              : `${Math.max(1, Math.round(entry.durationSeconds / 60))} min video`}
          </span>
        )}
      </div>

      {video && entry ? (
        <>
          <h2 className="mt-2 text-lg font-black tracking-[-.03em]">
            {lesson.title} in {formatDuration(entry.durationSeconds)}, start to finish
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-[#817a87]">
            How this lesson works, the worked example, and the practice task — narrated{course ? ` for ${course.shortTitle}` : ""}.
          </p>
          <CoverVideo
            className="mt-4"
            src={video.href}
            poster={availability?.poster ? (video.poster ?? undefined) : undefined}
            title={lesson.title}
            durationSeconds={entry.durationSeconds}
            chapters={entry.chapters}
          />
        </>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[18px] border border-dashed border-[#ded9e3] bg-white/70 px-4 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f3f1f6] text-[#8a8394]">
            <Icon name="video" size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-[#4a4450]">
              {unreachable
                ? "The walkthrough video could not be reached just now."
                : "This lesson has no walkthrough video yet."}
            </p>
            <p className="mt-0.5 text-[10px] leading-4 text-[#918a97]">
              {unreachable
                ? "Reload the page to try again — the written lesson below is complete either way."
                : "The written lesson below is complete — read it, work through the example, then take on the challenge."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <a
          href="#practice"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ddd8e2] bg-white px-5 py-3.5 text-sm font-bold text-[#5e5864] transition hover:border-violet-300"
        >
          <Icon name="terminal" size={16} /> Jump to the practice task
        </a>
        {track ? (
          <LessonActions
            courseId={courseId}
            lessonId={lesson.id}
            initiallyComplete={complete}
            nextHref={nextHref}
            nextLabel={nextLabel}
            suspended={suspended}
          />
        ) : (
          <a href={nextHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3.5 text-sm font-extrabold text-white">
            {nextLabel} <Icon name="arrow-right" size={16} />
          </a>
        )}
      </div>
    </section>
  );
}
