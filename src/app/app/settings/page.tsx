import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { ensureSettingsShape } from "@/lib/profile";
import SettingsApp from "@/components/SettingsApp";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);
  return (
    <SettingsApp
      settings={ensureSettingsShape(user.settings)}
      email={user.email}
      planName={plan.name}
      canExport={plan.entitlements.export}
      isAdmin={user.role === "admin"}
      suspended={Boolean(user.suspended)}
    />
  );
}
