import { NextRequest, NextResponse } from "next/server";
import { updateProfile } from "@/lib/accounts";
import { handleError, readJson, requireAccount } from "@/lib/api";
import { getPlan } from "@/lib/plans";
import { profileCompleteness, toProfileDto } from "@/lib/profile";

/**
 * GET /api/profile — the signed-in member's own profile plus how complete it is.
 */
export async function GET() {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  const { user } = session;
  return NextResponse.json({
    profile: toProfileDto(user, user.profile, user.settings),
    completeness: profileCompleteness(user.profile),
    plan: getPlan(user.subscription.planId).name,
  });
}

/**
 * PATCH /api/profile
 * Body: any of { name, birthDate, gender, pronouns, city, country, bio,
 *               interests, avatar, preferences }
 * Unknown keys are ignored; invalid ones come back as 400 + `fields`.
 */
export async function PATCH(req: NextRequest) {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const body = await readJson(req);
    const { user, changed } = updateProfile(session.user, body);
    return NextResponse.json({
      ok: true,
      changed,
      profile: toProfileDto(user, user.profile, user.settings),
      completeness: profileCompleteness(user.profile),
    });
  } catch (err) {
    return handleError(err);
  }
}
