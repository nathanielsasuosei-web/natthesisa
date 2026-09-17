"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountSettings } from "@/lib/profile";
import PasswordField from "./PasswordField";
import { Alert, Button, Panel, Row, SectionLabel, Sheet, TextInput, Toggle, messageFrom, sendJson, useToast } from "./forms";

/**
 * Account settings — every row here writes through the existing endpoints
 * immediately (PATCH /api/settings for the toggles, PUT for email/password,
 * DELETE for the account) and rolls back on the screen if the server says no.
 */

type Privacy = AccountSettings["privacy"];
type Notifications = AccountSettings["notifications"];

const PRIVACY_ROWS: Array<{ key: keyof Privacy; label: string; description: string; emoji: string }> = [
  {
    key: "discoverable",
    label: "Show me on Sparks",
    description: "Off hides you from Discover. Your matches keep working either way.",
    emoji: "👀",
  },
  { key: "showAge", label: "Show my age", description: "Your number on the card.", emoji: "🎂" },
  { key: "showLocation", label: "Show my city", description: "Off shows “somewhere near you” instead.", emoji: "📍" },
];

const NOTIFICATION_ROWS: Array<{ key: keyof Notifications; label: string; description: string; emoji: string }> = [
  { key: "newMatches", label: "New matches", description: "When the feeling is mutual.", emoji: "💘" },
  { key: "newLikes", label: "Likes", description: "Someone liked your card.", emoji: "❤️" },
  { key: "dateReminders", label: "Date reminders", description: "The day before a planned date idea.", emoji: "📅" },
  { key: "membership", label: "Membership", description: "Renewals, receipts, plan changes.", emoji: "💳" },
  { key: "productEmails", label: "Tips & product news", description: "Occasional, unsubscribe-anytime.", emoji: "✨" },
];

export default function SettingsApp({
  settings,
  email,
  planName,
  canExport,
  isAdmin,
  suspended,
}: {
  settings: AccountSettings;
  email: string;
  planName: string;
  canExport: boolean;
  isAdmin: boolean;
  suspended: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [privacy, setPrivacy] = useState<Privacy>(settings.privacy);
  const [notifications, setNotifications] = useState<Notifications>(settings.notifications);
  const [sheet, setSheet] = useState<null | "email" | "password" | "delete">(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState({ email, password: "" });
  const [pwDraft, setPwDraft] = useState({ currentPassword: "", newPassword: "" });
  const [delDraft, setDelDraft] = useState({ password: "", confirm: "" });

  async function patch(flags: { notifications?: Partial<Notifications>; privacy?: Partial<Privacy> }, label: string) {
    if (suspended) {
      toast.show("Suspended accounts can't change settings.");
      return;
    }
    const { ok, body } = await sendJson("/api/settings", { method: "PATCH", body: JSON.stringify(flags) });
    if (!ok) {
      toast.show(messageFrom(body, "Could not save that."));
      router.refresh();
      return;
    }
    const fresh = body.settings as AccountSettings | undefined;
    if (fresh) {
      setPrivacy(fresh.privacy);
      setNotifications(fresh.notifications);
    }
    toast.show(`${label} saved`);
  }

  async function submitEmail() {
    setBusy(true);
    setErr(null);
    const { ok, body } = await sendJson("/api/settings/email", {
      method: "PUT",
      body: JSON.stringify(emailDraft),
    });
    setBusy(false);
    if (!ok) return setErr(messageFrom(body, "Could not change that email."));
    toast.show("Sign-in email updated");
    setSheet(null);
    setEmailDraft((d) => ({ ...d, password: "" }));
    router.refresh();
  }

  async function submitPassword() {
    setBusy(true);
    setErr(null);
    const { ok, body } = await sendJson("/api/settings/password", {
      method: "PUT",
      body: JSON.stringify(pwDraft),
    });
    setBusy(false);
    if (!ok) return setErr(messageFrom(body, "Could not change that password."));
    toast.show("Password changed — you stay signed in here");
    setSheet(null);
    setPwDraft({ currentPassword: "", newPassword: "" });
  }

  async function signOut() {
    await sendJson("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function submitDelete() {
    setBusy(true);
    setErr(null);
    const { ok, body } = await sendJson("/api/settings/account", {
      method: "DELETE",
      body: JSON.stringify(delDraft),
    });
    setBusy(false);
    if (!ok) return setErr(messageFrom(body, "We couldn't delete that — check the password and the confirmation."));
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="px-1">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-white/50">Visibility, notifications, security and your data.</p>
      </header>

      <section>
        <SectionLabel>Who can find me</SectionLabel>
        <div className="space-y-2">
          {PRIVACY_ROWS.map((row) => (
            <Toggle
              key={row.key}
              emoji={row.emoji}
              label={row.label}
              description={row.description}
              checked={privacy[row.key]}
              onChange={(next) => {
                setPrivacy((p) => ({ ...p, [row.key]: next }));
                void patch({ privacy: { [row.key]: next } }, row.label);
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionLabel hint="demo — nothing is emailed">Notifications</SectionLabel>
        <div className="space-y-2">
          {NOTIFICATION_ROWS.map((row) => (
            <Toggle
              key={row.key}
              emoji={row.emoji}
              label={row.label}
              description={row.description}
              checked={notifications[row.key]}
              onChange={(next) => {
                setNotifications((n) => ({ ...n, [row.key]: next }));
                void patch({ notifications: { [row.key]: next } }, row.label);
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionLabel>Membership</SectionLabel>
        <Panel className="!p-0">
          <Row icon="💎" label="Plan" value={planName} href="/app/membership" />
          <Row icon="🧾" label="Billing & invoices" href="/app/billing" />
          <Row icon="📈" label="Activity timeline" href="/app/activity" />
        </Panel>
      </section>

      <section>
        <SectionLabel>Security</SectionLabel>
        <Panel className="!p-0">
          <Row icon="✉️" label="Sign-in email" value={email.length > 18 ? `${email.slice(0, 8)}…${email.slice(-8)}` : email} onClick={() => setSheet("email")} />
          <Row icon="🔒" label="Password" hint="At least 10 characters" onClick={() => setSheet("password")} />
          <Row icon="📤" label="Download my data" hint="JSON, everything we hold" chevron={false} onClick={() => toast.show("Opening the download…")} />
        </Panel>
        <div className="mt-2 px-1">
          {canExport ? (
            <a href="/api/export" className="press inline-flex rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/12">
              ⬇️ Match history (CSV)
            </a>
          ) : (
            <Alert tone="info" action={<Link href="/app/membership" className="text-xs font-semibold underline">Upgrade</Link>}>
              CSV export of your matches comes with Premium.
            </Alert>
          )}
          {/* the data download is a plain GET, so a link does it */}
          <a href="/api/settings/data" className="sr-only">
            Download my data
          </a>
        </div>
      </section>

      {isAdmin && (
        <section>
          <Panel className="!p-0">
            <Row icon="🛠️" label="Admin console" hint="Members, suspensions, revenue" href="/admin" />
          </Panel>
        </section>
      )}

      <section>
        <SectionLabel>Account</SectionLabel>
        <Panel className="!p-0">
          <Row icon="🚪" label="Sign out" chevron={false} onClick={() => void signOut()} />
          <Row icon="🗑️" label="Delete my account" hint="Removes matches, invoices, history" tone="danger" onClick={() => setSheet("delete")} />
        </Panel>
      </section>

      {/* --------------------------------- sheets -------------------------------- */}
      <Sheet
        open={sheet === "email"}
        onClose={() => setSheet(null)}
        title="Change your sign-in email"
        subtitle="Changing the email always costs a password confirmation."
        footer={
          <Button full onClick={() => void submitEmail()} busy={busy}>
            Update email
          </Button>
        }
      >
        <div className="space-y-3">
          {err && <Alert tone="error">{err}</Alert>}
          <TextInput
            label="New email"
            type="email"
            value={emailDraft.email}
            onChange={(e) => setEmailDraft((d) => ({ ...d, email: e.target.value }))}
            autoComplete="email"
          />
          <TextInput
            label="Current password"
            type="password"
            value={emailDraft.password}
            onChange={(e) => setEmailDraft((d) => ({ ...d, password: e.target.value }))}
            autoComplete="current-password"
          />
        </div>
      </Sheet>

      <Sheet
        open={sheet === "password"}
        onClose={() => {
          setSheet(null);
          setErr(null);
        }}
        title="Change your password"
        subtitle="This session stays signed in; a lockout from failed sign-ins is cleared."
        footer={
          <Button full onClick={() => void submitPassword()} busy={busy}>
            Change password
          </Button>
        }
      >
        <div className="space-y-3">
          {err && <Alert tone="error">{err}</Alert>}
          <TextInput
            label="Current password"
            type="password"
            value={pwDraft.currentPassword}
            onChange={(e) => setPwDraft((d) => ({ ...d, currentPassword: e.target.value }))}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={pwDraft.newPassword}
            onChange={(v) => setPwDraft((d) => ({ ...d, newPassword: v }))}
            autoComplete="new-password"
          />
        </div>
      </Sheet>

      <Sheet
        open={sheet === "delete"}
        onClose={() => setSheet(null)}
        title="Delete this account?"
        subtitle="Your profile, matches, date ideas, invoices and history are removed from the demo store. There is no undo."
        footer={
          <Button full variant="danger" onClick={() => void submitDelete()} busy={busy} disabled={delDraft.confirm.trim().toLowerCase() !== email}>
            Delete permanently
          </Button>
        }
      >
        <div className="space-y-3">
          {err && <Alert tone="error">{err}</Alert>}
          <TextInput
            label="Your password"
            type="password"
            value={delDraft.password}
            onChange={(e) => setDelDraft((d) => ({ ...d, password: e.target.value }))}
            autoComplete="current-password"
          />
          <TextInput
            label={`Type “${email}” to confirm`}
            value={delDraft.confirm}
            onChange={(e) => setDelDraft((d) => ({ ...d, confirm: e.target.value }))}
            error={delDraft.confirm && delDraft.confirm.trim().toLowerCase() !== email ? "Must match your sign-in email." : null}
          />
        </div>
      </Sheet>

      {toast.node}
    </div>
  );
}
