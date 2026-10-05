/**
 * Reports which database the app will use and what is in it.
 *
 *   npm run db:check
 *
 * Uses DATABASE_URL when it is set, otherwise the embedded PostgreSQL in
 * `.data/pg` — the same selection the app makes at runtime.
 */
import { loadEnv } from "./load-env.mts";
import { storageSummary } from "../src/lib/blob-store";
import { queryOne } from "../src/lib/db";
import { reportDatabase } from "../src/lib/bootstrap";

const loaded = loadEnv(); // .env.local, the same file the app reads

// Name the alternative variables so a host that injected POSTGRES_URL instead
// of DATABASE_URL does not look like "no database configured".
if (!process.env.DATABASE_URL?.trim()) {
  const alternative = ["POSTGRES_URL", "POSTGRES_PRISMA_URL", "SUPABASE_DB_URL", "POSTGRES_URL_NON_POOLING"].find(
    (name) => process.env[name]?.trim()
  );
  if (alternative) console.log(`note     : DATABASE_URL is not set; using ${alternative} instead`);
}

const info = await reportDatabase();

console.log(
  `driver   : ${
    info.driver === "postgres"
      ? `hosted Postgres (connection string from ${info.source ?? "the environment"})`
      : "embedded PGlite (.data/pg)"
  }`
);
console.log(`database : ${info.host ?? "—"}`);
console.log(`server   : ${info.version?.split(" ").slice(0, 2).join(" ") ?? "unknown"}`);
console.log(`data dir : ${process.env.PGLITE_DIR ?? ".data/pg (default)"}`);
console.log(`owner    : ${info.owner ?? "not created yet (set OWNER_EMAIL + OWNER_PASSWORD)"}`);

const totals = await queryOne<{ users: string; owners: string; admins: string; learners: string }>(
  `select
     count(*)::text as users,
     count(*) filter (where owner)::text as owners,
     count(*) filter (where role = 'admin')::text as admins,
     count(*) filter (where role = 'member')::text as learners
   from users`
);
console.log(`accounts : ${totals?.users ?? 0} total · ${totals?.learners ?? 0} learners · ${totals?.admins ?? 0} admins · ${totals?.owners ?? 0} owner`);

const recent = await queryOne<{ email: string; created_at: Date }>(
  "select email, created_at from users order by created_at desc limit 1"
);
console.log(`latest   : ${recent ? `${recent.email} (${new Date(recent.created_at).toISOString()})` : "no accounts yet"}`);
console.log(`files    : ${storageSummary()}`);

// Uploaded lessons and the owner's branding profile live in app_state, so a
// backup of the database is a backup of both. A fresh database has no row yet.
const state = await queryOne<{ lessons: string | null; branding: string | null }>(
  `select
     (select count(*)::text from jsonb_array_elements(coalesce((select value from app_state where key = 'lessons'), '[]'::jsonb))) as lessons,
     (select case when value is null or value = 'null'::jsonb then 'not set' else 'set' end from app_state where key = 'branding') as branding`
).catch(() => null);
console.log(
  `content  : ${state ? `${state.lessons ?? 0} uploaded lesson(s) · branding ${state.branding ?? "not set"}` : "app_state not created yet"}`
);
if (loaded.length) console.log(`env      : ${loaded.join(", ")}`);

process.exit(0);
