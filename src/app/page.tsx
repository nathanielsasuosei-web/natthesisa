import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { PLANS, getPlan, formatMoney } from "@/lib/plans";
import { site } from "@/config/site";
import AnimatedBackground from "@/components/AnimatedBackground";

const FEATURES = [
  {
    title: "Real matches",
    body: "Discover singles near you, like the ones who make you smile, and match when it's mutual.",
    icon: "M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.7 4c1.6 0 3.2.8 4.3 2.2C13.1 4.8 14.7 4 16.3 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z",
  },
  {
    title: "Date ideas, together",
    body: "Every match gets a shared list of date ideas — plan them, go on them, tick them off.",
    icon: "M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  },
  {
    title: "Likes you can see",
    body: "Live counters for matches and likes, so limits are never a surprise.",
    icon: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  },
  {
    title: "Perks, enforced",
    body: "Love insights, match export and the activity timeline unlock with your membership — checked on the server, not just hidden in the UI.",
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
    <div className="relative min-h-screen">
      <AnimatedBackground />

      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-rose-200/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-rose-600 text-sm font-bold text-white">♥</span>
            {site.name}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <a href="#features" className="hidden rounded-lg px-3 py-2 text-slate-600 transition hover:text-slate-900 sm:block">Features</a>
            <a href="#pricing" className="hidden rounded-lg px-3 py-2 text-slate-600 transition hover:text-slate-900 sm:block">Membership</a>
            {user ? (
              <Link href="/dashboard" className="rounded-lg bg-rose-600 px-4 py-2 font-medium text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500">
                Open my matches
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-slate-600 transition hover:text-slate-900">Sign in</Link>
                <Link href="/login" className="rounded-lg bg-rose-600 px-4 py-2 font-medium text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500">
                  Join free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-rose-700 backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
            </span>
            Thousands of sparks flying right now
          </span>
          <h1
            className="animate-fade-up mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl"
            style={{ animationDelay: "0.1s" }}
          >
            Meet someone real.
            <span className="gradient-pan-text block bg-gradient-to-r from-rose-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">
              Fall for the right one.
            </span>
          </h1>
          <p
            className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-slate-600"
            style={{ animationDelay: "0.2s" }}
          >
            {site.name} is a warm little dating app — matches, date ideas, compatibility — with a
            complete membership engine behind it: upgrades apply instantly, downgrades and
            cancellations respect your billing period, and every perk is enforced server-side.
            Prices in {site.currency.label} ({site.currency.symbol}).
          </p>
          <div
            className="animate-fade-up mt-8 flex items-center justify-center gap-3"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="/login"
              className="rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:scale-[1.03] hover:bg-rose-500 active:scale-[0.98]"
            >
              Start matching — free
            </Link>
            <a
              href="#pricing"
              className="rounded-xl border border-slate-300 bg-white/80 px-6 py-3 font-semibold text-slate-700 backdrop-blur transition hover:scale-[1.03] hover:border-slate-400 active:scale-[0.98]"
            >
              See membership
            </a>
          </div>

          {/* Product mock */}
          <div className="animate-fade-up mx-auto mt-16 max-w-4xl" style={{ animationDelay: "0.45s" }}>
            <div className="animate-float rounded-2xl border border-rose-200/80 bg-white/85 shadow-2xl shadow-rose-900/10 backdrop-blur">
              <div className="flex items-center gap-1.5 border-b border-rose-100 px-4 py-3">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-400">{site.name.toLowerCase()} / matches</span>
              </div>
              <div className="grid gap-4 p-6 text-left sm:grid-cols-3">
                <div className="rounded-xl border border-rose-100 bg-white/80 p-4">
                  <p className="text-xs font-medium text-slate-500">New match</p>
                  <p className="mt-1 text-lg font-semibold">Adjoa, 26 🐙</p>
                  <span className="mt-2 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">93% compatible</span>
                </div>
                <div className="rounded-xl border border-rose-100 bg-white/80 p-4">
                  <p className="text-xs font-medium text-slate-500">Likes used</p>
                  <p className="mt-1 text-lg font-semibold">1,284 / 2,000</p>
                  <div className="mt-3 h-2 rounded-full bg-rose-100">
                    <div className="h-2 w-[64%] rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-rose-100 bg-white/80 p-4">
                  <p className="text-xs font-medium text-slate-500">Membership renews</p>
                  <p className="mt-1 text-lg font-semibold">Oct 12</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Premium · {formatMoney(getPlan("premium").monthly)}/mo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-rose-200/70 bg-white/85 py-20 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Everything a love life needs — and a membership engine that behaves</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="animate-fade-up rounded-2xl border border-rose-100 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-600/5"
                style={{ animationDelay: `${0.08 * i}s` }}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600">
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
          <h2 className="text-center text-3xl font-bold tracking-tight">Simple, honest membership</h2>
          <p className="mt-3 text-center text-slate-600">
            Start free. Upgrade when the sparks fly. Cancel any time.
          </p>
          <p className="mt-1 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            All prices in {site.currency.label} ({site.currency.symbol})
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className={`animate-fade-up relative rounded-2xl border p-8 backdrop-blur transition duration-300 hover:-translate-y-1 ${
                  plan.featured
                    ? "border-rose-600 bg-white/90 shadow-xl shadow-rose-600/10 hover:shadow-2xl hover:shadow-rose-600/15"
                    : "border-rose-100 bg-white/85 hover:shadow-lg"
                }`}
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-rose-600/30">
                    Most loved
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-4 shrink-0 text-rose-500">
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
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500"
                      : "border border-slate-300 bg-white/80 text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {plan.id === "free" ? "Join free" : `Choose ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-rose-200/70 bg-white/85 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}. Demo project — no real payments. Prices in {site.currency.symbol}.</p>
          <Link href="/login" className="font-medium text-rose-600 transition hover:text-rose-500">Sign in →</Link>
        </div>
      </footer>
    </div>
  );
}
