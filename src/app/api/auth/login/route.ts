import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { createUser, findUserByName } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
  }

  const user = findUserByName(name) ?? createUser(name);
  if (user.role === undefined) user.role = user.name.toLowerCase() === "admin" ? "admin" : "member";
  if (user.suspended === undefined) user.suspended = false;

  const res = NextResponse.json({ ok: true, userId: user.id, role: user.role });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
