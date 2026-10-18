"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { COUNTRIES } from "@/lib/countries";
import EmbedNotice from "./EmbedNotice";
import Icon from "./Icon";
import PasswordStrength from "./PasswordStrength";
import SocialAuthButtons from "./SocialAuthButtons";

type Mode = "signin" | "signup" | "forgot";
type TabMode = Exclude<Mode, "forgot">;

interface Props {
  initialMode?: Mode;
  /** A same-site path to open after signing in, e.g. the lesson that asked for it. */
  next?: string | null;
  /** An explanation of a social sign-in that came back short, e.g. `?oauth=denied`. */
  socialError?: string | null;
}

const fieldClass =
  "w-full rounded-xl border border-[#dcd8e2] bg-white py-3 pl-10 pr-3 text-sm text-[#211d27] transition duration-200 placeholder:text-[#aaa4b0] hover:border-[#c9c2d4] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100";

const stagger = (index: number) => ({ "--i": index } as CSSProperties);

/** m:ss for the rate-limit countdown. */
function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function AuthForm({ initialMode = "signin", next = null, socialError = null }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // The error banner shakes each time a new error appears.
  const [errorKey, setErrorKey] = useState(0);

  // The sliding pill under the two tabs.
  const tabRefs = useRef<Partial<Record<TabMode, HTMLButtonElement | null>>>({});
  const [pill, setPill] = useState({ x: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const measure = () => {
      const tab = tabRefs.current[mode === "signup" ? "signup" : "signin"];
      if (tab) setPill({ x: tab.offsetLeft, width: tab.offsetWidth, ready: true });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mode]);

  // Counts the rate-limit lock down to zero, then the button comes back.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function fail(message: string) {
    setError(message);
    setErrorKey((key) => key + 1);
  }

  function changeMode(to: Mode) {
    setMode(to);
    setError(null);
    setNotice(null);
    setSentTo(null);
  }

  function reportRateLimit(seconds: number | undefined, fallback: string) {
    const wait = typeof seconds === "number" && seconds > 0 ? seconds : 300;
    setCooldown(wait);
    fail(fallback);
  }

  async function authenticate() {
    if (busy || cooldown > 0) return;
    if (mode === "signup" && name.trim().length < 2) {
      fail("Please enter your full name.");
      return;
    }
    if (mode === "signup" && !country) {
      fail("Choose your country.");
      return;
    }
    if (mode === "signup" && city.trim().length < 2) {
      fail("Enter your city or town.");
      return;
    }
    if (!email.trim() || !password) {
      fail("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, name, email, password, country, city }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          reportRateLimit(data.retryAfter, data.error ?? "Too many attempts.");
          return;
        }
        if (data.code === "NO_ACCOUNT" && mode === "signin") {
          // Not an error to stare at: offer the account creation this email needs.
          setNotice(data.error ?? "No account exists for that email yet.");
          return;
        }
        fail(data.error ?? "We could not sign you in.");
        return;
      }
      // Let the success state land before the page changes.
      setSuccess(mode === "signup" ? "Account created" : "Welcome back");
      window.setTimeout(() => {
        // Use a full navigation after changing the httpOnly session cookie so
        // the first protected server render always receives the new session.
        window.location.replace(next ?? (data.role === "owner" ? "/owner" : "/dashboard"));
      }, 650);
    } catch {
      fail("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function requestReset() {
    if (busy || cooldown > 0) return;
    if (!email.trim()) {
      fail("Enter the email address you signed up with.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 429) {
        reportRateLimit(data.retryAfter, data.error ?? "Too many reset requests.");
        return;
      }
      if (!response.ok) {
        fail(data.error ?? "We could not send a reset link right now.");
        return;
      }
      setSentTo(email.trim().toLowerCase());
    } catch {
      fail("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "forgot") requestReset();
    else authenticate();
  }

  function onPasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsOn(event.getModifierState("CapsLock"));
  }

  const locked = cooldown > 0;
  const ctaLabel = locked
    ? `Try again in ${clock(cooldown)}`
    : success
      ? success
      : busy
        ? mode === "forgot"
          ? "Sending your link…"
          : "Opening your workspace…"
        : mode === "signup"
          ? "Create free account"
          : mode === "forgot"
            ? "Send reset link"
            : "Sign in to codemasterghana";

  // The "check your inbox" state after a reset request.
  if (mode === "forgot" && sentTo) {
    return (
      <div className="auth-step text-center">
        <div className="relative mx-auto grid size-16 place-items-center rounded-full bg-[#eee9ff] text-[#6d4aff] auth-ring">
          <span className="auth-check"><Icon name="mail" size={28} /></span>
        </div>
        <h1 className="mt-6 text-[25px] font-black tracking-[-.04em] text-[#1c1921]">Check your inbox</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#77717d]">
          If an account exists for <strong className="text-[#302b37]">{sentTo}</strong>, a reset link is on its way. It works once and expires in 30 minutes.
        </p>
        <p className="mt-3 text-[11px] leading-5 text-[#9a939f]">Nothing arrived? Check spam, or try again in a few minutes.</p>
        <button type="button" onClick={() => changeMode("signin")} className="mt-7 inline-flex items-center gap-1.5 text-sm font-extrabold text-[#6543e8] transition hover:-translate-x-0.5">
          <Icon name="arrow-left" size={15} /> Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      {mode !== "forgot" ? (
        <div className="auth-tabs grid grid-cols-2 rounded-xl bg-[#f0eef3] p-1" role="tablist" aria-label="Account">
          <span aria-hidden className="auth-tab-pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.width, opacity: pill.ready ? 1 : 0 }} />
          {(["signin", "signup"] as TabMode[]).map((tab) => (
            <button
              key={tab}
              ref={(node) => { tabRefs.current[tab] = node; }}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              onClick={() => changeMode(tab)}
              className={`relative z-10 rounded-[9px] px-4 py-2.5 text-sm font-bold transition-colors duration-300 ${mode === tab ? "text-[#211d27]" : "text-[#7a7480] hover:text-[#4d4753]"}`}
            >
              {tab === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" onClick={() => changeMode("signin")} className="auth-step inline-flex items-center gap-1.5 text-xs font-bold text-[#6543e8] transition hover:-translate-x-0.5">
          <Icon name="arrow-left" size={14} /> Back to sign in
        </button>
      )}

      {/* Keyed on the mode, so each step plays its own entrance. */}
      <div key={mode} className="auth-step mt-6">
        <h1 className="text-[27px] font-black tracking-[-.04em] text-[#1c1921]">
          {mode === "signup" ? "Create your learning space" : mode === "forgot" ? "Forgot your password?" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-[#77717d]">
          {mode === "signup"
            ? "Start with two complete courses. No card needed."
            : mode === "forgot"
              ? "Enter the email you signed up with. We will send a link that works once."
              : "Continue from exactly where you stopped."}
        </p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="auth-field block" style={stagger(0)}>
              <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Full name</span>
              <div className="relative"><Icon name="user" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="e.g. Ama Mensah" className={fieldClass} /></div>
            </label>
          )}

          <label className="auth-field block" style={stagger(mode === "signup" ? 1 : 0)}>
            <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Email address</span>
            <div className="relative"><Icon name="mail" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className={fieldClass} /></div>
          </label>

          {mode === "signup" && (
            <div className="auth-field grid grid-cols-2 gap-3" style={stagger(2)}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Country</span>
                <div className="relative">
                  <Icon name="globe" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" />
                  <select value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country-name" className={`${fieldClass} appearance-none pr-8`}>
                    <option value="">Select country</option>
                    {COUNTRIES.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <Icon name="chevron-down" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9b94a2]" />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">City / town</span>
                <div className="relative"><Icon name="home" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" /><input value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" placeholder="e.g. Accra" className={fieldClass} /></div>
              </label>
            </div>
          )}

          {mode !== "forgot" && (
            <label className="auth-field block" style={stagger(mode === "signup" ? 3 : 1)}>
              <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#4d4753]">
                <span>Password</span>
                {mode === "signin" ? (
                  <button type="button" onClick={() => changeMode("forgot")} className="font-bold text-[#6543e8] transition hover:text-[#5e3ce8] hover:underline">Forgot password?</button>
                ) : (
                  <span className="font-medium text-[#9a939f]">Stored securely</span>
                )}
              </span>
              <div className="relative">
                <Icon name="lock" size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a2]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={onPasswordKey}
                  onKeyUp={onPasswordKey}
                  onBlur={() => setCapsOn(false)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  className={`${fieldClass} pr-14`}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold text-[#817a89] transition hover:bg-[#f3f1f5]">{showPassword ? "Hide" : "Show"}</button>
              </div>
              {capsOn && <span className="auth-step mt-1.5 block text-[11px] font-bold text-amber-700">Caps lock is on.</span>}
              {mode === "signup" && <PasswordStrength value={password} />}
            </label>
          )}

          {mode === "signup" && <p className="auth-field text-[11px] leading-5 text-[#89828f]" style={stagger(4)}>By creating an account, you agree to codemasterghana&apos;s Terms and Privacy Policy.</p>}

          {socialError && (
            <div className="auth-step rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900">{socialError}</div>
          )}
          {notice && (
            <div className="auth-step rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900">
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
          {error && (
            <div key={errorKey} role="alert" className="auth-shake rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy || locked || Boolean(success)}
            className={`btn-shine inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold text-white transition-all duration-300 disabled:cursor-wait ${
              success ? "bg-[#2fa36b] shadow-[0_9px_25px_rgba(47,163,107,.25)]" : "bg-[#6d4aff] shadow-[0_9px_25px_rgba(109,74,255,.22)] hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:translate-y-0 disabled:opacity-65"
            }`}
          >
            {success && <span className="auth-check"><Icon name="check" size={16} /></span>}
            {ctaLabel}
            {!busy && !success && !locked && <Icon name="arrow-right" size={16} />}
          </button>
        </form>

        {mode !== "forgot" && (
          <div className="auth-step mt-6">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#e7e3eb]" />
              <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#9a939f]">or continue with</span>
              <span className="h-px flex-1 bg-[#e7e3eb]" />
            </div>
            <SocialAuthButtons next={next} mode={mode === "signup" ? "signup" : "signin"} style={stagger(5)} />
          </div>
        )}
      </div>

      <EmbedNotice />
    </div>
  );
}
