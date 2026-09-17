import { NextRequest, NextResponse } from "next/server";
import { DiscoverError, reshuffleDeck, rewindLast, swipe } from "@/lib/discover";
import { readJson } from "@/lib/api";
import { getPlan } from "@/lib/plans";
import { profileCompleteness } from "@/lib/profile";
import {
  NOT_DISCOVERABLE_ERROR,
  PROFILE_INCOMPLETE_ERROR,
  SUSPENDED_ERROR,
  getCurrentUser,
  isSuspended,
  needsProfileSetup,
} from "@/lib/session";
import type { SwipeAction, User } from "@/lib/store";

const SWIPE_ACTIONS: SwipeAction[] = ["like", "pass", "super"];

/**
 * POST /api/discover/swipe
 *   body { action: "like" | "pass" | "super", name }   — swipe the top card
 *   body { action: "rewind" }                          — take the last one back
 *   body { action: "reshuffle" }                       — bring passed profiles back
 *
 * This is the only way to swipe. The deck may animate whatever it likes, but
 * nothing counts until this route accepts it — the plan's like allowance, the
 * match-slot cap, the finished-profile gate, visibility and suspension are all
 * checked here, in that order.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (isSuspended(user)) return NextResponse.json(SUSPENDED_ERROR, { status: 403 });

  try {
    const body = await readJson(req);
    const action = body.action;

    if (action === "rewind") {
      const { restored, note, deck } = rewindLast(user);
      return NextResponse.json({ ok: true, action, restored, note, deck, ...stats(user) });
    }
    if (action === "reshuffle") {
      const { back, deck } = reshuffleDeck(user);
      return NextResponse.json({ ok: true, action, back, deck, ...stats(user) });
    }

    if (!SWIPE_ACTIONS.includes(action as SwipeAction))
      return NextResponse.json(
        { error: "Expected like, pass, super, rewind or reshuffle." },
        { status: 400 }
      );

    // everything that costs a like needs a finished profile and a visible profile
    if (needsProfileSetup(user)) return NextResponse.json(PROFILE_INCOMPLETE_ERROR, { status: 403 });
    if (!user.settings.privacy.discoverable)
      return NextResponse.json(NOT_DISCOVERABLE_ERROR, { status: 403 });

    const result = swipe(user, body.name, action as SwipeAction);
    return NextResponse.json(
      {
        ok: true,
        action,
        note: result.note,
        mutual: result.mutual,
        matched: result.matched,
        deck: result,
        ...stats(user),
      },
      { status: result.matched ? 201 : 200 }
    );
  } catch (err) {
    if (err instanceof DiscoverError)
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    console.error("discover/swipe", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/** Meters the deck shows under the cards. */
function stats(user: User) {
  const plan = getPlan(user.subscription.planId);
  return {
    plan: { id: plan.id, name: plan.name, matches: plan.limits.matches, likes: plan.limits.likesPerPeriod },
    completeness: profileCompleteness(user.profile),
  };
}
