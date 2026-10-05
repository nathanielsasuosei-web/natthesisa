import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paystack API client (server-only — the secret key must never reach the browser).
 *
 * Paystack is the payment provider for Ghana: one integration takes MTN MoMo,
 * Telecel Cash, AT Money, cards and bank transfers in Ghana cedis, and the
 * student approves a MoMo charge with their own PIN on their own phone.
 *
 * The flow used here is Paystack Standard Checkout:
 *
 *   1. `initializeTransaction()` creates a transaction and returns an
 *      `authorization_url`. The student is redirected there.
 *   2. The student pays on Paystack's page (MoMo prompt, card form, …).
 *   3. Paystack sends the browser back to our `callback_url` with the
 *      reference, AND posts a `charge.success` webhook to
 *      `/api/webhooks/paystack`.
 *   4. Both the callback page and the webhook call `verifyTransaction()` and
 *      fulfil the purchase — whichever runs first wins (see `payments.ts` for
 *      the idempotency), so a slow webhook can never lose a payment and a
 *      forged callback can never grant access.
 *
 * Test mode: Paystack test keys (`sk_test_…`) behave exactly like live ones,
 * including a test MoMo approval. Nothing here distinguishes test from live —
 * the dashboard shows which key is configured so the teacher always knows.
 */

const API_BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new PaystackError("Paystack is not configured.", "NOT_CONFIGURED", 503);
  return key;
}

/** True when real payments are possible (a secret key is configured). */
export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}

/** `sk_test_…` vs `sk_live_…` — shown in the teacher console, never to students. */
export function paystackKeyMode(): "test" | "live" | "missing" {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) return "missing";
  return key.startsWith("sk_live_") ? "live" : "test";
}

export class PaystackError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "PAYSTACK_ERROR", status = 502) {
    super(message);
    this.name = "PaystackError";
    this.code = code;
    this.status = status;
  }
}

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (error) {
    throw new PaystackError(
      `Could not reach the payment service (${error instanceof Error ? error.message : "network error"}). Check your connection and try again.`,
      "NETWORK_ERROR"
    );
  }
  const envelope = (await response.json().catch(() => null)) as PaystackEnvelope<T> | null;
  if (!response.ok || !envelope?.status) {
    const message = envelope?.message || `Paystack responded with HTTP ${response.status}.`;
    console.error(`[codemasterghana] paystack ${path} failed: ${message}`);
    throw new PaystackError(
      "The payment could not be started. Try again in a moment.",
      "PROVIDER_ERROR",
      response.status >= 500 ? 502 : 400
    );
  }
  return envelope.data;
}

export interface InitializeParams {
  email: string;
  /** Amount in cedis (whole pesewas handled inside — pass e.g. 20 for GH₵20). */
  amountGhs: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
  /** Channels offered on the Paystack page. MoMo first: it is how Ghana pays. */
  channels?: Array<"mobile_money" | "card" | "bank_transfer" | "ussd" | "qr" | "bank">;
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializeTransaction(params: InitializeParams): Promise<InitializeResult> {
  const data = await api<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: params.email,
      // Paystack takes the smallest currency unit: pesewas for GHS.
      amount: Math.round(params.amountGhs * 100),
      currency: "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: params.channels ?? ["mobile_money", "card", "bank_transfer"],
      metadata: params.metadata ?? {},
    },
  });
  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

export interface VerifiedTransaction {
  reference: string;
  status: string;
  /** Amount actually paid, in cedis. */
  amountGhs: number;
  currency: string;
  channel: string;
  paidAt: string | null;
  customerEmail: string;
  /** The MoMo / card details Paystack reports, for receipts. */
  authorization: {
    brand?: string;
    last4?: string;
    bank?: string;
    mobile_money_number?: string;
  } | null;
  metadata: Record<string, string>;
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const data = await api<{
    reference: string;
    status: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string | null;
    customer: { email: string };
    authorization: VerifiedTransaction["authorization"];
    metadata: Record<string, string> | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);
  return {
    reference: data.reference,
    status: data.status,
    amountGhs: data.amount / 100,
    currency: data.currency,
    channel: data.channel,
    paidAt: data.paid_at,
    customerEmail: data.customer.email,
    authorization: data.authorization,
    metadata: data.metadata ?? {},
  };
}

/**
 * Verifies a webhook genuinely came from Paystack: the `x-paystack-signature`
 * header must be the HMAC-SHA512 of the raw request body under the secret key.
 * The comparison is constant-time; a missing or wrong signature is a forgery.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    status: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string | null;
    customer: { email: string };
    authorization: VerifiedTransaction["authorization"];
    metadata: Record<string, string> | null;
  };
}

/** Parses a webhook body after its signature has been verified. */
export function parseWebhookEvent(rawBody: string): PaystackWebhookEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as PaystackWebhookEvent;
    if (typeof parsed?.event !== "string" || typeof parsed?.data?.reference !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Confirms the secret key works, for `npm run payments:check` and the teacher
 * console. Lists the supported Ghana banks — a cheap authenticated call that
 * fails loudly on a wrong or revoked key.
 */
export async function checkConnection(): Promise<{ ok: true; mode: "test" | "live" }> {
  await api<unknown[]>("/bank?currency=GHS&pay_with_bank_transfer=true");
  return { ok: true, mode: paystackKeyMode() === "live" ? "live" : "test" };
}
