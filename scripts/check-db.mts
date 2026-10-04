/**
 * Reports which database the app will use and what is in it.
 *
 *   npm run db:check
 *
 * Uses DATABASE_URL when it is set, otherwise the embedded PostgreSQL in
 * `.data/pg` — the same selection the app makes at runtime.
 */
import { queryOne } from "../src/lib/db";
import { reportDatabase } from "../src/lib/bootstrap";

const info = await reportDatabase();

console.log(`driver   : ${info.driver === "postgres" ? "DATABASE_URL (hosted Postgres)" : "embedded PGlite (.data/pg)"}`);
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

process.exit(0);
