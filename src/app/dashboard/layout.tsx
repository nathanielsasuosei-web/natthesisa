import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import SidebarNav from "@/components/SidebarNav";
import AnimatedBackground from "@/components/AnimatedBackground";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plan = getPlan(user.subscription.planId);

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
        />
      </aside>

      {/* Top nav (mobile) */}
      <div className="relative border-b border-slate-800 bg-slate-950 p-4 lg:hidden">
        <SidebarNav
          userName={user.name}
          planName={plan.name}
          activityEnabled={plan.entitlements.activityLog}
          isAdmin={user.role === "admin"}
          compact
        />
      </div>

      <main className="min-w-0 flex-1">
        <AnimatedBackground variant="subtle" />
        <div className="relative mx-auto max-w-5xl px-6 py-8">
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
