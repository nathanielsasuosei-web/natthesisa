"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MIN_AGE, NAME_MAX, NAME_MIN } from "@/lib/profile";
import { validateNewPassword } from "@/lib/password-rules";
import PasswordField from "./PasswordField";
import { Alert, Button, TextInput, fieldsFrom, messageFrom, sendJson } from "./forms";

/** Step 1 of joining: identity only. Age/location/bio/interests come next. */
export default function SignupForm({ maxBirthDate }: { maxBirthDate?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", birthDate: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  // the newest birthday that still clears the age gate — computed on the server
  // (and passed in) so the input's `max` can't differ between renders
  const maxDate = useMemo(
    () =>
      maxBirthDate ??
      (() => {
        const d = new Date();
        d.setUTCFullYear(d.getUTCFullYear() - MIN_AGE);
        return d.toISOString().slice(0, 10);
      })(),
    [maxBirthDate]
  );

  function clientValidate(): boolean {
    const next: Record<string, string> = {};
    if (form.name.trim().length < NAME_MIN) next.name = `At least ${NAME_MIN} characters.`;
    if (form.name.trim().length > NAME_MAX) next.name = `Up to ${NAME_MAX} characters.`;
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email.trim()))
      next.email = "That doesn't look like an email address.";
    if (!form.birthDate) next.birthDate = `We need this to confirm you're ${MIN_AGE}+.`;
    else if (form.birthDate > maxDate) next.birthDate = `You must be at least ${MIN_AGE} to join.`;
    const pwError = validateNewPassword(form.password);
    if (form.password && pwError) next.password = pwError;
    if (!form.password) next.password = "Choose a password.";
    if (form.confirm !== form.password) next.confirm = "Those don't match yet.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    if (busy) return;
    if (!clientValidate()) return;

    setBusy(true);
    try {
      const { ok, status, body } = await sendJson("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          birthDate: form.birthDate,
        }),
      });
      if (!ok) {
        setErrors(fieldsFrom(body));
        setBanner(messageFrom(body, "Could not create your account."));
        if (status === 409) setBanner(messageFrom(body, "That email is already taken."));
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch {
      setBanner("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {banner && <Alert tone="error">{banner}</Alert>}

      <TextInput
        label="Name"
        required
        value={form.name}
        onChange={set("name")}
        error={errors.name}
        placeholder="What should we call you?"
        autoComplete="given-name"
        maxLength={NAME_MAX + 5}
        hint="Shown first on your profile. No surnames needed."
      />
      <TextInput
        label="Email"
        required
        type="email"
        value={form.email}
        onChange={set("email")}
        error={errors.email}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <TextInput
        label="Date of birth"
        required
        type="date"
        value={form.birthDate}
        onChange={set("birthDate")}
        error={errors.birthDate}
        max={maxDate}
        hint={`Your age (${MIN_AGE}+) is calculated from this and shown on your profile.`}
      />
      <PasswordField value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} error={errors.password} />
      <TextInput
        label="Confirm password"
        required
        type="password"
        value={form.confirm}
        onChange={set("confirm")}
        error={errors.confirm}
        autoComplete="new-password"
        placeholder="Type it once more"
      />

      <Button type="submit" busy={busy} className="w-full">
        {busy ? "Creating your account…" : "Create account & build my profile"}
      </Button>

      <p className="text-center text-xs text-white/45">
        Next we&apos;ll ask for a photo, your city, a bio and who you&apos;d like to meet — about a
        minute, and you can change any of it later.
      </p>
      <p className="text-center text-sm text-white/55">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-rose-300 hover:text-rose-200">
          Sign in
        </Link>
      </p>
    </form>
  );
}
