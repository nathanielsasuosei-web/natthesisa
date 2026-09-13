import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { logActivity, consumeAction, uid } from "@/lib/store";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const match = user.matches.find((m) => m.id === id);
  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 140) : "";
  if (!title) return NextResponse.json({ error: "A date idea is required." }, { status: 400 });

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

  match.dateIdeas.push({ id: uid(), title, done: false, createdAt: new Date().toISOString() });
  logActivity(user, `Planned “${title}” with ${match.name}`);
  return NextResponse.json({ ok: true }, { status: 201 });
}
