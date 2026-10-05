"use client";

import { useMemo, useState } from "react";
import type { ContactMessage } from "@/lib/messages";
import { MESSAGE_TOPICS } from "@/lib/message-topics";
import { fmtDateTime } from "@/lib/format";
import Icon from "./Icon";

interface Props {
  initialMessages: ContactMessage[];
}

type Filter = "open" | "all" | "answered";

const topicLabel = (id: string) => MESSAGE_TOPICS.find((topic) => topic.id === id)?.label ?? "Something else";

/**
 * The teacher's contact-form inbox. Messages are stored on the platform (see
 * `lib/messages.ts`); replying is done by email, so the useful actions here
 * are marking a message answered and removing the ones that are done with.
 */
export default function OwnerMessages({ initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [filter, setFilter] = useState<Filter>("open");
  const [open, setOpen] = useState<string | null>(initialMessages.find((message) => !message.answered)?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const counts = useMemo(
    () => ({
      open: messages.filter((message) => !message.answered).length,
      answered: messages.filter((message) => message.answered).length,
    }),
    [messages]
  );

  const shown = messages.filter((message) =>
    filter === "all" ? true : filter === "open" ? !message.answered : message.answered
  );

  async function act(id: string, action: "answered" | "unanswered" | "delete") {
    if (busy) return;
    setBusy(id);
    setError("");
    try {
      const response = await fetch("/api/owner/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; messages?: ContactMessage[]; error?: string };
      if (!response.ok || !payload.ok || !payload.messages) {
        setError(payload.error || "That did not work. Please try again.");
        return;
      }
      setMessages(payload.messages);
      if (action === "delete") setOpen(null);
    } catch {
      setError("No answer from the server. Check the connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-[22px] border border-[#e8e4ec] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0edf3] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Icon name="mail" size={17} className="text-[#6d4aff]" />
          <h2 className="text-sm font-black">Contact messages</h2>
          {counts.open > 0 && <span className="rounded-full bg-[#ffcf59] px-2 py-0.5 text-[9px] font-black text-[#4b3800]">{counts.open} open</span>}
        </div>
        <div className="inline-flex rounded-xl bg-[#f4f2f6] p-1">
          {(["open", "all", "answered"] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold capitalize transition ${filter === option ? "bg-white text-[#332e39] shadow-sm" : "text-[#8a8390]"}`}
            >
              {option === "open" ? `Open (${counts.open})` : option === "answered" ? `Answered (${counts.answered})` : `All (${messages.length})`}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-[12px] font-semibold text-red-800">{error}</p>}

      {shown.length === 0 ? (
        <p className="px-5 py-10 text-center text-[12px] text-[#918a97] sm:px-6">
          {filter === "open" ? "Nothing waiting — every message has been answered." : "No messages here yet."}
        </p>
      ) : (
        <ul className="divide-y divide-[#f0edf3]">
          {shown.map((message) => {
            const isOpen = open === message.id;
            return (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : message.id)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-[#fbfafc] sm:px-6"
                >
                  <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-black ${message.answered ? "bg-emerald-100 text-emerald-700" : "bg-[#f0ecff] text-[#5e3de0]"}`}>
                    {message.answered ? <Icon name="check" size={14} /> : message.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-[#332e39]">{message.subject || topicLabel(message.topic)}</span>
                      {!message.answered && <span className="rounded-full bg-[#ffcf59] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#4b3800]">New</span>}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-[#7d7683]">
                      {message.name} · {message.email} · {topicLabel(message.topic)} · {fmtDateTime(message.createdAt)}
                    </span>
                    {!isOpen && <span className="mt-1 block truncate text-[11px] text-[#a09aa7]">{message.body}</span>}
                  </span>
                  <Icon name="chevron-down" size={15} className={`mt-1 shrink-0 text-[#bbb5c0] transition ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6">
                    <div className="rounded-2xl border border-[#ece8f0] bg-[#fbfafc] p-4">
                      <p className="whitespace-pre-wrap text-[12px] leading-6 text-[#4a4450]">{message.body}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || topicLabel(message.topic)}`)}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#6d4aff] px-3.5 py-2 text-[11px] font-extrabold text-white transition hover:bg-[#5e3de0]">
                        <Icon name="mail" size={13} /> Reply by email
                      </a>
                      <button
                        type="button"
                        disabled={busy === message.id}
                        onClick={() => act(message.id, message.answered ? "unanswered" : "answered")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#dad5df] bg-white px-3.5 py-2 text-[11px] font-extrabold text-[#4a4450] transition hover:bg-[#f4f2f6] disabled:opacity-50"
                      >
                        <Icon name="check" size={13} /> {message.answered ? "Mark as open again" : "Mark as answered"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === message.id}
                        onClick={() => {
                          if (window.confirm("Delete this message for good?")) act(message.id, "delete");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-[11px] font-extrabold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Icon name="close" size={12} /> Delete
                      </button>
                      <span className="ml-auto font-mono text-[10px] text-[#a9a2b0]">{message.id}</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
