import { createHash, createPublicKey, randomBytes, sign as cryptoSign, verify as cryptoVerify, type JsonWebKey } from "node:crypto";
import { readFileSync } from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { signValue, verifySignedValue } from "./session";
import { safeNextPath } from "./safe-next";
import {
  AccountExistsError,
  createSocialUser,
  findUserByEmail,
  type User,
} from "./store";

/**
 * Sign-in with Google, Facebook or Apple.
 *
 * The flow is plain OAuth 2.0 (plus OpenID Connect for Google and Apple), run
 * by these helpers and the two routes under `/api/auth/oauth/`:
 *
 *   1. `/api/auth/oauth/<provider>` signs a short-lived `state` (and a PKCE
 *      verifier) into a cookie, then sends the student to the provider.
 *   2. The provider sends them back to `/api/auth/oauth/<provider>/callback`
 *      with a `code`. The callback checks `state` against the cookie, trades
 *      the code for tokens, reads the verified profile, and signs the student
 *      in — creating their account (with its student number) on first visit.
 *
 * The same `users` row backs every way in: a student who signed up with a
 * password can later press "Continue with Google" for the same email, and a
 * student who signed up with a provider can set a password on their account
 * page. Nothing links or duplicates: the verified email is the identity.
 *
 * Each provider needs its own credentials in the environment (see
 * `.env.example`); until they are set, the buttons explain that sign-in is not
 * configured yet instead of failing halfway through.
 */

export const OAUTH_PROVIDERS = ["google", "facebook", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

const LABELS: Record<OAuthProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
};

/** What the login page shows when a social sign-in comes back empty-handed. */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  unconfigured: "Sign-in with that provider is not set up on this deployment yet. Ask the site owner to add its credentials.",
  denied: "The provider did not complete sign-in. Please try again.",
  mismatch: "That sign-in attempt could not be verified or has timed out. Please try again.",
  no_email: "That provider did not share an email address, so we could not match or create an account. Try another way to sign in.",
  failed: "Sign-in with that provider did not work. Please try again.",
};

export function oauthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? OAUTH_ERROR_MESSAGES.failed;
}

/* -------------------------------------------------------------------------- */
/* Credentials                                                                */
/* -------------------------------------------------------------------------- */

interface Credentials {
  clientId: string;
  clientSecret: string;
}

function googleCredentials(): Credentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

function facebookCredentials(): Credentials | null {
  const clientId = process.env.FACEBOOK_APP_ID?.trim();
  const clientSecret = process.env.FACEBOOK_APP_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/**
 * Apple needs an app-specific secret: a short-lived ES256 JWT this function
 * signs with the `.p8` key Apple issued (the Team and Key ids come along).
 * The key can be given as `APPLE_PRIVATE_KEY` (with `\n` escapes) or as a
 * path in `APPLE_PRIVATE_KEY_FILE`.
 */
function appleCredentials(): (Credentials & { clientSecret: string }) | null {
  const clientId = process.env.APPLE_CLIENT_ID?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  let key = process.env.APPLE_PRIVATE_KEY?.trim();
  const keyFile = process.env.APPLE_PRIVATE_KEY_FILE?.trim();
  if (!key && keyFile) {
    try {
      key = readFileSync(/* turbopackIgnore: true */ keyFile, "utf8").trim();
    } catch (error) {
      console.error("[codemasterghana] could not read APPLE_PRIVATE_KEY_FILE", error);
      return null;
    }
  }
  key = key?.replace(/\\n/g, "\n");
  if (!clientId || !teamId || !keyId || !key) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(Buffer.from(JSON.stringify({ alg: "ES256", kid: keyId })));
  const claims = base64url(
    Buffer.from(
      JSON.stringify({
        iss: teamId,
        iat: now,
        // Apple accepts client secrets up to six months old.
        exp: now + 60 * 60 * 24 * 180,
        aud: "https://appleid.apple.com",
        sub: clientId,
      })
    )
  );
  const signature = cryptoSign("sha256", Buffer.from(`${header}.${claims}`), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return { clientId, clientSecret: `${header}.${claims}.${base64url(signature)}` };
}

export function providerConfigured(provider: OAuthProvider): boolean {
  return (
    (provider === "google" && Boolean(googleCredentials())) ||
    (provider === "facebook" && Boolean(facebookCredentials())) ||
    (provider === "apple" && Boolean(appleCredentials()))
  );
}

/* -------------------------------------------------------------------------- */
/* URLs                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The origin the browser is actually talking to, derived from the request's
 * forwarded headers. It wins over any configured canonical domain: a mismatch
 * here is the classic "redirect_uri_mismatch" failure. `NEXT_PUBLIC_SITE_URL`
 * is honoured when a proxy makes the true origin unknowable.
 */
export function requestOrigin(req: NextRequest): string {
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.nextUrl.protocol.replace(":", "");
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host") || req.nextUrl.host;
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || `${proto}://${host}`).replace(/\/+$/, "");
}

export function callbackUrl(req: NextRequest, provider: OAuthProvider): string {
  return `${requestOrigin(req)}/api/auth/oauth/${provider}/callback`;
}

function base64url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

/* -------------------------------------------------------------------------- */
/* The state cookie                                                           */
/* -------------------------------------------------------------------------- */

export const OAUTH_STATE_COOKIE = "codara_oauth_state";
/** Long enough to read a consent screen, short enough that a stale state is useless. */
const STATE_TTL_MS = 10 * 60 * 1000;

interface FlowState {
  provider: OAuthProvider;
  state: string;
  /** PKCE verifier, kept server-side until the code comes back. */
  verifier: string;
  /** Where to land after signing in — already checked to be a same-site path. */
  next: string | null;
  expires: number;
}

/**
 * The cookie is written `SameSite=None; Secure` wherever HTTPS is in play,
 * because Apple answers with a cross-site form POST (Google and Facebook are
 * top-level redirects) and a `Lax` cookie would not come back with it. Plain
 * local development over http falls back to `Lax` — Apple sign-in on http is
 * not a scenario any provider supports anyway.
 */
export function stateCookieOptions(req: NextRequest, maxAgeSeconds: number) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .split(",")[0]
    .split(":")[0]
    .toLowerCase();
  const local = /^(localhost|127\.0\.0\.1|::1)$/.test(host);
  return {
    httpOnly: true,
    sameSite: (local ? "lax" : "none") as "lax" | "none",
    secure: !local,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function beginFlowState(provider: OAuthProvider, next: string | null): FlowState {
  const flow: FlowState = {
    provider,
    state: randomBytes(24).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    next,
    expires: Date.now() + STATE_TTL_MS,
  };
  return flow;
}

/** The signed cookie value that carries a flow to the callback. */
export function flowStateCookieValue(flow: FlowState): string {
  const payload = `oauth.${flow.provider}.${flow.state}.${flow.expires}.${flow.verifier}.${base64url(flow.next ?? "")}`;
  return `${payload}.${signValue(payload)}`;
}

export function readFlowState(value: string | undefined | null): FlowState | null {
  if (!value) return null;
  const parts = value.split(".");
  // oauth.<provider>.<state>.<expires>.<verifier>.<next>.<signature>
  if (parts.length !== 7 || parts[0] !== "oauth") return null;
  const [, provider, state, expiresRaw, verifier, nextRaw, signature] = parts;
  if (!isOAuthProvider(provider)) return null;
  const expires = Number(expiresRaw);
  if (!state || !verifier || !Number.isFinite(expires) || expires < Date.now()) return null;
  if (!verifySignedValue(`oauth.${provider}.${state}.${expiresRaw}.${verifier}.${nextRaw}`, signature)) return null;
  let next: string | null = null;
  try {
    next = safeNextPath(Buffer.from(nextRaw, "base64url").toString("utf8"));
  } catch {
    next = null;
  }
  return { provider, state, verifier, next, expires };
}

/* -------------------------------------------------------------------------- */
/* Provider endpoints                                                         */
/* -------------------------------------------------------------------------- */

export function authorizeUrl(provider: OAuthProvider, redirectUri: string, flow: FlowState): string {
  const params = new URLSearchParams({
    client_id: credentialsFor(provider)?.clientId ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    state: flow.state,
  });

  if (provider === "google") {
    params.set("scope", "openid email profile");
    params.set("prompt", "select_account");
    // PKCE: the code is useless without the verifier kept in the state cookie.
    params.set("code_challenge", sha256Base64Url(flow.verifier));
    params.set("code_challenge_method", "S256");
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
  if (provider === "facebook") {
    params.set("scope", "email,public_profile");
    return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
  }
  // Apple: `name` is only shared on the very first consent, and asking for it
  // requires the answer to come back as a form POST.
  params.set("scope", "name email");
  params.set("response_mode", "form_post");
  params.set("code_challenge", sha256Base64Url(flow.verifier));
  params.set("code_challenge_method", "S256");
  return `https://appleid.apple.com/auth/authorize?${params}`;
}

function credentialsFor(provider: OAuthProvider): Credentials | null {
  if (provider === "google") return googleCredentials();
  if (provider === "facebook") return facebookCredentials();
  return appleCredentials();
}

/* -------------------------------------------------------------------------- */
/* Code exchange and profiles                                                 */
/* -------------------------------------------------------------------------- */

export interface SocialProfile {
  /** The provider's own id for this person. */
  providerId: string;
  email: string;
  name: string;
}

async function tradeCode(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
  verifier: string
): Promise<{ accessToken: string; idToken: string | null }> {
  const credentials = credentialsFor(provider);
  if (!credentials) throw new Error(`no ${provider} credentials`);

  if (provider === "facebook") {
    const url = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    url.searchParams.set("client_id", credentials.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("client_secret", credentials.clientSecret);
    url.searchParams.set("code", code);
    const response = await fetch(url, { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as { access_token?: string; error?: unknown };
    if (!response.ok || !data.access_token) throw new Error("facebook token exchange failed");
    return { accessToken: data.access_token, idToken: null };
  }

  const tokenUrl =
    provider === "google"
      ? "https://oauth2.googleapis.com/token"
      : "https://appleid.apple.com/auth/token";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code_verifier: verifier,
  });
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    id_token?: string;
    error?: unknown;
  };
  if (!response.ok || !data.access_token) throw new Error(`${provider} token exchange failed`);
  return { accessToken: data.access_token, idToken: data.id_token ?? null };
}

async function profileFromGoogle(accessToken: string): Promise<SocialProfile> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as {
    sub?: string;
    email?: string;
    name?: string;
  };
  if (!response.ok || !data.email) throw new Error("google profile failed");
  return { providerId: data.sub ?? data.email, email: data.email, name: data.name ?? "" };
}

async function profileFromFacebook(accessToken: string): Promise<SocialProfile> {
  const url = new URL("https://graph.facebook.com/me");
  url.searchParams.set("fields", "id,name,email");
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as { id?: string; name?: string; email?: string };
  if (!response.ok || !data.email || !data.id) throw new Error("facebook profile failed");
  return { providerId: data.id, email: data.email, name: data.name ?? "" };
}

interface AppleClaims {
  sub?: string;
  email?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
}

/**
 * Apple hands the identity over as a signed `id_token`. The signature is
 * checked against Apple's published keys (and the usual issuer, audience and
 * expiry claims), so a forged token from anywhere else is rejected here.
 */
async function profileFromApple(idToken: string, userField: string | null, clientId: string): Promise<SocialProfile> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("malformed apple id_token");
  const [headerPart, payloadPart, signaturePart] = parts;

  const claims = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as AppleClaims;
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== "https://appleid.apple.com" || !audience.includes(clientId)) {
    throw new Error("apple id_token is for someone else");
  }
  if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
    throw new Error("apple id_token expired");
  }

  const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8")) as { kid?: string };
  const keysResponse = await fetch("https://appleid.apple.com/auth/keys", { cache: "no-store" });
  const keys = (await keysResponse.json().catch(() => ({ keys: [] }))) as {
    keys: JsonWebKey[];
  };
  const jwk = keys.keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("apple signing key not found");
  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const signature = Buffer.from(signaturePart, "base64url");
  const valid = cryptoVerify(
    "sha256",
    Buffer.from(`${headerPart}.${payloadPart}`),
    { key: publicKey, dsaEncoding: "ieee-p1363" },
    signature
  );
  if (!valid) throw new Error("apple id_token signature invalid");
  if (!claims.email) throw new Error("apple id_token has no email");

  // Apple shares the name once, as JSON in the form-post `user` field.
  let name = "";
  if (userField) {
    try {
      const user = JSON.parse(userField) as { name?: { firstName?: string; lastName?: string } };
      name = [user.name?.firstName, user.name?.lastName].filter(Boolean).join(" ");
    } catch {
      name = "";
    }
  }
  return { providerId: claims.sub ?? claims.email, email: claims.email, name };
}

export async function fetchSocialProfile(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
  verifier: string,
  userField: string | null = null
): Promise<SocialProfile> {
  const tokens = await tradeCode(provider, code, redirectUri, verifier);
  if (provider === "google") return profileFromGoogle(tokens.accessToken);
  if (provider === "facebook") return profileFromFacebook(tokens.accessToken);
  const clientId = appleCredentials()?.clientId ?? "";
  if (!tokens.idToken) throw new Error("apple returned no id_token");
  return profileFromApple(tokens.idToken, userField, clientId);
}

/* -------------------------------------------------------------------------- */
/* Accounts                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The profile is now a verified email from the provider — which is exactly the
 * identity an account is keyed by. An existing student (password or social) is
 * signed in to their same account; a new email gets a new account, numbered
 * like every other. The name a provider sends is used only when creating.
 */
export async function accountForProfile(provider: OAuthProvider, profile: SocialProfile): Promise<User> {
  const email = profile.email.trim().toLowerCase().slice(0, 160);
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  const fallbackName = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  try {
    return await createSocialUser(profile.name.trim().slice(0, 60) || fallbackName, email, LABELS[provider]);
  } catch (error) {
    // Two first-time sign-ins at once: the loser of the race still signs in.
    if (error instanceof AccountExistsError) {
      const winner = await findUserByEmail(email);
      if (winner) return winner;
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Route helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Where a failed social sign-in lands: the login page, with an explanation. */
export function oauthFailure(req: NextRequest, code: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?oauth=${encodeURIComponent(code)}`, requestOrigin(req)), 303);
}
