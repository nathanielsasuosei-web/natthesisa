import { NextResponse } from "next/server";
import { deckState } from "@/lib/discover";
import {
  NOT_DISCOVERABLE_ERROR,
  PROFILE_INCOMPLETE_ERROR,
  SUSPENDED_ERROR,
  getCurrentUser,
  isSuspended,
  needsProfileSetup,
} from "@/lib/session";

/**
 * GET /api/discover — the deck in one call: cards to swipe (already filtered
 * by gender, age range and distance, and de-duplicated against your history)
 * plus the counters that drive the limit meters and the "why am I blocked" copy.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  return NextResponse.json({
    signedIn: true,
    name: user.name,
    deck: deckState(user),
    gating: {
      suspended: isSuspended(user),
      needsProfile: needsProfileSetup(user),
      hidden: !user.settings.privacy.discoverable,
    },
    blockers: {
      suspended: isSuspended(user) ? SUSPENDED_ERROR : null,
      profile: needsProfileSetup(user) ? PROFILE_INCOMPLETE_ERROR : null,
      hidden: !user.settings.privacy.discoverable ? NOT_DISCOVERABLE_ERROR : null,
    },
  });
}
