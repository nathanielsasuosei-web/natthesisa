import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import AdminLoginForm from "@/components/AdminLoginForm";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

export const metadata: Metadata = { title: "Administrator sign in" };

export default async function AdminSignInPage() {
  if (process.env.ADMIN_PREVIEW === "1") redirect("/admin");

  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");

  return (
    <main className="grid min-h-screen bg-[#f8f8f5] lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#1b1822] p-10 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute -left-32 -top-40 size-[32rem] rounded-full bg-[#6d4aff]/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-36 size-[28rem] rounded-full bg-[#ff7448]/20 blur-3xl" />
        <div className="relative"><Logo inverse /></div>
        <div className="relative my-auto mx-auto max-w-md py-14"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-[#c3b7f8]"><Icon name="shield" size={14} /> Admin control center</span><h2 className="mt-6 text-balance text-5xl font-black leading-[1.04] tracking-[-.055em]">See the whole platform clearly.</h2><p className="mt-5 max-w-md text-base leading-7 text-[#aaa4b1]">Monitor engagement, manage learner access and keep subscriptions under control from one secure workspace.</p><div className="mt-9 grid grid-cols-3 gap-0 border-y border-white/10">{[["users", "Learners"], ["chart", "Analytics"], ["card", "Billing"]].map(([icon, label]) => <div key={label} className="border-r border-white/10 p-4 last:border-r-0"><Icon name={icon as "users"} size={18} className="text-[#b9a9ff]" /><p className="mt-3 text-[10px] font-bold text-[#c8c2cd]">{label}</p></div>)}</div></div>
        <p className="relative text-[10px] text-[#686170]">Authorized administrators only · Demo environment</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-8"><div className="absolute left-5 top-5 lg:hidden"><Logo /></div><Link href="/" className="absolute right-6 top-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#77717e] hover:text-[#5e3ce8]"><Icon name="arrow-left" size={14} /> Home</Link><div className="w-full max-w-[440px] border-y border-[#ded9e3] py-8"><AdminLoginForm currentUserName={user?.name} /><p className="mt-6 text-center text-[10px] text-[#918a97]">Student? <Link href="/login" className="font-bold text-[#6543e8]">Go to student sign in</Link></p></div></section>
    </main>
  );
}
