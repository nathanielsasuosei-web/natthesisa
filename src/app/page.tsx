import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { PLANS, formatMoney } from "@/lib/plans";

const FEATURES = [
  {
    title: "Boards & tasks",
    body: "Create boards, add tasks, tick things off. The basics, done properly.",
    icon: "M3 7h18M3 12h18M3 17h10",
  },
  {
    title: "Subscription control",
    body: "Upgrade instantly, schedule downgrades, cancel with one click and resume any time before the period ends.",
    icon: "M12 3v18m5-13H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H6",
  },
  {
    title: "Usage you can see",
    body: "Live counters for boards and actions, so limits are never a surprise.",
    icon: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  },
  {
    title: "Entitlements, enforced",
    body: "Analytics, CSV export and the audit log unlock with your plan — checked on the server, not just hidden in the UI.",
    icon: "M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z",
  },
  {
    title: "Billing history",
    body: "Every upgrade and renewal issues an invoice you can review from the billing page.",
    icon: "M7 3h10v18l-5-3-5 3V3z",
  },
  {
    title: "Fair renewals",
    body: "Downgrades and cancellations take effect at the end of the period you already paid for.",
    icon: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">N</span>
            Natthesisa
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <a href="#features" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">Features</a>
            <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900 sm:block">Pricing</a>
            {user ? (
              <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-slate-600 hover:text-slate-900">Sign in</Link>
                <Link href="/login" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200 via-fuchsia-100 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <span className="size-1.5 rounded-full bg-indigo-500" />
            Subscription control built in
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Plan your work.
            <span className="block bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              Own your subscription.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Natthesisa is a tidy little workspace — boards, tasks, usage — with a complete
            subscription engine behind it: upgrades apply instantly, downgrades and cancellations
            respect your billing period, and every entitlement is enforced server-side.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/login" className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500">
              Start free
            </Link>
            <a href="#pricing" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400">
              See pricing
            </a>
          </div>

          {/* Product mock */}
          <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-slate-400">natthesisa / dashboard</span>
            </div>
            <div className="grid gap-4 p-6 text-left sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Plan</p>
                <p className="mt-1 text-lg font-semibold">Pro</p>
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Actions used</p>
                <p className="mt-1 text-lg font-semibold">1,284 / 2,000</p>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-[64%] rounded-full bg-indigo-500" />
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Renews</p>
                <p className="mt-1 text-lg font-semibold">Oct 12</p>
                <p className="mt-2 text-xs text-slate-400">Monthly · $12</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Everything a workspace needs — and a subscription engine that behaves</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-6 transition hover:border-indigo-300 hover:shadow-md">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                    <path d={f.icon} />
                  </svg>
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Simple, honest pricing</h2>
          <p className="mt-3 text-center text-slate-600">Start free. Upgrade when you outgrow it. Cancel any time.</p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-white p-8 ${
                  plan.featured ? "border-indigo-600 shadow-xl shadow-indigo-600/10" : "border-slate-200"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
                <p className="mt-6">
                  <span className="text-4xl font-bold tracking-tight">{formatMoney(plan.monthly)}</span>
                  <span className="text-slate-500"> / month</span>
                </p>
                {plan.yearly > 0 && (
                  <p className="mt-1 text-xs text-slate-500">or {formatMoney(plan.yearly)}/year — two months free</p>
                )}
                <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-4 shrink-0 text-emerald-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-8 block rounded-xl px-4 py-2.5 text-center font-semibold transition ${
                    plan.featured
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-slate-300 text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Natthesisa. Demo project — no real payments.</p>
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in →</Link>
        </div>
      </footer>
    </div>
  );
}
