"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LearnerProfile } from "@/lib/store";
import Icon from "./Icon";

interface Props {
  name: string;
  email: string;
  profile: LearnerProfile;
}

export default function AccountForm({ name: initialName, email, profile: initialProfile }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [headline, setHeadline] = useState(initialProfile.headline);
  const [track, setTrack] = useState(initialProfile.track);
  const [experience, setExperience] = useState(initialProfile.experience);
  const [weeklyGoal, setWeeklyGoal] = useState(initialProfile.weeklyGoal);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, headline, track, experience, weeklyGoal }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: "error", text: data.error ?? "Your changes could not be saved." });
        return;
      }
      setMessage({ type: "ok", text: "Your account has been updated." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-1.5 w-full rounded-xl border border-[#ded9e3] bg-white px-3.5 py-2.5 text-xs font-medium text-[#38323e] transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100";

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="open-surface">
        <div className="border-b border-[#ece9ef] py-4"><h2 className="text-sm font-extrabold">Profile details</h2><p className="mt-1 text-[10px] text-[#918a97]">How your name and learning goal appear in codemasterghana.</p></div>
        <div className="grid gap-5 py-6 sm:grid-cols-2">
          <label className="block"><span className="text-[10px] font-bold text-[#5f5965]">Full name</span><input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
          <label className="block"><span className="text-[10px] font-bold text-[#5f5965]">Email address</span><div className="relative"><input value={email} readOnly className={`${inputClass} bg-[#f7f6f8] pr-16 text-[#817a87]`} /><span className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-[8px] font-black uppercase tracking-wider text-[#aaa4b0]">Verified</span></div></label>
          <label className="block sm:col-span-2"><span className="text-[10px] font-bold text-[#5f5965]">Learning headline</span><input value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={120} placeholder="What are you working toward?" className={inputClass} /><span className="mt-1 block text-right text-[8px] text-[#aaa4b0]">{headline.length}/120</span></label>
        </div>
      </section>

      <section className="open-surface">
        <div className="border-b border-[#ece9ef] py-4"><h2 className="text-sm font-extrabold">Learning preferences</h2><p className="mt-1 text-[10px] text-[#918a97]">Used to personalize course recommendations and goals.</p></div>
        <div className="grid gap-5 py-6 sm:grid-cols-2">
          <label><span className="text-[10px] font-bold text-[#5f5965]">Primary goal</span><select value={track} onChange={(event) => setTrack(event.target.value as LearnerProfile["track"])} className={inputClass}><option>Web developer</option><option>App developer</option><option>Computer science</option><option>Full-stack developer</option></select></label>
          <label><span className="text-[10px] font-bold text-[#5f5965]">Experience level</span><select value={experience} onChange={(event) => setExperience(event.target.value as LearnerProfile["experience"])} className={inputClass}><option>Just starting</option><option>Some experience</option><option>Building professionally</option></select></label>
          <div className="sm:col-span-2"><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-[#5f5965]">Weekly learning goal</span><span className="rounded-lg bg-[#f0ecff] px-2.5 py-1 text-[10px] font-black text-[#5e3de0]">{weeklyGoal} minutes</span></div><input type="range" min={30} max={600} step={30} value={weeklyGoal} onChange={(event) => setWeeklyGoal(Number(event.target.value))} className="mt-4 w-full accent-[#6d4aff]" /><div className="mt-1 flex justify-between text-[8px] font-semibold text-[#aaa4b0]"><span>30 min</span><span>10 hours</span></div></div>
        </div>
      </section>

      {message && <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}
      <div className="flex justify-end"><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(109,74,255,.2)] transition hover:-translate-y-0.5 disabled:opacity-60"><Icon name="check" size={15} />{busy ? "Saving…" : "Save changes"}</button></div>
    </form>
  );
}
