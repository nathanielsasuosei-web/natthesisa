"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ProfileDto } from "@/lib/profile";
import {
  BIO_MAX,
  COUNTRIES,
  GENDERS,
  GENDER_LABEL,
  NAME_MAX,
  NAME_MIN,
  PHOTO_MAX_COUNT,
  PRONOUN_PRESETS,
  type Gender,
} from "@/lib/profile";
import InterestPicker from "./InterestPicker";
import PhotoGallery from "./PhotoGallery";
import PreferenceControls from "./PreferenceControls";
import ProfilePreviewCard from "./ProfilePreviewCard";
import { Alert, Button, Panel, SectionLabel, Sheet, TextInput, Textarea, fieldsFrom, messageFrom, sendJson } from "./forms";

/**
 * Edit profile — the same PATCH /api/profile (atomic: one bad field and nothing
 * is saved) and PUT /api/profile/gallery the API exposes, laid out as app
 * sections with a sticky save bar instead of a wall of inputs.
 */
export default function ProfileEditApp({
  initial,
  completeness,
}: {
  initial: ProfileDto;
  completeness: { percent: number; missing: string[]; done: boolean };
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: initial.name,
    birthDate: initial.birthDate,
    gender: initial.gender,
    pronouns: initial.pronouns,
    city: initial.city,
    country: initial.country,
    bio: initial.bio,
    interests: initial.interests,
    preferences: initial.preferences,
    photos: initial.photos ?? [],
    avatar: initial.avatar,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);

  const dirty = useMemo(
    () =>
      draft.name !== initial.name ||
      draft.birthDate !== initial.birthDate ||
      draft.gender !== initial.gender ||
      draft.pronouns !== initial.pronouns ||
      draft.city !== initial.city ||
      draft.country !== initial.country ||
      draft.bio !== initial.bio ||
      draft.avatar !== initial.avatar ||
      draft.interests.join("|") !== initial.interests.join("|") ||
      draft.photos.join("|") !== (initial.photos ?? []).join("|") ||
      JSON.stringify(draft.preferences) !== JSON.stringify(initial.preferences),
    [draft, initial]
  );

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  async function save() {
    if (busy) return;
    setBusy(true);
    setFormError(null);
    setErrors({});

    // 1. gallery first — a rejected photo shouldn't block the text edits, but a
    //    saved gallery must be in the profile we then diff against
    if (draft.photos.join("|") !== (initial.photos ?? []).join("|")) {
      const g = await sendJson("/api/profile/gallery", {
        method: "PUT",
        body: JSON.stringify({ photos: draft.photos }),
      });
      if (!g.ok) {
        setBusy(false);
        setFormError(messageFrom(g.body, "The server rejected one of those photos."));
        setErrors(fieldsFrom(g.body));
        return;
      }
    }

    // 2. then only the fields that actually changed
    const patch: Record<string, unknown> = {};
    if (draft.name !== initial.name) patch.name = draft.name;
    if (draft.birthDate !== initial.birthDate) patch.birthDate = draft.birthDate;
    if (draft.gender !== initial.gender) patch.gender = draft.gender;
    if (draft.pronouns !== initial.pronouns) patch.pronouns = draft.pronouns;
    if (draft.city !== initial.city) patch.city = draft.city;
    if (draft.country !== initial.country) patch.country = draft.country;
    if (draft.bio !== initial.bio) patch.bio = draft.bio;
    if (draft.avatar !== initial.avatar) patch.avatar = draft.avatar;
    if (draft.interests.join("|") !== initial.interests.join("|")) patch.interests = draft.interests;
    if (JSON.stringify(draft.preferences) !== JSON.stringify(initial.preferences)) patch.preferences = draft.preferences;

    let next = initial;
    if (Object.keys(patch).length > 0) {
      const p = await sendJson("/api/profile", { method: "PATCH", body: JSON.stringify(patch) });
      setBusy(false);
      if (!p.ok) {
        setFormError(messageFrom(p.body, "Nothing was saved — fix the highlighted field."));
        setErrors(fieldsFrom(p.body));
        return;
      }
      const profile = p.body.profile;
      if (profile && typeof profile === "object") next = profile as ProfileDto;
    }
    setBusy(false);
    setDraft({
      name: next.name,
      birthDate: next.birthDate,
      gender: next.gender,
      pronouns: next.pronouns,
      city: next.city,
      country: next.country,
      bio: next.bio,
      interests: next.interests,
      preferences: next.preferences,
      photos: next.photos ?? [],
      avatar: next.avatar,
    });
    setSavedAt(Date.now());
    router.refresh();
    router.push("/app/profile");
  }

  return (
    <div className="pb-28">
      <header className="px-5 pb-3 pt-3">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Edit profile</h1>
        <p className="mt-0.5 text-sm text-white/50">
          {completeness.percent}% complete
          {completeness.missing.length > 0 ? ` · missing ${completeness.missing.slice(0, 2).join(", ")}` : " · nothing missing"}
        </p>
      </header>

      <div className="space-y-4 px-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Panel>
          <SectionLabel hint={`${draft.photos.length}/${PHOTO_MAX_COUNT}`}>Photos</SectionLabel>
          <PhotoGallery
            photos={draft.photos}
            onChange={(next) => set("photos", next)}
            avatar={draft.avatar}
            onAvatarChange={(emoji) => set("avatar", emoji)}
          />
          {errors.photos && <p className="mt-2 text-xs font-medium text-rose-300">{errors.photos}</p>}
          {errors.photo && <p className="mt-2 text-xs font-medium text-rose-300">{errors.photo}</p>}
        </Panel>

        <Panel>
          <SectionLabel>The basics</SectionLabel>
          <div className="space-y-3">
            <TextInput
              label="Display name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
              hint={`${NAME_MIN}–${NAME_MAX} characters. This is what matches see first.`}
              maxLength={NAME_MAX}
            />
            <TextInput
              label="Date of birth"
              type="date"
              value={draft.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
              error={errors.birthDate}
              hint="Only your age is shown. You must be 18 or older."
            />
            <div>
              <SectionLabel>Gender</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={draft.gender === g}
                    onClick={() => set("gender", (draft.gender === g ? "" : g) as Gender | "")}
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
          </div>
        </Panel>

        <Panel>
          <SectionLabel>Where you are</SectionLabel>
          <div className="space-y-3">
            <TextInput
              label="City"
              value={draft.city}
              onChange={(e) => set("city", e.target.value)}
              error={errors.city}
              placeholder="Accra"
              hint="Used for the distance filter in your deck."
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
        </Panel>

        <Panel>
          <SectionLabel hint={`${[...draft.bio].length}/${BIO_MAX}`}>Your bio</SectionLabel>
          <Textarea
            value={draft.bio}
            onChange={(e) => set("bio", e.target.value)}
            error={errors.bio}
            maxLength={BIO_MAX}
            placeholder="Bookshops, jollof debates, long walks at Labadi. Looking for someone to argue about films with."
          />
        </Panel>

        <Panel>
          <SectionLabel>Interests</SectionLabel>
          <InterestPicker selected={draft.interests} onChange={(next) => set("interests", next)} error={errors.interests} />
        </Panel>

        <Panel>
          <SectionLabel>Who I&apos;d like to meet</SectionLabel>
          <PreferenceControls
            value={draft.preferences}
            onChange={(next) => set("preferences", next)}
            errors={errors}
            myAge={initial.age}
          />
        </Panel>

        <button
          type="button"
          onClick={() => setPreview(true)}
          className="press w-full rounded-3xl bg-white/[0.05] p-4 text-left ring-1 ring-white/10"
        >
          <span className="flex items-center gap-3">
            <span aria-hidden className="grid size-9 place-items-center rounded-2xl bg-white/[0.07] text-base">
              👀
            </span>
            <span>
              <span className="block text-[15px] font-medium text-white">Preview your card</span>
              <span className="block text-xs text-white/45">See it the way the deck shows it to other members</span>
            </span>
            <span className="ml-auto text-white/25">›</span>
          </span>
        </button>
      </div>

      {/* sticky save bar */}
      <div className="glass safe-bottom fixed inset-x-0 bottom-[70px] z-40 mx-auto max-w-[430px] border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-xs text-white/50">
            {!dirty ? (savedAt ? "All changes saved ✓" : "Nothing to save") : "Unsaved changes"}
          </p>
          <Button variant="ghost" onClick={() => router.push("/app/profile")} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void save()} busy={busy} disabled={!dirty}>
            Save
          </Button>
        </div>
      </div>

      <Sheet open={preview} onClose={() => setPreview(false)} title="How others see you" subtitle="Live preview of your card, from the fields you've typed.">
        <ProfilePreviewCard
          name={draft.name}
          profile={{
            completedAt: initial.completedAt,
            updatedAt: initial.updatedAt,
            birthDate: draft.birthDate,
            gender: draft.gender,
            pronouns: draft.pronouns,
            city: draft.city,
            country: draft.country,
            bio: draft.bio,
            interests: draft.interests,
            avatar: draft.avatar,
            avatarPicked: initial.avatarPicked,
            photo: draft.photos[0] ?? null,
            photos: draft.photos,
            preferences: draft.preferences,
          }}
          showAge={initial.settings.privacy.showAge}
          showLocation={initial.settings.privacy.showLocation}
          showSparks
        />
      </Sheet>
    </div>
  );
}
