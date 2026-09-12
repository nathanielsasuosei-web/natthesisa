import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import SidebarNav from "@/components/SidebarNav";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plan = getPlan(user.subscription.planId);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 p-5 lg:flex">
        <SidebarNav
          userName={user.name}
          planName={plan.name}
          auditEnabled={plan.entitlements.auditLog}
        />
      </aside>

      {/* Top nav (mobile) */}
      <div className="border-b border-slate-800 bg-slate-950 p-4 lg:hidden">
        <SidebarNav
          userName={user.name}
          planName={plan.name}
          auditEnabled={plan.entitlements.auditLog}
          compact
        />
      </div>

      <main className="min-w-0 flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
