"use client";

import { useEffect, useRef, useState } from "react";
import type { LessonFile } from "@/lib/courses";
import { clipLength, formatClock, type VideoEdits } from "@/lib/media";
import Icon from "./Icon";

interface Props {
  file: LessonFile;
}

/**
 * Plays an owner-uploaded video, honouring the edits made in the console:
 * the clip starts at the trim start, stops at the trim end, follows the mute
 * setting and shows the captured thumbnail before it plays.
 */
export default function TrimmedVideo({ file }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);

  const edits: VideoEdits = {
    trimStart: file.trimStart ?? 0,
    trimEnd: file.trimEnd ?? null,
    muted: file.muted ?? false,
  };
  const trimmed = edits.trimStart > 0.05 || (edits.trimEnd !== null && edits.trimEnd < duration - 0.05);
  const keep = duration ? clipLength(edits, duration) : 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function onLoaded() {
      if (!video) return;
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      if (edits.trimStart > 0) video.currentTime = edits.trimStart;
    }
    function onTimeUpdate() {
      if (!video) return;
      const end = edits.trimEnd ?? video.duration;
      if (Number.isFinite(end) && video.currentTime >= end - 0.04) {
        video.pause();
        video.currentTime = edits.trimStart;
      }
    }
    function onPlay() {
      if (!video) return;
      const end = edits.trimEnd ?? video.duration;
      if (video.currentTime < edits.trimStart - 0.05 || (Number.isFinite(end) && video.currentTime >= end - 0.05)) {
        video.currentTime = edits.trimStart;
      }
    }
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    if (video.readyState >= 1) onLoaded();
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits.trimStart, edits.trimEnd]);

  return (
    <div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        controls
        preload="metadata"
        playsInline
        muted={edits.muted}
        poster={file.poster ?? undefined}
        className="aspect-video w-full bg-black"
        src={file.href}
      >
        Your browser cannot play this video. Use the download button above.
      </video>
      {(trimmed || edits.muted) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[#eeebf0] bg-[#faf9fb] px-4 py-2.5 text-[9px] font-semibold text-[#7d7683]">
          {trimmed && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0ecff] px-2.5 py-1 font-black uppercase tracking-wide text-[#5e3de0]"><Icon name="spark" size={10} /> Edited clip</span>}
          {trimmed && duration > 0 && <span>{formatClock(edits.trimStart)} → {formatClock(edits.trimEnd ?? duration)} ({formatClock(keep)} shown)</span>}
          {edits.muted && <span className="inline-flex items-center gap-1.5"><Icon name="close" size={10} /> Plays muted</span>}
        </div>
      )}
    </div>
  );
}
