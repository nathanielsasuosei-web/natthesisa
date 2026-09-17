import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { COUNTRIES, GENDER_LABEL, INTENT_LABEL, ageFrom, interestEmoji, profileCompleteness, summarizeLocation } from "@/lib/profile";
import { fmtDate } from "@/lib/format";
import Lightbox from "@/components/Lightbox";
import { Chip } from "@/components/forms";

export const dynamic = "force-dynamic";

/**
 * The full-screen profile view — the member's own card, rendered with the same
 * fields the deck shows other people, plus the completeness nudge and a couple
 * of stats. Editing lives on /app/profile/edit; this screen is for reading.
 */
export default async function ProfileScreen() {
  const user = await requireUser();
  const profile = user.profile;
  const age = ageFrom(profile.birthDate);
  const completeness = profileCompleteness(profile);
  const plan = getPlan(user.subscription.planId);
  const datesDone = user.matches.reduce((n, m) => n + m.dateIdeas.filter((d) => d.done).length, 0);
  const photos = profile.photos ?? [];

  return (
    <div className="pb-8">
      {/* hero */}
      <section className="relative">
        {photos[0] ? (
          <div className="relative">
            <Lightbox photos={photos} name={user.name} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#120a11] via-[#120a11]/70 to-transparent" />
          </div>
        ) : (
          <div className="grid h-64 place-items-center bg-gradient-to-br from-rose-500/30 via-fuchsia-500/20 to-indigo-500/25">
            <span aria-hidden className="text-7xl drop-shadow-lg">
              {profile.avatar || "✨"}
            </span>
          </div>
        )}

        <div className={`px-5 ${photos[0] ? "-mt-24 relative" : ""}`}>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="flex items-baseline gap-2 truncate text-[28px] font-bold leading-tight tracking-tight">
                {user.name}
                {age !== null && <span className="text-2xl font-light text-white/65">{age}</span>}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/55">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5">
                  <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {summarizeLocation(profile) || "Add your city"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* actions */}
      <div className="mt-4 flex gap-2 px-5">
        <Link href="/app/profile/edit" className="press flex-1">
          <span className="shine block w-full rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-600 py-3 text-center text-[15px] font-semibold text-white shadow-lg shadow-rose-900/40">
            Edit profile
          </span>
        </Link>
        <Link href="/app/profile/preview" className="press rounded-2xl bg-white/[0.07] px-4 py-3 text-[15px] font-semibold text-white/85 ring-1 ring-white/12">
          How others see me
        </Link>
      </div>

      {/* completeness */}
      <section className="mt-5 px-4">
        <div className="rounded-3xl bg-white/[0.05] p-4 ring-1 ring-white/10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">
              {completeness.done ? "Profile finished" : "Finish your profile"}
            </h2>
            <span className={`text-sm font-bold ${completeness.percent >= 100 ? "text-emerald-300" : "text-rose-300"}`}>
              {completeness.percent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-400 transition-all duration-700"
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
          {completeness.missing.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {completeness.missing.map((label) => (
                <span key={label} className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-medium text-amber-100 ring-1 ring-amber-300/25">
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/45">
              Nothing missing. Decks like a complete profile — you&apos;ll surface higher.
            </p>
          )}
        </div>
      </section>

      {/* stats */}
      <section className="mt-4 grid grid-cols-4 gap-2 px-4">
        <Stat label="Matches" value={String(user.matches.length)} />
        <Stat label="Likes used" value={plan.limits.likesPerPeriod === null ? "∞" : String(user.usage.count)} />
        <Stat label="Dates been on" value={String(datesDone)} />
        <Stat label="Photos" value={String(photos.length)} />
      </section>

      {/* bio */}
      <section className="mt-5 px-4">
        <div className="rounded-3xl bg-white/[0.05] p-4 ring-1 ring-white/10">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">About me</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/80">
            {profile.bio || <span className="italic text-white/35">No bio yet — one or two lines goes a long way.</span>}
          </p>
        </div>
      </section>

      {/* interests */}
      <section className="mt-4 px-4">
        <div className="rounded-3xl bg-white/[0.05] p-4 ring-1 ring-white/10">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Interests · {profile.interests.length}
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {profile.interests.length === 0 ? (
              <p className="text-sm text-white/35">Nothing added yet.</p>
            ) : (
              profile.interests.map((tag) => <Chip key={tag} emoji={interestEmoji(tag)}>{tag}</Chip>)
            )}
          </div>
        </div>
      </section>

      {/* looking for */}
      <section className="mt-4 px-4">
        <div className="rounded-3xl bg-white/[0.05] p-1 ring-1 ring-white/10">
          <h2 className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Who I&apos;m looking for
          </h2>
          <dl className="divide-y divide-white/[0.06]">
            <Line label="Dating" value={profile.preferences.interestedIn.length ? profile.preferences.interestedIn.map((g) => GENDER_LABEL[g] ?? g).join(", ") : "Everyone"} />
            <Line label="Age range" value={`${profile.preferences.ageMin} – ${profile.preferences.ageMax}`} />
            <Line label="Distance" value={profile.preferences.distanceKm === 0 ? "Anywhere" : `Within ${profile.preferences.distanceKm} km`} />
            <Line label="After" value={INTENT_LABEL[profile.preferences.intent]} />
            <Line label="Pronouns" value={profile.pronouns || "Not set"} />
          </dl>
        </div>
      </section>

      {/* account */}
      <section className="mt-4 px-4">
        <div className="rounded-3xl bg-white/[0.05] p-1 ring-1 ring-white/10">
          <h2 className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Account</h2>
          <dl className="divide-y divide-white/[0.06]">
            <Line label="Email" value={user.email} />
            <Line label="Plan" value={`${plan.name} · ${user.subscription.cycle}`} />
            <Line label="Member since" value={fmtDate(user.createdAt)} />
            <Line label="Country" value={COUNTRIES.includes(profile.country) ? profile.country : profile.country || "Not set"} />
          </dl>
          <div className="flex gap-2 p-3">
            <Link href="/app/settings" className="press flex-1 rounded-2xl bg-white/[0.07] py-2.5 text-center text-sm font-semibold text-white/85 ring-1 ring-white/10">
              Settings
            </Link>
            <Link href="/app/activity" className="press flex-1 rounded-2xl bg-white/[0.07] py-2.5 text-center text-sm font-semibold text-white/85 ring-1 ring-white/10">
              Activity
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] px-2 py-3 text-center ring-1 ring-white/10">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-white/40">{label}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
      <dt className="shrink-0 text-sm text-white/45">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium text-white/85">{value}</dd>
    </div>
  );
}
