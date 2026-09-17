import { requireUser } from "@/lib/session";
import { profileCompleteness, toProfileDto } from "@/lib/profile";
import ProfileEditApp from "@/components/ProfileEditApp";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const user = await requireUser();
  return (
    <ProfileEditApp
      initial={toProfileDto(user, user.profile, user.settings)}
      completeness={profileCompleteness(user.profile)}
    />
  );
}
