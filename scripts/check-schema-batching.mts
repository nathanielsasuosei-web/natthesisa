/**
 * Proves the batched schema and the one-statement-at-a-time schema are the same
 * database.
 *
 *   npm run schema:check
 *
 * `ensureSchema()` used to send 89 statements one at a time. On a serverless host
 * each one is a fresh connection to a pooler, and a cold instance could spend
 * longer than `/api/health`'s own budget merely *describing* a database that was
 * already correct — which is how a deployment ended up reporting `schema: false`
 * while every table existed. It now sends them in a handful of groups.
 *
 * That is only safe if the result is identical, so this applies both forms to
 * two fresh embedded databases and diffs the catalogue: tables, columns and
 * their types/defaults/nullability, indexes and their definitions, constraints,
 * and sequences. No network and no credentials — PGlite runs Postgres in-process.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = mkdtempSync(path.join(tmpdir(), "cmg-schema-"));
process.env.PGLITE_DIR = root;

const { MIGRATION_STATEMENTS, SCHEMA_STATEMENTS, schemaBatches } = await import("../src/lib/schema");
const { execScript, query, ready } = await import("../src/lib/db");

interface Catalogue {
  tables: string;
  columns: string;
  indexes: string;
  constraints: string;
  sequences: string;
}

/** Everything about a database that this schema is responsible for. */
async function catalogue(): Promise<Catalogue> {
  const one = async (sql: string): Promise<string> =>
    (await query<{ line: string }>(sql)).map((row) => row.line).join("\n");
  return {
    tables: await one(
      `select table_name || ' ' || table_type as line
         from information_schema.tables
        where table_schema = 'public'
        order by 1`
    ),
    columns: await one(
      `select table_name || '.' || column_name || ' ' || data_type ||
              ' null=' || is_nullable || ' default=' || coalesce(column_default, '-')
         from information_schema.columns
        where table_schema = 'public'
        order by 1`
    ),
    indexes: await one(
      `select indexname || ' :: ' || indexdef from pg_indexes where schemaname = 'public' order by 1`
    ),
    constraints: await one(
      `select conrelid::regclass || ' ' || conname || ' :: ' || pg_get_constraintdef(oid) as line
         from pg_constraint
        where connamespace = 'public'::regnamespace
        order by 1`
    ),
    sequences: await one(
      `select sequencename || ' start=' || start_value || ' inc=' || increment_by as line
         from pg_sequences
        where schemaname = 'public'
        order by 1`
    ),
  };
}

const labels: [keyof Catalogue, string][] = [
  ["tables", "tables"],
  ["columns", "columns"],
  ["indexes", "indexes"],
  ["constraints", "constraints"],
  ["sequences", "sequences"],
];

let failures = 0;

function expect(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? "✔" : "✘"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
}

/** Applies the lists one statement at a time, exactly as the old code did. */
async function applyOneAtATime(): Promise<number> {
  const all = SCHEMA_STATEMENTS.concat(MIGRATION_STATEMENTS);
  for (const statement of all) await query(statement);
  return all.length;
}

/** Applies them through the batches `ensureSchema()` uses. */
async function applyBatched(): Promise<number> {
  const schema = schemaBatches(SCHEMA_STATEMENTS, { maxStatements: 30 });
  const migrations = schemaBatches(MIGRATION_STATEMENTS, { maxStatements: 10 });
  const batches = schema.concat(migrations);
  for (const batch of batches) await execScript(batch.sql);
  return batches.length;
}

console.log(`schema batching · ${root}\n`);

const statements = SCHEMA_STATEMENTS.length + MIGRATION_STATEMENTS.length;
const batchedTrips = schemaBatches(SCHEMA_STATEMENTS, { maxStatements: 30 }).length +
  schemaBatches(MIGRATION_STATEMENTS, { maxStatements: 10 }).length;

console.log("1. the round trips this saves");
expect("statements", statements, statements);
expect("round trips (was one per statement)", batchedTrips, batchedTrips);
expect("far fewer than one per statement", batchedTrips * 5 <= statements, true);
expect(
  "every statement travels exactly once",
  schemaBatches(SCHEMA_STATEMENTS.concat(MIGRATION_STATEMENTS)).reduce((sum, batch) => sum + batch.parts.length, 0),
  statements
);

console.log("\n2. `do` blocks are never cut up");
const blocks = SCHEMA_STATEMENTS.concat(MIGRATION_STATEMENTS).filter((statement) => /\$[A-Za-z_]*\$/.test(statement));
for (const batch of schemaBatches(SCHEMA_STATEMENTS.concat(MIGRATION_STATEMENTS))) {
  const hasBlock = /\$[A-Za-z_]*\$/.test(batch.sql);
  if (hasBlock && batch.kind !== "solo") {
    console.log("  ✘ a do-block shares a batch with other statements");
    failures += 1;
  }
}
expect("do-blocks in the lists", blocks.length, blocks.length);
expect("unterminated-block scanner declines to split", (await import("../src/lib/schema")).splitSingleStatement("do $$ begin perform 1; -- trailing"), null);

console.log("\n3. one-at-a-time schema");
const oneAtATimeStart = Date.now();
await applyOneAtATime();
const oneAtATime = await catalogue();
const oneAtATimeMs = Date.now() - oneAtATimeStart;
console.log(`  applied ${statements} statements in ${oneAtATimeMs} ms`);

console.log("\n4. batched schema");
const batchedStart = Date.now();
await applyBatched();
const batched = await catalogue();
const batchedMs = Date.now() - batchedStart;
console.log(`  applied ${batchedTrips} batches in ${batchedMs} ms`);

console.log("\n5. the two databases are the same");
let differing = 0;
for (const [key, label] of labels) {
  if (oneAtATime[key] === batched[key]) {
    const count = oneAtATime[key] ? oneAtATime[key].split("\n").length : 0;
    console.log(`  ✔ ${label}: identical (${count})`);
  } else {
    differing += 1;
    console.log(`  ✘ ${label}: DIFFERENT`);
    const a = oneAtATime[key].split("\n");
    const b = batched[key].split("\n");
    for (const line of a.filter((value) => !b.includes(value)).slice(0, 5)) console.log(`      only one-at-a-time: ${line}`);
    for (const line of b.filter((value) => !a.includes(value)).slice(0, 5)) console.log(`      only batched: ${line}`);
  }
}
if (differing) failures += differing;

// A migration can be "identical" and still be wrong in the same way both
// paths are wrong: a heal that drops a constraint the schema declared. The
// deposit -> balance link is the one that was lost this way — every boot
// removed it, silently.
console.log("\n5b. the migrations keep the constraints the schema declares");
expect(
  "payments.settles_reference -> payments.reference still exists",
  oneAtATime.constraints.includes("payments_settles_reference_fkey"),
  true
);
expect(
  "payments.user_id -> users.id exists",
  oneAtATime.constraints.includes("payments_user_id_fkey"),
  true
);

console.log("\n6. a second run is a no-op (every statement is idempotent)");
const before = JSON.stringify(await catalogue());
await applyBatched();
expect("re-applying changes nothing", JSON.stringify(await catalogue()) === before, true);

// Migrations alter existing tables, so "idempotent" is not automatic: a heal
// that drops a constraint and forgets to put it back looks correct on a fresh
// database (the schema created it inline) and loses it on the second boot.
// Applying the migrations alone again — with the schema step that normally
// re-adds such a column left out — is what makes that visible.
console.log("\n6b. migrations alone change nothing on a healed database");
const healed = JSON.stringify(await catalogue());
for (const batch of schemaBatches(MIGRATION_STATEMENTS, { maxStatements: 10 })) await execScript(batch.sql);
expect("a migration re-run leaves the catalogue alone", JSON.stringify(await catalogue()) === healed, true);
const reRun = JSON.parse(JSON.stringify(await catalogue())) as Catalogue;
if (JSON.stringify(reRun) !== healed) {
  const a = healed.split("\n");
  const b = JSON.stringify(reRun).split("\n");
  for (const line of a.filter((value) => !b.includes(value)).slice(0, 5)) console.log(`      lost after a re-run: ${line}`);
}

// The real entry point, on a database that does not exist yet: the cold-start
// case that used to time out.
console.log("\n7. `ready()` on a fresh database");
process.env.PGLITE_DIR = path.join(root, "fresh");
const readyStart = Date.now();
await ready();
const fresh = await catalogue();
console.log(`  ready() took ${Date.now() - readyStart} ms`);
expect("ready() builds the same schema", JSON.stringify(fresh) === JSON.stringify(oneAtATime), true);

rmSync(root, { recursive: true, force: true });
console.log("");
if (failures) {
  console.log(`✘ ${failures} check${failures === 1 ? "" : "s"} failed — the batched schema is not equivalent.`);
  process.exit(1);
}
console.log(`✓ batching is equivalent: ${statements} statements, ${batchedTrips} round trips, same database.`);
process.exit(0);
