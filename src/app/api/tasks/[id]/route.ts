import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { audit, consumeAction, findTask } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const found = findTask(user, id);
  if (!found) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.done !== "boolean") {
    return NextResponse.json({ error: "`done` must be a boolean." }, { status: 400 });
  }

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

  found.task.done = body.done;
  audit(user, `${body.done ? "Completed" : "Reopened"} task “${found.task.title}”`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const found = findTask(user, id);
  if (!found) return NextResponse.json({ error: "Task not found." }, { status: 404 });

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

  found.board.tasks = found.board.tasks.filter((t) => t.id !== id);
  audit(user, `Deleted task “${found.task.title}”`);
  return NextResponse.json({ ok: true });
}
