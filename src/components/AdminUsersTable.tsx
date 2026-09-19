"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminUserRow } from "@/lib/admin";
import type { PlanId } from "@/lib/plans";
import { fmtDate, fmtMinutes, fmtMoney, initials } from "@/lib/format";
import Icon from "./Icon";

interface Props {
  initialUsers: AdminUserRow[];
  adminId: string;
}

const PLAN_OPTIONS: Array<{ id: PlanId; name: string }> = [
  { id: "free", name: "Explorer" },
  { id: "premium", name: "Pro" },
  { id: "elite", name: "Mentor" },
];

export default function AdminUsersTable({ initialUsers, adminId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "admin">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserRow | null>(null);

  const users = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return initialUsers.filter((user) => {
      const queryMatch = !needle || `${user.name} ${user.email} ${user.planName} ${user.role}`.toLowerCase().includes(needle);
      const filterMatch = filter === "all" || (filter === "active" && !user.suspended) || (filter === "paused" && user.suspended) || (filter === "admin" && user.role === "admin");
      return queryMatch && filterMatch;
    });
  }, [initialUsers, query, filter]);

  async function act(userId: string, init: RequestInit, success: string) {
    if (busyId) return false;
    setBusyId(userId);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ error: true, text: data.error ?? "The action could not be completed." });
        return false;
      }
      setMessage({ text: success });
      router.refresh();
      return true;
    } catch {
      setMessage({ error: true, text: "Network error. Please try again." });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="open-surface overflow-hidden rounded-[22px] border border-[#e2dee7] bg-white">
      <div className="flex flex-col gap-4 border-b border-[#ebe8ed] py-5 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-sm font-extrabold">Learner accounts</h2><p className="mt-1 text-[10px] text-[#918a97]">Review access, progress, roles and account status.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a939f]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search learner or email…" className="w-full rounded-xl border border-[#ded9e3] py-2.5 pl-9 pr-3 text-[10px] font-semibold sm:w-56" /></label><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-[#ded9e3] bg-white px-3 py-2.5 text-[10px] font-bold"><option value="all">All accounts</option><option value="active">Active</option><option value="paused">Paused</option><option value="admin">Administrators</option></select></div>
      </div>
      {message && <p className={`mx-5 mt-4 w-fit rounded-lg px-3 py-2 text-[10px] font-bold ${message.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</p>}
      <div className="dashboard-scroll overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left">
          <thead><tr className="border-b border-[#ebe8ed] bg-[#faf9fb] text-[8px] font-black uppercase tracking-[.11em] text-[#918a97]"><th className="px-5 py-3">Learner</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Learning</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Revenue</th><th className="px-5 py-3 text-right">Controls</th></tr></thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-xs text-[#918a97]">No accounts match this view.</td></tr>}
            {users.map((user) => {
              const isSelf = user.id === adminId;
              const busy = busyId === user.id;
              return <tr key={user.id} className={`border-b border-[#f0edf2] last:border-0 ${user.suspended ? "bg-amber-50/45" : ""}`}>
                <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl text-[10px] font-black ${user.role === "admin" ? "bg-[#1b1822] text-[#c4b7ff]" : "bg-[#f0ecff] text-[#5e3de0]"}`}>{initials(user.name)}</span><div className="min-w-0"><p className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#403a46]"><span className="max-w-36 truncate">{user.name}</span>{isSelf && <span className="text-[8px] font-medium text-[#9a939f]">(you)</span>}</p><p className="mt-0.5 max-w-44 truncate text-[9px] text-[#918a97]">{user.email}</p><p className="mt-0.5 text-[8px] text-[#b0aab5]">Joined {fmtDate(user.createdAt)}</p></div></div></td>
                <td className="px-4 py-4"><select value={user.planId} disabled={busy} onChange={(event) => act(user.id, { method: "PATCH", body: JSON.stringify({ action: "setPlan", planId: event.target.value }) }, `${user.name} now has ${PLAN_OPTIONS.find((item) => item.id === event.target.value)?.name} access.`)} className="rounded-lg border border-[#ddd9e2] bg-white px-2.5 py-2 text-[9px] font-bold disabled:opacity-50">{PLAN_OPTIONS.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select><p className="mt-1.5 text-[8px] capitalize text-[#9a939f]">{user.cycle}</p></td>
                <td className="px-4 py-4"><p className="text-[10px] font-extrabold text-[#4a4450]">{user.lessonsCompleted} lessons</p><p className="mt-1 text-[8px] text-[#918a97]">{user.coursesStarted} started · {user.coursesCompleted} finished</p></td>
                <td className="px-4 py-4"><p className="text-[10px] font-extrabold text-[#4a4450]">{fmtMinutes(user.lifetimeMinutes)}</p><p className="mt-1 text-[8px] text-[#918a97]">Lifetime</p></td>
                <td className="px-4 py-4"><div className="flex flex-col items-start gap-1.5"><span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${user.suspended ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{user.suspended ? "Paused" : "Active"}</span>{user.role === "admin" && <span className="rounded-full bg-[#1b1822] px-2 py-1 text-[8px] font-black uppercase text-white">Admin</span>}</div></td>
                <td className="px-4 py-4 text-right"><p className="text-[10px] font-extrabold">{fmtMoney(user.revenue)}</p><p className="mt-1 text-[8px] text-[#918a97]">{user.invoices} invoice{user.invoices === 1 ? "" : "s"}</p></td>
                <td className="px-5 py-4"><div className="flex items-center justify-end gap-1.5">{user.role === "member" ? <><button disabled={busy || isSelf} onClick={() => act(user.id, { method: "PATCH", body: JSON.stringify({ action: "suspend", suspended: !user.suspended }) }, `${user.name}'s account ${user.suspended ? "restored" : "paused"}.`)} title={user.suspended ? "Restore account" : "Pause account"} className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-bold disabled:opacity-40 ${user.suspended ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{user.suspended ? "Restore" : "Pause"}</button><button disabled={busy} onClick={() => { if (window.confirm(`Reset all learning progress for ${user.name}?`)) act(user.id, { method: "PATCH", body: JSON.stringify({ action: "resetProgress" }) }, `${user.name}'s progress was reset.`); }} title="Reset progress" className="rounded-lg border border-[#ddd9e2] px-2.5 py-1.5 text-[9px] font-bold text-[#6d6673] disabled:opacity-40">Reset</button><button disabled={busy} onClick={() => act(user.id, { method: "PATCH", body: JSON.stringify({ action: "setRole", role: "admin" }) }, `${user.name} is now an administrator.`)} className="rounded-lg border border-[#d9d0fb] bg-[#f4f1ff] px-2.5 py-1.5 text-[9px] font-bold text-[#5e3de0] disabled:opacity-40">Make admin</button><button disabled={busy} onClick={() => setDeleteUser(user)} className="grid size-7 place-items-center rounded-lg text-[#aaa4b0] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40" title="Delete account"><Icon name="close" size={13} /></button></> : !isSelf ? <button disabled={busy} onClick={() => act(user.id, { method: "PATCH", body: JSON.stringify({ action: "setRole", role: "member" }) }, `${user.name} is now a learner.`)} className="rounded-lg border border-[#ddd9e2] px-2.5 py-1.5 text-[9px] font-bold text-[#6d6673]">Remove admin</button> : <span className="text-[8px] text-[#aaa4b0]">Current session</span>}</div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#ebe8ed] py-3 text-[9px] text-[#918a97]"><span>{users.length} of {initialUsers.length} accounts</span><span>Changes are enforced by the server</span></div>

      {deleteUser && <div className="fixed inset-0 z-50 grid place-items-center bg-[#15121c]/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyId) setDeleteUser(null); }}><div className="w-full max-w-sm rounded-[22px] bg-white p-6 shadow-2xl"><span className="grid size-11 place-items-center rounded-2xl bg-red-50 text-red-600"><Icon name="close" size={20} /></span><h3 className="mt-4 text-lg font-black tracking-[-.03em]">Delete {deleteUser.name}?</h3><p className="mt-2 text-xs leading-5 text-[#77717e]">This removes their account, {deleteUser.lessonsCompleted} completed lessons and billing history from the demo store. This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setDeleteUser(null)} disabled={Boolean(busyId)} className="rounded-xl border border-[#ddd9e2] px-4 py-2.5 text-xs font-bold">Keep account</button><button disabled={Boolean(busyId)} onClick={async () => { const target = deleteUser; const ok = await act(target.id, { method: "DELETE" }, `${target.name}'s account was deleted.`); if (ok) setDeleteUser(null); }} className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{busyId ? "Deleting…" : "Delete account"}</button></div></div></div>}
    </section>
  );
}
