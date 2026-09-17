import { NextResponse } from "next/server";
import { applySessionCookie } from "@/lib/session";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  return applySessionCookie(NextResponse.json({ ok: true }), null);
}
