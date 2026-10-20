import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentOwner } from "@/lib/session";
import { listPromotionRedemptions, listPromotions } from "@/lib/promotions";
import { programPriceRows } from "@/lib/owner-console";
import OwnerPromotions from "@/components/OwnerPromotions";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Promo codes" };

// The window and claim counts are read on every visit: a code that ends while
// the page is open must not keep showing "Live".
export const dynamic = "force-dynamic";

/**
 * The teacher's promo-code desk.
 *
 * The offer, in the teacher's terms: "Buy any program while this code runs and
 * the program I named comes free." The teacher writes the code, picks the free
 * program, and decides the start and end. Students enter the code in the
 * checkout modal; the free program lands with the paid one.
 */
export default async function OwnerPromotionsPage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/owner-sign-in");

  const promotions = await listPromotions();
  const claims = await listPromotionRedemptions(12);
  const programs = programPriceRows().map((row) => ({ id: row.id, name: row.title, price: row.price }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">Teacher console</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Promo codes</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#756f7b]">
            Give a free program to every student who buys one with a code. You choose the program, the code, and
            exactly when the offer starts and ends.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl border border-[#e2dee7] bg-white px-3.5 py-2.5 text-[10px] font-extrabold text-[#5f5965]">
          <Icon name="spark" size={14} className="text-[#6d4aff]" />
          {promotions.filter((promotion) => promotion.active).length} active code
          {promotions.filter((promotion) => promotion.active).length === 1 ? "" : "s"}
        </span>
      </header>

      <OwnerPromotions initial={promotions} claims={claims} programs={programs} now={new Date().toISOString()} />
    </div>
  );
}
