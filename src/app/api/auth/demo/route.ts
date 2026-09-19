import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { findUserByEmail } from "@/lib/store";

function redirectOnCurrentHost(path: string): NextResponse {
  // Use a relative Location header. In a proxied preview, request.url can point
  // at 0.0.0.0 instead of the browser-visible host; constructing an absolute
  // URL from it would send the browser somewhere it cannot reach.
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path, "Cache-Control": "no-store" },
  });
}

/**
 * One-click access for the self-contained demo accounts.
 * Remove this route when production authentication is connected.
 */
export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role");
  const email = role === "admin" ? "admin@codemasterghana.dev" : "student@codemasterghana.dev";
  const user = findUserByEmail(email);

  if (!user) {
    return redirectOnCurrentHost(role === "admin" ? "/admin-sign-in?error=unavailable" : "/login?error=unavailable");
  }

  const destination = user.role === "admin" ? "/admin" : "/dashboard";
  const response = redirectOnCurrentHost(destination);
  response.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
