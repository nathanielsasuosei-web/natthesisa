import { randomBytes } from "node:crypto";
import { ensureSchema, query, queryOne } from "./db";
import { getCourse } from "./courses";
import { findContentLesson } from "./course-content";
import { coursePrice, isPassPeriod, lessonPrice, passPrice, type PassPeriod } from "./plans";
import { PurchaseError, buyCourse, buyLesson, buyPass, type PaymentAttribution } from "./purchases";
import { getUserById, saveUser, type User } from "./store";
import { notifyContentPurchased, notifyPassPurchased } from "./email";
import {
  PaystackError,
  initializeTransaction,
  isPaystackConfigured,
  verifyTransaction,
} from "./paystack";
import { hasActivePass, ownsCourse, ownsLesson } from "./access";

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
 */

export type PaymentKind = "pass" | "course" | "lesson";
export type PaymentStatus = "pending" | "paid" | "failed" | "abandoned";
export type PaymentProvider = "demo" | "paystack";

export interface Payment {
  reference: string;
  userId: string;
  kind: PaymentKind;
  period: PassPeriod | null;
  courseId: string | null;
  lessonId: string | null;
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
    amount: row.amount,
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
  const rows = await query<PaymentRow>(
    "select * from payments where user_id = $1 order by created_at desc limit $2",
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
  const rows = await query<PaymentRow & { user_name: string; user_email: string }>(
    `select p.*, u.name as user_name, u.email as user_email
       from payments p join users u on u.id = p.user_id
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
  phone?: string;
  network?: string;
}

export interface CheckoutQuote {
  kind: PaymentKind;
  period: PassPeriod | null;
  courseId: string | null;
  lessonId: string | null;
  amount: number;
  description: string;
}

/**
 * Prices what the student asked for and checks it can still be bought.
 * Throws `CheckoutError` (or `PurchaseError` for already-owned content) when
 * the request makes no sense — before any row is written or provider called.
 */
export function quoteCheckout(user: User, input: CheckoutInput): CheckoutQuote {
  const kind = input.kind;
  if (kind === "pass") {
    if (!isPassPeriod(input.period)) {
      throw new CheckoutError("Choose a pass: daily, weekly or monthly.", "BAD_PERIOD");
    }
    const amount = passPrice(input.period);
    const label = input.period[0].toUpperCase() + input.period.slice(1);
    return {
      kind,
      period: input.period,
      courseId: null,
      lessonId: null,
      amount,
      description: `${label} access pass`,
    };
  }
  if (kind === "course") {
    const courseId = input.courseId?.trim() ?? "";
    const course = courseId ? getCourse(courseId) : null;
    if (!course) throw new CheckoutError("That course does not exist.", "NOT_FOUND", 404);
    if (ownsCourse(user, courseId)) {
      throw new PurchaseError("You already own this course.", "ALREADY_OWNED", 409);
    }
    return {
      kind,
      period: null,
      courseId,
      lessonId: null,
      amount: coursePrice(courseId),
      description: `${course.title} — course purchase`,
    };
  }
  const courseId = input.courseId?.trim() ?? "";
  const lessonId = input.lessonId?.trim() ?? "";
  const course = courseId ? getCourse(courseId) : null;
  if (!course) throw new CheckoutError("That course does not exist.", "NOT_FOUND", 404);
  if (!lessonId) throw new CheckoutError("A lesson purchase needs a lesson.", "BAD_REQUEST");
  const lesson = findContentLesson(course, lessonId);
  if (!lesson) throw new CheckoutError("That lesson does not exist.", "NOT_FOUND", 404);
  if (ownsLesson(user, lessonId)) {
    throw new PurchaseError("You already own this lesson.", "ALREADY_OWNED", 409);
  }
  if (ownsCourse(user, courseId)) {
    throw new PurchaseError(
      "This lesson is already included in your course purchase.",
      "ALREADY_OWNED",
      409
    );
  }
  return {
    kind,
    period: null,
    courseId,
    lessonId,
    amount: lessonPrice(lessonId),
    description: `${course.shortTitle} — “${lesson.title}”`,
  };
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
  const reference = newReference();
  const phone = input.phone?.trim() || null;
  const network = input.network?.trim() || null;

  await query(
    `insert into payments
       (reference, user_id, kind, period, course_id, lesson_id, amount, currency,
        description, status, provider, phone, network)
     values ($1,$2,$3,$4,$5,$6,$7,'GHS',$8,'pending',$9,$10,$11)`,
    [
      reference,
      user.id,
      quote.kind,
      quote.period,
      quote.courseId,
      quote.lessonId,
      quote.amount,
      quote.description,
      provider,
      phone,
      network,
    ]
  );

  if (!live) {
    const payment = (await getPayment(reference))!;
    return { payment, authorizationUrl: null, demo: true };
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
  return { payment, authorizationUrl, demo: false };
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
    throw new CheckoutError(
      `That payment is ${payment.status} and can no longer be completed. Start a new checkout.`,
      "PAYMENT_CLOSED",
      409
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
        payment.kind === "pass" && payment.period
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
    if (payment.kind === "pass" && payment.period) {
      const extending = hasActivePass(user);
      const receipt = await buyPass(user, payment.period, credit);
      await saveUser(user);
      await notifyPassPurchased({
        to: user.email,
        toName: user.name,
        period: receipt.period,
        price: receipt.price,
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
      await saveUser(user);
      const course = getCourse(payment.courseId);
      await notifyContentPurchased({
        to: user.email,
        toName: user.name,
        item: course?.title ?? "Course",
        amount: purchase.amount,
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
      await saveUser(user);
      const course = getCourse(payment.courseId);
      const lessonTitle = course ? findContentLesson(course, payment.lessonId)?.title ?? "lesson" : "lesson";
      await notifyContentPurchased({
        to: user.email,
        toName: user.name,
        item: `${course?.shortTitle ?? "Course"} — ${lessonTitle}`,
        amount: purchase.amount,
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
    // A race already granted this (two fulfilments interleaved): the account
    // owns it, so the payment is honoured rather than failed.
    if (error instanceof PurchaseError && error.code === "ALREADY_OWNED") {
      console.info(`[codemasterghana] payment ${reference} already owned at fulfilment — marking paid`);
      const paid = await markPaymentPaid(reference, {
        channel: attribution.channel ?? null,
        providerEventId: attribution.providerEventId ?? null,
        paidAt: attribution.paidAt ?? null,
      });
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
