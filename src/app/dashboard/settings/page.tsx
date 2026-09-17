import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { toProfileDto } from "@/lib/profile";
import SettingsForms from "@/components/SettingsForms";

export const metadata = { title: "Account settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);

  return (
    <SettingsForms
      profile={toProfileDto(user, user.profile, user.settings)}
      planName={plan.name}
      role={user.role}
      suspended={user.suspended}
    />
  );
}
