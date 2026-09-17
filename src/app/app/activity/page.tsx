import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { fmtDateTime } from "@/lib/format";
import { Button, EmptyState } from "@/components/forms";

export const dynamic = "force-dynamic";

/**
 * The activity timeline — an Elite perk, exactly as the API and plan table
 * define it. Elite members see every match, swipe, plan change and profile
 * edit in one scroll; everyone else gets the honest reason and the upgrade
 * path rather than a fake-looking locked panel.
 */
export default async function ActivityScreen() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);

  if (!plan.entitlements.activityLog) {
    return (
      <div className="pb-8 pt-3">
        <EmptyState
          emoji="🔒"
          title="The timeline is an Elite perk"
          body="Every spark, date and plan change in your love life, in order — with Elite you can read the whole story back."
          action={<Button full href="/app/membership">Go Elite</Button>}
        />
      </div>
    );
  }

  const events = [...user.activityLog].reverse();

  return (
    <div className="px-4 pb-8 pt-3">
      <header className="px-1">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Your timeline</h1>
        <p className="mt-0.5 text-sm text-white/50">
          {events.length} event{events.length === 1 ? "" : "s"} · newest first
        </p>
      </header>

      {events.length === 0 ? (
        <EmptyState emoji="🌱" title="Nothing recorded yet" body="Swipe, match or plan a date and the story starts writing itself." />
      ) : (
        <ol className="relative mt-4 space-y-3 border-l border-white/10 pl-5">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span aria-hidden className="absolute -left-[23px] top-2 size-2 rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-400 ring-4 ring-[#120a11]" />
              <div className="rounded-2xl bg-white/[0.05] px-3.5 py-2.5 ring-1 ring-white/10">
                <p className="text-[14px] leading-snug text-white/85">{event.text}</p>
                <p className="mt-1 text-[11px] tabular-nums text-white/35">{fmtDateTime(event.ts)} UTC</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
