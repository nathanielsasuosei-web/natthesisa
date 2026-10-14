import { fmtMoney } from "./format";
import { halfAmount, type ProgramPaymentPart } from "./pass-periods";

/**
 * The ways a program can be paid for, as the buttons and the checkout modal
 * show them.
 *
 * One place decides the wording and the numbers, so the dashboard course page,
 * the programs page and the locked-lesson page all offer a half payment with
 * the same sentence and the same amount. The amounts are for display only —
 * `/api/checkout` prices the `covers` value again on the server, so a doctored
 * amount in the browser cannot buy a program cheaply.
 *
 * The split itself (half of the price, half of each course's lessons) lives in
 * `pass-periods.ts` and `access.ts`; nothing here does arithmetic beyond
 * showing what is left.
 */

export interface CheckoutChoice {
  /** What the server is asked to sell: the whole program, its first half, or the balance. */
  covers: ProgramPaymentPart;
  /** The label on the card, e.g. "Pay in full". */
  label: string;
  amount: number;
  /** The sentence under the label that says what this opens. */
  note: string;
  /** What the success step says once this choice has been paid for. */
  done: string;
}

/**
 * What to offer for one program.
 *
 *   • nothing paid yet — pay in full (the default, listed first) or half now,
 *     which opens the first half of every course in it;
 *   • half already paid — only the balance, for exactly what is left;
 *   • paid in full — nothing: the buttons are not rendered at all.
 */
export function programChoices(opts: {
  programName: string;
  price: number;
  entitlement?: "none" | "half" | "full";
  /** What is still owed (the whole price when nothing has been paid). */
  balance?: number;
}): CheckoutChoice[] {
  const { programName, price, entitlement = "none" } = opts;
  if (entitlement === "full" || price <= 0) return [];

  if (entitlement === "half") {
    const left = Math.max(0, opts.balance ?? price - halfAmount(price));
    return [
      {
        covers: "balance",
        label: "Pay the balance",
        amount: left,
        note: `Opens every remaining lesson in ${programName}, permanently.`,
        done: `The balance is paid — every lesson in the ${programName} program is open now.`,
      },
    ];
  }

  const half = halfAmount(price);
  const left = Math.max(0, price - half);
  return [
    {
      covers: "full",
      label: "Pay in full",
      amount: price,
      note: `Every course and every lesson in ${programName}, permanently.`,
      done: `The ${programName} program is yours now. Every lesson is open.`,
    },
    {
      covers: "half",
      label: "Pay half now",
      amount: half,
      note: `Opens the first half of every course in ${programName}. The rest opens when you pay the balance${left > 0 ? ` of ${fmtMoney(left)}` : ""}.`,
      done: `You paid half — the first half of every course in ${programName} is open. The rest opens when you pay the balance${left > 0 ? ` of ${fmtMoney(left)}` : ""}.`,
    },
  ];
}

/** What a student who has paid half still owes, for a one-line status sentence. */
export function balanceSentence(programName: string, balance: number): string {
  return `${fmtMoney(balance)} left to pay on ${programName} before every lesson in it opens.`;
}
