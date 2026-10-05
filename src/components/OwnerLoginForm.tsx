"use client";

import Link from "next/link";
import { useState } from "react";
import { AUTH_UNAVAILABLE_MESSAGE } from "@/lib/auth-errors";
import EmbedNotice from "./EmbedNotice";
import Icon from "./Icon";

interface Props {
  currentUserName?: string;
  /** True when no owner exists and none is configured in the environment. */
  setupAvailable?: boolean;
}

/**
 * Points the teacher at the deployment's own diagnosis.
 *
 * The banner cannot say what is wrong (it is the same message for every
 * outage), but `/api/health` names the cause and the fix — and it is the one
 * page that still answers while the database is down. The teacher is the
 * people who can act on it, so only this form links to it.
 */
function UnavailableHelp() {
  return (
    <p className="mt-1.5 font-medium text-red-700/80">
      <a href="/api/health" target="_blank" rel="noreferrer" className="font-extrabold underline">
        Open /api/health
      </a>{" "}
      for the exact cause.
    </p>
  );
}

export default function OwnerLoginForm({ currentUserName, setupAvailable = false }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notOwner, setNotOwner] = useState(false);
  // The database-outage banner is the one failure the teacher can act on,
  // so it carries the link to the read-only diagnosis.
  const databaseDown = error === AUTH_UNAVAILABLE_MESSAGE;

  /**
   * Creates the owner account when none exists yet, so a fresh database can be
   * claimed from the browser instead of dead-ending at "no account for that
   * email". The route refuses once an owner exists or the environment
   * configures one.
   */
  async function createOwner(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError("Enter an email and a password for the owner account.");
      return;
    }
    if (password !== repeat) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/owner-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "The owner account could not be created.");
        return;
      }
      window.location.replace("/owner");
    } catch {
      setError("Network error. The owner account was not created.");
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError("Enter the owner email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotOwner(false);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ mode: "signin", email, password }),
      });
      const data = await response.json().catch(() => null) as { error?: string; role?: string } | null;
      if (!response.ok) {
        setError(
          data?.error ?? (response.status >= 500 ? AUTH_UNAVAILABLE_MESSAGE : "Teacher sign-in failed.")
        );
        return;
      }
      if (data?.role !== "owner") {
        // A learner who lands here is signed in now, so send them somewhere
        // useful instead of leaving them stuck on an error.
        setNotOwner(true);
        setError("This account is not the teacher account.");
        return;
      }
      // A full navigation guarantees the new httpOnly session is used by the
      // first protected server render (and avoids a client-router race).
      window.location.replace("/owner");
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
        <span className="grid size-11 place-items-center rounded-2xl bg-[#eee9ff] text-[#6d4aff]"><Icon name="crown" size={22} /></span>
        <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#6d4aff]">Protected area</p><h1 className="mt-0.5 text-2xl font-black tracking-[-.04em]">{setupAvailable ? "Set up the owner account" : "Teacher sign in"}</h1></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#77717d]">
        {setupAvailable
          ? "This database has no teacher yet. Create the one owner account — it is the only account that can publish lessons and set prices."
          : "Sign in as the teacher to publish lessons, set prices and manage students."}
      </p>

      {currentUserName && <div className="mt-4 border-l-2 border-[#6d4aff] py-1 pl-3.5 text-[11px] leading-5 text-[#5f4b9d]">You are currently signed in as <strong>{currentUserName}</strong>. Teacher sign-in will safely switch this session.</div>}

      {setupAvailable && (
        <form onSubmit={createOwner} className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Owner email</span><div className="relative"><Icon name="mail" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="you@example.com" className={fieldClass} /></div></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Choose a password</span><div className="relative"><Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className={`${fieldClass} pr-12`} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold text-[#817a89] hover:bg-[#f3f1f5]">{showPassword ? "Hide" : "Show"}</button></div></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Repeat the password</span><div className="relative"><Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type={showPassword ? "text" : "password"} value={repeat} onChange={(event) => setRepeat(event.target.value)} autoComplete="new-password" className={fieldClass} /></div></label>
          {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
            {error}
            {notOwner && (
              <>
                {" "}
                <Link href="/dashboard" className="font-extrabold underline">
                  Go to your student dashboard
                </Link>
              </>
            )}
            {databaseDown && <UnavailableHelp />}
          </div>
        )}
          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_9px_25px_rgba(109,74,255,.22)] transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:opacity-60">{busy ? "Creating the owner account…" : "Create owner account"}{!busy && <Icon name="arrow-right" size={16} />}</button>
          <p className="text-[11px] leading-5 text-[#89828f]">This option disappears once an owner exists. On a deployment, set OWNER_EMAIL and OWNER_PASSWORD instead so the account is created on first start.</p>
        </form>
      )}

      <form onSubmit={signIn} className={`space-y-4 ${setupAvailable ? "hidden" : ""}`}>
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Owner email</span><div className="relative"><Icon name="mail" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" className={fieldClass} /></div></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Password</span><div className="relative"><Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className={`${fieldClass} pr-12`} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold text-[#817a89] hover:bg-[#f3f1f5]">{showPassword ? "Hide" : "Show"}</button></div></label>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">{error}{databaseDown && <UnavailableHelp />}</div>}
        <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dcd8e2] bg-[#1b1822] px-4 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#2b2733] disabled:opacity-60">{busy ? "Verifying access…" : "Sign in as the teacher"}{!busy && <Icon name="arrow-right" size={16} />}</button>
        <p className="text-[10px] leading-5 text-[#9a939f]">The owner account is created on first start from <span className="font-mono">OWNER_EMAIL</span> and <span className="font-mono">OWNER_PASSWORD</span>. Change that password from the learner account page once you are in.</p>
      </form>

      <EmbedNotice />

    </div>
  );
}
