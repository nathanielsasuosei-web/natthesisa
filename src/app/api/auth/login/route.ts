import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/accounts";
import { handleError, readJson } from "@/lib/api";
import { profileCompleteness, toProfileDto } from "@/lib/profile";
import { applySessionCookie } from "@/lib/session";

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Verifies the password against the stored scrypt hash, resets the failure
 * counter, and opens a 30-day session cookie. Repeated failures lock sign-in.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const { user } = authenticate(body.email, body.password);
    const completeness = profileCompleteness(user.profile);

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      role: user.role,
      suspended: user.suspended,
      name: user.name,
      profile: toProfileDto(user, user.profile, user.settings),
      completeness,
      // the client uses these two flags to decide where to land
      next: user.role === "admin" ? "/admin" : completeness.done ? "/app/discover" : "/onboarding",
    });
    return applySessionCookie(res, user.id);
  } catch (err) {
    return handleError(err);
  }
}
