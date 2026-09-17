"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BIO_MAX,
  profileFromDto,
  COUNTRIES,
  GENDERS,
  GENDER_LABEL,
  INTEREST_MAX,
  INTEREST_MIN,
  MIN_AGE,
  PRONOUN_PRESETS,
  type Gender,
  type Profile,
  type ProfileDto,
  ageFrom,
  summarizeLocation,
} from "@/lib/profile";
import type { Completeness } from "@/lib/profile";
import Avatar from "./Avatar";
import InterestPicker from "./InterestPicker";
import PhotoPicker from "./PhotoPicker";
import PreferenceControls from "./PreferenceControls";
import ProfilePreviewCard from "./ProfilePreviewCard";
import { Alert, Button, Card, Select, TextInput, Textarea, fieldsFrom, messageFrom, sendJson } from "./forms";

/**
 * The full profile editor: everything collected during profile creation, plus a
 * live preview. Each card saves on its own — nothing is lost by leaving a
 * section half-finished, because the section you saved is already on the server.
 */
export default function ProfileEditor({
  initial,
  completeness,
  planName,
  suspended,
}: {
  initial: ProfileDto;
  completeness: Completeness;
  planName: string;
  suspended: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDto>(initial);
  const [saved, setSaved] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>, section: string): Promise<PatchResult> {
    setBanner(null);
    setSaved(null);
    const { ok, body } = await sendJson("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!ok) {
      const fields = fieldsFrom(body);
      if (Object.keys(fields).length === 0) setBanner(messageFrom(body, "Could not save that."));
      return { ok: false, fields };
    }
    const nextProfile = body.profile;
    if (nextProfile && typeof nextProfile === "object") setProfile(nextProfile as ProfileDto);
    setSaved(section);
    router.refresh();
    window.setTimeout(() => setSaved((s) => (s === section ? null : s)), 2600);
    return { ok: true, fields: {} };
  }

  const age = ageFrom(profile.birthDate);
  const previewProfile: Profile = useMemo(() => profileFromDto(profile), [profile]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-white p-5">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} photo={profile.photo} emoji={profile.avatar} size={56} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">{profile.name}&rsquo;s profile</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {age !== null ? `${age} · ` : ""}
              {summarizeLocation(profile) || "No location yet"} · {planName} member
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CompletenessRing percent={completeness.percent} />
          <Link
            href="/dashboard/settings"
            className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Account settings
          </Link>
        </div>
      </header>

      {completeness.percent < 100 && (
        <Alert
          tone="info"
          action={
            <span className="text-xs font-semibold uppercase tracking-wide">
              Add {completeness.missing.slice(0, 3).join(", ")}
            </span>
          }
        >
          Your profile is {completeness.percent}% complete — fuller profiles get noticeably more likes.
        </Alert>
      )}
      {suspended && (
        <Alert tone="warn">
          Your account is suspended, so likes and matches are blocked. Profile edits are still allowed
          so you can keep your details current while you appeal.
        </Alert>
      )}
      {banner && <Alert tone="error">{banner}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card
            title="Profile photo"
            icon="📸"
            description="Shown first. We crop to a square in your browser before uploading."
            action={<SavedPill show={saved === "photo"} />}
          >
            <PhotoPicker
              name={profile.name}
              photo={profile.photo}
              avatar={profile.avatar}
              onChange={() => {
                void reload();
                setSaved("photo");
                window.setTimeout(() => setSaved((s) => (s === "photo" ? null : s)), 2600);
              }}
            />
          </Card>

          <BasicsCard profile={profile} onPatch={patch} saved={saved === "basics"} />

          <AboutCard profile={profile} onPatch={patch} saved={saved === "about"} />

          <Card
            title="Dating preferences"
            icon="💘"
            description="Who turns up in Discover — gender, age range, distance and what you're after."
            action={<SavedPill show={saved === "prefs"} />}
          >
            <PreferencesCard profile={profile} onPatch={patch} />
          </Card>

          <p className="text-xs text-slate-500">
            Preferences and profile fields are validated on the server too —{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">PATCH /api/profile</code>{" "}
            rejects under-age birthdays, oversized photos and malformed interest tags.
          </p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <ProfilePreviewCard
            name={profile.name}
            profile={previewProfile}
            showAge={profile.settings.privacy.showAge}
            showLocation={profile.settings.privacy.showLocation}
          />
          <div className="rounded-2xl border border-rose-100 bg-white p-5">
            <h3 className="text-sm font-semibold">Who can see what</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
              <li className="flex justify-between gap-2">
                <span>Age</span>
                <span className="font-medium">{profile.settings.privacy.showAge ? "Shown" : "Hidden"}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Location</span>
                <span className="font-medium">{profile.settings.privacy.showLocation ? "Shown" : "Hidden"}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>In Discover</span>
                <span className="font-medium">{profile.settings.privacy.discoverable ? "Visible" : "Hidden"}</span>
              </li>
            </ul>
            <Link
              href="/dashboard/settings"
              className="mt-3 block rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Change in account settings
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );

  /** Photo uploads go to their own endpoint, so re-read the saved profile. */
  async function reload() {
    const { ok, body } = await sendJson("/api/profile", { method: "GET", body: "{}" });
    const p = ok ? (body.profile as ProfileDto | undefined) : undefined;
    if (p) setProfile(p);
    router.refresh();
  }
}

function SavedPill({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="animate-fade-up rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Saved
    </span>
  );
}

function CompletenessRing({ percent }: { percent: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2" title={`Profile is ${percent}% complete`}>
      <svg viewBox="0 0 56 56" className="size-12 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#ffe4e6" strokeWidth="6" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={percent >= 100 ? "#10b981" : "#e11d48"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * c} ${c}`}
        />
      </svg>
      <div className="leading-tight">
        <p className="text-sm font-bold">{percent}%</p>
        <p className="text-[11px] text-slate-500">complete</p>
      </div>
    </div>
  );
}

/* ------------------------------ sections ------------------------------ */

interface PatchResult {
  ok: boolean;
  fields: Record<string, string>;
}

type PatchFn = (payload: Record<string, unknown>, section: string) => Promise<PatchResult>;

function BasicsCard({ profile, onPatch, saved }: { profile: ProfileDto; onPatch: PatchFn; saved: boolean }) {
  const [draft, setDraft] = useState({
    name: profile.name,
    birthDate: profile.birthDate,
    gender: profile.gender,
    pronouns: profile.pronouns,
    city: profile.city,
    country: profile.country,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const dirty =
    draft.name !== profile.name ||
    draft.birthDate !== profile.birthDate ||
    draft.gender !== profile.gender ||
    draft.pronouns !== profile.pronouns ||
    draft.city !== profile.city ||
    draft.country !== profile.country;

  async function save() {
    setBusy(true);
    const result = await onPatch({ ...draft }, "basics");
    setErrors(result.fields);
    setBusy(false);
  }

  const age = ageFrom(draft.birthDate);

  return (
    <Card
      title="The basics"
      icon="🧭"
      description="Your display name, age, gender and where you are."
      action={
        <div className="flex items-center gap-2">
          <SavedPill show={saved} />
          {dirty && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}
        </div>
      }
      footer={
        <>
          <Button onClick={() => void save()} busy={busy} disabled={!dirty}>
            {dirty ? "Save changes" : "Saved ✓"}
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setDraft({
                name: profile.name,
                birthDate: profile.birthDate,
                gender: profile.gender,
                pronouns: profile.pronouns,
                city: profile.city,
                country: profile.country,
              })
            }
            disabled={!dirty}
          >
            Reset
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Display name"
            required
            value={draft.name}
            error={errors.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            hint="Also used as your account name across the app."
          />
          <TextInput
            label="Date of birth"
            required
            type="date"
            value={draft.birthDate}
            error={errors.birthDate}
            onChange={(e) => setDraft((d) => ({ ...d, birthDate: e.target.value }))}
            hint={age !== null ? `${age} years old` : `Members must be ${MIN_AGE}+`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Gender"
            value={draft.gender}
            error={errors.gender}
            onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value as Gender | "" }))}
            options={[
              { value: "", label: "Prefer not to say" },
              ...GENDERS.map((g) => ({ value: g, label: GENDER_LABEL[g] })),
            ]}
          />
          <TextInput
            label="Pronouns"
            value={draft.pronouns}
            error={errors.pronouns}
            onChange={(e) => setDraft((d) => ({ ...d, pronouns: e.target.value }))}
            placeholder="she/her"
            list="pronoun-options"
          />
          <Select
            label="Country"
            value={draft.country}
            onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
            options={COUNTRIES}
          />
        </div>
        <TextInput
          label="City"
          required
          value={draft.city}
          error={errors.city}
          onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
          placeholder="Accra"
          hint="Used for “near you” in Discover and on your profile card."
        />
        <datalist id="pronoun-options">
          {PRONOUN_PRESETS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
    </Card>
  );
}

function AboutCard({ profile, onPatch, saved }: { profile: ProfileDto; onPatch: PatchFn; saved: boolean }) {
  const [bio, setBio] = useState(profile.bio);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const dirty = bio !== profile.bio || interests.join("|") !== profile.interests.join("|");

  async function save() {
    setBusy(true);
    const result = await onPatch({ bio, interests }, "about");
    setErrors(result.fields);
    setBusy(false);
  }

  return (
    <Card
      title="About you"
      icon="✍️"
      description="The two things members say they look at first."
      action={
        <div className="flex items-center gap-2">
          <SavedPill show={saved} />
          {dirty && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}
        </div>
      }
      footer={
        <>
          <Button onClick={() => void save()} busy={busy} disabled={!dirty}>
            {dirty ? "Save changes" : "Saved ✓"}
          </Button>
          <span className="text-xs text-slate-500">
            {interests.length} interest{interests.length === 1 ? "" : "s"} · min {INTEREST_MIN}, max {INTEREST_MAX}
          </span>
        </>
      }
    >
      <div className="space-y-5">
        <Textarea
          label="Bio"
          value={bio}
          maxLength={BIO_MAX}
          error={errors.bio}
          onChange={(e) => setBio(e.target.value)}
          hint={
            bio.trim().length >= 40
              ? "Good length — specific beats clever."
              : `${Math.max(0, 40 - bio.trim().length)} more characters and this counts as complete.`
          }
          placeholder="What you do, what you're bad at, what a good Saturday looks like."
        />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Interests</p>
          <InterestPicker selected={interests} error={errors.interests} onChange={setInterests} />
        </div>
      </div>
    </Card>
  );
}

function PreferencesCard({ profile, onPatch }: { profile: ProfileDto; onPatch: PatchFn }) {
  const [draft, setDraft] = useState(profile.preferences);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile.preferences);

  return (
    <div className="space-y-5">
      <PreferenceControls
        value={draft}
        myAge={ageFrom(profile.birthDate)}
        onChange={(next) => {
          setDraft(next);
        }}
      />
      <div className="flex flex-wrap items-center gap-3 border-t border-rose-50 pt-4">
        <Button
          busy={busy}
          disabled={!dirty}
          onClick={async () => {
            setBusy(true);
            await onPatch({ preferences: draft }, "prefs");
            setBusy(false);
          }}
        >
          {dirty ? "Save preferences" : "Saved ✓"}
        </Button>
        {dirty && <span className="text-xs font-medium text-amber-600">Unsaved changes</span>}
        <Button variant="ghost" onClick={() => setDraft(profile.preferences)} disabled={!dirty}>
          Reset
        </Button>
      </div>
    </div>
  );
}
