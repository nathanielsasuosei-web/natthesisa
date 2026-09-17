import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { profileCompleteness, toProfileDto } from "@/lib/profile";
import ProfileEditor from "@/components/ProfileEditor";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);

  return (
    <ProfileEditor
      initial={toProfileDto(user, user.profile, user.settings)}
      completeness={profileCompleteness(user.profile)}
      planName={plan.name}
      suspended={user.suspended}
    />
  );
}
