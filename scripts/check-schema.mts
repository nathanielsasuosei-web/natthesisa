/**
 * Proves the two halves of the schema machinery, on a throwaway database:
 *
 *   npm run schema:check
 *
 *   1. The shape check (`SCHEMA_CURRENT_QUERY`) tells the truth —
 *      `false` on an empty database, `true` once the statements have run.
 *      `ensureSchema()` uses it as a fast path, so a database that is already
 *      correct costs one query instead of ~80 statements.
 *   2. Every way a `payments` table can come from somewhere else (another
 *      project's `uuid` user_id, a `varchar(8)` reference, rules that reject
 *      `program` / `paystack`, a foreign NOT NULL column) is noticed by that
 *      check — so the heal is never skipped — and put right by the migration
 *      statements. The one shape the app deliberately tolerates (money stored
 *      as `numeric`) must NOT be noticed: it already works.
 *
 * The database is created in a temporary directory, so this never touches
 * `.data/pg` or a hosted database, and the file is removed on exit.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { MIGRATION_STATEMENTS, SCHEMA_CURRENT_QUERY, SCHEMA_STATEMENTS } from "../src/lib/schema";

const directory = mkdtempSync(path.join(tmpdir(), "cmg-schema-check-"));
const db = await new PGlite(directory);

const current = async (): Promise<boolean> =>
  (await db.query<{ current: boolean }>(SCHEMA_CURRENT_QUERY)).rows[0]?.current === true;

/** Exactly what `ensureSchema()` runs when the shape check says "not current". */
const apply = async (): Promise<void> => {
  for (const statement of [...SCHEMA_STATEMENTS, ...MIGRATION_STATEMENTS]) {
    // Statements that touch a foreign table warn instead of failing the run.
    await db.exec(statement).catch((error) => console.log(`   (statement warned: ${String(error).slice(0, 110)}…)`));
  }
  // The app writes whole cedis and reads money through Number(), so it accepts
  // any numeric column; the check does too, which would leave the integer
  // version of this one case untested. Put it back for the next case.
  await db.exec(`alter table payments alter column amount type integer using amount::integer`).catch(() => undefined);
};

interface Case {
  name: string;
  sql: string;
  /** The app can use this shape as it is — the check must not notice it. */
  tolerated?: true;
}

const cases: Case[] = [
  { name: "user_id becomes uuid (the checkout failure)", sql: `
      alter table payments drop constraint if exists payments_user_id_fkey;
      alter table payments alter column user_id type uuid using user_id::uuid` },
  { name: "reference becomes varchar(8)", sql: `
      alter table payments alter column reference type varchar(8)` },
  { name: "currency becomes char(3)", sql: `
      alter table payments alter column currency type char(3)` },
  { name: "amount becomes numeric(10,2)", tolerated: true, sql: `
      alter table payments alter column amount type numeric(10,2)` },
  { name: "a legacy NOT NULL column appears", sql: `
      alter table payments add column if not exists legacy_plan text not null default '';
      alter table payments alter column legacy_plan drop default` },
  { name: "the kind rule forgets 'program'", sql: `
      alter table payments drop constraint if exists payments_kind_check;
      alter table payments add constraint payments_kind_check check (kind in ('pass','course','lesson'))` },
  { name: "the status rule only knows 'succeeded'", sql: `
      alter table payments drop constraint if exists payments_status_check;
      alter table payments add constraint payments_status_check check (status in ('succeeded','failed'))` },
  { name: "the provider rule never heard of 'paystack'", sql: `
      alter table payments drop constraint if exists payments_provider_check;
      alter table payments add constraint payments_provider_check check (provider in ('legacy','flutterwave'))` },
  { name: "users.avatar is gone", sql: `
      alter table users drop column if exists avatar` },
  { name: "payments is the old hand-made table", sql: `
      drop table if exists payments;
      create table payments (id uuid primary key default gen_random_uuid(), user_id uuid not null,
        amount numeric(10,2), currency varchar(3) default 'USD', status text,
        constraint payments_status_check check (status in ('succeeded','failed','refunded')))` },
  { name: "unique emails are no longer enforced", sql: `
      drop index if exists users_email_key` },
  { name: "invoice_number_seq is gone", sql: `
      drop sequence if exists invoice_number_seq` },
];

console.log(`database : ${directory}\n`);
console.log(`empty database               current=${await current()}`);

await apply();
console.log(`after the statements         current=${await current()}\n`);

let failures = 0;
for (const testCase of cases) {
  if (!(await current())) await apply(); // start every case from a database that is current
  await db.exec(testCase.sql).catch((error) => console.log(`   (setup note: ${String(error).slice(0, 110)})`));

  const noticed = !(await current());
  let result: boolean;
  if (testCase.tolerated) {
    // The app's own insert columns (see createCheckout in src/lib/payments.ts).
    await db.exec(`alter table payments drop constraint if exists payments_user_id_fkey`).catch(() => undefined);
    await db
      .exec(`insert into payments
               (reference, user_id, kind, period, course_id, lesson_id, program_id, amount,
                currency, description, status, provider, phone, network)
             values ('CMG-CHECK-1', 'no-such-user', 'program', null, null, null, 'web-development',
                     300, 'GHS', 'Web Development - program purchase', 'pending', 'paystack', null, null)`)
      .catch(() => undefined);
    const row = await db.query<{ amount: unknown }>(`select amount from payments where reference = 'CMG-CHECK-1'`);
    const usable = Number(row.rows[0]?.amount) === 300;
    await db.exec(`delete from payments where reference = 'CMG-CHECK-1'`).catch(() => undefined);
    result = !noticed && usable;
    console.log(
      `${result ? "ok  " : "FAIL"}  ${testCase.name.padEnd(52)} accepted as-is=${!noticed} usable=${usable}`
    );
  } else {
    await apply();
    const repaired = await current();
    result = noticed && repaired;
    console.log(`${result ? "ok  " : "FAIL"}  ${testCase.name.padEnd(52)} noticed=${noticed} repaired=${repaired}`);
  }
  if (!result) failures += 1;
}

await db.close();
rmSync(directory, { recursive: true, force: true });

console.log(failures === 0 ? "\nschema check: every shape noticed and repaired" : `\nschema check: ${failures} case(s) FAILED`);
process.exit(failures === 0 ? 0 : 1);
