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
      <div className="overflow-hidden overflow-hidden rounded-3xl bg-white/[0.05] ring-1 ring-white/12">
        <div className="relative">
          {profile.photos && profile.photos.length > 1 ? (
            <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
              {profile.photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={i === 0 ? "" : `Photo ${i + 1}`} className="h-52 w-full shrink-0 snap-center object-cover" />
              ))}
            </div>
          ) : profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="" className="h-52 w-full object-cover" />
          ) : (
            <div className="grid h-52 w-full place-items-center bg-gradient-to-br from-rose-500/30 via-fuchsia-500/25 to-indigo-500/25">
              <span className="text-6xl" aria-hidden>
                {profile.avatar}
              </span>
            </div>
          )}
          {profile.photos && profile.photos.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
              1/{profile.photos.length} — scroll
            </span>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-rose-300 shadow">
            How others see you
          </span>
          {(profile.pronouns || profile.gender) && (
            <span className="absolute right-3 top-3 rounded-full bg-white/[0.08]/80 px-2.5 py-1 text-xs font-medium text-white">
              {profile.pronouns || profile.gender}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-lg font-bold tracking-tight">{name || "Your name"}</h3>
            {age !== null && showAge && (
              <span className="text-lg font-medium text-white/55">{age}</span>
            )}
          </div>
          {showLocation ? (
            <p className="mt-0.5 text-sm text-white/55">
              {location || <span className="italic text-white/40">Add your city so nearby people find you</span>}
            </p>
          ) : (
            <p className="mt-0.5 text-sm italic text-white/40">Location hidden</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            {profile.bio || (
              <span className="italic text-white/40">
                Your bio goes here — one or two lines about who you are when you&apos;re off the app.
              </span>
            )}
          </p>

          {profile.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-300"
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
    <div className="rounded-3xl bg-white/[0.05] ring-1 ring-white/12 p-5">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold">Your first sparks</h4>
        <span className="text-xs text-white/40">{DISCOVER_POOL.length} demo members in the pool</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {ranked.map(({ seed, score, fits }) => {
          const shared = sharedInterests(profile.interests, seed.interests);
          return (
            <li key={seed.name} className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-lg shadow">
                {seed.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {seed.name}, {seed.age}
                  <span className="ml-1.5 text-xs font-normal text-white/55">{seed.city}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-white/55">
                  {shared.length > 0
                    ? `Shared: ${shared.join(", ")}`
                    : `Add interests and we'll score ${seed.name.split(" ")[0]} higher`}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  fits ? "bg-rose-600 text-white" : "bg-white/10 text-white/55"
                }`}
                title={fits ? "Inside your preferences" : "Outside your stated preferences"}
              >
                {score}%
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-white/55">
        Pool score adjusted for your interests, age range and distance. You&apos;re after{" "}
        {INTENT_LABEL[profile.preferences.intent].toLowerCase()}.
      </p>
    </div>
  );
}
