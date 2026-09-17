"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountSettings, ProfileDto } from "@/lib/profile";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { site } from "@/config/site";
import Avatar from "./Avatar";
import PasswordField from "./PasswordField";
import { validateNewPassword } from "@/lib/password-rules";
import { Alert, Button, Card, TextInput, Toggle, fieldsFrom, messageFrom, sendJson } from "./forms";

/**
 * Account settings: sign-in details, security, notifications, privacy,
 * your data and the door out. Everything here writes through an API route —
 * the toggles are optimistic but roll back if the server says no.
 */
export default function SettingsForms({
  profile,
  planName,
  role,
  suspended,
}: {
  profile: ProfileDto;
  planName: string;
  role: "member" | "admin";
  suspended: boolean;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-white p-5">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} photo={profile.photo} emoji={profile.avatar} size={52} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Account settings</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {profile.email} · {planName} {role === "admin" ? "· admin" : ""} · joined {fmtDate(profile.createdAt)}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/profile"
          className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
        >
          Edit my profile
        </Link>
      </header>

      {suspended && (
        <Alert tone="warn">
          Your account is suspended. Changing your email or password still works so you can secure the
          account while you appeal with {site.supportEmail}.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SignInSection profile={profile} />
        <EmailSection profile={profile} />
      </div>

      <NotificationSection settings={profile.settings} />
      <PrivacySection settings={profile.settings} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DataSection profile={profile} />
        <DangerZone profile={profile} role={role} />
      </div>
    </div>
  );
}

/* ------------------------------- security ------------------------------ */

function SignInSection({ profile }: { profile: ProfileDto }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setErrors({});
    const local: Record<string, string> = {};
    if (!current) local.currentPassword = "Enter your current password.";
    const weak = validateNewPassword(next);
    if (next && weak) local.newPassword = weak;
    if (!next) local.newPassword = "Choose a new password.";
    if (next !== confirm) local.confirm = "The two don't match.";
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setBusy(true);
    const { ok, body } = await sendJson("/api/settings/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setBusy(false);
    if (!ok) {
      setErrors(fieldsFrom(body));
      setBanner(messageFrom(body, "Could not change your password."));
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setDone(true);
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <Card
      title="Sign-in & security"
      icon="🔒"
      description="Passwords are hashed with scrypt; we never store the one you type."
      footer={
        <>
          <Button type="submit" form="password-form" busy={busy} variant="primary">
            Update password
          </Button>
          {done && <span className="text-xs font-semibold text-emerald-600">Password updated ✓</span>}
        </>
      }
    >
      <form id="password-form" onSubmit={submit} className="space-y-4" noValidate>
        {banner && <Alert tone="error">{banner}</Alert>}
        <TextInput
          label="Current password"
          type="password"
          value={current}
          autoComplete="current-password"
          error={errors.currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Needed for any security change"
        />
        <PasswordField
          label="New password"
          value={next}
          onChange={setNext}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <TextInput
          label="Confirm new password"
          type="password"
          value={confirm}
          error={errors.confirm}
          autoComplete="new-password"
          onChange={(e) => setConfirm(e.target.value)}
        />
      </form>

      <dl className="mt-5 space-y-2 rounded-xl bg-rose-50/60 p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Last sign-in</dt>
          <dd className="font-medium">{profile.lastLoginAt ? fmtDateTime(profile.lastLoginAt) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Session</dt>
          <dd className="font-medium">Cookie · 30 days · same-site lax</dd>
        </div>
      </dl>

      <button
        onClick={() => void signOut()}
        className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
      >
        Sign out of this device
      </button>
    </Card>
  );
}

function EmailSection({ profile }: { profile: ProfileDto }) {
  const router = useRouter();
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = email.trim().toLowerCase() !== profile.email;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setErrors({});
    if (!dirty) return;
    setBusy(true);
    const { ok, body } = await sendJson("/api/settings/email", {
      method: "PUT",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    setBusy(false);
    if (!ok) {
      setErrors(fieldsFrom(body));
      setBanner(messageFrom(body, "Could not change your email."));
      return;
    }
    setPassword("");
    setBanner(null);
    router.refresh();
  }

  return (
    <Card
      title="Email address"
      icon="📧"
      description="Your sign-in handle. Changing it needs your password, and it must not belong to another member."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {banner && <Alert tone="error">{banner}</Alert>}
        <TextInput
          label="Email"
          type="email"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          hint={dirty ? "Unsaved change" : `Signed in as ${profile.email}`}
        />
        <TextInput
          label="Confirm with your password"
          type="password"
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Button type="submit" busy={busy} disabled={!dirty || !password}>
          {dirty ? "Save new email" : "Saved ✓"}
        </Button>
      </form>
      <p className="mt-4 text-xs text-slate-500">
        This demo never sends mail — no verification link, no password reset. In a real build the
        change would wait for a click on a confirmation link.
      </p>
    </Card>
  );
}

/* ------------------------------ preferences ---------------------------- */

const NOTIFICATION_COPY: Array<{
  key: keyof AccountSettings["notifications"];
  label: string;
  description: string;
  emoji: string;
}> = [
  { key: "newMatches", label: "New matches", description: "When someone likes you back", emoji: "💘" },
  { key: "newLikes", label: "Likes on your profile", description: "A daily digest, not a ping per like", emoji: "❤️" },
  { key: "dateReminders", label: "Date reminders", description: "The morning of a planned date idea", emoji: "📅" },
  { key: "membership", label: "Membership notices", description: "Renewals, downgrades and invoices", emoji: "🧾" },
  { key: "productEmails", label: "Tips & product news", description: "Occasional ideas for your profile", emoji: "📬" },
];

const PRIVACY_COPY: Array<{
  key: keyof AccountSettings["privacy"];
  label: string;
  description: string;
  emoji: string;
}> = [
  { key: "showAge", label: "Show my age", description: "Off means your card shows a name and photo only", emoji: "🎂" },
  { key: "showLocation", label: "Show my location", description: "Your city appears under your name", emoji: "📍" },
  {
    key: "discoverable",
    label: "Appear in Discover",
    description: "Turn off to pause new likes while keeping existing matches",
    emoji: "🙈",
  },
];

function useToggleSaver(initial: AccountSettings) {
  const router = useRouter();
  const [settings, setSettings] = useState<AccountSettings>(initial);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(group: "notifications" | "privacy", key: string, value: boolean) {
    setError(null);
    setBusyKey(`${group}.${key}`);
    const previous = settings;
    const optimistic = {
      ...settings,
      [group]: { ...settings[group], [key]: value },
    } as AccountSettings;
    setSettings(optimistic);
    const { ok, body } = await sendJson("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ [group]: { [key]: value } }),
    });
    setBusyKey(null);
    if (!ok) {
      setSettings(previous);
      setError(messageFrom(body, "Could not save that setting."));
      return;
    }
    const returned = body.settings as AccountSettings | undefined;
    if (returned) setSettings(returned);
    router.refresh();
  }

  return { settings, save, busyKey, error };
}

function NotificationSection({ settings }: { settings: AccountSettings }) {
  const { settings: live, save, busyKey, error } = useToggleSaver(settings);
  return (
    <Card
      title="Notifications"
      icon="🔔"
      description="What we'd email you about. Off means off — no quiet exceptions."
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {NOTIFICATION_COPY.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            description={item.description}
            emoji={item.emoji}
            checked={live.notifications[item.key]}
            disabled={busyKey === `notifications.${item.key}`}
            onChange={(next) => void save("notifications", item.key, next)}
          />
        ))}
      </div>
      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </Card>
  );
}

function PrivacySection({ settings }: { settings: AccountSettings }) {
  const { settings: live, save, busyKey, error } = useToggleSaver(settings);
  return (
    <Card
      title="Privacy & visibility"
      icon="🕶️"
      description="Controls applied to the card other members see and to whether you appear in Discover."
    >
      <div className="grid gap-2.5 sm:grid-cols-3">
        {PRIVACY_COPY.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            description={item.description}
            emoji={item.emoji}
            checked={live.privacy[item.key]}
            disabled={busyKey === `privacy.${item.key}`}
            onChange={(next) => void save("privacy", item.key, next)}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Your birthday, email and password are never shown on a profile card, whatever these toggles do.
      </p>
      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------- data --------------------------------- */

function DataSection({ profile }: { profile: ProfileDto }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/data");
      if (!res.ok) {
        setError("Could not prepare your export.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sparks-${profile.name.toLowerCase().replace(/\W+/g, "-")}-data.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Your data"
      icon="📦"
      description="Download everything the demo holds about you as one JSON file."
      footer={
        <>
          <Button variant="ghost" onClick={() => void download()} busy={busy}>
            {busy ? "Preparing…" : "Download my data (JSON)"}
          </Button>
          <Link
            href="/api/export"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:text-rose-500"
          >
            Match history (CSV) →
          </Link>
        </>
      }
    >
      <dl className="space-y-2 text-sm">
        <Row label="Profile updated" value={profile.updatedAt ? fmtDateTime(profile.updatedAt) : "—"} />
        <Row label="Account created" value={fmtDate(profile.createdAt)} />
        <Row label="Interests" value={`${profile.interests.length} selected`} />
        <Row label="Photo" value={profile.photo ? "Uploaded" : "Avatar only"} />
      </dl>
      <p className="mt-4 text-xs text-slate-500">
        The CSV export is a Premium perk; this JSON download is always yours. Both come straight from
        the in-memory store, so a server restart clears the data entirely.
      </p>
      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-rose-50 pb-2 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function DangerZone({ profile, role }: { profile: ProfileDto; role: "member" | "admin" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function destroy() {
    setBusy(true);
    setBanner(null);
    const { ok, body } = await sendJson("/api/settings/account", {
      method: "DELETE",
      body: JSON.stringify({ confirm, password }),
    });
    setBusy(false);
    if (!ok) {
      setErrors(fieldsFrom(body));
      setBanner(messageFrom(body, "Could not delete the account."));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <Card
      title="Danger zone"
      icon="🗑️"
      description="Deleting removes your profile, matches, date ideas and billing history for good."
    >
      {!open ? (
        <div>
          <Button
            variant="danger"
            onClick={() => setOpen(true)}
            disabled={role === "admin"}
            title={role === "admin" ? "Admin accounts can't self-delete from the demo" : undefined}
          >
            Delete my account
          </Button>
          {role === "admin" && (
            <p className="mt-2 text-xs text-slate-500">
              Admin accounts can&apos;t be deleted from inside the app — ask another admin to remove it.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm font-medium text-red-800">
            This can&apos;t be undone. Confirm your email and password, then delete.
          </p>
          {banner && <Alert tone="error">{banner}</Alert>}
          <TextInput
            label="Type your email"
            value={confirm}
            error={errors.confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={profile.email}
          />
          <TextInput
            label="Your password"
            type="password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              busy={busy}
              disabled={confirm.trim().toLowerCase() !== profile.email || !password}
              onClick={() => void destroy()}
            >
              {busy ? "Deleting…" : "Yes, delete everything"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setPassword("");
                setErrors({});
              }}
            >
              Keep my account
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
