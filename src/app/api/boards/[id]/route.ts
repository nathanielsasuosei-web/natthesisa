import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { audit, consumeAction } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const idx = user.boards.findIndex((b) => b.id === id);
  if (idx === -1) return NextResponse.json({ error: "Board not found." }, { status: 404 });

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

  const [removed] = user.boards.splice(idx, 1);
  audit(user, `Deleted board “${removed.name}”`);
  return NextResponse.json({ ok: true });
}
