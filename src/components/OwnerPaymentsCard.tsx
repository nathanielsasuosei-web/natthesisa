import Link from "next/link";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { publicKeyMode } from "@/lib/paystack";
import type { RecentPayment } from "@/lib/payments";
import Icon from "./Icon";

interface Props {
  payments: RecentPayment[];
  pending: number;
  provider: "paystack" | "demo";
  keyMode: "test" | "live" | "missing";
}

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  abandoned: "bg-[#f0edf3] text-[#817a87]",
};

/**
 * The teacher's payment register.
 *
 * Shows whether live Mobile Money is connected (and in test or live mode),
 * how the teacher finishes the setup (webhook URL), and every checkout with
 * its student, amount and status — so a "I paid but it is locked" message can
 * be answered from one screen: find the reference, see paid or pending, and
 * either grant access or ask the student to complete the approval.
 */
export default function OwnerPaymentsCard({ payments, pending, provider, keyMode }: Props) {
  const live = provider === "paystack";
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || "https://your-domain.com";
  const pubMode = publicKeyMode();
  const mismatched = live && pubMode !== "missing" && pubMode !== keyMode;

  return (
    <section className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold">Mobile Money payments</h2>
          <p className="mt-1 text-[10px] text-[#918a97]">
            {live
              ? keyMode === "live"
                ? "Live — students pay real money with MoMo, cards and bank transfers."
                : "Test mode — Paystack test keys: approvals are simulated, no real money moves."
              : "Demo mode — approvals are simulated. Add your Paystack keys to take real MoMo payments."}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9px] font-black ${
            live && keyMode === "live"
              ? "bg-emerald-100 text-emerald-700"
              : live
                ? "bg-amber-100 text-amber-800"
                : "bg-[#f0edf3] text-[#817a87]"
          }`}
        >
          <Icon name={live ? "shield" : "mobile"} size={12} />
          {live ? (keyMode === "live" ? "Live via Paystack" : "Paystack test mode") : "Demo payments"}
        </span>
      </div>

      {!live ? (
        <div className="mt-4 rounded-2xl border border-[#e6e2e9] bg-[#faf9fb] p-4 text-[11px] leading-6 text-[#5f5965]">
          <p className="font-extrabold text-[#332e39]">Take real MoMo payments in three steps</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Create a free account at <strong>paystack.com</strong>, activate Ghana cedis (GHS) and copy your{" "}
              <strong>secret</strong> and <strong>publishable</strong> keys from Settings → API keys.
            </li>
            <li>
              Set <code className="rounded bg-[#eeeaf1] px-1 font-mono text-[10px]">PAYSTACK_SECRET_KEY</code> and{" "}
              <code className="rounded bg-[#eeeaf1] px-1 font-mono text-[10px]">NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</code>{" "}
              in the environment (test keys first: <code className="rounded bg-[#eeeaf1] px-1 font-mono text-[10px]">sk_test_…</code> +{" "}
              <code className="rounded bg-[#eeeaf1] px-1 font-mono text-[10px]">pk_test_…</code>), then redeploy.
              {pubMode !== "missing" && (
                <span className="mt-1 block text-emerald-700">
                  Publishable key already set ({pubMode}). Only the secret key is missing.
                </span>
              )}
            </li>
            <li>
              In Paystack → Settings → Webhooks, add{" "}
              <code className="rounded bg-[#eeeaf1] px-1 font-mono text-[10px] break-all">
                {siteBase}/api/webhooks/paystack
              </code>{" "}
              so approvals confirm even if the student closes their browser.
            </li>
          </ol>
          <p className="mt-2 text-[10px] text-[#918a97]">
            Verify with <code className="rounded bg-[#eeeaf1] px-1 font-mono">npm run payments:check</code> before
            telling students to pay. Full steps are in the README under “Mobile Money payments”.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-[#e6e2e9] bg-[#faf9fb] px-4 py-3 text-[10px] text-[#5f5965]">
          <span>
            Webhook:{" "}
            <code className="rounded bg-[#eeeaf1] px-1 font-mono break-all">{siteBase}/api/webhooks/paystack</code>
          </span>
          <span>
            Publishable key:{" "}
            <strong className={pubMode === "missing" ? "text-amber-700" : ""}>
              {pubMode === "missing" ? "not set" : `${pubMode} · set`}
            </strong>
          </span>
          <span>
            Waiting approval: <strong>{pending}</strong>
          </span>
        </div>
      )}

      {mismatched && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[10px] font-semibold leading-5 text-amber-800">
          The secret key is {keyMode} but the publishable key is {pubMode} — use the test pair together or the
          live pair together, then redeploy.
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#ece9ef]">
        {payments.length ? (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="sticky top-0 bg-[#faf9fb] text-[8px] font-black uppercase tracking-wider text-[#918a97]">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">What</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.reference} className="border-t border-[#f0edf2]">
                    <td className="whitespace-nowrap px-4 py-3 text-[10px] text-[#817a87]">
                      {fmtDateTime(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-bold text-[#4f4956]">{payment.userName}</p>
                      <p className="text-[9px] text-[#918a97]">{payment.userEmail}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-[10px] font-semibold text-[#5f5965]">
                      {payment.description}
                      {payment.phone && (
                        <span className="block text-[9px] font-medium text-[#918a97]">
                          {payment.network ? `${payment.network} · ` : ""}{payment.phone}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-[10px] font-extrabold">
                      {fmtMoney(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${STATUS_STYLE[payment.status] ?? STATUS_STYLE.abandoned}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[9px] text-[#918a97]">
                      {payment.reference}
                      {payment.invoiceNumber && (
                        <span className="block text-emerald-700">{payment.invoiceNumber}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#f0edf3] text-[#817a87]">
              <Icon name="mobile" size={20} />
            </span>
            <p className="mt-3 text-xs font-extrabold">No checkouts yet</p>
            <p className="mt-1 text-[10px] text-[#918a97]">
              The first student payment — pass, course or lesson — appears here.
            </p>
          </div>
        )}
      </div>

      {pending > 0 && (
        <p className="mt-3 text-[10px] leading-5 text-[#817a87]">
          <strong>{pending} payment{pending === 1 ? " is" : "s are"} waiting</strong> for the student to approve
          on their phone. Pending checkouts expire on their own; a student who paid but still sees “waiting” should
          open the payment link again from their <Link href="/dashboard/billing" className="font-bold text-[#5e3de0] underline">billing page</Link>.
        </p>
      )}
    </section>
  );
}
