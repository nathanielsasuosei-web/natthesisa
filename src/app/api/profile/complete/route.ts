import { NextResponse } from "next/server";
import { finishOnboarding } from "@/lib/accounts";
import { handleError, requireAccount } from "@/lib/api";
import { profileCompleteness, toProfileDto } from "@/lib/profile";

/**
 * POST /api/profile/complete — closes profile creation (used by both
 * "Looks good" and "Finish later" so we know the member has been through it).
 */
export async function POST() {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    finishOnboarding(session.user);
    const user = session.user;
    return NextResponse.json({
      ok: true,
      profile: toProfileDto(user, user.profile, user.settings),
      completeness: profileCompleteness(user.profile),
    });
  } catch (err) {
    return handleError(err);
  }
}
