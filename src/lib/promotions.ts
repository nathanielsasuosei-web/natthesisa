import { randomUUID } from "node:crypto";
import { ensureSchema, query, queryOne } from "./db";
import { getProgram } from "./programs";
import { programPrice } from "./plans";
import { ownsProgram } from "./access";
import { logActivity, uid, type Purchase, type User } from "./store";
import {
  isValidPromoCode,
  normalizePromoCode,
  promoCodeError,
  promoDateLabel,
  promotionStatus,
  type Promotion,
  type PromotionStatus,
  type PromotionWithStats,
} from "./promo-codes";

/**
 * Promo codes, stored in PostgreSQL.
 *
 * A promo code is the teacher's offer: "buy any program while this code is
 * live and the program I named comes with it, free." The teacher owns the
 * window (`startsAt`…`endsAt`), an on/off switch, and an optional cap on how
 * many students may claim it. The student types the code in the checkout
 * modal; the server checks it (`resolvePromotion`), remembers it on the
 * payment row, and grants the free program the moment the payment is
 * confirmed (`redeemPromotion`).
 *
 * Two rules make it safe:
 *   • a code is judged against the window every time it is entered, so a code
 *     that has not started or has ended is refused with a sentence that says
 *     which one it is;
 *   • a student can claim the same code once. `promo_redemptions` carries a
 *     unique `(promo_id, user_id)` index, so a webhook replay can never grant
 *     the reward twice.
 *
 * The reward is a whole program rather than a single course because programs
 * are the only thing that opens lessons in this app (see `access.ts`).
 */

export class PromoError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "PROMO_ERROR", status = 400) {
    super(message);
    this.name = "PromoError";
    this.code = code;
    this.status = status;
  }
}

interface PromotionRow {
  id: string;
  code: string;
  reward_program_id: string;
  description: string | null;
  starts_at: Date | string;
  ends_at: Date | string;
  max_redemptions: number | string | null;
  active: boolean | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface RedemptionRow {
  id: string;
  promo_id: string;
  code: string;
  user_id: string;
  payment_reference: string;
  program_id: string;
  value: number | string | null;
  created_at: Date | string;
}

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

function toPromotion(row: PromotionRow): Promotion {
  return {
    id: row.id,
    code: row.code,
    rewardProgramId: row.reward_program_id,
    description: row.description ?? "",
    startsAt: iso(row.starts_at),
    endsAt: iso(row.ends_at),
    maxRedemptions: Number(row.max_redemptions ?? 0),
    active: row.active !== false,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function withStats(promo: Promotion): PromotionWithStats {
  const program = getProgram(promo.rewardProgramId);
  return {
    ...promo,
    redeemedCount: 0,
    rewardValue: program ? programPrice(program.id) : 0,
    rewardProgramName: program?.name ?? "Program no longer in the catalogue",
  };
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function listPromotions(): Promise<PromotionWithStats[]> {
  await ensureSchema();
  const rows = await query<PromotionRow>("select * from promo_codes order by created_at desc");
  const counts = await query<{ promo_id: string; count: string }>(
    "select promo_id, count(*)::text as count from promo_redemptions group by promo_id"
  );
  const byPromo = new Map(counts.map((row) => [row.promo_id, Number(row.count)]));
  return rows.map((row) => {
    const promo = toPromotion(row);
    return { ...withStats(promo), redeemedCount: byPromo.get(promo.id) ?? 0 };
  });
}

export async function getPromotion(id: string): Promise<Promotion | null> {
  if (!id) return null;
  await ensureSchema();
  const row = await queryOne<PromotionRow>("select * from promo_codes where id = $1", [id]);
  return row ? toPromotion(row) : null;
}

/** Looks a code up the way students type it: any case, with stray spaces. */
export async function findPromotionByCode(rawCode: string): Promise<Promotion | null> {
  const code = normalizePromoCode(rawCode);
  if (!code) return null;
  await ensureSchema();
  const row = await queryOne<PromotionRow>("select * from promo_codes where code = $1", [code]);
  return row ? toPromotion(row) : null;
}

async function promotionStats(id: string): Promise<PromotionWithStats | null> {
  const promo = await getPromotion(id);
  if (!promo) return null;
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from promo_redemptions where promo_id = $1",
    [id]
  );
  return { ...withStats(promo), redeemedCount: Number(row?.count ?? 0) };
}

async function hasRedeemed(promoId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    "select id from promo_redemptions where promo_id = $1 and user_id = $2 limit 1",
    [promoId, userId]
  );
  return Boolean(row);
}

/* -------------------------------------------------------------------------- */
/* Owner writes                                                               */
/* -------------------------------------------------------------------------- */

interface PromotionInput {
  code?: unknown;
  rewardProgramId?: unknown;
  description?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  maxRedemptions?: unknown;
  active?: unknown;
}

function readTime(value: unknown, fallback: string | undefined, label: "start" | "end"): string {
  const supplied = typeof value === "string" ? value.trim() : value === undefined ? undefined : String(value);
  if (!supplied) {
    if (fallback) return fallback;
    throw new PromoError(`Choose when the code ${label === "start" ? "starts" : "ends"}.`);
  }
  const time = Date.parse(supplied);
  if (!Number.isFinite(time)) {
    throw new PromoError(`The ${label} date is not a real date.`);
  }
  return new Date(time).toISOString();
}

function readFields(input: PromotionInput, current?: Promotion) {
  const rewardProgramId =
    typeof input.rewardProgramId === "string" ? input.rewardProgramId.trim() : current?.rewardProgramId ?? "";
  if (!rewardProgramId) throw new PromoError("Choose the program the code gives away free.");
  if (!getProgram(rewardProgramId)) throw new PromoError("That program does not exist.");

  const startsAt = readTime(input.startsAt, current?.startsAt, "start");
  const endsAt = readTime(input.endsAt, current?.endsAt, "end");
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new PromoError("The code must end after it starts.");
  }

  const description =
    typeof input.description === "string" ? input.description.trim().slice(0, 160) : current?.description ?? "";

  const rawMax = input.maxRedemptions ?? current?.maxRedemptions ?? 0;
  const maxRedemptions = Number(rawMax);
  if (!Number.isFinite(maxRedemptions) || maxRedemptions < 0 || maxRedemptions > 100_000) {
    throw new PromoError("A claim limit must be between 0 (no limit) and 100,000.");
  }

  const active = typeof input.active === "boolean" ? input.active : current?.active ?? true;

  return {
    rewardProgramId,
    description,
    startsAt,
    endsAt,
    maxRedemptions: Math.round(maxRedemptions),
    active,
  };
}

/** Creates a code. The teacher supplies the code, the free program and the window. */
export async function createPromotion(input: PromotionInput): Promise<PromotionWithStats> {
  await ensureSchema();
  const code = normalizePromoCode(typeof input.code === "string" ? input.code : "");
  const problem = promoCodeError(code);
  if (problem) throw new PromoError(problem, "BAD_CODE");
  if (!isValidPromoCode(code)) throw new PromoError("That code cannot be used.", "BAD_CODE");

  const fields = readFields(input);
  if (await findPromotionByCode(code)) {
    throw new PromoError(`The code ${code} already exists — pick another.`, "DUPLICATE_CODE", 409);
  }

  const id = randomUUID();
  try {
    await query(
      `insert into promo_codes
         (id, code, reward_program_id, description, starts_at, ends_at,
          max_redemptions, active, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8, now(), now())`,
      [
        id,
        code,
        fields.rewardProgramId,
        fields.description,
        fields.startsAt,
        fields.endsAt,
        fields.maxRedemptions,
        fields.active,
      ]
    );
  } catch (error) {
    // 23505 = unique_violation: another request created the same code first.
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") {
      throw new PromoError(`The code ${code} already exists — pick another.`, "DUPLICATE_CODE", 409);
    }
    throw error;
  }

  const created = await promotionStats(id);
  if (!created) throw new PromoError("The code could not be saved.", "SAVE_FAILED", 500);
  console.info(`[codemasterghana] promo code ${code} created (${fields.startsAt} → ${fields.endsAt})`);
  return created;
}

/**
 * Changes a code in place. The code itself is immutable: redemptions point at
 * it, and a renamed code would silently stop matching what students were told.
 */
export async function updatePromotion(id: string, input: PromotionInput): Promise<PromotionWithStats> {
  const current = await getPromotion(id);
  if (!current) throw new PromoError("That promo code no longer exists.", "NOT_FOUND", 404);

  const fields = readFields(input, current);
  await query(
    `update promo_codes
        set reward_program_id = $2,
            description = $3,
            starts_at = $4,
            ends_at = $5,
            max_redemptions = $6,
            active = $7,
            updated_at = now()
      where id = $1`,
    [
      id,
      fields.rewardProgramId,
      fields.description,
      fields.startsAt,
      fields.endsAt,
      fields.maxRedemptions,
      fields.active,
    ]
  );

  const updated = await promotionStats(id);
  if (!updated) throw new PromoError("The code could not be saved.", "SAVE_FAILED", 500);
  return updated;
}

/**
 * Removes a code. Claims already made keep their free program (the reward is
 * a purchase on the student's account, independent of the code) and the
 * redemption rows stay as history.
 */
export async function deletePromotion(id: string): Promise<void> {
  await ensureSchema();
  const rows = await query<{ code: string }>("delete from promo_codes where id = $1 returning code", [id]);
  if (!rows.length) throw new PromoError("That promo code no longer exists.", "NOT_FOUND", 404);
  console.info(`[codemasterghana] promo code ${rows[0].code} deleted`);
}

/* -------------------------------------------------------------------------- */
/* Student side: checking a code at checkout                                  */
/* -------------------------------------------------------------------------- */

export interface PromotionQuote {
  promotionId: string;
  code: string;
  description: string;
  endsAt: string;
  rewardProgramId: string;
  rewardProgramName: string;
  /** What the free program costs today — the value the student is gaining. */
  rewardProgramPrice: number;
}

/**
 * Answers "can this student use this code on this purchase?" and throws a
 * sentence saying exactly why not when the answer is no. Called twice: when
 * the checkout modal validates the code, and again when the checkout row is
 * created — the second call is what the payment is locked in with.
 */
export async function resolvePromotion(
  rawCode: string,
  user: User,
  buyingProgramId: string
): Promise<PromotionQuote> {
  const code = normalizePromoCode(rawCode);
  const problem = promoCodeError(code);
  if (problem) throw new PromoError(problem, "BAD_CODE");

  const promo = await findPromotionByCode(code);
  if (!promo) {
    throw new PromoError("That promo code does not exist — check the spelling.", "PROMO_NOT_FOUND", 404);
  }

  // `findPromotionByCode` does not count claims, so the usage status is
  // decided separately — checking `promotionStatus` alone here would let a
  // fully claimed code through until the database refused the redemption.
  const status: PromotionStatus = promotionStatus(promo);
  if (status === "paused") {
    throw new PromoError("That promo code is paused right now.", "PROMO_PAUSED", 410);
  }
  if (status === "scheduled") {
    throw new PromoError(`That code starts on ${promoDateLabel(promo.startsAt)}.`, "PROMO_NOT_STARTED", 410);
  }
  if (status === "ended") {
    throw new PromoError(`That code ended on ${promoDateLabel(promo.endsAt)}.`, "PROMO_ENDED", 410);
  }

  const program = getProgram(promo.rewardProgramId);
  if (!program) {
    throw new PromoError(
      "The free program behind that code is no longer in the catalogue.",
      "PROMO_REWARD_MISSING",
      410
    );
  }

  if (promo.rewardProgramId === buyingProgramId) {
    throw new PromoError(
      "That code gives you the same program you are buying, so it would add nothing. Use it when buying a different program.",
      "PROMO_SAME_PROGRAM"
    );
  }

  if (ownsProgram(user, promo.rewardProgramId)) {
    throw new PromoError(
      `You already own the ${program.name} program this code gives away — there is nothing extra to gain.`,
      "PROMO_ALREADY_OWNED",
      409
    );
  }

  if (await hasRedeemed(promo.id, user.id)) {
    throw new PromoError("You have already used this code.", "PROMO_USED", 409);
  }

  if (promo.maxRedemptions > 0) {
    const claimed = await queryOne<{ count: string }>(
      "select count(*)::text as count from promo_redemptions where promo_id = $1",
      [promo.id]
    );
    if (Number(claimed?.count ?? 0) >= promo.maxRedemptions) {
      throw new PromoError("That code has been fully claimed.", "PROMO_EXHAUSTED", 410);
    }
  }

  return {
    promotionId: promo.id,
    code: promo.code,
    description: promo.description,
    endsAt: promo.endsAt,
    rewardProgramId: promo.rewardProgramId,
    rewardProgramName: program.name,
    rewardProgramPrice: programPrice(promo.rewardProgramId),
  };
}

/* -------------------------------------------------------------------------- */
/* Student side: granting the reward                                          */
/* -------------------------------------------------------------------------- */

export interface PromoReward {
  code: string;
  programId: string;
  programName: string;
  /** The free program's price on the day the reward was granted. */
  value: number;
}

/** Adds the free program to the account. True when it was not owned yet. */
function grantReward(user: User, reward: Pick<PromoReward, "programId">): boolean {
  if (ownsProgram(user, reward.programId)) return false;
  const purchase: Purchase = {
    id: uid(),
    kind: "program",
    refId: reward.programId,
    courseId: null,
    amount: 0,
    at: new Date().toISOString(),
    invoiceNumber: null,
  };
  user.purchases.push(purchase);
  return true;
}

function rewardFromRow(row: RedemptionRow): PromoReward | null {
  const program = getProgram(row.program_id);
  return {
    code: row.code,
    programId: row.program_id,
    programName: program?.name ?? "Program",
    value: Number(row.value ?? 0),
  };
}

/**
 * Hands over the free program attached to a paid checkout, exactly once.
 *
 * Idempotent on `payment_reference` and on `(promo_id, user_id)`: the webhook
 * and the return URL can both fulfil the same payment, and a replayed
 * fulfilment must still grant one program, not two.
 *
 * The code's window is deliberately NOT re-checked here. It was checked when
 * the checkout row was created, which is the moment the student committed to
 * the purchase; a code whose window ends while Paystack is confirming would
 * otherwise bill the student and then withhold what they were promised.
 */
export async function redeemPromotion(
  user: User,
  payment: { reference: string; promoCode: string | null }
): Promise<PromoReward | null> {
  const code = payment.promoCode ? normalizePromoCode(payment.promoCode) : "";
  if (!code) return null;
  await ensureSchema();

  // This exact payment was already fulfilled (webhook + return URL race), or
  // a previous attempt recorded the claim but failed before saving the
  // account. Either way the reward is repaired rather than granted twice:
  // the unique `(promo_id, user_id)` index is the real gate.
  const already = await queryOne<RedemptionRow>("select * from promo_redemptions where payment_reference = $1", [
    payment.reference,
  ]);
  if (already) {
    const reward = rewardFromRow(already);
    if (reward && grantReward(user, reward)) {
      logActivity(user, `Promo code ${reward.code} added the ${reward.programName} program free`, "billing");
    }
    return reward;
  }

  const promo = await findPromotionByCode(code);
  if (!promo) {
    console.warn(`[codemasterghana] payment ${payment.reference} carried promo ${code}, which no longer exists`);
    return null;
  }

  const program = getProgram(promo.rewardProgramId);
  if (!program) {
    console.warn(
      `[codemasterghana] payment ${payment.reference} carried promo ${code}, whose reward program is not in the catalogue`
    );
    return null;
  }

  if (await hasRedeemed(promo.id, user.id)) {
    console.warn(`[codemasterghana] ${user.email} already used promo ${code} — not granting it again`);
    return null;
  }

  const value = programPrice(promo.rewardProgramId);
  const inserted = await query<{ id: string }>(
    `insert into promo_redemptions
       (id, promo_id, code, user_id, payment_reference, program_id, value, created_at)
     values ($1,$2,$3,$4,$5,$6,$7, now())
     on conflict (promo_id, user_id) do nothing
     returning id`,
    [uid(), promo.id, code, user.id, payment.reference, promo.rewardProgramId, value]
  );
  if (!inserted.length) {
    console.warn(`[codemasterghana] ${user.email} already used promo ${code} — not granting it again`);
    return null;
  }

  if (grantReward(user, { programId: promo.rewardProgramId })) {
    logActivity(user, `Promo code ${code} added the ${program.name} program free`, "billing");
  }
  console.info(
    `[codemasterghana] promo ${code} redeemed by ${user.email} with ${payment.reference} (${program.name}, GH₵${value})`
  );

  return { code, programId: promo.rewardProgramId, programName: program.name, value };
}

/**
 * The reward a payment handed over, if any — read from the redemption row so
 * the confirmation screens can name the free program after a live redirect,
 * when the browser no longer remembers the checkout form.
 */
export async function promoRedemptionForPayment(reference: string): Promise<PromoReward | null> {
  if (!reference) return null;
  await ensureSchema();
  const row = await queryOne<RedemptionRow>("select * from promo_redemptions where payment_reference = $1", [
    reference,
  ]);
  return row ? rewardFromRow(row) : null;
}

/** Every claim made with a code, newest first — the teacher's audit trail. */
export async function listPromotionRedemptions(limit = 100): Promise<
  Array<PromoReward & { userName: string; userEmail: string; createdAt: string; paymentReference: string }>
> {
  await ensureSchema();
  const rows = await query<RedemptionRow & { user_name: string | null; user_email: string | null }>(
    `select r.*, u.name as user_name, u.email as user_email
       from promo_redemptions r
       left join users u on u.id = r.user_id
      order by r.created_at desc
      limit $1`,
    [Math.min(Math.max(limit, 1), 500)]
  );
  return rows.map((row) => {
    const reward = rewardFromRow(row)!;
    return {
      ...reward,
      userName: row.user_name ?? "Deleted student",
      userEmail: row.user_email ?? "—",
      createdAt: iso(row.created_at),
      paymentReference: row.payment_reference,
    };
  });
}
