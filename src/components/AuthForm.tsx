"use client";

import { useState } from "react";
import EmbedNotice from "./EmbedNotice";
import Icon from "./Icon";

type Mode = "signin" | "signup";

interface Props {
  initialMode?: Mode;
  /** A same-site path to open after signing in, e.g. the lesson that asked for it. */
  next?: string | null;
}

export default function AuthForm({ initialMode = "signin", next = null }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function authenticate() {
    if (busy) return;
    if (mode === "signup" && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, name, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === "NO_ACCOUNT" && mode === "signin") {
          // Not an error to stare at: offer the account creation this email needs.
          setNotice(data.error ?? "No account exists for that email yet.");
          return;
        }
        setError(data.error ?? "We could not sign you in.");
        return;
      }
      // Use a full navigation after changing the httpOnly session cookie so
      // the first protected server render always receives the new session.
      window.location.replace(next ?? (data.role === "owner" ? "/owner" : "/dashboard"));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
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
          <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#4d4753]"><span>Password</span>{mode === "signin" && <span className="font-medium text-[#9a939f]">Stored securely</span>}</span>
          <div className="relative"><Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} className="w-full rounded-xl border border-[#dcd8e2] bg-white py-3 pl-10 pr-12 text-sm text-[#211d27] transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold text-[#817a89] hover:bg-[#f3f1f5]">{showPassword ? "Hide" : "Show"}</button></div>
        </label>

        {mode === "signup" && <p className="text-[11px] leading-5 text-[#89828f]">By creating an account, you agree to codemasterghana&apos;s Terms and Privacy Policy.</p>}
        {notice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900">
            {notice}{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setNotice("Choose a password to finish creating your account — at least 8 characters with a number or symbol.");
              }}
              className="font-extrabold underline"
            >
              Create an account with this email
            </button>
          </div>
        )}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">{error}</div>}
        <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_9px_25px_rgba(109,74,255,.22)] transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-65">
          {busy ? "Opening your workspace…" : mode === "signup" ? "Create free account" : "Sign in to codemasterghana"} {!busy && <Icon name="arrow-right" size={16} />}
        </button>
      </form>

      <EmbedNotice />
    </div>
  );
}
