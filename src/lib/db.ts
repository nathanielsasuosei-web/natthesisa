import { mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import { MIGRATION_STATEMENTS, SCHEMA_STATEMENTS } from "./schema";

/**
 * Database connection.
 *
 * Configure a real database with DATABASE_URL (Supabase, Neon, RDS, a local
 * Postgres — anything that speaks the Postgres wire protocol):
 *
 *   DATABASE_URL="postgresql://user:password@host:5432/postgres"
 *
 * When DATABASE_URL is missing, development falls back to an embedded
 * PostgreSQL (PGlite) stored in `.data/pg`, so the app runs with real SQL and
 * real constraints out of the box. Production refuses to start without a
 * connection string unless ALLOW_EMBEDDED_DB=1 is set explicitly, because an
 * embedded database inside a serverless function is not durable.
 */

export type DbDriver = "postgres" | "embedded";

interface Driver {
  kind: DbDriver;
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}

const g = globalThis as unknown as {
  __codaraDb?: Promise<Driver>;
  __codaraSchema?: Promise<void>;
  __codaraShutdownHooks?: boolean;
  __codaraCloseDb?: () => Promise<void>;
};

/** Statements that change data, and so need flushing to the filesystem. */
const WRITE_STATEMENT =
  /^(insert|update|delete|create|alter|drop|truncate|comment|grant|revoke|set)\b/i;

function embeddedAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_EMBEDDED_DB === "1";
}

/** Splits a connection string into loggable parts. The password is never returned. */
function describeDatabaseUrl(url: string): { user: string; host: string; port: string; db: string } {
  try {
    const parsed = new URL(url);
    return {
      user: decodeURIComponent(parsed.username || "(none)"),
      host: parsed.hostname || "(none)",
      port: parsed.port || "5432",
      db: decodeURIComponent(parsed.pathname.replace(/^\//, "") || "(none)"),
    };
  } catch {
    return { user: "(unparseable DATABASE_URL)", host: "", port: "", db: "" };
  }
}

/**
 * Logs a connection failure with the fix, not just the driver error.
 *
 * Sign-in shows a deliberately generic banner, so this log line — visible in
 * `vercel logs` / the host's log viewer — is what turns "check the database
 * connection" into a concrete next step. Never logs the password.
 */
function logConnectionFailure(url: string, error: unknown): void {
  const { user, host, port, db } = describeDatabaseUrl(url);
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[codemasterghana] database connection failed (${user}@${host}:${port}/${db}): ${detail}`);
  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(host)) {
    const ref = host.split(".")[1];
    console.error(
      `[codemasterghana] '${host}' is Supabase's DIRECT host, which is IPv6-only: hosts without an IPv6 route ` +
        `(including Vercel) can never reach it, and every sign-in fails. Switch DATABASE_URL to the Transaction ` +
        `pooler URI (Supabase dashboard → Project settings → Database → Connection pooling): ` +
        `postgresql://postgres.${ref}:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres. ` +
        `Set it on every environment, redeploy, and sign-in recovers with no code change.`
    );
  } else if (/password authentication failed/i.test(detail)) {
    console.error(
      "[codemasterghana] the database rejected the password. Reset it (Supabase dashboard → Project settings → " +
        "Database → Reset database password), update the deployment's environment variables, and redeploy."
    );
  } else if (/role "[^"]*" does not exist/i.test(detail)) {
    console.error(
      "[codemasterghana] the database has no such role. Against the Supabase pooler the user must be " +
        "'postgres.<project-ref>', not plain 'postgres' — fix the username in DATABASE_URL and redeploy."
    );
  } else if (/ENOTFOUND|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT|timeout|expired/i.test(detail)) {
    console.error(
      "[codemasterghana] the host is unreachable from here. Check the hostname and the project's region, " +
        "and Supabase → Project settings → Network restrictions for IP allowlists blocking this host."
    );
  }
}

async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL?.trim();

  if (url) {
    const { Pool } = await import("pg");
    const isLocal = /(^|@|\/\/)(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url);
    const wantsSsl = !isLocal && process.env.DATABASE_SSL !== "false";
    const pool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      // Managed providers (Supabase, Neon, RDS) terminate TLS with their own
      // certificates; we encrypt the connection but do not pin their CA.
      ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
      // Supabase's pooler (port 6543) runs in transaction mode and cannot keep
      // prepared statements, so queries here are always unnamed/simple.
      statement_timeout: 15_000,
    });
    pool.on("error", (error) => {
      // An idle client dropped by the server (a pooler recycling connections,
      // a deploy restarting Postgres). The pool replaces the client on its
      // own; without this listener the error is thrown into the void.
      console.error("[codemasterghana] database pool dropped an idle client", error);
    });
    // Fail fast with a useful message rather than hanging on first request.
    try {
      await pool.query("select 1");
    } catch (error) {
      await pool.end().catch(() => {});
      logConnectionFailure(url, error);
      throw error;
    }
    return {
      kind: "postgres",
      query: async <T>(sql: string, params?: unknown[]) => (await pool.query(sql, params)).rows as T[],
      close: () => pool.end(),
    };
  }

  if (!embeddedAllowed()) {
    throw new Error(
      "DATABASE_URL is not set. Connect a PostgreSQL database (for example Supabase or Neon) before running in production."
    );
  }

  const directory = process.env.PGLITE_DIR?.trim() || path.join(process.cwd(), ".data", "pg");
  const db = await openEmbedded(directory);
  console.info(
    `[codemasterghana] database: embedded PostgreSQL (PGlite) at ${directory}. ` +
      "Local development only — set DATABASE_URL to a hosted PostgreSQL for production."
  );
  await registerShutdown(db);

  return {
    kind: "embedded",
    query: async <T>(sql: string, params?: unknown[]) => {
      const result = await db.query<T>(sql, params as never);
      if (WRITE_STATEMENT.test(sql)) {
        // PGlite keeps a virtual filesystem in memory and writes it out
        // lazily. Flushing after a write costs ~0ms and means a server that is
        // killed mid-request can still recover on the next boot.
        await db.syncToFs();
      }
      return result.rows as T[];
    },
    close: async () => {
      await db.syncToFs().catch(() => {});
      await db.close();
    },
  };
}

/**
 * Opens the embedded database, recovering from an interrupted one.
 *
 * PGlite is a single-process PostgreSQL: if the process is killed while it is
 * writing, the data directory can be left with a torn checkpoint record, which
 * Postgres refuses to start from. A hosted server handles that itself, so this
 * fallback only exists for the embedded case — it moves the unreadable
 * directory aside (nothing is deleted) and starts a new one, so the app comes
 * back up instead of returning 500s forever.
 */
async function openEmbedded(directory: string): Promise<PGliteDb> {
  const { PGlite } = await import("@electric-sql/pglite");
  // PGlite creates its own data directory with a non-recursive mkdir, so a
  // missing parent (a fresh checkout, or a deployment where `.data` is not part
  // of the image) makes it fail with ENOENT before PostgreSQL even starts.
  mkdirSync(directory, { recursive: true });
  try {
    const db = new PGlite(directory);
    await db.query("select 1"); // forces startup, so a broken directory fails here
    return db;
  } catch (error) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    mkdirSync(path.dirname(directory), { recursive: true });
    const quarantine = `${directory}.broken-${stamp}`;
    try {
      renameSync(directory, quarantine);
    } catch (renameError) {
      throw error;
    }
    const reason = (error instanceof Error ? error.message : String(error)).replace(/\.+$/, "");
    console.error(
      `[codemasterghana] The embedded database at ${directory} could not be opened (${reason}). ` +
        `The old directory is kept at ${quarantine} and a new, empty database was created. ` +
        "Set DATABASE_URL to a hosted PostgreSQL — it recovers from an interrupted write on its own."
    );
    const fresh = new PGlite(directory);
    await fresh.query("select 1");
    return fresh;
  }
}

type PGliteDb = { query<T>(sql: string, params?: never): Promise<{ rows: T[] }>; syncToFs(): Promise<void>; close(): Promise<void> };

/**
 * Closes the database when the process is asked to stop, so a normal restart
 * checkpoints cleanly instead of looking like a crash. Both signals are
 * handled because `next dev` and the deployment platform use SIGTERM, while a
 * terminal Ctrl-C sends SIGINT.
 */
async function registerShutdown(db: PGliteDb): Promise<void> {
  g.__codaraCloseDb = async () => {
    await db.syncToFs().catch(() => {});
    await db.close();
  };
  if (g.__codaraShutdownHooks) return;
  g.__codaraShutdownHooks = true;

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      const closed = g.__codaraCloseDb?.().catch(() => {}) ?? Promise.resolve();
      // Never hang the shutdown: if closing takes too long, let the process go.
      const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
      void Promise.race([closed, timeout]).then(() => process.exit(0));
    });
  }
}

async function driver(): Promise<Driver> {
  if (!g.__codaraDb) {
    g.__codaraDb = createDriver().catch((error) => {
      g.__codaraDb = undefined;
      throw error;
    });
  }
  return g.__codaraDb;
}

export async function dbKind(): Promise<DbDriver> {
  return (await driver()).kind;
}

export async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  return (await driver()).query<T>(sql, params);
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Creates the tables on first use, then heals databases made by older builds.
 * Safe to call on every request.
 */
export async function ensureSchema(): Promise<void> {
  if (!g.__codaraSchema) {
    g.__codaraSchema = (async () => {
      for (const statement of SCHEMA_STATEMENTS) {
        await runSchemaStatement(statement);
      }
      // A stale database has the tables but not the columns: the migration
      // reshapes it in place (additive only — rows are never dropped,
      // renamed or retyped), so deploying the new code is the whole upgrade.
      for (const statement of MIGRATION_STATEMENTS) {
        await runSchemaStatement(statement);
      }
    })().catch((error) => {
      g.__codaraSchema = undefined;
      throw error;
    });
  }
  return g.__codaraSchema;
}

/** Runs one schema/migration statement, naming it in the logs if it fails. */
async function runSchemaStatement(statement: string): Promise<void> {
  try {
    await query(statement);
  } catch (error) {
    const preview = statement.replace(/\s+/g, " ").trim().slice(0, 120);
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[codemasterghana] schema statement failed (${preview}…): ${detail}`);
    throw error;
  }
}

/**
 * Connects once to a real database and reports what it found — handy in logs
 * when a deployment points at the wrong DATABASE_URL.
 */
export async function databaseInfo(): Promise<{ driver: DbDriver; version: string | null }> {
  const row = await queryOne<{ version: string }>("select version() as version");
  return { driver: await dbKind(), version: row?.version ?? null };
}

/** Waits for the schema to exist before any query runs. */
export async function ready(): Promise<void> {
  await ensureSchema();
}
