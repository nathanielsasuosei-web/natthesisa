import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { avatarHref } from "@/lib/avatars";
import { ensureContentReady } from "@/lib/bootstrap";
import { COURSES } from "@/lib/courses";
import { PROGRAMS } from "@/lib/programs";
import { programPrice, formatMoney } from "@/lib/plans";
import { lessonCountsByCourse, contentTotals } from "@/lib/course-content";
import { site } from "@/config/site";
import InfoPage, { InfoContactStrip, InfoFaq, InfoList, InfoSection } from "@/components/InfoPage";
import { isPaystackConfigured } from "@/lib/paystack";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Pricing & payment",
  description:
    "What a codemasterghana program costs, and how payment works in Ghana — Mobile Money, card or bank transfer.",
};

export const dynamic = "force-dynamic";

const PAYMENT_METHODS = [
  {
    icon: "mobile" as const,
    name: "Mobile Money",
    detail: "MTN MoMo, Telecel Cash and AT Money — the fastest way to pay from a phone. You will confirm with your MoMo PIN on your own network's prompt.",
  },
  {
    icon: "card" as const,
    name: "Card",
    detail: "Visa, Mastercard and Verve, processed by a Ghanaian payment gateway. We never see or store your card number.",
  },
  {
    icon: "briefcase" as const,
    name: "Bank transfer",
    detail: "For schools, companies and study groups paying for several people. Contact us and we will send a formal invoice.",
  },
];

export default async function PricingPage() {
  await ensureContentReady();
  const user = await getCurrentUser();
  const totals = contentTotals();
  const counts = lessonCountsByCourse();
  const appHref = user ? (user.role === "owner" ? "/owner" : "/dashboard") : null;
  const checkoutHref = user ? "/dashboard/plans" : "/login?mode=signup";

  return (
    <InfoPage
      eyebrow="Pricing & payment"
      title="Buy a program. Learn everything in it, forever."
      intro={`Prices are set by your teacher, in ${site.currency.label}, and every purchase is recorded on your account with an invoice. This is the page to read before you pay for anything.`}
      appHref={appHref}
      signedIn={Boolean(user)}
      userName={user?.name}
      userAvatar={user ? avatarHref(user) : null}
    >
      {/* ---- the programs --------------------------------------------------- */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-[-.03em]">1. The programs</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6e6875]">
              Every course and every lesson sits inside a program, and the program is the only thing
              you pay for. One payment opens all of it, permanently — no subscriptions, no time
              limits, no per-lesson fees.
            </p>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#9a939f]">Set by your teacher</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((program) => {
            const courses = COURSES.filter((course) => course.category === program.category);
            const lessons = courses.reduce((sum, course) => sum + (counts[course.id] ?? 0), 0);
            return (
              <article key={program.id} className="flex flex-col rounded-[22px] border border-[#e8e4ec] bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#6d4aff]">Program</p>
                <h3 className="mt-2 text-base font-black tracking-[-.02em]">{program.name}</h3>
                <p className="mt-1 text-[11px] font-semibold text-[#817a87]">{program.tagline}</p>
                <p className="mt-4 text-3xl font-black tracking-[-.05em]">{formatMoney(programPrice(program.id))}</p>
                <p className="mt-1 text-[11px] text-[#918a97]">
                  {courses.length} course{courses.length === 1 ? "" : "s"} · {lessons} lessons · yours forever
                </p>
                <p className="mt-4 flex-1 text-[12px] leading-6 text-[#5d5763]">{program.description}</p>
                <Link href={checkoutHref} className="mt-6 rounded-xl bg-[#6d4aff] px-4 py-3 text-center text-xs font-extrabold text-white transition hover:-translate-y-0.5">
                  {user ? `Buy ${program.name}` : "Create an account"}
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#918a97]">
          {totals.courses} courses · {totals.lessons} lessons in total. A program priced at{" "}
          {formatMoney(0)} is free to join — no checkout, no payment.
        </p>
      </section>

      {/* ---- how to pay ----------------------------------------------------- */}
      <section>
        <h2 className="text-lg font-black tracking-[-.03em]">2. How payment works</h2>
        {isPaystackConfigured() ? (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            <p className="font-bold">Mobile Money payments are live.</p>
            <p className="mt-1 text-[13px]">
              At checkout, enter the MoMo number to charge — MTN MoMo, Telecel Cash or AT Money — and approve the
              charge with your MoMo PIN on your own phone. Cards and bank transfers are offered on the same secure
              page, processed by Paystack. Every purchase creates an invoice on your account and a receipt by email.
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-bold">This build does not take real money.</p>
            <p className="mt-1 text-[13px]">
              The program checkout is fully working — it records your purchase, your invoice and your access in the
              database — but no card, Mobile Money or bank details are collected and nothing is charged. You can use the
              whole platform while it is in this state.
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PAYMENT_METHODS.map((method) => (
            <div key={method.name} className="rounded-2xl border border-[#e8e4ec] bg-white p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]"><Icon name={method.icon} size={17} /></span>
              <p className="mt-3 text-sm font-extrabold text-[#332e39]">{method.name}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-[#7d7683]">{method.detail}</p>
            </div>
          ))}
        </div>

        <InfoList
          items={[
            <>Payments will be processed by a licensed Ghanaian gateway (Paystack or Flutterwave), so card and Mobile Money details are entered on their secure page — never on ours.</>,
            <>Every purchase creates an invoice number, visible on your <Link href="/dashboard/billing" className="font-bold text-[#5e3de0] underline">billing page</Link>.</>,
            <>A school or company paying for several people should <Link href="/contact" className="font-bold text-[#5e3de0] underline">contact us</Link> for a formal invoice and a group price.</>,
            <>Scholarships: if the price is out of reach, write to us and say so. A number of free programs are given out each month to students who ask.</>,
          ]}
        />
      </section>

      <InfoSection title="Can I try before I buy?">
        <p>
          Every course page describes exactly what is inside — the lessons, the projects, the time it takes. There
          are no free previews: the program price is the whole price, and it opens everything the moment your
          payment confirms.
        </p>
      </InfoSection>

      <InfoFaq
        items={[
          {
            q: "What does the program price include?",
            a: "Everything under that program: every course, every lesson, the code lab and the lesson materials — permanently. There is nothing else to buy for that program.",
          },
          {
            q: "Does my access ever expire?",
            a: "No. A program is a one-off purchase, not a subscription. Come back in a year and it is all still open.",
          },
          {
            q: "Can I pay with MTN MoMo today?",
            a: isPaystackConfigured()
              ? "Yes — MTN MoMo, Telecel Cash and AT Money all work at checkout. Enter the number to charge, approve with your MoMo PIN on your phone, and your program opens immediately."
              : "Not yet — the Mobile Money integration is the next step before launch. Everything else about buying is finished, including invoices and access records, so the moment the gateway is connected the same checkout takes a MoMo payment.",
          },
          {
            q: "Do you offer refunds?",
            a: "There is nothing to refund while payments are a demo. When payments go live: a program you have not opened can be refunded within 7 days, one you have already studied cannot, and anything we cannot fix gets your money back.",
          },
          {
            q: "Do you give discounts to schools?",
            a: "Yes. Schools, universities, NGOs and study groups get a per-seat price and a teacher view of everyone's progress.",
          },
        ]}
      />

      <InfoContactStrip />
    </InfoPage>
  );
}
