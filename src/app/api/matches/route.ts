import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import {
  DISCOVER_POOL,
  Match,
  logActivity,
  consumeAction,
  getStore,
  uid,
} from "@/lib/store";

/** Like someone new — the app "discovers" the next single for you. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const plan = getPlan(user.subscription.planId);

  // --- membership control: match limit enforced server-side ---
  if (plan.limits.matches !== null && user.matches.length >= plan.limits.matches) {
    return NextResponse.json(
      {
        error: `The ${plan.name} plan allows ${plan.limits.matches} active matches. Upgrade to meet more people.`,
        code: "MATCH_LIMIT",
      },
      { status: 402 }
    );
  }
  // --- membership control: likes allowance enforced server-side ---
  if (!consumeAction(user)) {
    return NextResponse.json(
      {
        error: `You've used all ${plan.limits.likesPerPeriod} likes in this billing period. Upgrade for more.`,
        code: "LIKE_LIMIT",
      },
      { status: 402 }
    );
  }

  // pick the next single the user hasn't matched with yet
  const taken = new Set(user.matches.map((m) => m.name));
  const candidates = DISCOVER_POOL.filter((s) => !taken.has(s.name));
  const seed =
    candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : {
          ...DISCOVER_POOL[Math.floor(Math.random() * DISCOVER_POOL.length)],
          name: `${DISCOVER_POOL[Math.floor(Math.random() * DISCOVER_POOL.length)].name} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`,
        };

  const match: Match = {
    id: uid(),
    name: seed.name,
    age: seed.age,
    bio: seed.bio,
    emoji: seed.emoji,
    compatibility: seed.compatibility,
    createdAt: new Date().toISOString(),
    dateIdeas: [],
  };
  user.matches.push(match);
  logActivity(user, `It's a match — you and ${match.name} liked each other 💘`);
  return NextResponse.json({ ok: true, match }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ matches: user.matches, store: getStore().users.size });
}
