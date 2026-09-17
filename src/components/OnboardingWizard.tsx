"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BIO_MAX,
  COUNTRIES,
  GENDERS,
  GENDER_LABEL,
  INTEREST_MIN,
  MIN_AGE,
  NAME_MAX,
  PHOTO_MAX_COUNT,
  PRONOUN_PRESETS,
  type Gender,
  type Preferences,
  type Profile,
  ageFrom,
  summarizeLocation,
} from "@/lib/profile";
import InterestPicker from "./InterestPicker";
import PhotoGallery from "./PhotoGallery";
import PreferenceControls from "./PreferenceControls";
import ProfilePreviewCard from "./ProfilePreviewCard";
import { Alert, Button, SectionLabel, TextInput, Textarea, fieldsFrom, messageFrom, sendJson } from "./forms";

/**
 * Profile creation, one screen at a time — the same flow as before, now wearing
 * the app. Every step is a real save through PATCH /api/profile (and
 * PUT /api/profile/gallery for photos), so closing the tab mid-wizard loses
 * nothing, and the Finish button is the same POST /api/profile/complete the
 * API gates the deck behind.
 */

export interface WizardDraft {
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
  photos: string[];
  preferences: Preferences;
}

const STEPS = [
  { key: "photos", label: "Photos", emoji: "📸", blurb: `Up to ${PHOTO_MAX_COUNT}. The first one is your main shot.` },
  { key: "basics", label: "The basics", emoji: "🧭", blurb: "Name, age, gender, where you are." },
  { key: "about", label: "About you", emoji: "✍️", blurb: "A bio and the things you'd actually do together." },
  { key: "prefs", label: "Who you want", emoji: "💘", blurb: "This is what filters your deck." },
  { key: "done", label: "You're in", emoji: "🎉", blurb: "Here's the card other members will swipe on." },
] as const;

export default function OnboardingWizard({ initial, planName }: { initial: WizardDraft; planName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const profile: Profile = useMemo(() => ({ ...draft, completedAt: null, updatedAt: null }), [draft]);
  const age = ageFrom(draft.birthDate);
  const last = STEPS.length - 1;

  const set = <K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  async function save(patch: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setErrors({});
    setBanner(null);
    try {
      const { ok, body } = await sendJson("/api/profile", { method: "PATCH", body: JSON.stringify(patch) });
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

  async function next() {
    // photos travel on their own endpoint
    if (step === 0) {
      if (draft.photos.length > 0) {
        setBusy(true);
        const { ok, body } = await sendJson("/api/profile/gallery", {
          method: "PUT",
          body: JSON.stringify({ photos: draft.photos }),
        });
        setBusy(false);
        if (!ok) {
          setBanner(messageFrom(body, "The server rejected one of those photos."));
          setErrors(fieldsFrom(body));
          return;
        }
      }
      // the avatar choice belongs to this step too — save it whether or not
      // there are photos, so "Skip this step" doesn't lose the pick
      if (draft.avatar !== initial.avatar) {
        if (!(await save({ avatar: draft.avatar }))) return;
      }
      return advance();
    }

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
    if (step === 2) payload = { bio: draft.bio, interests: draft.interests, avatar: draft.avatar };
    if (step === 3) payload = { preferences: draft.preferences };
    if (payload && !(await save(payload))) return;
    advance();
  }

  function advance() {
    setErrors({});
    setBanner(null);
    setStep((s) => Math.min(s + 1, last));
  }

  async function finish() {
    setBusy(true);
    await sendJson("/api/profile/complete", { method: "POST", body: "{}" }).catch(() => null);
    setBusy(false);
    router.push("/app/discover");
    router.refresh();
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* progress */}
      <header className="shrink-0 px-5 pb-2 pt-4">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-label={s.label}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-gradient-to-r from-rose-400 to-fuchsia-400" : "bg-white/12"
              }`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-300">
              Step {step + 1} of {STEPS.length} · {planName} plan
            </p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-white">
              {STEPS[step].emoji} {STEPS[step].label}
            </h1>
            <p className="mt-1 text-sm text-white/50">{STEPS[step].blurb}</p>
          </div>
          {step !== last && (
            <button
              type="button"
              onClick={() => void finish()}
              disabled={busy}
              className="press shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white/45 ring-1 ring-white/10 transition hover:text-white disabled:opacity-50"
            >
              Later
            </button>
          )}
        </div>
      </header>

      {/* step body */}
      <div key={step} className="animate-card-in no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {banner && (
          <div className="mb-3">
            <Alert tone="error">{banner}</Alert>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-3">
            <PhotoGallery
              photos={draft.photos}
              onChange={(photos) => set("photos", photos)}
              avatar={draft.avatar}
              onAvatarChange={(avatar) => set("avatar", avatar)}
              aspect="square"
            />
            <p className="px-1 text-xs leading-relaxed text-white/40">
              No photo is fine — the avatar you picked stands in, and you can add real photos from your profile any time.
              Photos are resized in your browser, then re-checked by the server.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3.5">
            <TextInput
              label="Display name"
              required
              value={draft.name}
              error={errors.name}
              onChange={(e) => set("name", e.target.value)}
              hint={`${2}–${NAME_MAX} characters. A first name or nickname works.`}
              maxLength={NAME_MAX}
              autoComplete="name"
            />
            <TextInput
              label="Date of birth"
              required
              type="date"
              value={draft.birthDate}
              error={errors.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
              hint={age !== null ? `That makes you ${age}.` : `Members must be ${MIN_AGE} or older.`}
            />
            <div>
              <SectionLabel>Gender</SectionLabel>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={draft.gender === ""}
                  onClick={() => set("gender", "")}
                  className={`press rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition ${
                    draft.gender === "" ? "bg-white/15 text-white ring-white/25" : "bg-white/[0.06] text-white/60 ring-white/10"
                  }`}
                >
                  Prefer not to say
                </button>
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={draft.gender === g}
                    onClick={() => set("gender", g)}
                    className={`press rounded-full px-3.5 py-2 text-sm font-medium transition ${
                      draft.gender === g
                        ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-lg shadow-rose-900/40"
                        : "bg-white/[0.06] text-white/70 ring-1 ring-white/10"
                    }`}
                  >
                    {GENDER_LABEL[g]}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="mt-1.5 text-xs font-medium text-rose-300">{errors.gender}</p>}
            </div>
            <div>
              <SectionLabel>Pronouns</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {PRONOUN_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={draft.pronouns === p}
                    onClick={() => set("pronouns", draft.pronouns === p ? "" : p)}
                    className={`press rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                      draft.pronouns === p ? "bg-white/15 text-white ring-white/25" : "bg-white/[0.05] text-white/60 ring-white/10"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <TextInput
              label="City"
              required
              value={draft.city}
              error={errors.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Accra"
              hint={summarizeLocation(draft) || "Location decides who sees you nearby."}
            />
            <label className="block">
              <span className="mb-1.5 block px-1 text-[13px] font-medium text-white/70">Country</span>
              <select
                value={draft.country}
                onChange={(e) => set("country", e.target.value)}
                className="w-full appearance-none rounded-2xl bg-white/[0.07] px-4 py-3.5 text-[15px] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-rose-400/70 [&>option]:bg-[#1b1017]"
              >
                <option value="">Not set</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Textarea
              label="Your bio"
              value={draft.bio}
              maxLength={BIO_MAX}
              error={errors.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Pastry chef by sunrise, beach walker by sunset. I'll beat you at Scrabble and then buy you coffee."
              hint={`40+ characters reads as real effort. ${[...draft.bio].length}/${BIO_MAX}`}
            />
            <div>
              <SectionLabel hint={`at least ${INTEREST_MIN}`}>Interests</SectionLabel>
              <InterestPicker selected={draft.interests} error={errors.interests} onChange={(interests) => set("interests", interests)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <PreferenceControls value={draft.preferences} myAge={age} errors={errors} onChange={(preferences) => set("preferences", preferences)} />
        )}

        {step === last && (
          <div className="space-y-4">
            <ProfilePreviewCard
              name={draft.name}
              profile={profile}
              showAge={age !== null}
              showLocation={Boolean(draft.city)}
              showSparks
            />
            <p className="px-1 text-xs leading-relaxed text-white/45">
              That&apos;s the card. Your deck is already ranked with it — people who fit your age range, distance and
              gender preference come first, and a like only becomes a match when it&apos;s mutual.
            </p>
          </div>
        )}
      </div>

      {/* footer nav */}
      <footer className="glass safe-bottom shrink-0 border-t border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          {step > 0 && step !== last && (
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={busy}>
              ←
            </Button>
          )}
          {step === last ? (
            <Button full onClick={() => void finish()} busy={busy}>
              {busy ? "Opening your deck…" : "Start matching 💘"}
            </Button>
          ) : (
            <Button full onClick={() => void next()} busy={busy}>
              {busy ? "Saving…" : step === 0 && draft.photos.length === 0 ? "Skip this step" : "Save & continue"}
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-white/30">
          {step === last ? "You can change any of this later in the app" : "Saved as you go — reload any time"}
        </p>
      </footer>
    </div>
  );
}
