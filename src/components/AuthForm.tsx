"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";

type Mode = "signin" | "signup";

interface Props {
  initialMode?: Mode;
}

export default function AuthForm({ initialMode = "signin" }: Props) {
  // Keep the router initialized for compatibility with already-open preview
  // tabs during hot reload; successful auth still uses a full navigation.
  useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function authenticate(payload?: { email: string; password: string }) {
    if (busy) return;
    const useEmail = payload?.email ?? email;
    const usePassword = payload?.password ?? password;
    if (mode === "signup" && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!useEmail.trim() || !usePassword) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: payload ? "signin" : mode, name, email: useEmail, password: usePassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "We could not sign you in.");
        return;
      }
      // Use a full navigation after changing the httpOnly session cookie so
      // the first protected server render always receives the new session.
      window.location.replace(data.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <div>
      <div className="grid grid-cols-2 rounded-xl bg-[#f0eef3] p-1">
        <button type="button" onClick={() => changeMode("signin")} className={`rounded-[9px] px-4 py-2.5 text-sm font-bold transition ${mode === "signin" ? "bg-white text-[#211d27] shadow-sm" : "text-[#7a7480]"}`}>Sign in</button>
        <button type="button" onClick={() => changeMode("signup")} className={`rounded-[9px] px-4 py-2.5 text-sm font-bold transition ${mode === "signup" ? "bg-white text-[#211d27] shadow-sm" : "text-[#7a7480]"}`}>Create account</button>
      </div>

      <div className="mt-6">
        <h1 className="text-[27px] font-black tracking-[-.04em] text-[#1c1921]">{mode === "signup" ? "Create your learning space" : "Welcome back"}</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#77717d]">{mode === "signup" ? "Start with two complete courses. No card needed." : "Continue from exactly where you stopped."}</p>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); authenticate(); }} className="mt-6 space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Full name</span>
            <div className="relative"><Icon name="user" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="e.g. Ama Mensah" className="w-full rounded-xl border border-[#dcd8e2] bg-white py-3 pl-10 pr-3 text-sm text-[#211d27] transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100" /></div>
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Email address</span>
          <div className="relative"><Icon name="mail" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border border-[#dcd8e2] bg-white py-3 pl-10 pr-3 text-sm text-[#211d27] transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100" /></div>
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#4d4753]"><span>Password</span>{mode === "signin" && <span className="font-medium text-[#9a939f]">Demo authentication</span>}</span>
          <div className="relative"><Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} className="w-full rounded-xl border border-[#dcd8e2] bg-white py-3 pl-10 pr-12 text-sm text-[#211d27] transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold text-[#817a89] hover:bg-[#f3f1f5]">{showPassword ? "Hide" : "Show"}</button></div>
        </label>

        {mode === "signup" && <p className="text-[11px] leading-5 text-[#89828f]">By creating an account, you agree to codemasterghana&apos;s Terms and Privacy Policy.</p>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">{error}</div>}
        <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_9px_25px_rgba(109,74,255,.22)] transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-65">
          {busy ? "Opening your workspace…" : mode === "signup" ? "Create free account" : "Sign in to codemasterghana"} {!busy && <Icon name="arrow-right" size={16} />}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#e5e1e8]" /><span className="text-[10px] font-bold uppercase tracking-wider text-[#aaa4b0]">or explore the demo</span><span className="h-px flex-1 bg-[#e5e1e8]" /></div>
      <div className="grid gap-x-5 sm:grid-cols-2">
        <a href="/api/auth/demo?role=student" aria-disabled={busy} className="border-t border-[#ddd9e2] py-3 text-left transition hover:border-[#a999e2]"><span className="block text-xs font-extrabold text-[#37313d]">Student demo</span><span className="mt-0.5 block text-[10px] text-[#8d8694]">Courses & progress</span></a>
        <a href="/api/auth/demo?role=admin" aria-disabled={busy} className="border-t border-[#ddd9e2] py-3 text-left transition hover:border-[#a999e2]"><span className="block text-xs font-extrabold text-[#37313d]">Admin demo</span><span className="mt-0.5 block text-[10px] text-[#8d8694]">Monitor learners</span></a>
      </div>
    </div>
  );
}
