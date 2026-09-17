import { NextResponse } from "next/server";
import { toProfileDto, profileCompleteness } from "@/lib/profile";
import { getCurrentUser } from "@/lib/session";

/**
 * GET /api/auth/me — who is signed in (used by the client shell to hydrate
 * forms and to decide between /dashboard and /onboarding).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signedIn: false }, { status: 401 });
  return NextResponse.json({
    signedIn: true,
    profile: toProfileDto(user, user.profile, user.settings),
    completeness: profileCompleteness(user.profile),
    role: user.role,
    suspended: user.suspended,
    planId: user.subscription.planId,
  });
}
