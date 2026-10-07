"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { speechChunks } from "@/lib/speech-text";

/**
 * Reads the lesson aloud with the device's own voice.
 *
 * Passages are the elements marked `data-speech` inside `#lesson-article`.
 * The voice and the highlight are the same element, so a learner can follow
 * the textbook with their eyes while they listen. Nothing is uploaded: speech
 * stays on the device, which is why it works for every lesson, including ones
 * an instructor publishes later.
 */

type Status = "idle" | "playing" | "paused";

type Cue = {
  el: HTMLElement;
  label: string;
  text: string;
  codeText?: string;
  kind: string;
};

type Cursor = {
  index: number;
  total: number;
  label: string;
  text: string;
};

const STORAGE_KEY = "cmg-narrator";
const RATES = [0.85, 1, 1.15, 1.3, 1.5, 1.75];

function collectCues(title: string): Cue[] {
  const root = document.getElementById("lesson-article");
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>("[data-speech]")].flatMap((el) => {
    const text = el.getAttribute("data-speech")?.replace(/\s+/g, " ").trim() ?? "";
    if (!text) return [];
    return [
      {
        el,
        label: el.getAttribute("data-speech-label") || title,
        text,
        codeText: el.getAttribute("data-speech-code") || undefined,
        kind: el.getAttribute("data-speech-kind") || "text",
      },
    ];
  });
}

function preferredVoice(voices: SpeechSynthesisVoice[], saved: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const remembered = voices.find((voice) => voice.name === saved);
  if (remembered) return remembered;
  const ranked = [...voices].sort((a, b) => score(b) - score(a));
  return ranked[0] ?? null;
}

function score(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let value = 0;
  if (lang.startsWith("en-gb")) value += 5;
  else if (lang.startsWith("en")) value += 3;
  if (name.includes("natural") || name.includes("premium") || name.includes("enhanced")) value += 4;
  if (name.includes("google") || name.includes("microsoft")) value += 2;
  if (voice.localService) value += 1;
  return value;
}

export default function LessonNarrator({ title, words }: { title: string; words: number }) {
  const listenMinutes = Math.max(1, Math.round(words / 150));
  const [status, setStatus] = useState<Status>("idle");
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [showText, setShowText] = useState(false);
  const [cues, setCues] = useState<Cue[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1);
  const [follow, setFollow] = useState(true);
  const [readCode, setReadCode] = useState(false);
  const [readHints, setReadHints] = useState(false);

  const statusRef = useRef<Status>("idle");
  const rateRef = useRef(1);
  const followRef = useRef(true);
  const readCodeRef = useRef(false);
  const hintsRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const cuesRef = useRef<Cue[]>([]);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const chunkRef = useRef(0);
  const tokenRef = useRef(0);
  const expectingRef = useRef(false);
  const startedAtRef = useRef(0);
  const retriesRef = useRef(0);
  const unlockedRef = useRef(false);
  const showTextRef = useRef(false);
  const speakRef = useRef<() => void>(() => {});

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);
  useEffect(() => {
    followRef.current = follow;
  }, [follow]);
  useEffect(() => {
    readCodeRef.current = readCode;
  }, [readCode]);
  useEffect(() => {
    hintsRef.current = readHints;
  }, [readHints]);
  useEffect(() => {
    showTextRef.current = showText;
  }, [showText]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as {
        rate?: number;
        voice?: string;
        follow?: boolean;
        readCode?: boolean;
        readHints?: boolean;
      };
      if (typeof saved.rate === "number" && RATES.includes(saved.rate)) {
        setRate(saved.rate);
        rateRef.current = saved.rate;
      }
      if (typeof saved.voice === "string") setVoiceName(saved.voice);
      if (typeof saved.follow === "boolean") {
        setFollow(saved.follow);
        followRef.current = saved.follow;
      }
      if (typeof saved.readCode === "boolean") {
        setReadCode(saved.readCode);
        readCodeRef.current = saved.readCode;
      }
      if (typeof saved.readHints === "boolean") {
        setReadHints(saved.readHints);
        hintsRef.current = saved.readHints;
      }
    } catch {
      /* a corrupt preference should not stop the lesson from being read */
    }

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      const english = all.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
      const list = english.length ? english : all;
      setVoices(list);
      const saved = (() => {
        try {
          return (JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as { voice?: string }).voice ?? "";
        } catch {
          return "";
        }
      })();
      const chosen = preferredVoice(list, voiceRef.current?.name || saved);
      if (chosen && !voiceRef.current) {
        voiceRef.current = chosen;
        setVoiceName(chosen.name);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
      clearHighlight();
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (statusRef.current !== "playing" || !expectingRef.current) return;
      const synth = window.speechSynthesis;
      if (synth.speaking || synth.pending) return;
      if (Date.now() - startedAtRef.current < 1400) return;
      retriesRef.current += 1;
      if (retriesRef.current > 2) {
        retriesRef.current = 0;
        chunkRef.current += 1;
      }
      speakRef.current();
    }, 1600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (status === "idle") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status]);

  function persist(next: { rate?: number; voice?: string; follow?: boolean; readCode?: boolean; readHints?: boolean }) {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, unknown>;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }));
    } catch {
      /* private mode */
    }
  }

  function refreshCues(): Cue[] {
    const next = collectCues(title);
    cuesRef.current = next;
    setCues(next);
    return next;
  }

  function skipped(cue: Cue): boolean {
    return cue.kind === "hint" && !hintsRef.current;
  }

  function cueText(cue: Cue): string {
    if (cue.kind === "code" && readCodeRef.current && cue.codeText) return cue.codeText;
    return cue.text;
  }

  function prepareChunks() {
    const cue = cuesRef.current[indexRef.current];
    chunksRef.current = cue && !skipped(cue) ? speechChunks(cueText(cue)) : [];
  }

  function seekSpeakable(from: number, direction: 1 | -1): number {
    let index = from;
    while (index >= 0 && index < cuesRef.current.length && skipped(cuesRef.current[index])) {
      index += direction;
    }
    return index;
  }

  speakRef.current = () => {
    const synth = window.speechSynthesis;
    if (statusRef.current !== "playing") return;
    let index = indexRef.current;
    if (index < 0 || index >= cuesRef.current.length || skipped(cuesRef.current[index])) {
      index = seekSpeakable(Math.max(index, 0), 1);
      indexRef.current = index;
      chunkRef.current = 0;
      chunksRef.current = [];
    }
    const cue = cuesRef.current[index];
    if (!cue) {
      finishReading();
      return;
    }
    if (!chunksRef.current.length) prepareChunks();
    if (chunkRef.current >= chunksRef.current.length) {
      const next = seekSpeakable(index + 1, 1);
      indexRef.current = next;
      chunkRef.current = 0;
      chunksRef.current = [];
      speakRef.current();
      return;
    }
    const mine = ++tokenRef.current;
    const utterance = new SpeechSynthesisUtterance(chunksRef.current[chunkRef.current]);
    utterance.rate = rateRef.current;
    utterance.lang = voiceRef.current?.lang || "en-GB";
    if (voiceRef.current) utterance.voice = voiceRef.current;
    highlight(cue, index, followRef.current);
    setCursor({
      index,
      total: cuesRef.current.length,
      label: cue.label,
      text: chunksRef.current[chunkRef.current],
    });
    startedAtRef.current = Date.now();
    expectingRef.current = true;
    utterance.onend = () => {
      if (mine !== tokenRef.current) return;
      expectingRef.current = false;
      retriesRef.current = 0;
      if (statusRef.current !== "playing") return;
      chunkRef.current += 1;
      speakRef.current();
    };
    utterance.onerror = (event) => {
      if (mine !== tokenRef.current) return;
      expectingRef.current = false;
      if (event.error === "interrupted" || event.error === "canceled") return;
      setError("This browser blocked read-aloud. Try Chrome, Edge or Safari, and allow the tab to play sound.");
      statusRef.current = "paused";
      setStatus("paused");
    };
    synth.speak(utterance);
  };

  function start(at = 0) {
    setError("");
    const list = refreshCues();
    if (!list.length) {
      setError("This lesson has no text to read yet.");
      return;
    }
    const index = seekSpeakable(Math.min(Math.max(at, 0), list.length - 1), 1);
    if (index >= list.length) {
      setError("Nothing left to read with the current settings.");
      return;
    }
    indexRef.current = index;
    chunkRef.current = 0;
    chunksRef.current = [];
    retriesRef.current = 0;
    statusRef.current = "playing";
    setStatus("playing");
    const synth = window.speechSynthesis;
    if (!unlockedRef.current) {
      unlockedRef.current = true;
      speakRef.current();
      return;
    }
    synth.cancel();
    window.setTimeout(() => {
      if (statusRef.current === "playing") speakRef.current();
    }, 60);
  }

  function pause() {
    statusRef.current = "paused";
    setStatus("paused");
    expectingRef.current = false;
    tokenRef.current += 1;
    window.speechSynthesis.cancel();
  }

  function resume() {
    setError("");
    statusRef.current = "playing";
    setStatus("playing");
    speakRef.current();
  }

  function stop() {
    statusRef.current = "idle";
    setStatus("idle");
    expectingRef.current = false;
    tokenRef.current += 1;
    indexRef.current = 0;
    chunkRef.current = 0;
    chunksRef.current = [];
    window.speechSynthesis?.cancel();
    clearHighlight();
    setCursor(null);
  }

  function skip(direction: 1 | -1) {
    if (!cuesRef.current.length) refreshCues();
    const next = seekSpeakable(indexRef.current + direction, direction);
    if (next < 0 || next >= cuesRef.current.length) return;
    indexRef.current = next;
    chunkRef.current = 0;
    chunksRef.current = [];
    if (statusRef.current === "playing") {
      tokenRef.current += 1;
      window.speechSynthesis.cancel();
      window.setTimeout(() => {
        if (statusRef.current === "playing") speakRef.current();
      }, 60);
      return;
    }
    const cue = cuesRef.current[next];
    highlight(cue, next, followRef.current);
    setCursor({ index: next, total: cuesRef.current.length, label: cue.label, text: cueText(cue) });
  }

  function finishReading() {
    statusRef.current = "idle";
    setStatus("idle");
    expectingRef.current = false;
    tokenRef.current += 1;
    window.speechSynthesis?.cancel();
    clearHighlight();
    setCursor(null);
  }

  function togglePlay() {
    if (!supported) return;
    if (statusRef.current === "playing") pause();
    else if (statusRef.current === "paused") resume();
    else start(0);
  }

  function openSpeechText() {
    refreshCues();
    setShowText((open) => !open);
  }

  function jumpTo(index: number) {
    if (statusRef.current === "idle") start(index);
    else {
      statusRef.current = "playing";
      setStatus("playing");
      indexRef.current = index;
      chunkRef.current = 0;
      chunksRef.current = [];
      tokenRef.current += 1;
      window.speechSynthesis.cancel();
      window.setTimeout(() => speakRef.current(), 60);
    }
  }

  function changeRate(next: number) {
    setRate(next);
    rateRef.current = next;
    persist({ rate: next });
    if (statusRef.current === "playing") {
      tokenRef.current += 1;
      window.speechSynthesis.cancel();
      window.setTimeout(() => speakRef.current(), 60);
    }
  }

  function changeVoice(name: string) {
    setVoiceName(name);
    voiceRef.current = voices.find((voice) => voice.name === name) ?? null;
    persist({ voice: name });
    if (statusRef.current === "playing") {
      tokenRef.current += 1;
      window.speechSynthesis.cancel();
      window.setTimeout(() => speakRef.current(), 60);
    }
  }

  const active = status !== "idle";
  const progress = cursor && cursor.total ? Math.round(((cursor.index + 1) / cursor.total) * 100) : 0;

  return (
    <div className="lesson-narrator mt-6 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!supported}
          className="inline-flex min-w-0 items-center gap-3 rounded-2xl border border-[#ddd3f7] bg-white px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(31,25,40,.04)] transition hover:border-[#c9b8ff] hover:bg-[#faf8ff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-white ${status === "playing" ? "bg-[#1b1822]" : "bg-[#6d4aff]"}`}>
            <Icon name={status === "playing" ? "pause" : "play"} size={15} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-extrabold tracking-[-.02em] text-[#241f2b]">
              {status === "playing" ? "Listening to this lesson" : status === "paused" ? "Paused — tap to resume" : "Listen to this lesson"}
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-[#8b8496]">
              {supported
                ? `About ${listenMinutes} min · read aloud on this device`
                : "Read-aloud needs Chrome, Edge or Safari"}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={openSpeechText}
          className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-3 text-[12.5px] font-extrabold transition ${showText ? "border-[#6d4aff] bg-[#f4f1ff] text-[#5032c2]" : "border-[#e4e0e8] bg-white text-[#5c5667] hover:border-[#c9b8ff]"}`}
          aria-expanded={showText}
        >
          <Icon name="book" size={15} />
          Speech text
        </button>
      </div>
      <p className="mt-2.5 max-w-xl text-[12px] leading-5 text-[#918a97]">
        Hear the lesson the way it is written. The passage being read is highlighted, so you can follow with your eyes. Pause, change the speed, or jump to any section.
      </p>
      {error ? <p className="mt-2 text-[12px] font-semibold leading-5 text-[#c2592f]">{error}</p> : null}

      {showText ? (
        <SpeechText
          cues={cues}
          activeIndex={cursor?.index ?? -1}
          onJump={jumpTo}
          readCode={readCode}
          readHints={readHints}
        />
      ) : null}

      {active ? (
        <div
          className="fixed inset-x-3 bottom-3 z-50 mx-auto w-auto max-w-3xl rounded-2xl border border-white/10 bg-[#1b1822] p-3 text-white shadow-[0_18px_50px_rgba(20,16,28,.35)] sm:inset-x-6 sm:p-4"
          role="region"
          aria-label="Lesson audio"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-[#6d4aff] animate-pulse-ring" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-black uppercase tracking-[.14em] text-[#b7a6ff]">
                {status === "paused" ? "Paused" : "Now reading"} · {cursor?.label ?? title}
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-white/85">{cursor?.text}</p>
            </div>
            <button type="button" onClick={stop} className="grid size-8 shrink-0 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Stop and close the player">
              <Icon name="close" size={15} />
            </button>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#6d4aff] transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => skip(-1)} className="grid size-9 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/15" aria-label="Previous passage">
              <Icon name="arrow-left" size={15} />
            </button>
            <button type="button" onClick={togglePlay} className="grid size-10 place-items-center rounded-xl bg-[#6d4aff] text-white transition hover:bg-[#5d3df0]" aria-label={status === "playing" ? "Pause" : "Play"}>
              <Icon name={status === "playing" ? "pause" : "play"} size={16} />
            </button>
            <button type="button" onClick={() => skip(1)} className="grid size-9 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/15" aria-label="Next passage">
              <Icon name="arrow-right" size={15} />
            </button>
            <span className="ml-1 text-[10px] font-bold text-white/50">
              {cursor ? `${cursor.index + 1} / ${cursor.total}` : ""}
            </span>
            <label className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-white/70">
              <span className="sr-only">Speed</span>
              <select
                value={rate}
                onChange={(event) => changeRate(Number(event.target.value))}
                className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
                aria-label="Reading speed"
              >
                {RATES.map((value) => (
                  <option key={value} value={value} className="text-[#1b1822]">
                    {value}×
                  </option>
                ))}
              </select>
            </label>
            {voices.length > 1 ? (
              <select
                value={voiceName}
                onChange={(event) => changeVoice(event.target.value)}
                className="max-w-[9.5rem] truncate rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-bold text-white outline-none"
                aria-label="Voice"
              >
                {voices.map((voice) => (
                  <option key={`${voice.name}-${voice.lang}`} value={voice.name} className="text-[#1b1822]">
                    {voice.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] font-bold text-white/60">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={follow}
                onChange={(event) => {
                  setFollow(event.target.checked);
                  followRef.current = event.target.checked;
                  persist({ follow: event.target.checked });
                }}
                className="size-3.5 accent-[#6d4aff]"
              />
              Follow the text
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={readCode}
                onChange={(event) => {
                  setReadCode(event.target.checked);
                  readCodeRef.current = event.target.checked;
                  persist({ readCode: event.target.checked });
                  chunksRef.current = [];
                }}
                className="size-3.5 accent-[#6d4aff]"
              />
              Also read code
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={readHints}
                onChange={(event) => {
                  setReadHints(event.target.checked);
                  hintsRef.current = event.target.checked;
                  persist({ readHints: event.target.checked });
                }}
                className="size-3.5 accent-[#6d4aff]"
              />
              Read exercise hints
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SpeechText({
  cues,
  activeIndex,
  onJump,
  readCode,
  readHints,
}: {
  cues: Cue[];
  activeIndex: number;
  onJump: (index: number) => void;
  readCode: boolean;
  readHints: boolean;
}) {
  const groups: { label: string; items: { cue: Cue; index: number }[] }[] = [];
  cues.forEach((cue, index) => {
    if (cue.kind === "hint" && !readHints) return;
    const last = groups[groups.length - 1];
    const item = { cue, index };
    if (last && last.label === cue.label) last.items.push(item);
    else groups.push({ label: cue.label, items: [item] });
  });

  if (!groups.length) {
    return (
      <p className="mt-4 rounded-2xl border border-[#e4dfeb] bg-white px-4 py-4 text-[13px] leading-6 text-[#6b6474]">
        The speech text appears once the lesson has loaded. Open this again in a moment.
      </p>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-[#e4dfeb] bg-white" aria-label="Speech text">
      <div className="flex items-center justify-between gap-3 border-b border-[#f0edf4] px-4 py-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#6d4aff]">Speech text</p>
          <p className="mt-1 text-[12px] leading-5 text-[#8b8496]">The words that will be read. Tap a passage to start there.</p>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-[#a19aa7]">{cues.length} passages</span>
      </div>
      <div className="dashboard-scroll max-h-[28rem] overflow-y-auto px-2 py-2">
        {groups.map((group) => (
          <div key={`${group.label}-${group.items[0]?.index}`} className="mb-2">
            <p className="px-2 pb-1 pt-3 text-[9px] font-black uppercase tracking-[.14em] text-[#918a97]">{group.label}</p>
            {group.items.map(({ cue, index }) => {
              const text = cue.kind === "code" && readCode && cue.codeText ? cue.codeText : cue.text;
              const active = index === activeIndex;
              return (
                <button
                  key={index}
                  id={`speech-cue-${index}`}
                  type="button"
                  onClick={() => onJump(index)}
                  className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${active ? "bg-[#f4f1ff]" : "hover:bg-[#faf9fb]"}`}
                >
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${active ? "bg-[#6d4aff] text-white" : "bg-[#f0ecff] text-[#6d4aff]"}`}>
                    <Icon name="play" size={8} />
                  </span>
                  <span className={`text-[13px] leading-6 ${active ? "font-semibold text-[#3a2a7d]" : "text-[#4b4553]"}`}>{text}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function highlight(cue: Cue, index: number, follow: boolean) {
  document.querySelectorAll("#lesson-article [data-speech].is-reading").forEach((node) => node.classList.remove("is-reading"));
  cue.el.classList.add("is-reading");
  const transcript = document.getElementById(`speech-cue-${index}`);
  if (transcript) transcript.scrollIntoView({ block: "nearest" });
  if (!follow) return;
  const rect = cue.el.getBoundingClientRect();
  const visible = rect.top >= 88 && rect.bottom <= window.innerHeight - 170;
  if (visible) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  cue.el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
}

function clearHighlight() {
  document.querySelectorAll("#lesson-article [data-speech].is-reading").forEach((node) => node.classList.remove("is-reading"));
}
