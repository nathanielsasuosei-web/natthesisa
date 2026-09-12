import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { audit, consumeAction, uid } from "@/lib/store";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const board = user.boards.find((b) => b.id === id);
  if (!board) return NextResponse.json({ error: "Board not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 140) : "";
  if (!title) return NextResponse.json({ error: "Task title is required." }, { status: 400 });

  const plan = getPlan(user.subscription.planId);
  if (!consumeAction(user)) {
    return NextResponse.json(
      {
        error: `You've used all ${plan.limits.actionsPerPeriod} actions in this billing period. Upgrade for more.`,
        code: "ACTION_LIMIT",
      },
      { status: 402 }
    );
  }

  board.tasks.push({ id: uid(), title, done: false, createdAt: new Date().toISOString() });
  audit(user, `Added task “${title}” to “${board.name}”`);
  return NextResponse.json({ ok: true }, { status: 201 });
}
