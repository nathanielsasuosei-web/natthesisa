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
      const next = typeof body.next === "string" ? body.next : "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setBanner("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
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
        <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 p-3">
          <p className="text-xs font-medium text-rose-800">Demo accounts — one tap to fill in</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => void submit(e, demo.member)}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
            >
              Member · {demo.member.email}
            </button>
            <button
              type="button"
              onClick={(e) => void submit(e, demo.admin)}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
            >
              Admin · {demo.admin.email}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-rose-700/80">
            Passwords are shown on purpose: this is a demo with in-memory data.
          </p>
        </div>
      )}

      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-rose-600 hover:text-rose-500">
          Create an account
        </Link>
      </p>
    </form>
  );
}
