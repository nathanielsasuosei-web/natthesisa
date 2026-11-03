/**
 * Proves a legacy `payments` table is healed into one checkout can use.
 *
 *   npm run payments:schema
 *
 * The reported failure was one sentence — "The checkout could not be started —
 * the payments table stores account ids in a format this app cannot use." — and
 * it came from an `ensureSchema()` that reported success while leaving the
 * table unusable. Each earlier version of the heal missed a different shape:
 *
 *   * a `reference` that is `uuid` (adding `settles_reference … references
 *     payments(reference)` fails with 42804, and that failure aborted the whole
 *     schema step, so *every* checkout failed);
 *   * an old `kind` enum (adding `check (kind in (… 'program'))` fails with
 *     22P02 because the enum has no such label);
 *   * a constraint in this app's own table that compares a column with values
 *     the column's type cannot hold (42883).
 *
 * So this does not inspect DDL. For every realistic legacy shape it creates
 * the table, runs the real `ready()`, then starts a real `createCheckout()` as
 * a real account — the exact path the student took — and checks the payment
 * row, the preserved legacy rows, and the foreign keys left on the table.
 *
 * Each shape runs in its own process against its own embedded database: the
 * database module is a per-process singleton, and a fresh Postgres per shape is
 * the only honest way to test "a database that already looked like this".
 * No network and no credentials — PGlite runs Postgres in-process.
 */
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const self = fileURLToPath(import.meta.url);

interface Shape {
  id: string;
  /** What this table would have come from, in one line. */
  what: string;
  /** The legacy table, before this app has ever seen the database. */
  sql: string;
  /** Reference values that must survive the healing untouched. */
  legacyReferences: string[];
  /** The failure this shape caused before the heal was fixed. */
  usedToFail: string;
}

const SHAPES: Shape[] = [
  {
    id: "serial-account-ids",
    what: "a hand-made app: serial account ids, short varchar reference, numeric amount, char(3) currency, its own status/provider rules",
    usedToFail: "the short reference and the old rules were kept, so checkout rows were rejected",
    legacyReferences: ["OLD-A-1"],
    sql: `
      create table legacy_accounts (id serial primary key, email text);
      create table payments (
        id serial primary key,
        user_id integer not null references legacy_accounts(id),
        reference varchar(10) not null unique,
        kind text not null default 'pass',
        period varchar(10),
        course_id integer,
        lesson_id integer,
        program_id integer,
        amount numeric(10,2) not null default 0,
        currency char(3) not null default 'GHS',
        description text not null default '',
        status text not null default 'succeeded',
        provider text not null default 'paystack',
        phone text,
        plan text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint payments_status_check check (status in ('succeeded','failed')),
        constraint payments_provider_check check (provider in ('paystack','stripe'))
      );
      insert into legacy_accounts (email) values ('old@example.com');
      insert into payments (user_id, reference, amount) values (1, 'OLD-A-1', 25);
    `,
  },
  {
    id: "supabase-accounts",
    what: "a Supabase-style app: uuid account ids in its own accounts table",
    usedToFail: "uuid account ids cannot take this app's text ids",
    legacyReferences: [],
    sql: `
      create table accounts (id uuid primary key default gen_random_uuid(), email text);
      create table payments (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references accounts(id),
        reference text not null unique,
        kind text not null default 'pass',
        amount numeric(10,2) not null default 0,
        currency text not null default 'GHS',
        description text not null default '',
        status text not null default 'succeeded',
        provider text not null default 'paystack',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `,
  },
  {
    id: "text-user-id",
    what: "text account ids pointing at another app's accounts, which this app's ids never match",
    usedToFail: "the stale foreign key rejected every checkout with 23503",
    legacyReferences: [],
    sql: `
      create table legacy_accounts (id serial primary key, email text);
      create table payments (
        id serial primary key,
        user_id text not null,
        reference text not null unique,
        kind text not null default 'pass',
        amount integer not null default 0,
        description text not null default '',
        status text not null default 'succeeded',
        created_at timestamptz not null default now()
      );
    `,
  },
  {
    id: "uuid-reference",
    what: "a uuid `reference` on a hand-made table — the shape that aborted the whole schema step",
    usedToFail: "42804: adding settles_reference -> reference cannot be implemented while reference is uuid",
    legacyReferences: [],
    sql: `
      create table accounts (id uuid primary key default gen_random_uuid(), email text);
      create table payments (
        id bigint generated always as identity primary key,
        account_id uuid not null references accounts(id),
        reference uuid not null unique default gen_random_uuid(),
        kind text not null default 'pass',
        amount numeric(10,2) not null default 0,
        currency text not null default 'GHS',
        description text not null default '',
        status text not null default 'succeeded',
        provider text not null default 'paystack',
        created_at timestamptz not null default now()
      );
      alter table payments rename column account_id to user_id;
    `,
  },
  {
    id: "uuid-reference-with-rows",
    what: "the same uuid `reference`, with legacy payment rows already in it",
    usedToFail: "42804 — and the old rows had to survive the cast",
    legacyReferences: ["2f6d6c1e-9a5b-4a0f-9b0e-0a1b2c3d4e5f"],
    sql: `
      create table accounts (id uuid primary key default gen_random_uuid());
      create table payments (
        id bigint generated always as identity primary key,
        user_id uuid not null references accounts(id),
        reference uuid not null unique,
        kind text not null default 'pass',
        period text,
        course_id text,
        amount numeric(10,2) not null default 0,
        currency text not null default 'GHS',
        description text not null default '',
        status text not null default 'succeeded',
        provider text not null default 'paystack',
        created_at timestamptz not null default now()
      );
      insert into accounts (id) values ('00000000-0000-0000-0000-000000000001');
      insert into payments (user_id, reference, amount)
        values ('00000000-0000-0000-0000-000000000001', '2f6d6c1e-9a5b-4a0f-9b0e-0a1b2c3d4e5f', 10);
    `,
  },
  {
    id: "incoming-user-fk",
    what: "a sibling table whose foreign key lands on payments.user_id",
    usedToFail: "42804: the sibling's foreign key cannot be implemented once user_id is text",
    legacyReferences: [],
    sql: `
      create table payments (
        id serial primary key,
        user_id integer not null unique,
        reference text not null unique,
        kind text not null default 'pass',
        amount integer not null default 0,
        description text not null default '',
        status text not null default 'succeeded',
        created_at timestamptz not null default now()
      );
      create table receipts (id serial primary key, payer integer references payments(user_id));
    `,
  },
  {
    id: "enum-kind-and-status",
    what: "another app's enum types on kind/status, whose labels this app does not use",
    usedToFail: "22P02: invalid input value for enum … \"program\" — the kind rule could not be added",
    legacyReferences: ["OLD-ENUM-1"],
    sql: `
      create type legacy_kind as enum ('pass', 'course');
      create type legacy_status as enum ('succeeded', 'failed');
      create table payments (
        id serial primary key,
        user_id integer not null,
        reference text not null unique,
        kind legacy_kind not null default 'pass',
        amount integer not null default 0,
        description text not null default '',
        status legacy_status not null default 'succeeded',
        created_at timestamptz not null default now(),
        constraint legacy_kind_check check (kind in ('pass','course'))
      );
      insert into payments (user_id, reference) values (1, 'OLD-ENUM-1');
    `,
  },
  {
    id: "upgrade-with-settles",
    what: "an upgrade from a build that already added `settles_reference` beside a uuid `reference`",
    usedToFail: "the same 42804 as uuid-reference, reached through the previous heal's own column",
    legacyReferences: [],
    sql: `
      create table accounts (id uuid primary key default gen_random_uuid());
      create table payments (
        id bigint generated always as identity primary key,
        user_id uuid not null references accounts(id),
        reference uuid not null unique default gen_random_uuid(),
        kind text not null default 'pass',
        amount numeric(10,2) not null default 0,
        currency text not null default 'GHS',
        description text not null default '',
        status text not null default 'succeeded',
        provider text not null default 'paystack',
        settles_reference text,
        created_at timestamptz not null default now()
      );
    `,
  },
];

/* -------------------------------------------------------------------------- */
/* Child: one shape, healed and checked out against                       */
/* -------------------------------------------------------------------------- */

interface ChildResult {
  columns: { name: string; type: string }[];
  legacyRows: { reference: string }[];
  checkout: { reference: string; userId: string; amount: number; programId: string | null } | null;
  storedPaymentUserId: string | null;
  foreignKeys: { name: string; definition: string }[];
  textChecks: { name: string; definition: string }[];
  secondRunChanged: boolean;
  error: string | null;
}

async function child(shapeId: string, directory: string, out: string): Promise<void> {
  const shape = SHAPES.find((candidate) => candidate.id === shapeId)!;
  process.env.PGLITE_DIR = directory;

  const result: ChildResult = {
    columns: [],
    legacyRows: [],
    checkout: null,
    storedPaymentUserId: null,
    foreignKeys: [],
    textChecks: [],
    secondRunChanged: false,
    error: null,
  };

  try {
    const { execScript, query, ready } = await import("../src/lib/db");
    await execScript(shape.sql);

    // What the legacy table held before this app touched it.
    result.legacyRows = await query<{ reference: string }>(
      "select reference::text as reference from payments order by reference"
    );

    // The real first request: creates what is missing, heals what is wrong.
    await ready();

    result.columns = await query<{ name: string; type: string }>(
      `select column_name as name, data_type as type
         from information_schema.columns
        where table_schema = current_schema() and table_name = 'payments'
        order by ordinal_position`
    );

    // The student's actual path: a real account, a real program checkout.
    const { createAccount } = await import("../src/lib/store");
    const { createCheckout } = await import("../src/lib/payments");
    const user = await createAccount({
      name: "Legacy Student",
      email: `legacy-${shapeId}@example.com`,
      password: "correct horse battery staple",
    });
    const started = await createCheckout(
      user,
      { kind: "program", programId: "computer-science", phone: "0244123456", network: "mtn" },
      { callbackBaseUrl: "http://localhost:3000" }
    );
    result.checkout = {
      reference: started.payment.reference,
      userId: started.payment.userId,
      amount: started.payment.amount,
      programId: started.payment.programId,
    };
    const stored = await query<{ user_id: string }>(
      "select user_id from payments where reference = $1",
      [started.payment.reference]
    );
    result.storedPaymentUserId = stored[0]?.user_id ?? null;

    result.foreignKeys = await query<{ name: string; definition: string }>(
      `select conname as name, pg_get_constraintdef(oid) as definition
         from pg_constraint
        where conrelid = 'payments'::regclass and contype = 'f'
        order by conname`
    );
    result.textChecks = await query<{ name: string; definition: string }>(
      `select conname as name, pg_get_constraintdef(oid) as definition
         from pg_constraint
        where conrelid = 'payments'::regclass and contype = 'c'
        order by conname`
    );

    // A second boot must not change anything: the heal is idempotent.
    const before = JSON.stringify(
      await query(
        `select column_name, data_type, coalesce(column_default, '-') as column_default
           from information_schema.columns where table_name = 'payments' order by column_name`
      )
    );
    delete (globalThis as { __codaraSchema?: unknown }).__codaraSchema;
    await ready();
    const after = JSON.stringify(
      await query(
        `select column_name, data_type, coalesce(column_default, '-') as column_default
           from information_schema.columns where table_name = 'payments' order by column_name`
      )
    );
    result.secondRunChanged = before !== after;
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    result.error = `${detail.code ?? "error"}: ${detail.message ?? String(error)}`;
  }

  writeFileSync(out, JSON.stringify(result));
  process.exit(0);
}

/* -------------------------------------------------------------------------- */
/* Parent: run every shape, then judge the results                            */
/* -------------------------------------------------------------------------- */

if (process.argv[2] === "--shape") {
  await child(process.argv[3], process.argv[4], process.argv[5]);
}

const TEXT_COLUMNS = [
  "reference",
  "user_id",
  "kind",
  "period",
  "course_id",
  "lesson_id",
  "program_id",
  "description",
  "status",
  "provider",
  "currency",
  "phone",
  "network",
  "authorization_url",
  "channel",
  "invoice_number",
  "provider_event_id",
  "promo_code",
  "settles_reference",
];

let failures = 0;

function expect(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`    ${ok ? "✔" : "✘"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
}

const root = mkdtempSync(path.join(tmpdir(), "cmg-payments-schema-"));
console.log(`legacy payments schema · ${SHAPES.length} shapes\n`);

for (const shape of SHAPES) {
  const directory = path.join(root, shape.id);
  const out = path.join(root, `${shape.id}.json`);
  console.log(`${shape.id} — ${shape.what}`);
  console.log(`  used to fail with ${shape.usedToFail}`);

  try {
    await run(process.execPath, ["--import", "tsx", self, "--shape", shape.id, directory, out], {
      cwd: path.resolve(path.dirname(self), ".."),
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    failures += 1;
    console.log(`    ✘ the check itself crashed: ${(error as Error).message.split("\n")[0]}`);
    continue;
  }

  const result = JSON.parse(readFileSync(out, "utf8")) as ChildResult;

  if (result.error) {
    failures += 1;
    console.log(`    ✘ ready()/checkout failed: ${result.error}`);
    continue;
  }

  // The whole point: the student's checkout starts.
  expect("checkout started, no CHECKOUT_FAILED", result.checkout !== null, true);
  expect("the payment row carries this app's text account id", result.storedPaymentUserId, result.checkout?.userId);
  expect("the payment is for the program asked for", result.checkout?.programId, "computer-science");
  expect("the payment has a CMG- reference", /^CMG-/.test(result.checkout?.reference ?? ""), true);

  // Every column this app writes is text, whatever the legacy type was.
  const wrong = TEXT_COLUMNS.map((name) => {
    const column = result.columns.find((candidate) => candidate.name === name);
    return column && column.type !== "text" ? `${name}=${column.type}` : null;
  }).filter(Boolean);
  expect("every id/string column is text", wrong, []);

  // The columns the heal has to add exist.
  for (const added of ["deposit", "balance_due", "settles_reference", "promo_code", "paid_at", "created_at", "updated_at"]) {
    expect(`payments.${added} exists`, result.columns.some((column) => column.name === added), true);
  }

  // Legacy rows are preserved, values and all.
  expect(
    "legacy payment rows preserved",
    result.legacyRows.map((row) => row.reference),
    shape.legacyReferences
  );

  // Only this app's two relationships remain, and both are enforceable.
  const keys = result.foreignKeys.map((key) => `${key.name}: ${key.definition}`).sort();
  expect(
    "foreign keys are exactly user_id -> users, settles_reference -> reference",
    keys.length === 2 &&
      keys[0].includes("settles_reference") &&
      keys[0].includes("payments(reference)") &&
      keys[1].includes("user_id") &&
      keys[1].includes("users(id)"),
    true
  );

  // The rules this app relies on are back (and the old ones are gone).
  const rules = result.textChecks.map((rule) => rule.name).sort();
  expect(
    "this app's payment rules are installed",
    ["payments_amount_check", "payments_currency_check", "payments_kind_check", "payments_period_check", "payments_provider_check", "payments_status_check"].every(
      (name) => rules.includes(name)
    ),
    true
  );

  expect("a second boot changes nothing", result.secondRunChanged, false);
  console.log("");
}

rmSync(root, { recursive: true, force: true });
if (failures) {
  console.log(`✘ ${failures} check${failures === 1 ? "" : "s"} failed — a legacy payments table is still not healed.`);
  process.exit(1);
}
console.log(`✓ every legacy payments shape is healed, and a real checkout starts on each (${SHAPES.length} shapes).`);
process.exit(0);
