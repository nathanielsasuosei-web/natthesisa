import type { Metadata } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/require-user";
import { getPlan } from "@/lib/plans";
import { fmtDate, initials } from "@/lib/format";
import AccountForm from "@/components/AccountForm";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireCurrentUser();
  const plan = getPlan(user.subscription.planId);
  return (
    <div className="space-y-10">
      <header><p className="text-xs font-bold text-[#8a8390]">Settings</p><h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">My account</h1><p className="mt-1.5 text-sm text-[#756f7b]">Manage your profile and shape your learning experience.</p></header>
      <div className="grid gap-10 xl:grid-cols-[1fr_285px] xl:gap-12">
        <AccountForm name={user.name} email={user.email} profile={user.profile} />
        <aside className="space-y-5 xl:order-last">
          <section className="open-surface py-6 text-center"><span className="mx-auto grid size-16 place-items-center rounded-[22px] bg-[#1b1822] text-lg font-black text-[#c3b6ff]">{initials(user.name)}</span><h2 className="mt-3 text-sm font-extrabold">{user.name}</h2><p className="mt-1 text-[10px] text-[#918a97]">{user.profile.headline}</p><div className="mt-4 flex justify-center gap-2"><span className="rounded-full bg-[#f0ecff] px-2.5 py-1 text-[9px] font-bold text-[#5e3de0]">{user.profile.track}</span>{user.role === "admin" && <span className="rounded-full bg-[#1b1822] px-2.5 py-1 text-[9px] font-bold text-white">Admin</span>}</div></section>
          <section className="open-surface py-5"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]"><Icon name="spark" size={17} /></span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700">Active</span></div><h2 className="mt-4 text-sm font-extrabold">{plan.name} plan</h2><p className="mt-1 text-[10px] text-[#918a97]">{user.subscription.cycle} billing · Renews {fmtDate(user.subscription.currentPeriodEnd)}</p><Link href="/dashboard/plans" className="mt-4 block rounded-xl border border-[#e2dee6] py-2.5 text-center text-[10px] font-bold text-[#5e5864]">Manage plan</Link></section>
          <section className="open-surface py-5"><h2 className="text-xs font-extrabold">Security</h2><div className="mt-4 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon name="shield" size={17} /></span><div><p className="text-[10px] font-bold">Password protected</p><p className="mt-0.5 text-[9px] text-[#918a97]">Demo authentication enabled</p></div></div><button disabled className="mt-4 w-full rounded-xl border border-[#e2dee6] py-2.5 text-[10px] font-bold text-[#aaa4b0]">Change password (production)</button></section>
          <p className="px-1 text-[9px] leading-4 text-[#9a939f]">Account created {fmtDate(user.createdAt)} · Learner ID {user.id.slice(0, 8)}</p>
        </aside>
      </div>
    </div>
  );
}
