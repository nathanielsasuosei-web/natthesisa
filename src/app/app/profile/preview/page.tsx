import { requireUser } from "@/lib/session";
import { profileCompleteness } from "@/lib/profile";
import ProfilePreviewCard from "@/components/ProfilePreviewCard";
import { Button } from "@/components/forms";

export const dynamic = "force-dynamic";

/**
 * Read-only "how others see you" view. The preferences, visibility flags and
 * completeness shown here come from the same lib/profile helpers the API uses,
 * so this is the truth rather than a mock-up.
 */
export default async function ProfilePreviewPage() {
  const user = await requireUser();
  const completeness = profileCompleteness(user.profile);
  return (
    <div className="space-y-4 px-4 pb-8 pt-3">
      <header>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Your card</h1>
        <p className="mt-0.5 text-sm text-white/50">
          {completeness.percent}% complete · {user.settings.privacy.discoverable ? "visible in Discover" : "hidden from Discover"}
        </p>
      </header>

      <ProfilePreviewCard
        name={user.name}
        profile={user.profile}
        showAge={user.settings.privacy.showAge}
        showLocation={user.settings.privacy.showLocation}
        showSparks
      />

      <div className="grid grid-cols-2 gap-2">
        <Button full href="/app/profile/edit">
          Edit profile
        </Button>
        <Button full variant="ghost" href="/app/settings">
          Visibility
        </Button>
      </div>
    </div>
  );
}
