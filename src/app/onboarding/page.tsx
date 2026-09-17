import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { profileCompleteness } from "@/lib/profile";
import OnboardingWizard from "@/components/OnboardingWizard";
import PhoneFrame from "@/components/PhoneFrame";

export const metadata = { title: "Create your profile" };

/**
 * Profile creation. Reachable only while signed in with an unfinished profile;
 * once it's done we send you to the app (the editor lives there) so nothing
 * duplicates. The wizard saves every step through the same endpoints the
 * profile editor uses.
 */
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (profileCompleteness(user.profile).done) redirect("/app/profile");

  const plan = getPlan(user.subscription.planId);
  const p = user.profile;

  return (
    <PhoneFrame
      joinHref="/login"
      footer={<>Signed in as {user.email} · every step saves as you go</>}
    >
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
          photos: p.photos ?? [],
          preferences: p.preferences,
        }}
      />
    </PhoneFrame>
  );
}
