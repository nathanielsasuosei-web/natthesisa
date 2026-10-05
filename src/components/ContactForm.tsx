"use client";

import { useState } from "react";
import { MESSAGE_TOPICS, type MessageTopic } from "@/lib/message-topics";
import Icon from "./Icon";

interface Props {
  signedIn: boolean;
  defaultName?: string;
  defaultEmail?: string;
}

/**
 * The public contact form. Posts to `/api/contact`, which stores the message
 * for the teacher's console. No third-party form service is involved.
 */
export default function ContactForm({ signedIn, defaultName = "", defaultEmail = "" }: Props) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [topic, setTopic] = useState<MessageTopic>("course");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ id: string; name: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, topic, subject, message, company }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error || "Your message could not be sent just now. Please email hello@codemasterghana.com instead.");
        return;
      }
      setSent({ id: payload.id ?? "MSG-RECEIVED", name: name.trim() });
      setSubject("");
      setMessage("");
    } catch {
      setError("There was no answer from the server. Check your connection and try again, or email hello@codemasterghana.com.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-2xl bg-emerald-600 text-white"><Icon name="check" size={22} /></span>
        <h2 className="mt-4 text-lg font-black tracking-[-.03em] text-emerald-950">Message sent, {sent.name.split(" ")[0] || "friend"}.</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900/80">
          It is in the teacher&apos;s inbox now. Reference <span className="font-mono text-xs font-bold">{sent.id}</span> —
          quote it if you write again. Replies come from hello@codemasterghana.com within two working days.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => setSent(null)} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-emerald-800">
            Send another message
          </button>
          <a href="/dashboard" className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-50">
            Back to learning
          </a>
        </div>
      </div>
    );
  }

  const field = "mt-1.5 w-full rounded-xl border border-[#dad5df] bg-white px-4 py-3 text-sm text-[#332e39] outline-none transition placeholder:text-[#a9a2b0] focus:border-[#6d4aff] focus:ring-2 focus:ring-[#6d4aff]/15";

  return (
    <form onSubmit={submit} className="rounded-[22px] border border-[#e8e4ec] bg-white p-6 sm:p-8" noValidate={false}>
      <h2 className="text-lg font-black tracking-[-.03em]">Send a message</h2>
      <p className="mt-1.5 text-[12px] leading-5 text-[#7d7683]">
        {signedIn
          ? "You are signed in, so your account is attached to this message — we can look up your progress before replying."
          : "You do not need an account to write to us. Leave an email address you actually read, so the reply reaches you."}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#6e6875]">Your name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoComplete="name" placeholder="Ama Mensah" className={field} />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#6e6875]">Email address</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={160} autoComplete="email" placeholder="you@example.com" className={field} />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#6e6875]">What is it about?</span>
          <select value={topic} onChange={(event) => setTopic(event.target.value as MessageTopic)} className={field}>
            {MESSAGE_TOPICS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#6e6875]">Subject <span className="font-semibold normal-case text-[#a9a2b0]">(optional)</span></span>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} placeholder="e.g. Certificate code not verifying" className={field} />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#6e6875]">Your message</span>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={6} maxLength={4000} placeholder="Tell us what you need, and which course or lesson it is about." className={`${field} resize-y leading-6`} />
      </label>
      <p className="mt-1.5 text-right text-[10px] font-semibold text-[#a9a2b0]">{message.length} / 4000</p>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold leading-5 text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3 text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5e3de0] disabled:cursor-not-allowed disabled:opacity-60">
          <Icon name="mail" size={15} /> {busy ? "Sending…" : "Send message"}
        </button>
        <span className="text-[11px] text-[#918a97]">We reply within two working days.</span>
      </div>
    </form>
  );
}
