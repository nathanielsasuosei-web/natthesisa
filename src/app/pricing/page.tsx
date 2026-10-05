import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { ensureContentReady } from "@/lib/bootstrap";
import { COURSES } from "@/lib/courses";
import { coursePrice, formatMoney, PASS_PERIODS, PERIOD_DAYS, PERIOD_LABEL, pricing } from "@/lib/plans";
import { lessonCountsByCourse, contentTotals } from "@/lib/course-content";
import { site } from "@/config/site";
import InfoPage, { InfoContactStrip, InfoFaq, InfoList, InfoSection } from "@/components/InfoPage";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Pricing & payment",
  description:
    "What a codemasterghana pass costs, what each course costs, and how payment works in Ghana — Mobile Money, card or bank transfer.",
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
  const prices = pricing();
  const totals = contentTotals();
  const counts = lessonCountsByCourse();
  const appHref = user ? (user.role === "owner" ? "/owner" : "/dashboard") : null;
  const checkoutHref = user ? "/dashboard/plans" : "/login?mode=signup";

  return (
    <InfoPage
      eyebrow="Pricing & payment"
      title="One pass for the platform. Buy the courses you want to keep."
      intro={`Prices are set by your teacher, in ${site.currency.label}, and every purchase is recorded on your account with an invoice. This is the page to read before you pay for anything.`}
      appHref={appHref}
      signedIn={Boolean(user)}
    >
      {/* ---- the pass ------------------------------------------------------- */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-[-.03em]">1. Buy time: the access pass</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6e6875]">
              A pass opens the whole platform for the length you choose — every course, every lesson, the code lab and
              the lesson materials. It does not include the courses themselves; those are bought separately below.
            </p>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#9a939f]">Set by your teacher</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PASS_PERIODS.map((period) => (
            <article key={period} className={`relative flex flex-col rounded-[22px] border p-6 ${period === "monthly" ? "border-[#6d4aff] bg-[#f6f3ff] shadow-[0_18px_44px_rgba(109,74,255,.14)]" : "border-[#e8e4ec] bg-white"}`}>
              {period === "monthly" && (
                <span className="absolute -top-3 right-5 rounded-full bg-[#ffcf59] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#493600]">Best value</span>
              )}
              <h3 className="text-sm font-black">{PERIOD_LABEL[period]}</h3>
              <p className="mt-1 text-[11px] font-semibold text-[#817a87]">{PERIOD_DAYS[period]} day{PERIOD_DAYS[period] === 1 ? "" : "s"} of full access</p>
              <p className="mt-4 text-3xl font-black tracking-[-.05em]">{formatMoney(prices[period])}</p>
              <p className="mt-1 text-[11px] text-[#918a97]">
                {period === "daily" ? "About " + formatMoney(prices.daily) + " a day" : period === "weekly" ? `${formatMoney(Number((prices.weekly / 7).toFixed(2)))} a day` : `${formatMoney(Number((prices.monthly / 30).toFixed(2)))} a day`}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-[12px] text-[#5d5763]">
                {["Every course and lesson opens", "Free previews still free", "Progress, code lab and certificates", "Buy more time any time"].map((item) => (
                  <li key={item} className="flex items-start gap-2"><Icon name="check" size={13} className="mt-0.5 text-emerald-600" />{item}</li>
                ))}
              </ul>
              <Link href={checkoutHref} className={`mt-6 rounded-xl px-4 py-3 text-center text-xs font-extrabold transition hover:-translate-y-0.5 ${period === "monthly" ? "bg-[#6d4aff] text-white" : "border border-[#dad5df] bg-white text-[#302b37]"}`}>
                {user ? "Buy this pass" : "Create an account"}
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#918a97]">
          Buying more time while a pass is still active <strong>extends</strong> it from the day it would have ended —
          you never lose the time you have already paid for.
        </p>
      </section>

      {/* ---- the courses ---------------------------------------------------- */}
      <section>
        <h2 className="text-lg font-black tracking-[-.03em]">2. Buy what you want to keep</h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6e6875]">
          A course unlocks all of its lessons, permanently, and you only need a pass while you are actually learning.
          Individual lessons can be bought too, for the lessons you want without the whole course — the default lesson
          price is <strong>{formatMoney(prices.lesson)}</strong>.
        </p>

        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#e8e4ec] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#fbfafc] text-[10px] uppercase tracking-wide text-[#8a8390]">
                <tr>
                  <th className="px-5 py-3 font-black">Course</th>
                  <th className="px-5 py-3 font-black">Program</th>
                  <th className="px-5 py-3 font-black">Lessons</th>
                  <th className="px-5 py-3 text-right font-black">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0edf3]">
                {COURSES.map((course) => (
                  <tr key={course.id}>
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/courses/${course.slug}`} className="font-bold text-[#332e39] transition hover:text-[#5e3de0]">{course.title}</Link>
                      <p className="mt-0.5 text-[11px] text-[#918a97]">{course.level}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-[#6d6673]">{course.category}</td>
                    <td className="px-5 py-3.5 text-[12px] text-[#6d6673]">{counts[course.id] ?? 0}</td>
                    <td className="px-5 py-3.5 text-right font-black text-[#332e39]">{formatMoney(coursePrice(course.id))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#fbfafc] text-[11px] text-[#7d7683]">
                <tr>
                  <td className="px-5 py-3 font-bold" colSpan={2}>{totals.courses} courses · {totals.lessons} lessons</td>
                  <td className="px-5 py-3" colSpan={2}>Single lesson: <strong className="text-[#332e39]">{formatMoney(prices.lesson)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-[#918a97]">
          Teachers may price an individual course or lesson differently from the default — the table shows the price that
          applies in your account right now.
        </p>
      </section>

      {/* ---- how to pay ----------------------------------------------------- */}
      <section>
        <h2 className="text-lg font-black tracking-[-.03em]">3. How payment works</h2>
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-bold">This build does not take real money.</p>
          <p className="mt-1 text-[13px]">
            The pass and course checkout is fully working — it records your purchase, your invoice and your access in the
            database — but no card, Mobile Money or bank details are collected and nothing is charged. You can use the
            whole platform while it is in this state.
          </p>
        </div>

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
            <>Scholarships: if the price is out of reach, write to us and say so. A number of free passes are given out each month to students who ask.</>,
          ]}
        />
      </section>

      <InfoFaq
        items={[
          {
            q: "Does a pass include the courses?",
            a: "No. A pass buys time on the platform; a course or a lesson is bought separately and stays on your account. Both are needed to open a paid lesson — the free preview lessons are the exception.",
          },
          {
            q: "What is the cheapest way to start?",
            a: "Watch the free preview lesson on any course without paying anything, then start with a day pass and a single lesson. That is the smallest possible commitment, and everything you buy stays on your account.",
          },
          {
            q: "Can I pay with MTN MoMo today?",
            a: "Not yet — the Mobile Money integration is the next step before launch. Everything else about buying is finished, including invoices and access records, so the moment the gateway is connected the same checkout takes a MoMo payment.",
          },
          {
            q: "Do you offer refunds?",
            a: "There is nothing to refund while payments are a demo. When payments go live: an unused pass can be refunded within 7 days, a course you have already opened cannot, and anything we cannot fix gets your money back.",
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
