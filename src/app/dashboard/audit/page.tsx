import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { fmtDateTime } from "@/lib/format";

export default async function AuditPage() {
  const user = (await getCurrentUser())!;
  const plan = getPlan(user.subscription.planId);

  if (!plan.entitlements.auditLog) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-indigo-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-6">
            <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z" />
          </svg>
        </span>
        <h1 className="mt-4 text-xl font-bold">The audit log is a Business feature</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Every change to your workspace and subscription is recorded — plan changes, cancellations,
          board activity — giving teams a complete history.
        </p>
        <Link href="/dashboard/plans" className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
          Upgrade to Business
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-slate-600">Everything that happens in your workspace, newest first.</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white">
        {user.auditLog.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {user.auditLog.map((event) => (
              <li key={event.id} className="flex items-start gap-4 px-6 py-4">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-indigo-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">{event.text}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{fmtDateTime(event.ts)} UTC</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
