/**
 * Confirms the Mobile Money configuration actually works.
 *
 *   npm run payments:check
 *
 * Reports whether live payments are on (a Paystack secret key is set), which
 * mode the key is in (test vs live), and — when a key is present — calls
 * Paystack once to prove the key is valid. Without a key it says so plainly:
 * the checkout runs in demo mode and no real money can move.
 */
import { loadEnv, mask } from "./load-env.mts";

loadEnv();

const key = process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";

if (!key) {
  console.log("payments: DEMO mode — PAYSTACK_SECRET_KEY is unset.");
  console.log("  The checkout simulates the MoMo approval and no real money moves.");
  console.log("  Set PAYSTACK_SECRET_KEY (sk_test_… first) to take real payments.");
  process.exit(0);
}

const mode = key.startsWith("sk_live_") ? "LIVE" : key.startsWith("sk_test_") ? "TEST" : "UNKNOWN PREFIX";
console.log(`payments: Paystack key present — ${mask(key)} [${mode}]`);
if (mode === "LIVE") {
  console.log("  ⚠ LIVE key: real money moves. Use sk_test_… until launch day.");
}

try {
  const response = await fetch("https://api.paystack.co/bank?currency=GHS&pay_with_bank_transfer=true", {
    headers: { Authorization: `Bearer ${key}` },
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
