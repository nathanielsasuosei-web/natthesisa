"use client";

import { useState } from "react";
import Icon from "./Icon";

interface Props {
  currentUserName?: string;
}

export default function AdminLoginForm({ currentUserName }: Props) {
  const [email, setEmail] = useState("admin@codemasterghana.dev");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError("Enter the administrator email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ mode: "signin", email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Administrator sign-in failed.");
        return;
      }
      if (data.role !== "admin") {
        setError("This account does not have administrator access.");
        return;
      }
      // A full navigation guarantees the new httpOnly session is used by the
      // first protected server render (and avoids a client-router race).
      window.location.replace("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = "w-full rounded-xl border border-[#dcd8e2] bg-white py-3 pl-10 pr-3 text-sm text-[#211d27] transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#eee9ff] text-[#6d4aff]"><Icon name="admin" size={22} /></span>
        <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#6d4aff]">Protected area</p><h1 className="mt-0.5 text-2xl font-black tracking-[-.04em]">Administrator sign in</h1></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#77717d]">Sign in with an administrator account to monitor learners, plans and platform activity.</p>

      {currentUserName && <div className="mt-4 border-l-2 border-[#6d4aff] py-1 pl-3.5 text-[11px] leading-5 text-[#5f4b9d]">You are currently signed in as <strong>{currentUserName}</strong>. Administrator sign-in will safely switch this session.</div>}

      <a href="/api/auth/demo?role=admin" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_9px_25px_rgba(109,74,255,.22)] transition hover:-translate-y-0.5 hover:bg-[#5e3ce8]"><Icon name="spark" size={16} /> Open demo admin dashboard</a>

      <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#e5e1e8]" /><span className="text-[9px] font-black uppercase tracking-[.13em] text-[#aaa4b0]">or use credentials</span><span className="h-px flex-1 bg-[#e5e1e8]" /></div>

      <form onSubmit={signIn} className="space-y-4">
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Admin email</span><div className="relative"><Icon name="mail" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" className={fieldClass} /></div></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Password</span><div className="relative"><Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter admin password" className={`${fieldClass} pr-12`} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold text-[#817a89] hover:bg-[#f3f1f5]">{showPassword ? "Hide" : "Show"}</button></div></label>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">{error}</div>}
        <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dcd8e2] bg-[#1b1822] px-4 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#2b2733] disabled:opacity-60">{busy ? "Verifying access…" : "Sign in as administrator"}{!busy && <Icon name="arrow-right" size={16} />}</button>
      </form>
      <div className="mt-5 border-y border-[#e5e1e8] py-3 text-[10px] leading-5 text-[#817a87]"><strong>Demo credentials</strong><br />admin@codemasterghana.dev · admin123</div>
    </div>
  );
}
