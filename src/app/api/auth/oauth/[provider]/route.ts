import { NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/safe-next";
import {
  OAUTH_STATE_COOKIE,
  authorizeUrl,
  beginFlowState,
  callbackUrl,
  flowStateCookieValue,
  isOAuthProvider,
  oauthFailure,
  providerConfigured,
  stateCookieOptions,
} from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts a Google / Facebook / Apple sign-in.
 *
 * Reached by the "Continue with …" buttons. The student comes back to the
 * callback route with a code from the provider; everything about this visit
 * (which provider, the PKCE verifier, where to land afterwards) travels there
 * in a signed, short-lived cookie.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!isOAuthProvider(provider)) return oauthFailure(req, "failed");
  if (!providerConfigured(provider)) return oauthFailure(req, "unconfigured");

  // `next` is where the student was heading (e.g. the lesson that asked them
  // to sign in); it is checked to be a path on this site before it is trusted.
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  const flow = beginFlowState(provider, next);

  const response = NextResponse.redirect(authorizeUrl(provider, callbackUrl(req, provider), flow), 303);
  response.cookies.set(OAUTH_STATE_COOKIE, flowStateCookieValue(flow), stateCookieOptions(req, 600));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
