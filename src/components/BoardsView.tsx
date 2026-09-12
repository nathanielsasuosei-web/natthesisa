"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Board } from "@/lib/store";
import { describeLimit } from "@/lib/plans";

interface Props {
  boards: Board[];
  maxBoards: number | null;
  actionsUsed: number;
  actionLimit: number | null;
}

interface ApiError {
  error: string;
  code?: string;
}

export default function BoardsView({ boards, maxBoards, actionsUsed, actionLimit }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [taskDraft, setTaskDraft] = useState<Record<string, string>>({});

  const blocked = error?.code === "BOARD_LIMIT" || error?.code === "ACTION_LIMIT";
  const actionsLeft =
    actionLimit === null ? null : Math.max(actionLimit - actionsUsed, 0);

  async function call(url: string, init: RequestInit): Promise<boolean> {
    setError(null);
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Something went wrong." }));
        setError(data as ApiError);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError({ error: "Network error — please try again." });
      return false;
    }
  }

  async function createBoard(e: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    const ok = await call("/api/boards", { method: "POST", body: JSON.stringify({ name }) });
    setCreating(false);
    if (ok) setName("");
  }

  return (
    <div className="space-y-4">
      {/* Create board */}
      <form onSubmit={createBoard} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            maxBoards !== null && boards.length >= maxBoards
              ? "Board limit reached — upgrade to add more"
              : "New board name…"
          }
          disabled={maxBoards !== null && boards.length >= maxBoards}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={creating || (maxBoards !== null && boards.length >= maxBoards) || !name.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create board"}
        </button>
      </form>

      {/* Error / upsell banner */}
      {error && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
            blocked
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className="font-medium">{error.error}</span>
          {blocked && (
            <Link
              href="/dashboard/plans"
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500"
            >
              View plans →
            </Link>
          )}
        </div>
      )}

      {/* Actions meter */}
      <p className="text-xs text-slate-500">
        Actions used this period: <span className="font-semibold text-slate-700">{actionsUsed.toLocaleString("en-US")}</span>
        {actionsLeft !== null && <> · {actionsLeft.toLocaleString("en-US")} left on the current plan</>}
      </p>

      {/* Boards */}
      {boards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No boards yet — create your first one above.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              taskDraft={taskDraft[board.id] ?? ""}
              onDraft={(v) => setTaskDraft((d) => ({ ...d, [board.id]: v }))}
              onAddTask={async () => {
                const title = (taskDraft[board.id] ?? "").trim();
                if (!title) return;
                const ok = await call(`/api/boards/${board.id}/tasks`, {
                  method: "POST",
                  body: JSON.stringify({ title }),
                });
                if (ok) setTaskDraft((d) => ({ ...d, [board.id]: "" }));
              }}
              onToggleTask={(taskId, done) =>
                call(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ done: !done }) })
              }
              onDeleteTask={(taskId) => call(`/api/tasks/${taskId}`, { method: "DELETE" })}
              onDeleteBoard={() => {
                if (confirm(`Delete board “${board.name}” and all its tasks?`))
                  call(`/api/boards/${board.id}`, { method: "DELETE" });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BoardCard({
  board,
  taskDraft,
  onDraft,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onDeleteBoard,
}: {
  board: Board;
  taskDraft: string;
  onDraft: (v: string) => void;
  onAddTask: () => void;
  onToggleTask: (taskId: string, done: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteBoard: () => void;
}) {
  const done = board.tasks.filter((t) => t.done).length;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{board.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {done}/{board.tasks.length} done
          </p>
        </div>
        <button
          onClick={onDeleteBoard}
          title="Delete board"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" />
          </svg>
        </button>
      </div>

      <ul className="mt-4 flex-1 space-y-1.5">
        {board.tasks.map((task) => (
          <li key={task.id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-slate-50">
            <button
              onClick={() => onToggleTask(task.id, task.done)}
              aria-label={task.done ? "Mark as not done" : "Mark as done"}
              className={[
                "grid size-5 shrink-0 place-items-center rounded-md border transition",
                task.done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-slate-300 bg-white hover:border-emerald-400",
              ].join(" ")}
            >
              {task.done && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
            <span className={`min-w-0 flex-1 truncate text-sm ${task.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
              {task.title}
            </span>
            <button
              onClick={() => onDeleteTask(task.id)}
              title="Delete task"
              className="rounded-md p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-600"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-3.5">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </li>
        ))}
        {board.tasks.length === 0 && (
          <li className="py-2 text-xs text-slate-400">No tasks yet.</li>
        )}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAddTask();
        }}
        className="mt-4 flex gap-2 border-t border-slate-100 pt-4"
      >
        <input
          value={taskDraft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder="Add a task…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={!taskDraft.trim()}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
