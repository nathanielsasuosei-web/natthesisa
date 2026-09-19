import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import SidebarNav from "@/components/SidebarNav";
import AnimatedBackground from "@/components/AnimatedBackground";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const plan = getPlan(user.subscription.planId);
  const weeklyMinutes = user.usage.history.reduce((sum, day) => sum + day.count, 0);
  const navProps = {
    userName: user.name,
    userEmail: user.email,
    planName: plan.name,
    weeklyMinutes,
    weeklyGoal: user.profile.weeklyGoal,
    isAdmin: user.role === "admin",
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] overflow-hidden bg-[#1b1822] p-5 print:hidden lg:block">
        <div aria-hidden className="absolute -left-32 -top-36 size-80 rounded-full bg-[#6d4aff]/20 blur-3xl" />
        <div className="relative h-full"><SidebarNav {...navProps} /></div>
      </aside>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#1b1822] px-4 py-3 print:hidden lg:hidden"><SidebarNav {...navProps} compact /></header>
      <main className="dashboard-main relative min-w-0 flex-1 lg:ml-[252px]">
        <AnimatedBackground variant="subtle" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
          {user.suspended && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-amber-100 font-black">!</span>
              <div><p className="font-bold">Your account is paused</p><p className="mt-1 text-xs leading-5 text-amber-800">You can review your dashboard, but lessons, progress updates and subscription changes are disabled. Contact an administrator for help.</p></div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
