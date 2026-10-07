"use client";

import { useRef, useState } from "react";
import Icon from "./Icon";

interface Props {
  src: string;
  poster?: string | null;
  title: string;
  /** Length of the clip, so the player can show progress without loading it. */
  durationSeconds?: number;
  /** Chapter marks, in seconds from the start of the clip. */
  chapters?: { label: string; start: number }[];
  className?: string;
}

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * A video player with the site's own controls.
 *
 * The browser's default controls are hidden because they cannot be styled, and
 * a chapter list — "Introduction, The idea, Worked example, Your turn, Up next"
 * — is the useful thing a student can scrub to. Clicking a chapter seeks the
 * clip and starts it, which is what makes a two-minute lesson feel navigable
 * rather than something to sit through.
 */
export default function CoverVideo({ src, poster, title, durationSeconds, chapters = [], className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  function seekAndPlay(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    void video.play().catch(() => setPlaying(false));
  }

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }

  const total = duration || durationSeconds || 0;

  return (
    <div className={`overflow-hidden rounded-[20px] border border-[#e6e2e9] bg-[#0f0d13] ${className}`}>
      <div className="relative">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black"
          src={src}
          poster={poster ?? undefined}
          preload="metadata"
          playsInline
          muted={muted}
          onClick={toggle}
          onPlay={() => {
            setPlaying(true);
            setStarted(true);
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(100);
          }}
          onLoadedMetadata={(event) => {
            const value = event.currentTarget.duration;
            if (Number.isFinite(value) && value > 0) setDuration(value);
          }}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            setElapsed(video.currentTime);
            if (video.duration) setProgress(Math.min(100, (video.currentTime / video.duration) * 100));
          }}
          onError={() => setFailed("This video could not be loaded. Reload the page, or use the download button.")}
        />
        {!started && !failed && (
          <button
            type="button"
            onClick={toggle}
            aria-label={`Play ${title}`}
            className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/55 via-black/10 to-transparent transition hover:from-black/60"
          >
            <span className="grid size-16 place-items-center rounded-full bg-white/95 text-[#17151f] shadow-xl transition hover:scale-105">
              <Icon name="play" size={22} />
            </span>
          </button>
        )}
      </div>

      {failed ? (
        <p className="border-t border-white/10 px-4 py-3 text-[11px] font-semibold text-[#ffb4a2]">{failed}</p>
      ) : (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#17151f] transition hover:bg-[#e9e5f2]"
            >
              <Icon name={playing ? "pause" : "play"} size={14} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={0.2}
              value={progress}
              aria-label="Seek"
              onChange={(event) => {
                const video = videoRef.current;
                if (!video || !video.duration) return;
                const value = Number(event.target.value);
                setProgress(value);
                video.currentTime = (value / 100) * video.duration;
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#6d4aff]"
            />
            <span className="shrink-0 font-mono text-[10px] text-[#b9b3c2]">
              {clock(elapsed)} / {clock(total)}
            </span>
            <button
              type="button"
              onClick={() => {
                const video = videoRef.current;
                if (!video) return;
                video.muted = !video.muted;
                setMuted(video.muted);
              }}
              aria-label={muted ? "Unmute" : "Mute"}
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/15 text-[#d9d2e1] transition hover:border-white/35"
            >
              <Icon name={muted ? "volume-off" : "volume"} size={14} />
            </button>
            <a
              href={`${src}?download=1`}
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/15 text-[#d9d2e1] transition hover:border-white/35"
              aria-label="Download this video"
            >
              <Icon name="download" size={13} />
            </a>
          </div>

          {chapters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chapters.map((chapter) => {
                const active = elapsed >= chapter.start && elapsed < chapter.start + 25;
                return (
                  <button
                    key={`${chapter.label}-${chapter.start}`}
                    type="button"
                    onClick={() => seekAndPlay(chapter.start)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
                      active
                        ? "border-[#6d4aff] bg-[#6d4aff]/20 text-white"
                        : "border-white/15 text-[#b9b3c2] hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {clock(chapter.start)} · {chapter.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
