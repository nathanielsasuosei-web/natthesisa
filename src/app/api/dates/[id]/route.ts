import { NextRequest, NextResponse } from "next/server";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { logActivity, consumeAction, findDateIdea } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const { id } = await ctx.params;
  const found = findDateIdea(user, id);
  if (!found) return NextResponse.json({ error: "Date idea not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.done !== "boolean") {
    return NextResponse.json({ error: "`done` must be a boolean." }, { status: 400 });
  }

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

  found.idea.done = body.done;
  logActivity(
    user,
    `${body.done ? "Went on" : "Un-marked"} the date “${found.idea.title}” with ${found.match.name}`
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  const { id } = await ctx.params;
  const found = findDateIdea(user, id);
  if (!found) return NextResponse.json({ error: "Date idea not found." }, { status: 404 });

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

  found.match.dateIdeas = found.match.dateIdeas.filter((t) => t.id !== id);
  logActivity(user, `Removed the date idea “${found.idea.title}”`);
  return NextResponse.json({ ok: true });
}
