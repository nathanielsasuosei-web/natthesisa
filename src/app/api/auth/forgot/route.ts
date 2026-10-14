import { NextRequest, NextResponse } from "next/server";
import { ensureReady } from "@/lib/bootstrap";
import { noteAttempt, retryAfterSeconds } from "@/lib/attempt-limit";
import { notifyPasswordReset } from "@/lib/email";
import { findUserByEmail } from "@/lib/store";
import { createResetToken } from "@/lib/session";
import { siteUrl } from "@/config/site";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORGOT_LIMIT = 5;

/**
 * "Forgot password" request.
 *
 * The answer is the same whether or not an account exists, so the form cannot
 * be used to discover which emails are registered. The link is only sent to a
 * real, active account. Requests are rate-limited per email and address.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureReady();
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!emailPattern.test(email) || email.length > 160) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const key = `reset-request|${email}|${req.headers.get("x-forwarded-for") ?? "local"}`;
    const waitSeconds = retryAfterSeconds(key, FORGOT_LIMIT);
    if (waitSeconds > 0) {
      return NextResponse.json(
        { error: "Too many reset requests. Wait a few minutes and try again.", code: "RATE_LIMITED", retryAfter: waitSeconds },
        { status: 429, headers: { "Retry-After": String(waitSeconds), "Cache-Control": "no-store" } }
      );
    }
    noteAttempt(key);

    const user = await findUserByEmail(email);
    if (user && !user.suspended) {
      const token = createResetToken(user);
      await notifyPasswordReset({
        to: user.email,
        name: user.name,
        link: `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`,
      });
    }

    return NextResponse.json(
      { ok: true, message: "If an account exists for that email, a reset link is on its way. It expires in 30 minutes." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("password reset request failed", error);
    return NextResponse.json(
      { error: "We could not send a reset link right now. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
