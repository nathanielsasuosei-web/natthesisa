"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordField from "./PasswordField";
import { Alert, Button, TextInput, fieldsFrom, messageFrom, sendJson } from "./forms";

/**
 * Sign in. Emails are matched case-insensitively on the server; repeated wrong
 * passwords lock sign-in for a few minutes (see lib/accounts.ts).
 */
export default function LoginForm({ demo }: { demo?: { member: { email: string; password: string }; admin: { email: string; password: string } } }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent, override?: { email: string; password: string }) {
    e.preventDefault();
    if (busy) return;
    const creds = override ?? { email, password };
    setBusy(true);
    setBanner(null);
    setErrors({});
    if (override) {
      setEmail(override.email);
      setPassword(override.password);
    }
    try {
      const { ok, body } = await sendJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(creds),
      });
      if (!ok) {
        setErrors(fieldsFrom(body));
        setBanner(messageFrom(body, "Could not sign in."));
        return;
      }
      const next = typeof body.next === "string" ? body.next : "/app/discover";
      router.push(next);
      router.refresh();
    } catch {
      setBanner("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {banner && <Alert tone={banner.includes("locked") ? "warn" : "error"}>{banner}</Alert>}
      <TextInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <PasswordField
        label="Password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="current-password"
        hint={undefined}
      />
      <Button type="submit" busy={busy} className="w-full">
        {busy ? "Checking…" : "Sign in"}
      </Button>

      {demo && (
        <div className="rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/10">
          <p className="text-xs font-medium text-white/70">Demo accounts — one tap signs you in</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => void submit(e, demo.member)}
              className="press rounded-full bg-gradient-to-r from-rose-500/25 to-fuchsia-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100 ring-1 ring-rose-400/30"
            >
              💘 Member
            </button>
            <button
              type="button"
              onClick={(e) => void submit(e, demo.admin)}
              className="press rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/12"
            >
              🛠️ Admin
            </button>
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            {demo.member.email} · {demo.member.password} — passwords are shown on purpose: this is a demo
            with in-memory data.
          </p>
        </div>
      )}

      <p className="text-center text-sm text-white/50">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-rose-300 hover:text-rose-200">
          Create an account
        </Link>
      </p>
    </form>
  );
}
