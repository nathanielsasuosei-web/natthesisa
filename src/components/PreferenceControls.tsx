"use client";

import {
  GENDERS,
  GENDER_LABEL,
  INTENTS,
  INTENT_LABEL,
  MAX_AGE,
  GENDER_PLURAL,
  MIN_AGE,
  Preferences,
  summarizeLocation,
  type Gender,
} from "@/lib/profile";
import { Chip, Field } from "./forms";

/**
 * "Who I'd like to meet" — gender preference, age range, distance and intent.
 * Shared by profile creation and the profile editor so both stay in sync with
 * the same validation ranges the API enforces.
 */
export default function PreferenceControls({
  value,
  onChange,
  errors = {},
  myAge,
}: {
  value: Preferences;
  onChange: (next: Preferences) => void;
  errors?: Record<string, string>;
  myAge?: number | null;
}) {
  const set = <K extends keyof Preferences>(key: K, next: Preferences[K]) =>
    onChange({ ...value, [key]: next });

  const toggleGender = (g: Gender) => {
    const has = value.interestedIn.includes(g);
    set("interestedIn", has ? value.interestedIn.filter((x) => x !== g) : [...value.interestedIn.filter((x) => x !== g), g].sort());
  };

  const distanceLabel = (km: number) =>
    km === 0 ? "Anywhere" : km >= 500 ? `Within ${km} km` : km === 10 ? "Within 10 km" : `Within ${km} km`;

  return (
    <div className="space-y-5">
      <Field
        label="Interested in"
        hint="Choose one or more. Leave all three off and we'll show everyone in your range."
        error={errors.interestedIn}
      >
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Chip key={g} active={value.interestedIn.includes(g)} onClick={() => toggleGender(g)}>
              {GENDER_LABEL[g]}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="rounded-xl border ring-1 ring-white/10 bg-white/[0.05] p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-white/85">Age range</p>
          <p className="text-sm font-semibold text-rose-300">
            {value.ageMin} – {value.ageMax}
          </p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-white/55">Youngest I'll see {myAge ? `· you're ${myAge}` : ""}</span>
            <input
              type="number"
              min={MIN_AGE}
              max={MAX_AGE}
              value={value.ageMin}
              onChange={(e) => {
                const n = Math.trunc(Number(e.target.value) || MIN_AGE);
                set("ageMin", Math.max(MIN_AGE, Math.min(n, value.ageMax)));
              }}
              className="w-full rounded-xl ring-1 ring-white/10 bg-white/[0.06] px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-rose-400/70 focus:bg-white/[0.1]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-white/55">Oldest I'll see</span>
            <input
              type="number"
              min={MIN_AGE}
              max={MAX_AGE}
              value={value.ageMax}
              onChange={(e) => {
                const n = Math.trunc(Number(e.target.value) || MAX_AGE);
                set("ageMax", Math.min(MAX_AGE, Math.max(n, value.ageMin)));
              }}
              className="w-full rounded-xl ring-1 ring-white/10 bg-white/[0.06] px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-rose-400/70 focus:bg-white/[0.1]"
            />
          </label>
        </div>
        {errors.ageMin && <p className="mt-2 text-xs font-medium text-rose-300">{errors.ageMin}</p>}
      </div>

      <Field label="Distance" hint="How far are you willing to travel for a good date?" error={errors.distanceKm}>
        <div className="flex flex-wrap gap-2">
          {[10, 25, 50, 100, 300, 0].map((km) => (
            <Chip key={km} active={value.distanceKm === km} onClick={() => set("distanceKm", km)}>
              {distanceLabel(km)}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="What you're after" error={errors.intent}>
        <div className="grid gap-2 sm:grid-cols-2">
          {INTENTS.map((intent) => {
            const active = value.intent === intent;
            return (
              <button
                key={intent}
                type="button"
                onClick={() => set("intent", intent)}
                aria-pressed={active}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  active
                    ? "border-rose-500 bg-rose-500/15 font-semibold text-white shadow"
                    : "ring-1 ring-white/10 bg-white/[0.05] text-white/85 hover:bg-white/[0.1]"
                }`}
              >
                <span className="mr-1.5">{active ? "💘" : "♡"}</span>
                {INTENT_LABEL[intent]}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

/** One-line summary used on cards and section headers. */
export function PreferenceSummary({ value, profile }: { value: Preferences; profile?: { city: string; country: string } }) {
  const who =
    value.interestedIn.length === 0 || value.interestedIn.length === GENDERS.length
      ? "everyone"
      : value.interestedIn.map((g) => GENDER_PLURAL[g]).join(" & ");
  return (
    <p className="text-xs text-white/55">
      Dating {who}, {value.ageMin}–{value.ageMax} · {value.distanceKm === 0 ? "anywhere" : `within ${value.distanceKm} km`}
      {profile?.city ? ` · ${summarizeLocation(profile)}` : ""} · {INTENT_LABEL[value.intent]}
    </p>
  );
}
