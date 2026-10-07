"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { greeting, type AgentLink } from "@/lib/natthesisa";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  links?: AgentLink[];
}

interface PendingQuiz {
  id: string;
  answer: string;
}

interface ChatResponse {
  ok: boolean;
  reply?: string;
  suggestions?: string[];
  links?: AgentLink[];
  quiz?: { id: string; answer: string; explanation: string } | null;
  userName?: string;
  error?: string;
}

const STORAGE_KEY = "natthesisa-chat-v1";
const MAX_STORED = 60;

let counter = 0;
function uid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

function chatContext(): { courseId?: string; lessonId?: string; url?: string } {
  if (typeof window === "undefined") return {};
  const url = window.location.pathname;
  const parts = url.split("/").filter(Boolean);
  // /courses/<slug> · /learn/<courseId>/<lessonId>
  if (parts[0] === "courses" && parts[1]) return { courseId: parts[1], url };
  if (parts[0] === "learn" && parts[1]) {
    return { courseId: parts[1], lessonId: parts[2], url };
  }
  return { url };
}

/* ------------------------------------------------------------------ */
/* Markdown-lite renderer (bold, code, lists, line breaks)              */
/* ------------------------------------------------------------------ */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${keyPrefix}-${index}`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(
        <code
          key={`${keyPrefix}-${index}`}
          className="rounded-md bg-[#efeaff] px-1.5 py-0.5 font-mono text-[11px] text-[#4c2fd6]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
    index += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MessageBody({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  // Split out fenced code blocks first.
  const segments = content.split(/```(\w*)\n?([\s\S]*?)```/g);
  let key = 0;
  for (let i = 0; i < segments.length; i += 3) {
    const prose = segments[i];
    const language = segments[i + 1];
    const code = segments[i + 2];

    if (prose.trim()) {
      const lines = prose.split("\n");
      let listItems: string[] = [];
      let ordered = false;
      const flushList = () => {
        if (!listItems.length) return;
        const items = listItems;
        listItems = [];
        blocks.push(
          ordered ? (
            <ol key={key++} className="mt-1.5 list-decimal space-y-1 pl-5 text-[13px] leading-6">
              {items.map((item, index) => (
                <li key={index}>{renderInline(item, `ol-${key}-${index}`)}</li>
              ))}
            </ol>
          ) : (
            <ul key={key++} className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] leading-6">
              {items.map((item, index) => (
                <li key={index}>{renderInline(item, `ul-${key}-${index}`)}</li>
              ))}
            </ul>
          )
        );
      };
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          flushList();
          continue;
        }
        if (trimmed === "---") {
          flushList();
          blocks.push(<hr key={key++} className="my-2.5 border-[#e7e2ee]" />);
          continue;
        }
        const unordered = trimmed.match(/^[-•]\s+(.*)$/);
        const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
        if (unordered || numbered) {
          ordered = Boolean(numbered) && !unordered;
          listItems.push((unordered?.[1] ?? numbered?.[1] ?? "").trim());
          continue;
        }
        flushList();
        if (trimmed.startsWith("### ")) {
          blocks.push(
            <p key={key++} className="mt-2 text-[13px] font-extrabold">
              {renderInline(trimmed.slice(4), `h-${key}`)}
            </p>
          );
        } else {
          blocks.push(
            <p key={key++} className="mt-1.5 text-[13px] leading-6 first:mt-0">
              {renderInline(trimmed, `p-${key}`)}
            </p>
          );
        }
      }
      flushList();
    }

    if (code !== undefined) {
      blocks.push(
        <div key={key++} className="mt-2 overflow-hidden rounded-xl border border-[#232030] bg-[#1c1923]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a79fb3]">
              {language || "code"}
            </span>
            <span className="code-dots opacity-60" />
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-6 text-[#d9d3e4]">
            <code>{code.replace(/\n$/, "")}</code>
          </pre>
        </div>
      );
    }
  }
  return <div>{blocks}</div>;
}

/* ------------------------------------------------------------------ */
/* The chat panel — shared by the floating widget and the full page     */
/* ------------------------------------------------------------------ */

interface Props {
  variant?: "widget" | "page";
  onClose?: () => void;
}

export default function NatthesisaChat({ variant = "widget", onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [quiz, setQuiz] = useState<PendingQuiz | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const seeded = useRef(false);

  // Seed: restore history, or greet.
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as { messages?: Message[]; suggestions?: string[] };
        if (Array.isArray(stored.messages) && stored.messages.length) {
          setMessages(stored.messages.slice(-MAX_STORED));
          setSuggestions(stored.suggestions ?? []);
          return;
        }
      }
    } catch {
      // Corrupt storage: fall through to a fresh greeting.
    }
    const hello = greeting();
    setMessages([{ id: uid(), role: "assistant", content: hello.reply, links: hello.links }]);
    setSuggestions(hello.suggestions);
  }, []);

  // Persist + autoscroll.
  useEffect(() => {
    if (!messages.length) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: messages.slice(-MAX_STORED), suggestions })
      );
    } catch {
      // Private browsing — chat still works, it just isn't remembered.
    }
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, suggestions]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending) return;
      const userMessage: Message = { id: uid(), role: "user", content: content.slice(0, 2000) };
      const next = [...messages, userMessage];
      setMessages(next);
      setSuggestions([]);
      setInput("");
      setSending(true);
      try {
        const response = await fetch("/api/natthesisa", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: next.slice(-20).map((message) => ({ role: message.role, content: message.content })),
            context: chatContext(),
            quiz,
          }),
        });
        const payload = (await response.json()) as ChatResponse;
        if (!payload.ok || !payload.reply) throw new Error(payload.error || "empty reply");
        setMessages((current) => [
          ...current,
          { id: uid(), role: "assistant", content: payload.reply as string, links: payload.links ?? [] },
        ]);
        setSuggestions(payload.suggestions ?? []);
        setQuiz(payload.quiz ? { id: payload.quiz.id, answer: payload.quiz.answer } : null);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: uid(),
            role: "assistant",
            content:
              "Hmm, that message didn't go through — check your connection and try again. I'm still here. 💜",
          },
        ]);
        setSuggestions(["Try again", "Show me the courses"]);
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    },
    [messages, quiz, sending]
  );

  function clearChat() {
    const hello = greeting();
    setMessages([{ id: uid(), role: "assistant", content: hello.reply, links: hello.links }]);
    setSuggestions(hello.suggestions);
    setQuiz(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }

  const isPage = variant === "page";

  return (
    <div
      className={
        isPage
          ? "flex h-full min-h-[70vh] flex-col overflow-hidden rounded-[24px] border border-[#e2ddE9] bg-white shadow-[0_24px_70px_rgba(36,28,61,.14)]"
          : "flex h-full flex-col overflow-hidden"
      }
      role="dialog"
      aria-label="Chat with Natthesisa"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-black/[.06] bg-gradient-to-r from-[#1c1923] to-[#2b2450] px-4 py-3 text-white">
        <span className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#8b6bff] to-[#6d4aff] font-black">
          N
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#2b2450] bg-emerald-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-black tracking-tight">
            Natthesisa
            <span className="rounded-full bg-[#6d4aff] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
              AI
            </span>
          </p>
          <p className="truncate text-[11px] text-white/60">
            {sending ? "Thinking…" : "Online · your study companion"}
          </p>
        </div>
        <button
          type="button"
          onClick={clearChat}
          title="Start a fresh chat"
          className="grid size-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <Icon name="plus" size={16} />
        </button>
        {!isPage && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="grid size-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <Icon name="close" size={16} />
          </button>
        )}
        {isPage && (
          <Link
            href="/dashboard"
            className="hidden rounded-lg bg-white/10 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/20 sm:block"
          >
            Back to dashboard
          </Link>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="dashboard-scroll flex-1 space-y-4 overflow-y-auto bg-[#faf9fc] px-4 py-5">
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#6d4aff] px-3.5 py-2.5 text-[13px] leading-6 text-white shadow-[0_8px_20px_rgba(109,74,255,.25)]">
                {message.content}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#8b6bff] to-[#6d4aff] text-[11px] font-black text-white">
                N
              </span>
              <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-[#ece8f1] bg-white px-3.5 py-3 text-[#35313d] shadow-[0_4px_14px_rgba(36,28,61,.06)]">
                <MessageBody content={message.content} />
                {message.links && message.links.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[#f0edf4] pt-2.5">
                    {message.links.map((link) => (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        className="inline-flex items-center gap-1 rounded-full bg-[#f3efff] px-2.5 py-1.5 text-[11px] font-bold text-[#5c3be4] transition hover:bg-[#6d4aff] hover:text-white"
                      >
                        {link.label}
                        <Icon name="arrow-right" size={11} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {sending && (
          <div className="flex gap-2.5">
            <span className="grid size-7 shrink-0 animate-pulse place-items-center rounded-lg bg-gradient-to-br from-[#8b6bff] to-[#6d4aff] text-[11px] font-black text-white">
              N
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-[#ece8f1] bg-white px-4 py-3.5">
              <span className="nat-think-dot" />
              <span className="nat-think-dot" />
              <span className="nat-think-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !sending && (
        <div className="dashboard-scroll flex gap-1.5 overflow-x-auto border-t border-black/[.05] bg-white px-3.5 py-2.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              className="shrink-0 rounded-full border border-[#ddd5f5] bg-[#faf8ff] px-3 py-1.5 text-[11px] font-bold text-[#5c3be4] transition hover:border-[#6d4aff] hover:bg-[#6d4aff] hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className="border-t border-black/[.06] bg-white p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-[#ddd9e2] bg-[#faf9fc] p-1.5 pl-3.5 transition focus-within:border-[#6d4aff] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(109,74,255,.12)]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask Natthesisa anything…"
            rows={1}
            maxLength={2000}
            aria-label="Message Natthesisa"
            className="max-h-28 flex-1 resize-none bg-transparent py-2 text-[13px] leading-5 text-[#2b2733] placeholder:text-[#a49dab] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send message"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#6d4aff] text-white shadow-[0_6px_16px_rgba(109,74,255,.35)] transition hover:bg-[#5e3ce8] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[#a49dab]">
          Natthesisa can make mistakes — verify important details in your lessons.
        </p>
      </form>
    </div>
  );
}
