import { randomBytes } from "node:crypto";
import { ensureSchema, query, queryOne } from "./db";
import { getCourse } from "./courses";
import { findContentLesson } from "./course-content";
import {
  coursePrice,
  fmtMoney,
  isPassPeriod,
  isProgramPaymentPart,
  lessonPrice,
  passPrice,
  programPrice,
  type PassPeriod,
  type ProgramPaymentPart,
} from "./plans";
import {
  PurchaseError,
  buyCourse,
  buyLesson,
  buyPass,
  buyProgram,
  type PaymentAttribution,
} from "./purchases";
import { getUserById, logActivity, saveUser, type User } from "./store";
import { notifyContentPurchased, notifyPassPurchased, notifyProgramPurchased } from "./email";
import {
  PaystackError,
  initializeTransaction,
  isPaystackConfigured,
  refundTransaction,
  verifyTransaction,
} from "./paystack";
import { getProgram } from "./programs";
import { hasActivePass, ownsCourse, ownsLesson, ownsProgram, programLedger } from "./access";

/**
 * Checkouts and payment fulfilment.
 *
 * Money enters through exactly one door: a row in `payments`, created before
 * the student pays and fulfilled after the payment is verified. Demo mode
 * (no `PAYSTACK_SECRET_KEY`) and live mode (Paystack Standard Checkout: MoMo,
 * card, bank transfer) share the same door, so switching providers on changes
 * where the money moves — never what a purchase grants.
 *
 * Idempotency is the whole game. A successful payment can be reported twice
 * (the return URL *and* the webhook), and must still grant exactly one pass /
 * purchase, one invoice and one receipt email. The `payments` row is the lock:
 * the first fulfilment flips `pending` → `paid` and does the work; every later
 * attempt sees `paid` and returns without touching the account.
 *
 * Double charges are prevented at the source (an open checkout for the same
 * item is reused, never duplicated) and cured when prevention fails (a proven
 * second payment for the same item is refunded automatically).
 */

export type PaymentKind = "pass" | "course" | "lesson" | "program";
export type PaymentStatus = "pending" | "paid" | "failed" | "abandoned";
export type PaymentProvider = "demo" | "paystack";

export interface Payment {
  reference: string;
  userId: string;
  kind: PaymentKind;
  period: PassPeriod | null;
  courseId: string | null;
  lessonId: string | null;
  programId: string | null;
  /**
   * How much of a program this checkout pays for — the first half, the balance
   * after it, or the whole thing at once. Rows written before part payments
   * existed carry no value and are read as `"full"`.
   */
  covers: ProgramPaymentPart;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  phone: string | null;
  network: string | null;
  authorizationUrl: string | null;
  channel: string | null;
  invoiceNumber: string | null;
  providerEventId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentRow {
  reference: string;
  user_id: string;
  kind: string;
  period: string | null;
  course_id: string | null;
  lesson_id: string | null;
  program_id: string | null;
  covers: string | null;
  amount: number;
  currency: string;
  description: string;
  status: string;
  provider: string;
  phone: string | null;
  network: string | null;
  authorization_url: string | null;
  channel: string | null;
  invoice_number: string | null;
  provider_event_id: string | null;
  paid_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

function fromRow(row: PaymentRow): Payment {
  return {
    reference: row.reference,
    userId: row.user_id,
    kind: row.kind as PaymentKind,
    period: row.period as PassPeriod | null,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    programId: row.program_id,
    // A `covers` this app does not know (a hand-edited row) is read as a
    // payment for the whole program: granting less than was paid for would be
    // the worse mistake.
    covers: isProgramPaymentPart(row.covers) ? row.covers : "full",
    // `Number(...)`: a `payments` table whose `amount` column is `numeric`
    // (rather than this app's `integer`) hands the value back as a string —
    // `"300.00"` — and a string amount leaks into invoices, receipts and the
    // owner's revenue figures. Normalizing here makes the row the same shape
    // whichever table it came from.
    amount: Number(row.amount),
    currency: row.currency,
    description: row.description,
    status: row.status as PaymentStatus,
    provider: row.provider as PaymentProvider,
    phone: row.phone,
    network: row.network,
    authorizationUrl: row.authorization_url,
    channel: row.channel,
    invoiceNumber: row.invoice_number,
    providerEventId: row.provider_event_id,
    paidAt: row.paid_at ? iso(row.paid_at) : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export class CheckoutError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "CHECKOUT_ERROR", status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.code = code;
    this.status = status;
  }
}

/**
 * The plain sentence a checkout failure deserves when it was not one of ours.
 *
 * The generic banner ("The checkout could not be started.") is a dead end for
 * everyone: it says nothing a student can act on and hides a fixable database
 * problem from the teacher. A legacy `payments` table can fail on type,
 * constraint, or stale foreign-key mismatches while the reason lives only in
 * the host's logs. Naming the layer costs nothing and turns the next report
 * into a diagnosis. The Postgres code itself is only logged, never shown: it
 * is not the student's problem to read.
 */
export function describeCheckoutFailure(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "22P02":
    case "42804":
      return "the payments table stores account ids in a format this app cannot use";
    case "23514":
      return "the payments table still has an old rule that rejects this purchase";
    case "23502":
      return "the payments table demands a column this app no longer fills";
    case "42703":
      return "the payments table is missing a column this app needs";
    case "23503":
      return "the payments table still has an outdated account link";
    case "42P01":
      return "the payments table is missing";
    default:
      return "the database refused the payment row";
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function getPayment(reference: string): Promise<Payment | null> {
  await ensureSchema();
  const row = await queryOne<PaymentRow>("select * from payments where reference = $1", [reference]);
  return row ? fromRow(row) : null;
}

export async function getPaymentByEventId(providerEventId: string): Promise<Payment | null> {
  await ensureSchema();
  const row = await queryOne<PaymentRow>("select * from payments where provider_event_id = $1", [
    providerEventId,
  ]);
  return row ? fromRow(row) : null;
}

export async function listPaymentsForUser(userId: string, limit = 20): Promise<Payment[]> {
  await ensureSchema();
  // `user_id::text` (on the column, not the parameter) is what makes this work
  // on both shapes of the table: a `user_id uuid` left by another project
  // otherwise fails the whole query with `42883 operator does not exist:
  // text = uuid`. `ensureSchema()` now aligns that column to text, and the
  // cast keeps the read working on a database where it could not (a role
  // without ALTER rights) — see the heal block in `schema.ts`.
  const rows = await query<PaymentRow>(
    "select * from payments where user_id::text = $1 order by created_at desc limit $2",
    [userId, Math.min(Math.max(limit, 1), 100)]
  );
  return rows.map(fromRow);
}

export interface RecentPayment extends Payment {
  userName: string;
  userEmail: string;
}

export async function listRecentPayments(limit = 50): Promise<RecentPayment[]> {
  await ensureSchema();
  // `p.user_id::text` is deliberate, not decoration. `users.id` is `text`, but a
  // `payments` table made by an older build or by a database integration may hold
  // `user_id` as `uuid` — and a database reshaped that way has no foreign key
  // between the two, because PostgreSQL cannot create one across mismatched types.
  // Comparing `text = uuid` directly then fails the whole query with
  // `42883 operator does not exist: text = uuid`, which took the entire teacher
  // console down with an opaque 500. The cast makes the join correct on both
  // shapes, and is a no-op once the column is `text`.
  const rows = await query<PaymentRow & { user_name: string; user_email: string }>(
    `select p.*, u.name as user_name, u.email as user_email
       from payments p join users u on u.id = p.user_id::text
      order by p.created_at desc limit $1`,
    [Math.min(Math.max(limit, 1), 200)]
  );
  return rows.map((row) => ({ ...fromRow(row), userName: row.user_name, userEmail: row.user_email }));
}

export async function countPendingPayments(): Promise<number> {
  await ensureSchema();
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from payments where status = 'pending'"
  );
  return Number(row?.count ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Checkout creation                                                          */
/* -------------------------------------------------------------------------- */

export interface CheckoutInput {
  kind: PaymentKind;
  period?: string;
  courseId?: string;
  lessonId?: string;
  programId?: string;
  /** How much of the program to pay for now. Defaults to the whole thing. */
  covers?: string;
  phone?: string;
  network?: string;
}

export interface CheckoutQuote {
  kind: PaymentKind;
  period: PassPeriod | null;
  courseId: string | null;
  lessonId: string | null;
  programId: string | null;
  covers: ProgramPaymentPart;
  amount: number;
  description: string;
}

/**
 * Prices what the student asked for and checks it can still be bought.
 * Throws `CheckoutError` (or `PurchaseError` for already-owned content) when
 * the request makes no sense — before any row is written or provider called.
 *
 * A program can be bought in two parts, and the server — never the browser —
 * decides what each part costs:
 *
 *   • `"half"` is half of today's price. It is only sold to a student who has
 *     not started paying yet; one who has is told to pay the balance instead,
 *     because a second "half" is a second charge for the same access.
 *   • `"balance"` and `"full"` both come to today's price minus everything
 *     already paid. For a student who never paid anything that is the whole
 *     price; for one who paid half it is exactly what is left.
 */
export function quoteCheckout(user: User, input: CheckoutInput): CheckoutQuote {
  const kind = input.kind;
  if (kind === "program") {
    const programId = input.programId?.trim() ?? "";
    const program = programId ? getProgram(programId) : null;
    if (!program) throw new CheckoutError("That program does not exist.", "NOT_FOUND", 404);
    const covers: ProgramPaymentPart = isProgramPaymentPart(input.covers) ? input.covers : "full";
    const ledger = programLedger(user, programId);
    if (ledger.entitlement === "full") {
      throw new PurchaseError("You already own this program.", "ALREADY_OWNED", 409);
    }

    if (covers === "half") {
      if (ledger.entitlement === "half") {
        throw new CheckoutError(
          `You have already paid the first half of the ${program.name} program. Pay the remaining ${fmtMoney(ledger.balance)} to open the rest.`,
          "INSTALMENT_STARTED",
          409
        );
      }
      if (ledger.firstPayment <= 0) {
        throw new CheckoutError("This program costs nothing — no checkout needed.", "FREE_ITEM");
      }
      return {
        kind,
        period: null,
        courseId: null,
        lessonId: null,
        programId,
        covers,
        amount: ledger.firstPayment,
        description: `${program.name} — first half of the program`,
      };
    }

    // `balance` and `full` are the same amount: what is still owed.
    if (ledger.balance <= 0) {
      throw new PurchaseError("You already own this program.", "ALREADY_OWNED", 409);
    }
    const settlesBalance = ledger.entitlement === "half" || covers === "balance";
    return {
      kind,
      period: null,
      courseId: null,
      lessonId: null,
      programId,
      covers: settlesBalance ? "balance" : "full",
      amount: ledger.balance,
      description: settlesBalance
        ? `${program.name} — balance payment`
        : `${program.name} — program purchase`,
    };
  }
  // Passes, courses and lessons are retired as things to buy: the program is
  // the only checkout. Payments already in flight still fulfil through
  // `fulfillPayment`, which never calls this function.
  if (kind === "pass" || kind === "course" || kind === "lesson") {
    throw new CheckoutError(
      "That is no longer sold on its own — buy the program it belongs to instead.",
      "RETIRED_ITEM",
      410
    );
  }
  throw new CheckoutError("Say what you are buying.", "BAD_REQUEST");
}

/** `CMG-…`: unique per checkout, URL-safe, and recognizable on a MoMo statement. */
export function newReference(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `CMG-${time}-${rand}`;
}

export interface CreatedCheckout {
  payment: Payment;
  /** Set for live checkouts: redirect the student's browser here to pay. */
  authorizationUrl: string | null;
  /** True when no provider is configured and the MoMo prompt is simulated. */
  demo: boolean;
  /** True when an already-open checkout was reused instead of creating one. */
  reused: boolean;
}

/**
 * An open (`pending`) checkout by this student for this exact item, if one
 * exists. Reused by `createCheckout` so two rows for one item — the shape a
 * double charge takes — are never created on purpose.
 */
async function findOpenCheckout(
  userId: string,
  quote: Pick<CheckoutQuote, "kind" | "period" | "courseId" | "lessonId" | "programId" | "covers">
): Promise<Payment | null> {
  await ensureSchema();
  const row = await queryOne<PaymentRow>(
    // `user_id::text`: see `listPaymentsForUser` — a legacy `uuid` column must
    // not be allowed to take the whole checkout down with a type error.
    //
    // `covers` is part of the identity of the item, not decoration: a student
    // who paid half and is now paying the balance is buying something different
    // from the half checkout that may still be sitting open, and reusing that
    // row would charge them for the same half twice.
    `select * from payments
      where user_id::text = $1 and kind = $2
        and coalesce(period, '') = $3
        and coalesce(course_id, '') = $4
        and coalesce(lesson_id, '') = $5
        and coalesce(program_id, '') = $6
        and coalesce(covers, 'full') = $7
        and status = 'pending'
      order by created_at desc limit 1`,
    [
      userId,
      quote.kind,
      quote.period ?? "",
      quote.courseId ?? "",
      quote.lessonId ?? "",
      quote.programId ?? "",
      quote.covers,
    ]
  );
  return row ? fromRow(row) : null;
}

export async function createCheckout(
  user: User,
  input: CheckoutInput,
  opts: { callbackBaseUrl: string }
): Promise<CreatedCheckout> {
  const quote = quoteCheckout(user, input);
  if (quote.amount <= 0) {
    throw new CheckoutError("This costs nothing — no checkout needed.", "FREE_ITEM");
  }
  await ensureSchema();

  const live = isPaystackConfigured();
  const provider: PaymentProvider = live ? "paystack" : "demo";

  // A checkout already open for the same item is reused, not duplicated.
  // The one exception is a provider switch mid-checkout — a demo row from
  // before the keys were added, or a live row from before they were removed —
  // which is closed so the new checkout matches the world as it is now. (A
  // stale-provider row would otherwise strand the student: a demo row can no
  // longer confirm once live, and a live row can no longer verify once demo.)
  const open = await findOpenCheckout(user.id, quote);
  if (open && open.provider === provider) {
    const phone = input.phone?.trim() || null;
    const network = input.network?.trim() || null;
    if (phone || network) {
      await query(
        "update payments set phone = coalesce($2, phone), network = coalesce($3, network), updated_at = now() where reference = $1",
        [open.reference, phone, network]
      );
    }
    const payment = (await getPayment(open.reference))!;
    console.info(`[codemasterghana] checkout reused ${payment.reference} (${quote.kind}, GH₵${quote.amount})`);
    return { payment, authorizationUrl: payment.authorizationUrl, demo: provider === "demo", reused: true };
  }
  if (open) {
    await markPaymentAbandoned(open.reference);
  }

  const phone = input.phone?.trim() || null;
  const network = input.network?.trim() || null;

  // References are random; on the near-impossible collision the insert is
  // retried with a fresh one instead of failing the checkout.
  let reference = newReference();
  for (let attempt = 0; ; attempt += 1) {
    try {
      await query(
        `insert into payments
           (reference, user_id, kind, period, course_id, lesson_id, program_id, covers, amount, currency,
            description, status, provider, phone, network)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'GHS',$10,'pending',$11,$12,$13)`,
        [
          reference,
          user.id,
          quote.kind,
          quote.period,
          quote.courseId,
          quote.lessonId,
          quote.programId,
          quote.covers,
          quote.amount,
          quote.description,
          provider,
          phone,
          network,
        ]
      );
      break;
    } catch (error) {
      if ((error as { code?: string }).code !== "23505" || attempt >= 2) throw error;
      reference = newReference();
    }
  }
  console.info(
    `[codemasterghana] checkout created ${reference} (${quote.kind}, ${quote.covers}, GH₵${quote.amount}, ${provider})`
  );

  if (!live) {
    const payment = (await getPayment(reference))!;
    return { payment, authorizationUrl: null, demo: true, reused: false };
  }

  // Live: ask Paystack for a checkout page, then send the student there.
  // `callback_url` is where Paystack returns the browser afterwards (with
  // `?reference=`); the webhook is what actually confirms the money.
  const base = opts.callbackBaseUrl.replace(/\/+$/, "");
  let authorizationUrl: string;
  try {
    const initialized = await initializeTransaction({
      email: user.email,
      amountGhs: quote.amount,
      reference,
      callbackUrl: `${base}/api/checkout/callback`,
      metadata: {
        userId: user.id,
        kind: quote.kind,
        period: quote.period ?? "",
        courseId: quote.courseId ?? "",
        lessonId: quote.lessonId ?? "",
        programId: quote.programId ?? "",
        covers: quote.covers,
        phone: phone ?? "",
        network: network ?? "",
      },
    });
    authorizationUrl = initialized.authorizationUrl;
  } catch (error) {
    await markPaymentFailed(reference);
    if (error instanceof PaystackError) {
      throw new CheckoutError(error.message, error.code, error.status);
    }
    throw error;
  }

  await query(
    "update payments set authorization_url = $2, updated_at = now() where reference = $1",
    [reference, authorizationUrl]
  );
  const payment = (await getPayment(reference))!;
  return { payment, authorizationUrl, demo: false, reused: false };
}

/* -------------------------------------------------------------------------- */
/* Fulfilment                                                                 */
/* -------------------------------------------------------------------------- */

export interface Fulfilment {
  payment: Payment;
  /** True when this reference was already paid — nothing was granted twice. */
  alreadyPaid: boolean;
  invoiceNumber: string | null;
  passActive: boolean;
}

async function markPaymentPaid(
  reference: string,
  opts: {
    channel?: string | null;
    invoiceNumber?: string | null;
    providerEventId?: string | null;
    paidAt?: string | null;
  }
): Promise<Payment> {
  await query(
    `update payments
        set status = 'paid',
            channel = coalesce($2, channel),
            invoice_number = coalesce($3, invoice_number),
            provider_event_id = coalesce($4, provider_event_id),
            paid_at = coalesce($5::timestamptz, paid_at, now()),
            updated_at = now()
      where reference = $1`,
    [reference, opts.channel ?? null, opts.invoiceNumber ?? null, opts.providerEventId ?? null, opts.paidAt ?? null]
  );
  const payment = await getPayment(reference);
  if (!payment) throw new CheckoutError("That payment does not exist.", "NOT_FOUND", 404);
  console.info(`[codemasterghana] payment ${reference} marked paid`);
  return payment;
}

export async function markPaymentFailed(reference: string): Promise<void> {
  await ensureSchema();
  await query(
    "update payments set status = 'failed', updated_at = now() where reference = $1 and status = 'pending'",
    [reference]
  );
}

export async function markPaymentAbandoned(reference: string): Promise<void> {
  await ensureSchema();
  await query(
    "update payments set status = 'abandoned', updated_at = now() where reference = $1 and status = 'pending'",
    [reference]
  );
}

/**
 * Rewrites an invoice to the money actually paid. `buyPass` / `buyCourse` /
 * `buyLesson` invoice at the price on the day of fulfilment, but the teacher
 * may have repriced between checkout and payment — the student paid what
 * checkout asked, and the books must say so.
 */
function applyPaidAmount(user: User, invoiceNumber: string | null, paidAmount: number): void {
  if (!invoiceNumber) return;
  const invoice = user.invoices.find((item) => item.number === invoiceNumber);
  if (invoice) invoice.amount = paidAmount;
}

/**
 * Another PAID checkout by the same student for the same item, if one exists.
 * Proof of a genuine double charge — see the `ALREADY_OWNED` branch of
 * `fulfillPayment`. Without this proof the safe direction is to honour the
 * payment, never to refund it.
 */
async function findPaidTwin(payment: Payment): Promise<Payment | null> {
  await ensureSchema();
  const row = await queryOne<PaymentRow>(
    // `user_id::text` for the same reason as `findOpenCheckout`.
    `select * from payments
      where user_id::text = $1 and kind = $2
        and coalesce(period, '') = $3
        and coalesce(course_id, '') = $4
        and coalesce(lesson_id, '') = $5
        and coalesce(program_id, '') = $6
        and coalesce(covers, 'full') = $7
        and status = 'paid' and reference <> $8
      order by paid_at desc nulls last limit 1`,
    [
      payment.userId,
      payment.kind,
      payment.period ?? "",
      payment.courseId ?? "",
      payment.lessonId ?? "",
      payment.programId ?? "",
      payment.covers,
      payment.reference,
    ]
  );
  return row ? fromRow(row) : null;
}

/**
 * Returns a proven double charge. Best-effort by design: demo money was never
 * real, and a failed Paystack refund is logged loudly for the teacher, who
 * refunds from the Paystack dashboard instead — the register shows both paid
 * rows, so nothing is hidden either way.
 */
async function refundDoubleCharge(payment: Payment, user: User): Promise<void> {
  await refund(payment, user, `Duplicate payment ${payment.reference} refunded automatically`, undefined);
}

/**
 * Returns the part of a payment that was more than the student still owed.
 *
 * This is what a stale checkout looks like when it is paid late: a student
 * starts a "pay in full" checkout, leaves it, pays half through a newer one,
 * and the older page is approved afterwards. The access is theirs (the money
 * arrived), but the extra cedis were never owed — so they go back, and the
 * invoice and the purchase row carry what the program actually cost.
 */
async function refundExcess(payment: Payment, user: User, excess: number): Promise<void> {
  await refund(
    payment,
    user,
    `Overpayment ${payment.reference} refunded automatically — GH₵${excess} above what was owed`,
    excess
  );
}

/** One refund path, whole or partial. Demo money moves nowhere; it is recorded. */
async function refund(payment: Payment, user: User, note: string, amountGhs: number | undefined): Promise<void> {
  if (payment.provider !== "paystack") {
    // Demo payments never moved real money, but the account's history should
    // still say what happened to the row.
    logActivity(user, note, "billing");
    await saveUser(user);
    return;
  }
  try {
    await refundTransaction(payment.reference, amountGhs);
    logActivity(user, note, "billing");
    await saveUser(user);
    console.info(
      `[codemasterghana] refunded ${payment.reference} (GH₵${amountGhs ?? payment.amount} of GH₵${payment.amount})`
    );
  } catch (error) {
    console.error(
      `[codemasterghana] automatic refund FAILED for ${payment.reference} — refund it from the Paystack dashboard`,
      error
    );
    // Durable, not just a log line: the register shows this row as paid, so
    // the owed refund must be visible wherever the teacher looks next.
    logActivity(user, `AUTOMATIC REFUND FAILED for ${payment.reference} — refund it from Paystack`, "billing");
    await saveUser(user);
  }
}

/**
 * Grants what a verified payment bought. Safe to call twice for the same
 * reference (webhook + return URL): the second call sees `paid` and returns
 * `alreadyPaid` without granting, invoicing or emailing again.
 *
 * Must only be called after the money is confirmed — a verified Paystack
 * transaction / webhook, or the demo confirm endpoint while no provider is
 * configured. It performs no verification itself.
 */
export async function fulfillPayment(
  reference: string,
  attribution: PaymentAttribution & { providerEventId?: string; paidAt?: string } = {}
): Promise<Fulfilment> {
  await ensureSchema();

  // Same provider event delivered twice (Paystack retries webhooks): the row
  // it already paid is the answer, full stop.
  if (attribution.providerEventId) {
    const existing = await getPaymentByEventId(attribution.providerEventId);
    if (existing?.status === "paid") {
      const user = await getUserById(existing.userId);
      return {
        payment: existing,
        alreadyPaid: true,
        invoiceNumber: existing.invoiceNumber,
        passActive: user ? hasActivePass(user) : false,
      };
    }
  }

  const payment = await getPayment(reference);
  if (!payment) throw new CheckoutError("That payment does not exist.", "NOT_FOUND", 404);
  if (payment.status === "paid") {
    const user = await getUserById(payment.userId);
    return {
      payment,
      alreadyPaid: true,
      invoiceNumber: payment.invoiceNumber,
      passActive: user ? hasActivePass(user) : false,
    };
  }
  if (payment.status !== "pending") {
    // `failed` and `abandoned` are local guesses about an unfinished checkout,
    // and guesses can be wrong — the provider's reports can arrive out of
    // order. Every caller of this function has already confirmed the money
    // (signed webhook + amount check, or a live API verification), so a
    // confirmed payment is honoured rather than lost. Loudly logged, because
    // it should be rare.
    console.warn(
      `[codemasterghana] fulfilling ${reference} from status '${payment.status}' — money was confirmed anyway`
    );
  }

  const user = await getUserById(payment.userId);
  if (!user) throw new CheckoutError("That account no longer exists.", "NOT_FOUND", 404);
  if (user.suspended) {
    throw new CheckoutError("That account is paused. Contact your teacher for help.", "SUSPENDED", 403);
  }

  // The student paid what checkout asked. If the teacher changed the price
  // mid-payment, the paid amount stands — it is honoured, not re-billed.
  if (payment.provider === "paystack") {
    try {
      const current =
        payment.kind === "program" && payment.programId
          ? programPrice(payment.programId)
          : payment.kind === "pass" && payment.period
            ? passPrice(payment.period)
            : payment.kind === "course" && payment.courseId
              ? coursePrice(payment.courseId)
              : payment.kind === "lesson" && payment.lessonId
                ? lessonPrice(payment.lessonId)
                : payment.amount;
      if (current !== payment.amount) {
        console.info(
          `[codemasterghana] payment ${reference} fulfilled at GH₵${payment.amount} (current price GH₵${current})`
        );
      }
    } catch {
      // Pricing lookups must never block a paid fulfilment.
    }
  }

  const credit: PaymentAttribution = {
    reference: payment.reference,
    provider: payment.provider,
    phone: payment.phone ?? attribution.phone,
    network: payment.network ?? attribution.network,
    channel: attribution.channel,
    brand: attribution.brand,
    last4: attribution.last4,
  };

  try {
    if (payment.kind === "program" && payment.programId) {
      // `covers` is what the student actually asked for at checkout, and it is
      // the row — not the amount — that decides what opens: a half payment
      // opens the first half of every course, a balance or full payment opens
      // the rest. Nothing about it is inferred from the money, so a price
      // change between checkout and approval cannot turn a half payment into a
      // full one (or the reverse).
      //
      // What was still owed is read before the purchase is written, because it
      // is the ceiling: a payment bigger than that is a stale checkout approved
      // late, and the difference is returned rather than kept.
      const owed = programLedger(user, payment.programId).balance;
      const purchase = await buyProgram(user, payment.programId, credit, payment.covers);
      const excess = Math.max(0, payment.amount - owed);
      purchase.amount = payment.amount - excess;
      applyPaidAmount(user, purchase.invoiceNumber, purchase.amount);
      await saveUser(user);
      const program = getProgram(payment.programId);
      const programName = program?.name ?? "Program";
      const ledger = programLedger(user, payment.programId);
      await notifyProgramPurchased({
        to: user.email,
        toName: user.name,
        program: programName,
        amount: purchase.amount,
        invoiceNumber: purchase.invoiceNumber,
        half: payment.covers === "half",
        balance: ledger.entitlement === "half" ? ledger.balance : 0,
      });
      const paid = await markPaymentPaid(reference, {
        channel: attribution.channel ?? null,
        invoiceNumber: purchase.invoiceNumber,
        providerEventId: attribution.providerEventId ?? null,
        paidAt: attribution.paidAt ?? null,
      });
      if (excess > 0) {
        console.warn(
          `[codemasterghana] payment ${reference} was GH₵${payment.amount}, GH₵${excess} more than the GH₵${owed} owed — refunding the excess`
        );
        await refundExcess(payment, user, excess);
      }
      return {
        payment: paid,
        alreadyPaid: false,
        invoiceNumber: purchase.invoiceNumber,
        passActive: hasActivePass(user),
      };
    }

    if (payment.kind === "pass" && payment.period) {
      const extending = hasActivePass(user);
      const receipt = await buyPass(user, payment.period, credit);
      applyPaidAmount(user, receipt.invoiceNumber, payment.amount);
      user.subscription.price = payment.amount;
      await saveUser(user);
      await notifyPassPurchased({
        to: user.email,
        toName: user.name,
        period: receipt.period,
        price: payment.amount,
        expiresAt: receipt.expiresAt,
        invoiceNumber: receipt.invoiceNumber,
        extended: extending,
      });
      const paid = await markPaymentPaid(reference, {
        channel: attribution.channel ?? null,
        invoiceNumber: receipt.invoiceNumber,
        providerEventId: attribution.providerEventId ?? null,
        paidAt: attribution.paidAt ?? null,
      });
      return { payment: paid, alreadyPaid: false, invoiceNumber: receipt.invoiceNumber, passActive: true };
    }

    if (payment.kind === "course" && payment.courseId) {
      const purchase = await buyCourse(user, payment.courseId, credit);
      purchase.amount = payment.amount;
      applyPaidAmount(user, purchase.invoiceNumber, payment.amount);
      await saveUser(user);
      const course = getCourse(payment.courseId);
      await notifyContentPurchased({
        to: user.email,
        toName: user.name,
        item: course?.title ?? "Course",
        amount: payment.amount,
        invoiceNumber: purchase.invoiceNumber,
      });
      const paid = await markPaymentPaid(reference, {
        channel: attribution.channel ?? null,
        invoiceNumber: purchase.invoiceNumber,
        providerEventId: attribution.providerEventId ?? null,
        paidAt: attribution.paidAt ?? null,
      });
      return {
        payment: paid,
        alreadyPaid: false,
        invoiceNumber: purchase.invoiceNumber,
        passActive: hasActivePass(user),
      };
    }

    if (payment.kind === "lesson" && payment.courseId && payment.lessonId) {
      const purchase = await buyLesson(user, payment.courseId, payment.lessonId, credit);
      purchase.amount = payment.amount;
      applyPaidAmount(user, purchase.invoiceNumber, payment.amount);
      await saveUser(user);
      const course = getCourse(payment.courseId);
      const lessonTitle = course ? findContentLesson(course, payment.lessonId)?.title ?? "lesson" : "lesson";
      await notifyContentPurchased({
        to: user.email,
        toName: user.name,
        item: `${course?.shortTitle ?? "Course"} — ${lessonTitle}`,
        amount: payment.amount,
        invoiceNumber: purchase.invoiceNumber,
      });
      const paid = await markPaymentPaid(reference, {
        channel: attribution.channel ?? null,
        invoiceNumber: purchase.invoiceNumber,
        providerEventId: attribution.providerEventId ?? null,
        paidAt: attribution.paidAt ?? null,
      });
      return {
        payment: paid,
        alreadyPaid: false,
        invoiceNumber: purchase.invoiceNumber,
        passActive: hasActivePass(user),
      };
    }

    throw new CheckoutError("That payment is missing what it was buying.", "BAD_PAYMENT", 500);
  } catch (error) {
    if (error instanceof PurchaseError && error.code === "ALREADY_OWNED") {
      // The account already owns this item. Two very different cases:
      //  1. THIS reference was fulfilled concurrently (webhook + return URL
      //     racing each other). The single payment is legitimate — honour it.
      //  2. A DIFFERENT paid reference granted it. The student paid twice,
      //     and this payment's money goes back.
      // Only case 2 refunds, and only with proof. Without proof the safe
      // direction is to honour the payment and let the teacher reconcile
      // from the register — a wrong refund hands the item out for free.
      const current = await getPayment(reference);
      const twin = current?.status === "paid" ? null : await findPaidTwin(payment);
      // A second, narrower proof of a double charge, which the twin search
      // cannot see: this payment is for a program the account already owns and
      // paying it would take the student past the program's price. That is what
      // a late "half" approval looks like after the balance (or the whole
      // price) has already been paid, and what a balance payment looks like if
      // the teacher dropped the price to what the student had already paid.
      // Either way the money is over the price, so it goes back.
      const ledger =
        payment.kind === "program" && payment.programId ? programLedger(user, payment.programId) : null;
      const overpaid = Boolean(ledger && ledger.entitlement === "full" && ledger.paid + payment.amount > ledger.price);
      const paid = await markPaymentPaid(reference, {
        channel: attribution.channel ?? null,
        providerEventId: attribution.providerEventId ?? null,
        paidAt: attribution.paidAt ?? null,
      });
      if (twin || overpaid) {
        console.warn(
          `[codemasterghana] payment ${reference} is a double charge (${twin ? `twin ${twin.reference}` : `GH₵${payment.amount} over an already-paid program`}) — refunding`
        );
        await refundDoubleCharge(payment, user);
      } else {
        console.info(`[codemasterghana] payment ${reference} already owned at fulfilment — marking paid`);
      }
      return { payment: paid, alreadyPaid: true, invoiceNumber: paid.invoiceNumber, passActive: hasActivePass(user) };
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Verification (return URL / status polling)                                 */
/* -------------------------------------------------------------------------- */

export interface VerificationOutcome {
  payment: Payment;
  fulfilment: Fulfilment | null;
}

/**
 * Checks a live payment against Paystack and fulfils it when the money is
 * confirmed. Used by the return-URL callback and the verify page's polling —
 * the webhook does the same work from the provider side, and idempotency
 * (above) keeps the two from double-granting.
 */
export async function verifyAndFulfill(reference: string): Promise<VerificationOutcome> {
  const payment = await getPayment(reference);
  if (!payment) throw new CheckoutError("That payment does not exist.", "NOT_FOUND", 404);
  if (payment.status === "paid") {
    const user = await getUserById(payment.userId);
    return {
      payment,
      fulfilment: {
        payment,
        alreadyPaid: true,
        invoiceNumber: payment.invoiceNumber,
        passActive: user ? hasActivePass(user) : false,
      },
    };
  }
  if (payment.status !== "pending") return { payment, fulfilment: null };
  if (payment.provider !== "paystack") {
    throw new CheckoutError("That payment is not a live payment.", "NOT_LIVE", 400);
  }

  // The status page polls this on an interval; stamping the row lets it skip
  // re-asking the provider when another poll just did.
  await query("update payments set updated_at = now() where reference = $1", [reference]);

  const verified = await verifyTransaction(reference);
  const paidPesewas = Math.round(verified.amountGhs * 100);
  const expectedPesewas = Math.round(payment.amount * 100);
  const success =
    verified.status === "success" && verified.currency === "GHS" && paidPesewas >= expectedPesewas;

  if (!success) {
    // `abandoned` (never attempted) stays pending so the student can still use
    // the checkout URL; anything explicitly failed is closed.
    if (verified.status === "failed") await markPaymentFailed(reference);
    const current = (await getPayment(reference))!;
    console.info(`[codemasterghana] payment ${reference} verified: ${verified.status} (not fulfilled)`);
    return { payment: current, fulfilment: null };
  }

  const auth = verified.authorization;
  const fulfilment = await fulfillPayment(reference, {
    channel: (verified.channel as PaymentAttribution["channel"]) ?? "mobile_money",
    brand: auth?.brand ?? (verified.channel === "mobile_money" ? payment.network ?? "Mobile Money" : undefined),
    last4: auth?.last4 ?? (auth?.mobile_money_number ? auth.mobile_money_number.slice(-4) : undefined),
    phone: auth?.mobile_money_number ?? payment.phone ?? undefined,
    paidAt: verified.paidAt ?? undefined,
  });
  return { payment: fulfilment.payment, fulfilment };
}

/**
 * Completes a demo payment — the "I approved on my phone" button while no
 * provider is configured. Refuses outright once Paystack is live, so a demo
 * confirm can never mint a real entitlement.
 */
export async function confirmDemoPayment(reference: string, userId: string): Promise<Fulfilment> {
  if (isPaystackConfigured()) {
    throw new CheckoutError(
      "Demo confirmation is disabled while live payments are configured.",
      "LIVE_PAYMENTS",
      403
    );
  }
  const payment = await getPayment(reference);
  if (!payment) throw new CheckoutError("That payment does not exist.", "NOT_FOUND", 404);
  if (payment.userId !== userId) throw new CheckoutError("That payment is not yours.", "FORBIDDEN", 403);
  if (payment.provider !== "demo") {
    throw new CheckoutError("That payment is not a demo payment.", "NOT_DEMO", 400);
  }
  return fulfillPayment(reference, {
    channel: "mobile_money",
    brand: payment.network ?? "Mobile Money",
    last4: payment.phone?.slice(-4),
    phone: payment.phone ?? undefined,
    network: payment.network ?? undefined,
  });
}
