import type { Metadata } from "next";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };

// The link carries a token from the query string, so this page is always rendered per request.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <AnimatedBackground variant="subtle" />
      <div className="absolute left-5 top-5"><Logo /></div>
      <Link href="/login" className="absolute right-6 top-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#77717d] transition hover:text-[#5e3ce8]"><Icon name="arrow-left" size={14} /> Back to sign in</Link>

      <section className="auth-step w-full max-w-[430px] rounded-[22px] border border-[#e6e1ec] bg-white/90 p-7 shadow-[0_24px_60px_rgba(27,24,34,.10)] backdrop-blur sm:p-9">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="auth-step text-center">
            <h1 className="text-[25px] font-black tracking-[-.04em] text-[#1c1921]">This link is incomplete</h1>
            <p className="mt-2 text-sm leading-6 text-[#77717d]">Open the reset link from your email, or request a new one.</p>
            <Link href="/login?mode=forgot" className="btn-shine mt-7 inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5e3ce8]">Request a new link</Link>
          </div>
        )}
      </section>
    </main>
  );
}
