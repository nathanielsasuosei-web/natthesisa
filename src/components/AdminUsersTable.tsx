"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AdminUserRow } from "@/lib/admin";
import type { PlanId } from "@/lib/plans";
import { fmtDate, fmtMoney } from "@/lib/format";

interface Props {
  initialUsers: AdminUserRow[];
  adminId: string;
}

const PLAN_OPTIONS: Array<{ id: PlanId; label: string }> = [
  { id: "free", label: "Free" },
  { id: "premium", label: "Premium" },
  { id: "elite", label: "Elite" },
];

export default function AdminUsersTable({ initialUsers, adminId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUserRow | null>(null);

  const users = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return initialUsers;
    return initialUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(needle) ||
        u.planName.toLowerCase().includes(needle) ||
        (u.suspended && "suspended".includes(needle)) ||
        u.role.includes(needle)
    );
  }, [initialUsers, query]);

  async function act(
    userId: string,
    init: RequestInit,
    okMsg: string
  ): Promise<boolean> {
    if (busyId) return false;
    setBusyId(userId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return false;
      }
      setNotice(okMsg);
      router.refresh();
      return true;
    } catch {
      setError("Network error — please try again.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-100 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-50 p-6">
        <div>
          <h2 className="font-semibold">Members</h2>
          <p className="mt-1 text-sm text-slate-500">
            Comp plans, reset likes, suspend, promote or delete accounts.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, plan, role…"
          className="w-56 rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      {(notice || error) && (
        <p
          className={`mx-6 mt-4 w-fit rounded-lg px-3 py-1.5 text-sm font-medium ${
            error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? notice}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rose-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Matches</th>
              <th className="px-4 py-3 text-right font-medium">Likes</th>
              <th className="px-4 py-3 text-right font-medium">Revenue</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                  No accounts match “{query}”.
                </td>
              </tr>
            )}
            {users.map((u) => {
              const isSelf = u.id === adminId;
              const busy = busyId === u.id;
              return (
                <tr key={u.id} className={`border-b border-rose-50/60 last:border-0 ${u.suspended ? "bg-amber-50/40" : ""}`}>
                  {/* Member */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-slate-900 text-rose-300" : "bg-rose-100 text-rose-700"}`}>
                        {u.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium">
                          <span className="truncate">{u.name}</span>
                          {u.role === "admin" && (
                            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-rose-300">
                              Admin
                            </span>
                          )}
                          {isSelf && <span className="text-xs font-normal text-slate-400">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-400">Joined {fmtDate(u.createdAt)}</p>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3.5">
                    <select
                      value={u.planId}
                      disabled={busy}
                      onChange={(e) =>
                        act(
                          u.id,
                          { method: "PATCH", body: JSON.stringify({ action: "setPlan", planId: e.target.value }) },
                          `${u.name} moved to the ${PLAN_OPTIONS.find((p) => p.id === e.target.value)?.label} plan (comp'd).`
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium outline-none transition focus:border-rose-400 disabled:opacity-50"
                    >
                      {PLAN_OPTIONS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] capitalize text-slate-400">{u.cycle}{u.cancelAtPeriodEnd ? " · cancelling" : ""}</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    {u.suspended ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Suspended</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {u.matches}
                    <span className="text-xs text-slate-400"> · {u.dates} dates</span>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {u.likesUsed.toLocaleString("en-US")}
                    <span className="text-xs text-slate-400">
                      {" "}/ {u.likeLimit === null ? "∞" : u.likeLimit.toLocaleString("en-US")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium tabular-nums">{fmtMoney(u.revenue)}</td>

                  {/* Actions */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => act(u.id, { method: "PATCH", body: JSON.stringify({ action: "resetLikes" }) }, `Like allowance reset for ${u.name}.`)}
                        disabled={busy}
                        title="Reset like allowance"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                      >
                        Reset likes
                      </button>
                      {u.role === "member" ? (
                        <>
                          <button
                            onClick={() =>
                              act(
                                u.id,
                                { method: "PATCH", body: JSON.stringify({ action: "suspend", suspended: !u.suspended }) },
                                u.suspended ? `${u.name} reinstated.` : `${u.name} suspended.`
                              )
                            }
                            disabled={busy}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                              u.suspended
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "border border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
                            }`}
                          >
                            {u.suspended ? "Reinstate" : "Suspend"}
                          </button>
                          <button
                            onClick={() => act(u.id, { method: "PATCH", body: JSON.stringify({ action: "setRole", role: "admin" }) }, `${u.name} promoted to admin.`)}
                            disabled={busy}
                            title="Promote to admin"
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 disabled:opacity-50"
                          >
                            Make admin
                          </button>
                          <button
                            onClick={() => setConfirmDelete(u)}
                            disabled={busy}
                            title="Delete account"
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        !isSelf && (
                          <button
                            onClick={() => act(u.id, { method: "PATCH", body: JSON.stringify({ action: "setRole", role: "member" }) }, `${u.name} demoted to member.`)}
                            disabled={busy}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 disabled:opacity-50"
                          >
                            Demote
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-6 backdrop-blur-sm"
          onClick={() => !busyId && setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Delete {confirmDelete.name}&apos;s account?</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              This permanently removes their profile, <strong>{confirmDelete.matches}</strong>{" "}
              match{confirmDelete.matches === 1 ? "" : "es"}, {confirmDelete.dates} planned date
              {confirmDelete.dates === 1 ? "" : "s"} and {confirmDelete.invoices} invoice
              {confirmDelete.invoices === 1 ? "" : "s"}. It can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={busyId !== null}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400"
              >
                Keep account
              </button>
              <button
                onClick={async () => {
                  const target = confirmDelete;
                  const ok = await act(target.id, { method: "DELETE" }, `${target.name}'s account deleted.`);
                  if (ok) setConfirmDelete(null);
                }}
                disabled={busyId !== null}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {busyId ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
