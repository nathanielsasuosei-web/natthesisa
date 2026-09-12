import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { audit, consumeAction, getStore, uid } from "@/lib/store";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "Board name is required." }, { status: 400 });

  const plan = getPlan(user.subscription.planId);

  // --- subscription control: board limit enforced server-side ---
  if (plan.limits.boards !== null && user.boards.length >= plan.limits.boards) {
    return NextResponse.json(
      {
        error: `The ${plan.name} plan allows ${plan.limits.boards} boards. Upgrade to add more.`,
        code: "BOARD_LIMIT",
      },
      { status: 402 }
    );
  }
  // --- subscription control: action allowance enforced server-side ---
  if (!consumeAction(user)) {
    return NextResponse.json(
      {
        error: `You've used all ${plan.limits.actionsPerPeriod} actions in this billing period. Upgrade for more.`,
        code: "ACTION_LIMIT",
      },
      { status: 402 }
    );
  }

  const board = { id: uid(), name, createdAt: new Date().toISOString(), tasks: [] };
  user.boards.push(board);
  audit(user, `Created board “${name}”`);
  return NextResponse.json({ ok: true, board }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ boards: user.boards, store: getStore().users.size });
}
