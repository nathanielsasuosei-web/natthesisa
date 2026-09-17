"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  COUNTRIES,
  GENDERS,
  GENDER_LABEL,
  INTEREST_MIN,
  MIN_AGE,
  PRONOUN_PRESETS,
  type Gender,
  type Preferences,
  type Profile,
  ageFrom,
  summarizeLocation,
} from "@/lib/profile";
import InterestPicker from "./InterestPicker";
import PhotoPicker from "./PhotoPicker";
import PreferenceControls from "./PreferenceControls";
import ProfilePreviewCard from "./ProfilePreviewCard";
import { Alert, Button, Select, TextInput, Textarea, fieldsFrom, messageFrom, sendJson } from "./forms";

/**
 * Profile creation, step by step. Every step is saved with the same PATCH
 * endpoint the profile editor uses, so "continue" is a real save: reload the
 * page mid-wizard and you're still where you left it.
 */

interface Draft {
  name: string;
  birthDate: string;
  gender: Gender | "";
  pronouns: string;
  city: string;
  country: string;
  bio: string;
  interests: string[];
  avatar: string;
  avatarPicked: boolean;
  photo: string | null;
  preferences: Preferences;
}

const STEPS = [
  { key: "photo", label: "Photo", emoji: "📸", blurb: "A face people can recognise" },
  { key: "basics", label: "Basics", emoji: "🧭", blurb: "Name, age, gender, where you are" },
  { key: "about", label: "About you", emoji: "✍️", blurb: "Bio and interests" },
  { key: "prefs", label: "Who you want", emoji: "💘", blurb: "Preferences and a preview" },
] as const;

export default function OnboardingWizard({ initial, planName }: { initial: Draft; planName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const profile: Profile = useMemo(
    () => ({ ...draft, completedAt: null, updatedAt: null }),
    [draft]
  );
  const age = ageFrom(draft.birthDate);

  async function save(patch: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setErrors({});
    setBanner(null);
    try {
      const { ok, body } = await sendJson("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!ok) {
        setErrors(fieldsFrom(body));
        setBanner(messageFrom(body, "Could not save that — check the highlighted fields."));
        return false;
      }
      return true;
    } catch {
      setBanner("Network error — nothing was saved. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    // mark the wizard as done; the dashboard banner nudges if bits are missing
    await sendJson("/api/profile/complete", { method: "POST", body: "{}" }).catch(() => null);
    setBusy(false);
    router.push("/dashboard");
    router.refresh();
  }

  async function next() {
    let payload: Record<string, unknown> | null = null;
    if (step === 1)
      payload = {
        name: draft.name,
        birthDate: draft.birthDate,
        gender: draft.gender,
        pronouns: draft.pronouns,
        city: draft.city,
        country: draft.country,
      };
    if (step === 2) payload = { bio: draft.bio, interests: draft.interests };
    if (step === 3) payload = { preferences: draft.preferences };
    if (step === 0) return advance();
    if (payload && !(await save(payload))) return;
    advance();
  }

  function advance() {
    setErrors({});
    setBanner(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Step {step + 1} of {STEPS.length} · {planName} plan
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{STEPS[step].label}</h1>
            <p className="mt-1 text-sm text-slate-600">{STEPS[step].blurb}</p>
          </div>
          <button
            onClick={() => void finish()}
            disabled={busy}
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
          >
            Finish later
          </button>
        </div>

        {/* progress */}
        <div className="mt-5 flex gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => i <= step && setStep(i)}
              aria-label={`Go to ${s.label}`}
              className={`h-1.5 flex-1 rounded-full transition ${
                i <= step ? "bg-rose-600" : "bg-rose-100"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm shadow-rose-900/5">
          {banner && (
            <div className="mb-4">
              <Alert tone="error">{banner}</Alert>
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <PhotoPicker
                name={draft.name}
                photo={draft.photo}
                avatar={draft.avatar}
                onChange={({ photo, avatar }) => setDraft((d) => ({ ...d, photo, avatar }))}
              />
              <p className="text-xs text-slate-500">
                No photo is fine — pick an avatar and you can add a real one from your profile page any time.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <TextInput
                label="Display name"
                required
                value={draft.name}
                error={errors.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                hint="You can be a first name, a nickname, or a full name."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Date of birth"
                  required
                  type="date"
                  value={draft.birthDate}
                  error={errors.birthDate}
                  onChange={(e) => setDraft((d) => ({ ...d, birthDate: e.target.value }))}
                  hint={age !== null ? `That makes you ${age}.` : `Members must be ${MIN_AGE}+.`}
                />
                <Select
                  label="Gender"
                  required
                  value={draft.gender}
                  error={errors.gender}
                  onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value as Gender | "" }))}
                  options={[
                    { value: "", label: "Prefer not to say" },
                    ...GENDERS.map((g) => ({ value: g, label: GENDER_LABEL[g] })),
                  ]}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Pronouns"
                  value={draft.pronouns}
                  error={errors.pronouns}
                  onChange={(e) => setDraft((d) => ({ ...d, pronouns: e.target.value }))}
                  placeholder="she/her"
                  list="pronoun-options"
                />
                <datalist id="pronoun-options">
                  {PRONOUN_PRESETS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <TextInput
                  label="City"
                  required
                  value={draft.city}
                  error={errors.city}
                  onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  placeholder="Accra"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Country"
                  value={draft.country}
                  onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                  options={COUNTRIES}
                />
                <div className="flex items-end">
                  <p className="text-xs text-slate-500">
                    {summarizeLocation(draft) || "Location decides who sees you in Discover nearby."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Textarea
                label="Bio"
                value={draft.bio}
                maxLength={500}
                error={errors.bio}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder="Pastry chef by sunrise, beach walker by sunset. I'll beat you at Scrabble and then buy you coffee."
                hint="40+ characters reads as real effort. Say what you're like on a date, not just your job."
              />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Interests <span className="ml-1 text-xs font-normal text-slate-500">at least {INTEREST_MIN}</span>
                </p>
                <InterestPicker
                  selected={draft.interests}
                  error={errors.interests}
                  onChange={(next) => setDraft((d) => ({ ...d, interests: next }))}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <PreferenceControls
              value={draft.preferences}
              myAge={age}
              errors={errors}
              onChange={(preferences) => setDraft((d) => ({ ...d, preferences }))}
            />
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-rose-50 pt-5">
            <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={busy || step === 0}>
              ← Back
            </Button>
            <div className="flex gap-2">
              {step === 0 && (
                <Button type="button" variant="ghost" onClick={() => advance()} disabled={busy}>
                  Skip for now
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => void next()} busy={busy}>
                  {busy ? "Saving…" : "Save & continue"}
                </Button>
              ) : (
                <Button type="button" onClick={() => void finish()} busy={busy}>
                  {busy ? "Finishing…" : "Finish and start matching 💘"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* live preview */}
      <aside className="lg:sticky lg:top-10 lg:self-start">
        <div className="mb-3 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              title={s.label}
              className={`grid size-7 place-items-center rounded-full text-xs ${
                i < step || (i === step && step > 0)
                  ? "bg-emerald-100 text-emerald-700"
                  : i === step
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < step ? "✓" : s.emoji}
            </span>
          ))}
        </div>
        <ProfilePreviewCard
          name={draft.name}
          profile={profile}
          showAge={age !== null}
          showLocation={Boolean(draft.city)}
          showSparks={step === 3}
        />
      </aside>
    </div>
  );
}
