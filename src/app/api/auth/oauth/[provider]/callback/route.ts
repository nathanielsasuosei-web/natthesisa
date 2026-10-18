import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { recordSignIn, sessionCookie } from "@/lib/session";
import {
  OAUTH_STATE_COOKIE,
  accountForProfile,
  callbackUrl,
  fetchSocialProfile,
  isOAuthProvider,
  oauthFailure,
  readFlowState,
  requestOrigin,
  stateCookieOptions,
} from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where a Google / Facebook / Apple sign-in lands.
 *
 * Google and Facebook redirect back with a query string; Apple posts a form
 * (the only way it will share a name), so both verbs are handled here. The
 * `state` in the answer is checked against the signed cookie the start route
 * wrote — a callback that did not begin here fails closed.
 *
 * On success the student is signed in exactly like password sign-in: an
 * existing account with that verified email is used as-is, and a first-time
 * visitor gets a new account (and its student number) on the spot.
 */

async function handle(req: NextRequest, providerRaw: string): Promise<NextResponse> {
  try {
    return await completeSignIn(req, providerRaw);
  } catch (error) {
    // Provider outages, network hiccups, unexpected payloads — none of these
    // should ever surface as an unstyled error page mid-sign-in.
    console.error("[codemasterghana] social sign-in failed", error);
    return oauthFailure(req, "failed");
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  return handle(req, provider);
}

export async function POST(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  return handle(req, provider);
}

async function completeSignIn(req: NextRequest, providerRaw: string): Promise<NextResponse> {
  if (!isOAuthProvider(providerRaw)) return oauthFailure(req, "failed");
  const provider = providerRaw;

  let code = req.nextUrl.searchParams.get("code") ?? "";
  let state = req.nextUrl.searchParams.get("state") ?? "";
  let providerError = req.nextUrl.searchParams.get("error");
  let userField: string | null = null;
  if (req.method === "POST") {
    const form = await req.formData();
    code = String(form.get("code") ?? code);
    state = String(form.get("state") ?? state);
    providerError = String(form.get("error") ?? providerError ?? "") || null;
    userField = form.get("user") ? String(form.get("user")) : null;
  }

  const jar = await cookies();
  const flow = readFlowState(jar.get(OAUTH_STATE_COOKIE)?.value);
  // The state cookie is one-shot whichever way this ends.
  const doneWithState = { ...stateCookieOptions(req, 0), maxAge: 0 };

  if (providerError) {
    // The student pressed "Cancel", or the provider refused — not an error to
    // blame them for, just a sign-in that did not happen.
    const response = oauthFailure(req, "denied");
    response.cookies.set(OAUTH_STATE_COOKIE, "", doneWithState);
    return response;
  }
  if (!flow || flow.provider !== provider || !state || flow.state !== state) {
    const response = oauthFailure(req, "mismatch");
    response.cookies.set(OAUTH_STATE_COOKIE, "", doneWithState);
    return response;
  }
  if (!code) {
    const response = oauthFailure(req, "failed");
    response.cookies.set(OAUTH_STATE_COOKIE, "", doneWithState);
    return response;
  }

  const profile = await fetchSocialProfile(provider, code, callbackUrl(req, provider), flow.verifier, userField);
  if (!profile.email.trim()) {
    const response = oauthFailure(req, "no_email");
    response.cookies.set(OAUTH_STATE_COOKIE, "", doneWithState);
    return response;
  }

  const user = await accountForProfile(provider, profile);
  await recordSignIn(user);

  const cookie = await sessionCookie(user.id);
  const target = flow.next ?? (user.role === "owner" ? "/owner" : "/dashboard");
  const response = NextResponse.redirect(new URL(target, requestOrigin(req)), 303);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  response.cookies.set(OAUTH_STATE_COOKIE, "", doneWithState);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
