/**
 * Confirms the Mobile Money configuration actually works.
 *
 *   npm run payments:check
 *
 * Reports the Paystack key pair (publishable + secret), which mode each key
 * is in (test vs live), warns when the pair is mismatched, and — when a
 * secret key is present — calls Paystack once to prove it is valid. Without a
 * secret key it says so plainly: the checkout runs in demo mode and no real
 * money can move.
 */
import { loadEnv, mask } from "./load-env.mts";

loadEnv();

const secret = process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";
const publik = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ?? "";

function modeOf(key: string, livePrefix: string): "LIVE" | "TEST" | "missing" {
  if (!key) return "missing";
  return key.startsWith(livePrefix) ? "LIVE" : "TEST";
}

const publicMode = modeOf(publik, "pk_live_");
console.log(`payments: publishable key — ${mask(publik, 12)} [${publicMode}]`);
if (!publik) {
  console.log("  Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY (pk_test_… / pk_live_…) from Paystack → Settings → API keys.");
}

if (!secret) {
  console.log("payments: DEMO mode — PAYSTACK_SECRET_KEY is unset.");
  console.log("  The checkout simulates the MoMo approval and no real money moves.");
  console.log("  Set PAYSTACK_SECRET_KEY (sk_test_… first) to take real payments.");
  process.exit(0);
}

const secretMode = modeOf(secret, "sk_live_");
console.log(`payments: secret key — ${mask(secret)} [${secretMode}]`);
if (secretMode === "LIVE") {
  console.log("  ⚠ LIVE key: real money moves. Use sk_test_… until launch day.");
}
if (publik && secretMode !== publicMode) {
  console.log(
    `  ⚠ MISMATCH: the secret key is ${secretMode} but the publishable key is ${publicMode}. ` +
      "Use the test pair together or the live pair together."
  );
}

try {
  const response = await fetch("https://api.paystack.co/bank?currency=GHS&pay_with_bank_transfer=true", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = (await response.json().catch(() => null)) as { status?: boolean; message?: string } | null;
  if (!response.ok || !body?.status) {
    console.error(`payments: Paystack rejected the key — ${body?.message ?? `HTTP ${response.status}`}.`);
    console.error("  Copy the secret key again from Paystack → Settings → API keys.");
    process.exit(1);
  }
  console.log("payments: Paystack answered — the key works.");
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  console.log(
    `payments: webhook URL to register in Paystack → Settings → Webhooks:\n  ${base || "https://your-domain.com"}/api/webhooks/paystack`
  );
} catch (error) {
  console.error(`payments: could not reach Paystack — ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
