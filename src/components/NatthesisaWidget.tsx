"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import NatthesisaChat from "./NatthesisaChat";

const SEEN_KEY = "natthesisa-seen-v1";

/**
 * The floating Natthesisa assistant — mounted once in the root layout so it
 * follows the student everywhere. Hidden on the full-page /natthesisa view
 * (which renders the same chat large) and in print.
 */
export default function NatthesisaWidget() {
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SEEN_KEY) !== "1") {
        const timer = window.setTimeout(() => setUnseen(true), 2500);
        return () => window.clearTimeout(timer);
      }
    } catch {
      setUnseen(true);
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onLessonHelp = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: unknown }>).detail;
      setInitialPrompt(typeof detail?.prompt === "string" ? detail.prompt : null);
      setOpen(true);
      setUnseen(false);
      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Ignore — the nudge simply reappears next visit.
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("natthesisa:open", onLessonHelp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("natthesisa:open", onLessonHelp);
    };
  }, []);

  // The dedicated page renders the chat full-size — the bubble would double up.
  if (pathname === "/natthesisa") return null;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setUnseen(false);
      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Ignore — the nudge simply reappears next visit.
      }
    }
  }

  return (
    <div className="print:hidden">
      {/* Chat panel */}
      {open && (
        <div className="nat-panel-in fixed bottom-24 right-4 z-[60] h-[min(600px,calc(100dvh-7rem))] w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-[#e2dde9] bg-white shadow-[0_30px_80px_rgba(36,28,61,.30)] sm:bottom-24 sm:right-6">
          <NatthesisaChat
            variant="widget"
            onClose={() => setOpen(false)}
            initialPrompt={initialPrompt}
            onInitialPromptConsumed={() => setInitialPrompt(null)}
          />
        </div>
      )}

      {/* Nudge bubble */}
      {!open && unseen && (
        <button
          type="button"
          onClick={toggle}
          className="nat-panel-in fixed bottom-24 right-4 z-[60] max-w-[240px] rounded-2xl rounded-br-md border border-[#e2dde9] bg-white p-3 text-left shadow-[0_16px_40px_rgba(36,28,61,.20)] transition hover:-translate-y-0.5 sm:right-6"
        >
          <span className="flex items-start gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#8b6bff] to-[#6d4aff] text-[11px] font-black text-white">
              N
            </span>
            <span className="text-[12px] font-semibold leading-5 text-[#35313d]">
              Hi, I'm <strong>Natthesisa</strong> — stuck on anything? Ask me! 👋
            </span>
          </span>
        </button>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Close Natthesisa chat" : "Open Natthesisa chat"}
        className={`fixed bottom-5 right-4 z-[60] flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-4 text-sm font-black text-white shadow-[0_16px_40px_rgba(109,74,255,.45)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(109,74,255,.55)] active:translate-y-0 sm:bottom-6 sm:right-6 ${
          open ? "bg-[#1c1923]" : "animate-pulse-ring bg-gradient-to-r from-[#6d4aff] to-[#8b5cf6]"
        }`}
      >
        <span className="grid size-8 place-items-center rounded-full bg-white/20">
          <Icon name={open ? "close" : "spark"} size={open ? 15 : 17} />
        </span>
        {open ? "Close" : "Ask Natthesisa"}
        {!open && unseen && (
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ff7448] text-[10px] font-black text-white">
            1
          </span>
        )}
      </button>
    </div>
  );
}
