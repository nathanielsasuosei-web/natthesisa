import { NextRequest, NextResponse } from "next/server";
import { signup } from "@/lib/accounts";
import { handleError, readJson } from "@/lib/api";
import { applySessionCookie } from "@/lib/session";
import { toProfileDto } from "@/lib/profile";

/**
 * POST /api/auth/signup
 * Body: { name, email, password, birthDate }
 * Creates the account, opens the session, and hands the client straight to
 * profile creation (`profile.completedAt` is still null at this point).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const { user } = signup({
      name: body.name as string,
      email: body.email as string,
      password: body.password as string,
      birthDate: body.birthDate as string,
    });

    const res = NextResponse.json(
      {
        ok: true,
        role: user.role,
        user: toProfileDto(user, user.profile, user.settings),
        needsProfileSetup: true,
      },
      { status: 201 }
    );
    return applySessionCookie(res, user.id);
  } catch (err) {
    return handleError(err);
  }
}
