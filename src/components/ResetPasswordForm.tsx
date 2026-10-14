"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import Icon from "./Icon";
import Link from "next/link";
import PasswordStrength, { passwordScore } from "./PasswordStrength";

type Stage = "checking" | "form" | "expired" | "done";

const fieldClass =
  "w-full rounded-xl border border-[#dcd8e2] bg-white py-3 pl-10 pr-3 text-sm text-[#211d27] transition duration-200 placeholder:text-[#aaa4b0] hover:border-[#c9c2d4] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100";

/** Sets a new password from an emailed link, then signs the person in. */
export default function ResetPasswordForm({ token }: { token: string }) {
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [destination, setDestination] = useState("/dashboard");

  // Check the link as soon as the page opens, so an expired one says so now.
  useEffect(() => {
    let active = true;
    fetch(`/api/auth/reset?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((response) => response.json().catch(() => ({ valid: false })))
      .then((data: { valid?: boolean }) => {
        if (active) setStage(data.valid ? "form" : "expired");
      })
      .catch(() => {
        if (active) setStage("expired");
      });
    return () => {
      active = false;
    };
  }, [token]);

  function fail(message: string) {
    setError(message);
    setErrorKey((key) => key + 1);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (passwordScore(password) < 2) {
      fail("Use at least 8 characters with a letter and a number or symbol.");
      return;
    }
    if (password !== repeat) {
      fail("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === "LINK_INVALID") {
          setStage("expired");
          return;
        }
        fail(data.error ?? "Your password could not be changed.");
        return;
      }
      setDestination(data.role === "owner" ? "/owner" : "/dashboard");
      setStage("done");
      // Let the confirmation play, then load the page with the new session.
      window.setTimeout(() => window.location.replace(data.role === "owner" ? "/owner" : "/dashboard"), 1100);
    } catch {
      fail("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "checking") {
    return (
      <div className="auth-step text-center text-sm text-[#77717d]">
        <span className="mx-auto mb-4 block size-9 animate-spin rounded-full border-[3px] border-[#e4dffb] border-t-[#6d4aff]" aria-hidden />
        Checking your reset link…
      </div>
    );
  }

  if (stage === "expired") {
    return (
      <div className="auth-step text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-50 text-amber-700"><Icon name="clock" size={28} /></span>
        <h1 className="mt-6 text-[25px] font-black tracking-[-.04em] text-[#1c1921]">This link has expired</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#77717d]">Reset links work once and last 30 minutes. Ask for a fresh one and we will send it to your inbox.</p>
        <Link href="/login?mode=forgot" className="btn-shine mt-7 inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5e3ce8]">
          Request a new link <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="auth-step text-center">
        <div className="relative mx-auto grid size-16 place-items-center rounded-full bg-[#e7f6ee] text-[#2fa36b] auth-ring">
          <span className="auth-check"><Icon name="check" size={28} /></span>
        </div>
        <h1 className="mt-6 text-[25px] font-black tracking-[-.04em] text-[#1c1921]">Password updated</h1>
        <p className="mt-2 text-sm text-[#77717d]">You are signed in. Taking you {destination === "/owner" ? "to the teacher console" : "to your dashboard"}…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="auth-step">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#eee9ff] text-[#6d4aff]"><Icon name="lock" size={20} /></span>
        <h1 className="mt-5 text-[27px] font-black tracking-[-.04em] text-[#1c1921]">Choose a new password</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#77717d]">This link works once. Once you save, it stops working and you are signed in.</p>
      </div>

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <label className="auth-field block" style={{ "--i": 0 } as CSSProperties}>
          <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">New password</span>
          <div className="relative">
            <Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className={`${fieldClass} pr-14`} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold text-[#817a89] transition hover:bg-[#f3f1f5]">{showPassword ? "Hide" : "Show"}</button>
          </div>
          <PasswordStrength value={password} />
        </label>

        <label className="auth-field block" style={{ "--i": 1 } as CSSProperties}>
          <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Repeat the new password</span>
          <div className="relative">
            <Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" />
            <input type={showPassword ? "text" : "password"} value={repeat} onChange={(event) => setRepeat(event.target.value)} autoComplete="new-password" className={fieldClass} />
          </div>
        </label>

        {error && <div key={errorKey} role="alert" className="auth-shake rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">{error}</div>}

        <button type="submit" disabled={busy} className="btn-shine auth-field inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_9px_25px_rgba(109,74,255,.22)] transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-65" style={{ "--i": 2 } as CSSProperties}>
          {busy ? "Saving your password…" : "Save and sign in"}
          {!busy && <Icon name="arrow-right" size={16} />}
        </button>
      </form>
    </div>
  );
}
