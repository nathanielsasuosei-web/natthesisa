import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import AuthForm from "@/components/AuthForm";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");
  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#1b1822] p-10 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute -left-32 -top-36 size-[32rem] rounded-full bg-[#6d4aff]/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 size-[30rem] rounded-full bg-[#ff7448]/20 blur-3xl" />
        <div className="relative"><Logo inverse /></div>
        <div className="relative my-auto mx-auto max-w-lg py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-bold text-[#c3b7f8]"><Icon name="spark" size={14} /> Learn by building</span>
          <h2 className="mt-6 text-balance text-5xl font-black leading-[1.04] tracking-[-.055em]">Your next skill is closer than you think.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[#aaa4b1]">Join focused lessons, build projects worth sharing and watch your progress become a real body of work.</p>
          <div className="mt-10 grid gap-0 border-y border-white/10 sm:grid-cols-3">
            {[
              ["terminal", "39", "guided lessons"], ["briefcase", "15+", "real projects"], ["trophy", "3", "career paths"],
            ].map(([icon, value, label]) => (
              <div key={label} className="border-b border-white/10 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><Icon name={icon as "terminal"} size={18} className="text-[#ad9aff]" /><p className="mt-4 text-xl font-black">{value}</p><p className="mt-1 text-[10px] text-[#8f8997]">{label}</p></div>
            ))}
          </div>
          <blockquote className="mt-10 border-l-2 border-[#6d4aff] pl-5"><p className="text-sm font-semibold leading-6 text-[#d3ced8]">“The first platform that got me out of tutorial mode and into building.”</p><footer className="mt-2 text-xs text-[#847d8c]">— Ama, frontend learner</footer></blockquote>
        </div>
        <p className="relative text-xs text-[#686170]">© {new Date().getFullYear()} codemasterghana</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-[#faf9f7] px-5 py-10 sm:px-8">
        <div className="absolute left-5 top-5 lg:hidden"><Logo /></div>
        <Link href="/" className="absolute right-6 top-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#77717e] transition hover:text-[#5e3ce8]"><Icon name="arrow-left" size={14} /> Back to home</Link>
        <div className="w-full max-w-[430px] border-y border-[#ded9e3] py-8">
          <AuthForm initialMode={initialMode} />
        </div>
      </section>
    </main>
  );
}
