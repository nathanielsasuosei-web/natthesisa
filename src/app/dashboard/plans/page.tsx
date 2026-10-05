import type { Metadata } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/require-user";
import { site } from "@/config/site";
import { fmtDate } from "@/lib/format";
import { hasActivePass } from "@/lib/access";
import { pricing } from "@/lib/plans";
import { isPaystackConfigured } from "@/lib/paystack";
import PassOptions from "@/components/PassOptions";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Access pass" };

/**
 * Buying time.
 *
 * There is one level of access, sold by the day, week or month at prices the
 * owner sets. The page also says plainly what the pass does and does not
 * include: courses and lessons are bought separately in the catalog, and a
 * free preview lesson needs neither.
 */
export default async function PassPage() {
  const user = await requireCurrentUser();
  const prices = pricing();
  const active = hasActivePass(user);

  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="text-xs font-bold text-[#6d4aff]">Access pass</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">
          {active ? "Keep your learning going." : "Buy time. Learn everything."}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#756f7b]">
          One pass opens the platform for a day, a week or a month. Then pick the courses and lessons you want
          and buy them in the catalog — what you buy stays yours, and a renewed pass opens it all again. Prices are in {site.currency.label}.
        </p>
      </header>

      {active ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
          <span>
            <strong>Your pass is active until {fmtDate(user.subscription.expiresAt)}.</strong> Every course is open
            to buy, and previews are free to watch right now.
          </span>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1 font-black">
            Browse courses <Icon name="arrow-right" size={13} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <span>
            <strong>You do not have an active pass.</strong> Choose a length below — a course or lesson you have
            bought stays in your account for whenever you come back.
          </span>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1 font-black">
            See what is inside <Icon name="arrow-right" size={13} />
          </Link>
        </div>
      )}

      <PassOptions
        prices={{ daily: prices.daily, weekly: prices.weekly, monthly: prices.monthly }}
        active={active}
        expiresAt={active ? user.subscription.expiresAt : null}
        momoPhone={user.paymentMethod.phone}
        momoNetwork={user.paymentMethod.network}
      />

      <section className="open-columns grid gap-0 xl:grid-cols-3">
        {[
          ["spark", "One level, no tiers", "Every pass unlocks the same thing: the whole library the teacher has published."],
          ["card", "What you buy is yours", "Course and lesson purchases stay on your account, even after a pass ends."],
          ["shield", "Buy more time, never lose time", "Renewing early adds the new days on top of whatever is left."],
        ].map(([icon, title, body]) => (
          <div key={title} className="open-column flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]">
              <Icon name={icon as "shield"} size={17} />
            </span>
            <div>
              <p className="text-xs font-extrabold">{title}</p>
              <p className="mt-1 text-[10px] leading-4 text-[#918a97]">{body}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="text-center text-[9px] leading-4 text-[#9a939f]">
        {isPaystackConfigured()
          ? "Payments are processed securely by Paystack — approve with your MoMo PIN on your own phone. We never see or store your PIN."
          : "Demo note: checkout and invoices are fully interactive, but no real money moves. The teacher connects live Mobile Money payments from the console."}
      </p>
    </div>
  );
}
