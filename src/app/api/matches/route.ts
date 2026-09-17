import { NextResponse } from "next/server";
import { DiscoverError, topOfDeck, swipe } from "@/lib/discover";
import { getPlan } from "@/lib/plans";
import {
  NOT_DISCOVERABLE_ERROR,
  PROFILE_INCOMPLETE_ERROR,
  SUSPENDED_ERROR,
  getCurrentUser,
  isSuspended,
  needsProfileSetup,
} from "@/lib/session";
import { getStore } from "@/lib/store";

/**
 * POST /api/matches — "like whoever is next in the deck".
 *
 * Thin alias over /api/discover/swipe so there's exactly one set of rules
 * (allowance, match slots, profile gate, visibility) no matter which screen
 * you liked someone from.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });
  if (needsProfileSetup(user)) return NextResponse.json(PROFILE_INCOMPLETE_ERROR, { status: 403 });
  if (!user.settings.privacy.discoverable)
    return NextResponse.json(NOT_DISCOVERABLE_ERROR, { status: 403 });

  const card = topOfDeck(user);
  if (!card)
    return NextResponse.json(
      {
        error:
          "That's everyone in this demo pool for now. Reshuffle to see the people you passed on again.",
        code: "POOL_EMPTY",
      },
      { status: 409 }
    );

  try {
    const result = swipe(user, card.name, "like");
    return NextResponse.json(
      { ok: true, match: result.matched, mutual: result.mutual, note: result.note },
      { status: result.matched ? 201 : 200 }
    );
  } catch (err) {
    if (err instanceof DiscoverError)
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    console.error("matches", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });
  return NextResponse.json({
    matches: user.matches,
    plan: getPlan(user.subscription.planId).name,
    members: getStore().users.size,
  });
}
