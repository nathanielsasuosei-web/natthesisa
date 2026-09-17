import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { profileCompleteness } from "@/lib/profile";
import { site } from "@/config/site";
import OnboardingWizard from "@/components/OnboardingWizard";
import AnimatedBackground from "@/components/AnimatedBackground";

export const metadata = { title: `Create your profile — ${site.name}` };

/**
 * Profile creation. Reachable only while signed in with an unfinished profile;
 * once it's done we send you to the editor instead so nothing duplicates.
 */
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (profileCompleteness(user.profile).done) redirect("/dashboard/profile");

  const plan = getPlan(user.subscription.planId);
  const p = user.profile;

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <header className="border-b border-rose-200/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-rose-600 text-sm font-bold text-white">♥</span>
            {site.name}
          </Link>
          <p className="text-xs text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{user.email}</span>
          </p>
        </div>
      </header>
      <OnboardingWizard
        planName={plan.name}
        initial={{
          name: user.name,
          birthDate: p.birthDate,
          gender: p.gender,
          pronouns: p.pronouns,
          city: p.city,
          country: p.country,
          bio: p.bio,
          interests: p.interests,
          avatar: p.avatar,
          avatarPicked: p.avatarPicked,
          photo: p.photo,
          preferences: p.preferences,
        }}
      />
    </div>
  );
}
