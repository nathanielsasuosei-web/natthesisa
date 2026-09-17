import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { profileCompleteness } from "@/lib/profile";
import { site } from "@/config/site";
import Avatar from "@/components/Avatar";
import TabBar from "@/components/TabBar";

/**
 * The member app shell: a phone-shaped frame on desktop, the full viewport on a
 * phone, with the tab bar pinned inside it. Sheets and toasts position
 * themselves against this frame, which is why it's the positioning context.
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);
  const completeness = profileCompleteness(user.profile);

  // an unfinished profile gets the wizard, not the deck
  if (!completeness.done) redirect("/onboarding");

  const newMatches = user.matches.filter(
    (m) => Date.now() - new Date(m.createdAt).getTime() < 1000 * 60 * 60 * 24 * 3
  ).length;

  return (
    <div className="app-bg flex min-h-dvh w-full justify-center lg:items-center lg:p-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#120a11] text-white lg:h-[min(880px,94vh)] lg:max-w-[430px] lg:rounded-[2.75rem] lg:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)] lg:ring-1 lg:ring-white/15">
        {/* status strip / brand row */}
        <header className="glass safe-top relative z-20 flex shrink-0 items-center justify-between px-5 pb-2.5 pt-2.5">
          <Link href="/" className="press flex items-center gap-1.5 text-sm font-bold tracking-tight">
            <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-fuchsia-600 text-[11px]">
              ♥
            </span>
            {site.name}
          </Link>

          <div className="flex items-center gap-2">
            {user.suspended && (
              <Link
                href="/app/settings"
                className="press rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-300/30"
              >
                Suspended
              </Link>
            )}
            <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-semibold text-white/70 ring-1 ring-white/10">
              {plan.name}
            </span>
            <Link href="/app/profile" aria-label="My profile" className="press">
              <Avatar name={user.name} photo={user.profile.photo} emoji={user.profile.avatar} size={30} ring={false} tone="dark" />
            </Link>
          </div>
        </header>

        {user.suspended && (
          <p className="relative z-10 shrink-0 bg-amber-500/15 px-5 py-2 text-[11px] font-medium text-amber-100">
            Suspended by an admin — liking and matching are paused. Profile and security settings still work.
          </p>
        )}

        {/* the screens */}
        <main className="no-scrollbar relative flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>

        <TabBar newMatches={newMatches} />
      </div>
    </div>
  );
}
