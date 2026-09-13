import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { logActivity, consumeAction } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const { id } = await ctx.params;
  const idx = user.matches.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  const plan = getPlan(user.subscription.planId);
  if (!consumeAction(user)) {
    return NextResponse.json(
      {
        error: `You've used all ${plan.limits.likesPerPeriod} likes in this billing period. Upgrade for more.`,
        code: "LIKE_LIMIT",
      },
      { status: 402 }
    );
  }

  const [removed] = user.matches.splice(idx, 1);
  logActivity(user, `Unmatched with ${removed.name}`);
  return NextResponse.json({ ok: true });
}
