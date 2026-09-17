import { NextResponse } from "next/server";
import {
  PROFILE_INCOMPLETE_ERROR,
  SUSPENDED_ERROR,
  getCurrentUser,
  isSuspended,
  needsProfileSetup,
} from "@/lib/session";
import { getPlan } from "@/lib/plans";
import {
  Match,
  logActivity,
  consumeAction,
  createMatch,
  getStore,
  pickCandidate,
} from "@/lib/store";

/** Like someone new — the app "discovers" the next single for you. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });
  // a profile is what makes matching fair — so it's required before the first like
  if (needsProfileSetup(user))
    return NextResponse.json(PROFILE_INCOMPLETE_ERROR, { status: 403 });
  // a hidden profile can't meet anyone new — the toggle is enforced, not decorative
  if (!user.settings.privacy.discoverable) {
    return NextResponse.json(
      {
        error:
          "You're hidden from Discover, so new matches are paused. Turn visibility back on in account settings.",
        code: "NOT_DISCOVERABLE",
      },
      { status: 403 }
    );
  }

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

  // respect the member's dating preferences first, widen only if that leaves nobody
  const seed = pickCandidate(user, { respectPreferences: true });
  if (!seed) {
    return NextResponse.json(
      {
        error:
          "You've liked everyone in this demo pool. Widen your age range or distance in profile settings to meet more people.",
        code: "POOL_EMPTY",
      },
      { status: 409 }
    );
  }

  const match: Match = createMatch(user, seed);
  user.matches.push(match);
  logActivity(user, `It's a match — you and ${match.name} liked each other 💘`);
  return NextResponse.json({ ok: true, match }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });
  return NextResponse.json({ matches: user.matches, store: getStore().users.size });
}
