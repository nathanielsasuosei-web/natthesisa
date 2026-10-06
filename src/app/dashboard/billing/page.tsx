import type { Metadata } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/require-user";
import { getCourse } from "@/lib/courses";
import { getProgram } from "@/lib/programs";
import { fmtDate, fmtMoney } from "@/lib/format";
import { listPaymentsForUser } from "@/lib/payments";
import { formatPhone } from "@/lib/momo";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Billing" };

/**
 * What the student has paid for: the programs they own and every invoice.
 * Programs never expire, so there is nothing to renew or cancel — the page
 * offers only "buy another program".
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string }>;
}) {
  const user = await requireCurrentUser();
  const params = (await searchParams) ?? {};
  const checkoutFlag = params.checkout;
  const payments = await listPaymentsForUser(user.id, 10);
  const pending = payments.filter((payment) => payment.status === "pending");
  const method = user.paymentMethod;
  const paidWithMomo =
    method.provider === "paystack" && (method.channel === "mobile_money" || Boolean(method.phone));
  const ownedPrograms = user.purchases.filter((purchase) => purchase.kind === "program");
  const spent = user.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  const purchases = [...user.purchases].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-bold text-[#8a8390]">Access & payments</p>
        <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Billing</h1>
        <p className="mt-1.5 text-sm text-[#756f7b]">Your programs, your purchases, and every invoice.</p>
      </header>

      {(checkoutFlag === "missing" || checkoutFlag === "unknown") && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
          <Icon name="shield" size={16} className="shrink-0" />
          {checkoutFlag === "missing"
            ? "The payment provider returned without a reference, so there is nothing to confirm. If money left your MoMo account, it will be reversed automatically — otherwise just try again."
            : "That payment reference does not match any checkout on your account. If money left your MoMo account, contact your teacher with the reference from your MoMo message."}
        </div>
      )}

      {pending.length > 0 && (
        <section className="overflow-hidden rounded-[22px] border border-amber-200 bg-amber-50/60">
          <div className="flex items-center justify-between px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-sm font-extrabold text-amber-900">Payments waiting for approval</h2>
              <p className="mt-1 text-[10px] text-amber-700">
                Approve on your phone with your MoMo PIN, or open the payment page again.
              </p>
            </div>
            <Icon name="mobile" size={17} className="text-amber-600" />
          </div>
          <ul>
            {pending.map((payment) => (
              <li
                key={payment.reference}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-200/70 px-5 py-4 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[#4f4956]">{payment.description}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-[#918a97]">
                    {payment.reference} · {fmtDate(payment.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-extrabold">{fmtMoney(payment.amount)}</p>
                  {payment.authorizationUrl ? (
                    <a
                      href={payment.authorizationUrl}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#1b1822] px-3.5 py-2 text-[10px] font-extrabold text-white"
                    >
                      Complete payment <Icon name="arrow-right" size={12} />
                    </a>
                  ) : (
                    <Link
                      href={`/checkout/verify?reference=${encodeURIComponent(payment.reference)}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#1b1822] px-3.5 py-2 text-[10px] font-extrabold text-white"
                    >
                      Check status <Icon name="arrow-right" size={12} />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="open-surface overflow-hidden rounded-[24px] border border-[#e5e1e8] bg-white shadow-[0_10px_32px_rgba(31,24,45,.04)]">
        <div className="grid lg:grid-cols-[1fr_260px]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black tracking-[-.035em]">
                    {ownedPrograms.length > 0
                      ? `${ownedPrograms.length} program${ownedPrograms.length === 1 ? "" : "s"} owned`
                      : "No programs yet"}
                  </h2>
                  {ownedPrograms.length > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-700">Yours forever</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-[#77717e]">
                  {ownedPrograms.length > 0
                    ? ownedPrograms.map((purchase) => getProgram(purchase.refId)?.name ?? purchase.refId).join(" · ")
                    : "Buy a program to open every course and lesson inside it."}
                </p>
              </div>
              <Link href="/dashboard/plans" className="inline-flex items-center gap-1.5 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-[10px] font-extrabold text-white">
                {ownedPrograms.length > 0 ? "Buy another program" : "Buy a program"} <Icon name="arrow-right" size={13} />
              </Link>
            </div>
            <div className="mt-7 grid gap-4 border-y border-[#efecf1] py-5 sm:grid-cols-3">
              <div>
                <p className="text-[9px] font-bold text-[#918a97]">Programs owned</p>
                <p className="mt-1 text-xs font-extrabold">{ownedPrograms.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#918a97]">Total paid</p>
                <p className="mt-1 text-xs font-extrabold">{fmtMoney(spent)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#918a97]">Invoices</p>
                <p className="mt-1 text-xs font-extrabold">{user.invoices.length}</p>
              </div>
            </div>
            <p className="mt-5 text-[10px] leading-5 text-[#817a87]">
              A program is a one-off purchase, not a subscription: nothing renews by itself and there is nothing
              to cancel. What you buy stays open forever.
            </p>
          </div>
          <div className="border-t border-[#ece9ef] p-5 lg:border-l lg:border-t-0 lg:pl-7">
            <p className="text-[9px] font-black uppercase tracking-[.13em] text-[#817a87]">Payment method</p>
            {paidWithMomo ? (
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#ffcf59] to-[#e8a800] p-4 text-[#3d2c00] shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    {method.network ? `${method.network} MoMo` : "Mobile Money"}
                  </span>
                  <Icon name="mobile" size={17} className="text-[#3d2c00]/60" />
                </div>
                <p className="mt-8 font-mono text-sm tracking-[.12em]">
                  {method.phone ? formatPhone(method.phone) : `•••• •••• ${method.last4}`}
                </p>
                <div className="mt-4 flex justify-between text-[8px] uppercase text-[#3d2c00]/70">
                  <span>{user.name}</span>
                  <span>MoMo</span>
                </div>
              </div>
            ) : method.provider === "paystack" ? (
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#202a67] to-[#10152f] p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider">{method.brand}</span>
                  <Icon name="card" size={17} className="text-white/60" />
                </div>
                <p className="mt-8 font-mono text-sm tracking-[.17em]">•••• •••• •••• {method.last4}</p>
                <div className="mt-4 flex justify-between text-[8px] uppercase text-white/55">
                  <span>{user.name}</span>
                  <span>Paystack</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#202a67] to-[#10152f] p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black italic tracking-wider">VISA</span>
                  <Icon name="card" size={17} className="text-white/60" />
                </div>
                <p className="mt-8 font-mono text-sm tracking-[.17em]">•••• •••• •••• {method.last4}</p>
                <div className="mt-4 flex justify-between text-[8px] uppercase text-white/55">
                  <span>{user.name}</span>
                  <span>12/29</span>
                </div>
              </div>
            )}
            <p className="mt-3 flex gap-1.5 text-[8px] leading-4 text-[#918a97]">
              <Icon name="shield" size={12} className="shrink-0 text-emerald-600" />
              {method.provider === "paystack"
                ? "Processed securely by Paystack. Your MoMo PIN and card numbers never touch this site."
                : "Demo method only. No real payment details are stored."}
            </p>
          </div>
        </div>
      </section>

      <section className="open-surface overflow-hidden rounded-[22px] border border-[#e5e1e8] bg-white">
        <div className="flex items-center justify-between border-b border-[#ece9ef] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-extrabold">Purchases</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">Everything bought or granted on this account.</p>
          </div>
          <Icon name="courses" size={17} className="text-[#918a97]" />
        </div>
        {purchases.length ? (
          <ul>
            {purchases.map((purchase) => {
              const course = getCourse(purchase.courseId ?? purchase.refId);
              const program = purchase.kind === "program" ? getProgram(purchase.refId) : null;
              const label =
                purchase.kind === "program"
                  ? (program?.name ?? purchase.refId)
                  : purchase.kind === "course"
                    ? (course?.title ?? purchase.refId)
                    : purchase.refId;
              const kindLabel = purchase.kind === "program" ? "Program" : purchase.kind === "course" ? "Course" : "Lesson";
              return (
                <li key={purchase.id} className="flex items-center justify-between gap-4 border-b border-[#f0edf2] px-5 py-4 last:border-0 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-[#4f4956]">
                      {kindLabel} · {label}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#918a97]">
                      {fmtDate(purchase.at)}
                      {purchase.kind !== "program" ? " · kept as history — buy the program to open it" : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] font-extrabold">{purchase.amount > 0 ? fmtMoney(purchase.amount) : "Granted"}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#f0edf3] text-[#817a87]">
              <Icon name="courses" size={20} />
            </span>
            <p className="mt-3 text-xs font-extrabold">Nothing bought yet</p>
            <p className="mt-1 text-[10px] text-[#918a97]">Program purchases appear here.</p>
          </div>
        )}
      </section>

      <section className="open-surface overflow-hidden rounded-[22px] border border-[#e5e1e8] bg-white">
        <div className="flex items-center justify-between border-b border-[#ece9ef] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-extrabold">Invoice history</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">A record of every completed payment.</p>
          </div>
          <Icon name="download" size={17} className="text-[#918a97]" />
        </div>
        {user.invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-[#efecf1] bg-[#faf9fb] text-[8px] font-black uppercase tracking-wider text-[#918a97]">
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {user.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[#f0edf2] last:border-0">
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-[#5e3de0]">{invoice.number}</td>
                    <td className="px-4 py-4 text-[10px] font-semibold text-[#5f5965]">{invoice.description}</td>
                    <td className="px-4 py-4 text-[10px] text-[#817a87]">{fmtDate(invoice.date)}</td>
                    <td className="px-4 py-4 text-right text-[10px] font-extrabold">{fmtMoney(invoice.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700">Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#f0edf3] text-[#817a87]">
              <Icon name="card" size={20} />
            </span>
            <p className="mt-3 text-xs font-extrabold">No invoices yet</p>
            <p className="mt-1 text-[10px] text-[#918a97]">Program payments appear here.</p>
          </div>
        )}
      </section>

      <div className="open-callout flex gap-3 text-[#5971a7]">
        <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-[#3f67c8]" />
        <div>
          <p className="text-xs font-extrabold text-[#294b9b]">
            {method.provider === "paystack" ? "Secure Mobile Money payments" : "Demonstration payment system"}
          </p>
          <p className="mt-1 text-[10px] leading-5 text-[#5971a7]">
            {method.provider === "paystack"
              ? "Payments are processed by Paystack in Ghana cedis. Every payment creates an invoice above, and a receipt is emailed to you."
              : "Program prices, invoices and access control are functional and stored in the database. Payments are simulated until the teacher connects live Mobile Money."}
          </p>
        </div>
      </div>
    </div>
  );
}
