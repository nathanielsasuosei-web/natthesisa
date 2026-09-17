import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/lib/accounts";
import { handleError, readJson, requireAccount } from "@/lib/api";
import { passwordStrength } from "@/lib/password";
import { applySessionCookie } from "@/lib/session";

/**
 * PUT /api/settings/password — body { currentPassword, newPassword }.
 * Keeps the current session alive (cookie re-issued) and clears any lockout.
 */
export async function PUT(req: NextRequest) {
  const session = await requireAccount();
  if ("response" in session) return session.response;
  try {
    const body = await readJson(req);
    changePassword(
      session.user,
      typeof body.currentPassword === "string" ? body.currentPassword : "",
      typeof body.newPassword === "string" ? body.newPassword : ""
    );
    const res = NextResponse.json({
      ok: true,
      changedAt: new Date().toISOString(),
      strength: passwordStrength(typeof body.newPassword === "string" ? body.newPassword : ""),
    });
    return applySessionCookie(res, session.user.id);
  } catch (err) {
    return handleError(err);
  }
}
