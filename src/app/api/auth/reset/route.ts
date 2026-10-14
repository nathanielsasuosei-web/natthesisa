import { NextRequest, NextResponse } from "next/server";
import { ensureReady } from "@/lib/bootstrap";
import { passwordProblem } from "@/lib/passwords";
import { getUserById, logActivity, saveUser, setPassword } from "@/lib/store";
import { readResetToken, recordSignIn, resetTokenMatches, sessionCookie } from "@/lib/session";

/**
 * Checks a reset link without changing anything, so the page can say up front
 * that a link has expired instead of waiting for the first submit.
 */
export async function GET(req: NextRequest) {
  try {
    await ensureReady();
    const payload = readResetToken(req.nextUrl.searchParams.get("token"));
    const user = payload ? await getUserById(payload.userId) : null;
    const valid = Boolean(payload && user && !user.suspended && resetTokenMatches(payload, user));
    return NextResponse.json({ valid }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("reset link check failed", error);
    return NextResponse.json({ valid: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

/**
 * Sets a new password from a reset link, then signs the person in.
 *
 * Changing the hash is what retires the link, so reusing it fails. The
 * sign-in is a normal session cookie, the same as the sign-in form issues.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureReady();
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    const payload = readResetToken(token);
    const user = payload ? await getUserById(payload.userId) : null;
    if (!payload || !user || !resetTokenMatches(payload, user)) {
      return NextResponse.json(
        { error: "This reset link has expired or was already used. Request a new one.", code: "LINK_INVALID" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (user.suspended) {
      return NextResponse.json(
        { error: "Your account is paused. Please contact an administrator for help.", code: "SUSPENDED" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const problem = passwordProblem(password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400, headers: { "Cache-Control": "no-store" } });

    setPassword(user, password);
    logActivity(user, "Password reset from an emailed link", "account");
    await saveUser(user);

    await recordSignIn(user);
    const cookie = await sessionCookie(user.id);
    const response = NextResponse.json({ ok: true, message: "Password updated", role: user.role });
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("password reset failed", error);
    return NextResponse.json(
      { error: "Your password could not be changed. Check the database connection and try again.", code: "UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
