import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { profileCompleteness } from "@/lib/profile";
import SidebarNav from "@/components/SidebarNav";
import AnimatedBackground from "@/components/AnimatedBackground";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plan = getPlan(user.subscription.planId);
  const completeness = profileCompleteness(user.profile);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 p-5 lg:flex">
        {/* animated glow */}
        <div
          aria-hidden
          className="animate-blob pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-rose-600/25 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-blob pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-fuchsia-600/15 blur-3xl"
          style={{ animationDelay: "-13s" }}
        />
        <SidebarNav
          userName={user.name}
          planName={plan.name}
          activityEnabled={plan.entitlements.activityLog}
          isAdmin={user.role === "admin"}
          photo={user.profile.photo}
          avatar={user.profile.avatar}
          needsProfile={!completeness.done}
        />
      </aside>

      {/* Top nav (mobile) */}
      <div className="relative border-b border-slate-800 bg-slate-950 p-4 lg:hidden">
        <SidebarNav
          userName={user.name}
          planName={plan.name}
          activityEnabled={plan.entitlements.activityLog}
          isAdmin={user.role === "admin"}
          photo={user.profile.photo}
          avatar={user.profile.avatar}
          needsProfile={!completeness.done}
          compact
        />
      </div>

      <main className="min-w-0 flex-1">
        <AnimatedBackground variant="subtle" />
        <div className="relative mx-auto max-w-5xl px-6 py-8">
          {!completeness.done && (
            <Link
              href="/onboarding"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 transition hover:border-amber-300"
            >
              <span>
                <strong>Your profile isn&apos;t finished.</strong> Add a photo, your interests and who
                you&apos;d like to meet — {completeness.percent}% done so far. Matching stays locked
                until you do.
              </span>
              <span className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">
                Continue setup →
              </span>
            </Link>
          )}
          {user.suspended && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Your account is suspended.</strong> An administrator has paused your profile —
              likes, matches and membership changes are blocked until you&apos;re reinstated.
              Contact support to appeal.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
