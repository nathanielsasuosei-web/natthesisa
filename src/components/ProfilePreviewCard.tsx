"use client";

import { candidateOf, DISCOVER_POOL } from "@/lib/demo-pool";
import {
  INTENT_LABEL,
  type Profile,
  ageFrom,
  compatibilityFor,
  interestEmoji,
  sharedInterests,
  summarizeLocation,
  withinPreferences,
} from "@/lib/profile";
import { PreferenceSummary } from "./PreferenceControls";

/**
 * The card other members see — plus, on the last step of profile creation, the
 * three people your current answers would surface first. Both are computed with
 * the same rules the API uses, so the preview is the truth, not a mock-up.
 */
export default function ProfilePreviewCard({
  name,
  profile,
  showAge = true,
  showLocation = true,
  showSparks = false,
}: {
  name: string;
  profile: Profile;
  showAge?: boolean;
  showLocation?: boolean;
  showSparks?: boolean;
}) {
  const age = ageFrom(profile.birthDate);
  const location = summarizeLocation(profile);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-lg shadow-rose-900/5">
        <div className="relative">
          {profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="" className="h-52 w-full object-cover" />
          ) : (
            <div className="grid h-52 w-full place-items-center bg-gradient-to-br from-rose-100 via-fuchsia-100 to-rose-50">
              <span className="text-6xl" aria-hidden>
                {profile.avatar}
              </span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-sm">
            How others see you
          </span>
          {(profile.pronouns || profile.gender) && (
            <span className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white">
              {profile.pronouns || profile.gender}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-lg font-bold tracking-tight">{name || "Your name"}</h3>
            {age !== null && showAge && (
              <span className="text-lg font-medium text-slate-500">{age}</span>
            )}
          </div>
          {showLocation ? (
            <p className="mt-0.5 text-sm text-slate-500">
              {location || <span className="italic text-slate-400">Add your city so nearby people find you</span>}
            </p>
          ) : (
            <p className="mt-0.5 text-sm italic text-slate-400">Location hidden</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {profile.bio || (
              <span className="italic text-slate-400">
                Your bio goes here — one or two lines about who you are when you&apos;re off the app.
              </span>
            )}
          </p>

          {profile.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"
                >
                  <span aria-hidden>{interestEmoji(tag)}</span>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-rose-50 pt-3">
            <PreferenceSummary value={profile.preferences} />
          </div>
        </div>
      </div>

      {showSparks && <SparkPreview profile={profile} />}
    </div>
  );
}

function SparkPreview({ profile }: { profile: Profile }) {
  const ranked = DISCOVER_POOL.map((seed) => ({
    seed,
    score: compatibilityFor(profile, candidateOf(seed), seed.compatibility),
    fits: withinPreferences(profile, candidateOf(seed)).ok,
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold">Your first sparks</h4>
        <span className="text-xs text-slate-400">{DISCOVER_POOL.length} demo members in the pool</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {ranked.map(({ seed, score, fits }) => {
          const shared = sharedInterests(profile.interests, seed.interests);
          return (
            <li key={seed.name} className="flex items-center gap-3 rounded-xl bg-rose-50/50 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-lg shadow-sm">
                {seed.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {seed.name}, {seed.age}
                  <span className="ml-1.5 text-xs font-normal text-slate-500">{seed.city}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {shared.length > 0
                    ? `Shared: ${shared.join(", ")}`
                    : `Add interests and we'll score ${seed.name.split(" ")[0]} higher`}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  fits ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
                title={fits ? "Inside your preferences" : "Outside your stated preferences"}
              >
                {score}%
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Pool score adjusted for your interests, age range and distance. You&apos;re after{" "}
        {INTENT_LABEL[profile.preferences.intent].toLowerCase()}.
      </p>
    </div>
  );
}
