/**
 * Tiny helpers shared by every API route: JSON body parsing, a consistent
 * error envelope, and the session gate used by the account routes.
 */
import { NextRequest, NextResponse } from "next/server";
import { AccountError } from "./accounts";
import { ProfileValidationError } from "./profile";
import { SubscriptionError } from "./subscription";
import { SUSPENDED_ERROR, getCurrentUser, isSuspended } from "./session";
import type { User } from "./store";

export interface ErrorBody {
  error: string;
  code?: string;
  fields?: Record<string, string>;
}

export function fail(
  error: string,
  opts: { code?: string; status?: number; fields?: Record<string, string> } = {}
): NextResponse {
  const body: ErrorBody = { error };
  if (opts.code) body.code = opts.code;
  if (opts.fields && Object.keys(opts.fields).length > 0) body.fields = opts.fields;
  return NextResponse.json(body, { status: opts.status ?? 400 });
}

/** Turn a thrown domain error into the right HTTP response. */
export function handleError(err: unknown): NextResponse {
  if (err instanceof AccountError)
    return fail(err.message, { code: err.code, status: err.status, fields: err.fields });
  if (err instanceof ProfileValidationError)
    return fail(err.message, { code: err.code, status: err.status, fields: err.fields });
  if (err instanceof SubscriptionError)
    return fail(err.message, { code: err.code, status: 400 });
  console.error("[api]", err);
  return fail("Something went wrong on our side. Please try again.", {
    code: "SERVER_ERROR",
    status: 500,
  });
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  if (body === null || body === undefined) return {};
  throw new AccountError("Expected a JSON object body.", "BAD_BODY", 400);
}

export type SessionResult = { user: User } | { response: NextResponse };

/** Signed in and in good standing. */
export async function requireSession(): Promise<SessionResult> {
  const user = await getCurrentUser();
  if (!user) return { response: fail("Please sign in to continue.", { code: "UNAUTHORIZED", status: 401 }) };
  if (isSuspended(user))
    return { response: NextResponse.json(SUSPENDED_ERROR, { status: 403 }) };
  return { user };
}

/**
 * Signed in — suspension tolerated. Used by the account routes so a suspended
 * member can still edit their profile, change their password and delete
 * themselves; the blocklist lives on social + billing actions.
 */
export async function requireAccount(): Promise<SessionResult> {
  const user = await getCurrentUser();
  if (!user) return { response: fail("Please sign in to continue.", { code: "UNAUTHORIZED", status: 401 }) };
  return { user };
}
