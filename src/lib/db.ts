import { mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import { MIGRATION_STATEMENTS, SCHEMA_CURRENT_QUERY, SCHEMA_STATEMENTS } from "./schema";

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
    return { user: "(unparseable connection string)", host: "", port: "", db: "" };
  }
}

/**
 * The environment variables that can hold a Postgres connection string.
 *
 * `DATABASE_URL` is this project's documented name, but a database added
 * through a host's own dashboard does not necessarily use it: Vercel's Supabase
 * integration injects `POSTGRES_URL` (pooled), `POSTGRES_PRISMA_URL` and
 * `POSTGRES_URL_NON_POOLING`, and other integrations bring their own names.
 * Reading them too means pressing "Connect" in the dashboard is enough —
 * otherwise the app reports having no database while a perfectly good
 * connection string sits unused in the environment.
 *
 * Order matters. Pooled strings come first, because a serverless host opens a
 * connection per invocation; Supabase's direct host comes last, because it is
 * IPv6-only and therefore the one that cannot work on Vercel.
 */
export const CONNECTION_STRING_VARS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "SUPABASE_DB_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

export type ConnectionSource = (typeof CONNECTION_STRING_VARS)[number];

/** The first configured connection string, and the variable it came from. */
function configuredConnection(): { url: string; source: ConnectionSource } | null {
  for (const source of CONNECTION_STRING_VARS) {
    const url = process.env[source]?.trim();
    if (url) return { url, source };
  }
  return null;
}

export interface DatabaseTarget {
  driver: DbDriver;
  /** The environment variable the connection string came from, if any. */
  source: ConnectionSource | null;
  /** Hostname only — never a user, password or database name. */
  host: string | null;
}

/** What the app will connect to, resolved without opening a connection. */
export function databaseTarget(): DatabaseTarget {
  const found = configuredConnection();
  if (!found) return { driver: "embedded", source: null, host: null };
  return { driver: "postgres", source: found.source, host: describeDatabaseUrl(found.url).host };
}

/**
 * The sentence that names the fix for a connection failure, or null.
 *
 * Used twice: written to the logs by `logConnectionFailure`, and returned by
 * `/api/health` so a deployment can be diagnosed from a browser instead of the
 * host's log viewer. Never includes the password.
 */
export function connectionHint(error: unknown): string | null {
  const found = configuredConnection();
  return found ? describeFailure(found.url, error) : null;
}

function describeFailure(url: string, error: unknown): string | null {
  const { host } = describeDatabaseUrl(url);
  const detail = error instanceof Error ? error.message : String(error);
  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(host)) {
    const ref = host.split(".")[1];
    return (
      `'${host}' is Supabase's DIRECT host, which is IPv6-only: hosts without an IPv6 route ` +
      `(including Vercel) can never reach it, and every sign-in fails. Switch to the Transaction ` +
      `pooler URI (Supabase dashboard → Project settings → Database → Connection pooling): ` +
      `postgresql://postgres.${ref}:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres. ` +
      `Set it on every environment, redeploy, and sign-in recovers with no code change.`
    );
  }
  if (/password authentication failed/i.test(detail)) {
    return (
      "The database rejected the password. Reset it (Supabase dashboard → Project settings → " +
      "Database → Reset database password), update the deployment's environment variables, and redeploy."
    );
  }
  // Supabase's pooler answers a username without the project-ref suffix with
  // "Tenant or user not found" rather than Postgres's own "role does not exist".
  if (/role "[^"]*" does not exist|tenant or user not found/i.test(detail)) {
    return (
      "The database has no such role. Against the Supabase pooler the user must be " +
      "'postgres.<project-ref>', not plain 'postgres' — fix the username in the connection string and redeploy."
    );
  }
  if (/permission denied|must be owner of|insufficient privilege/i.test(detail)) {
    return (
      "The connection works but this role cannot create tables. Use the database's own admin " +
      "user (on Supabase: the password from Project settings → Database, user 'postgres.<project-ref>' " +
      "through the pooler), or create the tables yourself by pasting db/schema.sql into the SQL editor."
    );
  }
  if (/pg_hba\.conf|no encryption|SSL required|server does not support SSL/i.test(detail)) {
    return (
      "The SSL setting does not match what the server expects. Remove DATABASE_SSL=false " +
      "(managed hosts such as Supabase and Neon require TLS) and redeploy."
    );
  }
  if (/ENOTFOUND|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT|ECONNREFUSED|ECONNRESET|socket hang up|timeout|expired/i.test(detail)) {
    return (
      "The host is unreachable from here. Check the hostname and the project's region, and " +
      "Supabase → Project settings → Network restrictions for IP allowlists blocking this host."
    );
  }
  return null;
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
  const hint = describeFailure(url, error);
  if (hint) console.error(`[codemasterghana] ${hint}`);
}

async function createDriver(): Promise<Driver> {
  const found = configuredConnection();

  if (found) {
    const { url, source } = found;
    const { Pool } = await import("pg");
    const isLocal = /(^|@|\/\/)(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url);
    const wantsSsl = !isLocal && process.env.DATABASE_SSL !== "false";
    const max = Number(process.env.DATABASE_POOL_MAX ?? 5);
    const pool = new Pool({
      connectionString: url,
      max,
      // Managed providers (Supabase, Neon, RDS) terminate TLS with their own
      // certificates; we encrypt the connection but do not pin their CA.
      ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
      // Supabase's pooler (port 6543) runs in transaction mode and cannot keep
      // prepared statements, so queries here are always unnamed/simple.
      statement_timeout: 15_000,
      // Without a connect timeout, a host that accepts the TCP connection and
      // then never answers holds the request open until the platform's own
      // limit kills it — a hang instead of a diagnosable error.
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 10_000),
      keepAlive: true,
    });
    pool.on("error", (error) => {
      // An idle client dropped by the server (a pooler recycling connections,
      // a deploy restarting Postgres). The pool replaces the client on its
      // own; without this listener the error is thrown into the void.
      console.error("[codemasterghana] database pool dropped an idle client", error);
    });
    if (source === "POSTGRES_URL_NON_POOLING" && !isLocal) {
      console.warn(
        `[codemasterghana] database: connected through ${source}, which is a direct (non-pooled) connection. ` +
          "Serverless hosts open a connection per invocation, so the pooled URL (POSTGRES_URL) is the better one — " +
          "and Supabase's direct host is IPv6-only, so it cannot be reached from Vercel at all."
      );
    }
    // Fail fast with a useful message rather than hanging on first request.
    try {
      await pool.query("select 1");
    } catch (error) {
      await pool.end().catch(() => {});
      logConnectionFailure(url, error);
      throw error;
    }
    const { user, host, port, db } = describeDatabaseUrl(url);
    console.info(
      `[codemasterghana] database: ${user}@${host}:${port}/${db} via ${source} ` +
        `(SSL ${wantsSsl ? "on" : "off"}, pool max ${max})`
    );
    return {
      kind: "postgres",
      query: async <T>(sql: string, params?: unknown[]) => (await pool.query(sql, params)).rows as T[],
      close: () => pool.end(),
    };
  }

  if (!embeddedAllowed()) {
    throw new Error(
      `No PostgreSQL connection string is configured. Checked ${CONNECTION_STRING_VARS.join(", ")}. ` +
        "Connect a PostgreSQL database (for example Supabase or Neon), set the connection string in the " +
        "host's environment variables, and redeploy — a deployment picks environment variables up only on a new build."
    );
  }

  const directory = process.env.PGLITE_DIR?.trim() || path.join(process.cwd(), ".data", "pg");
  const db = await openEmbedded(directory);
  console.info(
    `[codemasterghana] database: embedded PostgreSQL (PGlite) at ${directory}. ` +
      `No ${CONNECTION_STRING_VARS[0]} was set (also checked ${CONNECTION_STRING_VARS.slice(1).join(", ")}). ` +
      "Local development only — set one of those to a hosted PostgreSQL for production."
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
 * Safe to call on every request, and cached per process.
 *
 * The statements are only run when the database does not already match them
 * (`SCHEMA_CURRENT_QUERY`, one query). That matters on a hosted deployment:
 * every cold serverless instance used to replay all ~80 statements over a
 * pooled connection before it could answer anything — long enough that the
 * health probe timed out and the first visitor waited seconds. A database that
 * is already correct now costs one query; one that is not (a fresh database, a
 * table left by another project, something changed by hand) takes the full
 * path, so the self-healing behaviour is unchanged.
 */
export async function ensureSchema(): Promise<void> {
  if (!g.__codaraSchema) {
    g.__codaraSchema = (async () => {
      if (await schemaIsCurrent()) return;

      console.info("[codemasterghana] shaping the database: creating or upgrading the tables this app needs");
      for (const statement of SCHEMA_STATEMENTS) {
        await runSchemaStatement(statement);
      }
      // A stale database has the tables but not the columns: the migration
      // reshapes it in place (additive only — rows are never dropped,
      // renamed or retyped), so deploying the new code is the whole upgrade.
      for (const statement of MIGRATION_STATEMENTS) {
        await runSchemaStatement(statement);
      }
      // Say so when the statements ran but the shape still disagrees — the
      // warnings above name the statement, and this is what a report sees.
      if (!(await schemaIsCurrent())) {
        console.warn(
          "[codemasterghana] the database still does not match the expected shape after the statements ran — see the warnings above"
        );
      }
    })().catch((error) => {
      g.__codaraSchema = undefined;
      throw error;
    });
  }
  return g.__codaraSchema;
}

/**
 * True when the database already has everything the statements would give it.
 * A check that cannot run (no connection, an unusual role) counts as `false`,
 * which runs the statements and lets them report the problem in full.
 */
async function schemaIsCurrent(): Promise<boolean> {
  try {
    const row = await queryOne<{ current: boolean }>(SCHEMA_CURRENT_QUERY);
    return row?.current === true;
  } catch (error) {
    console.warn("[codemasterghana] could not check the database shape, applying every statement instead", error);
    return false;
  }
}

/**
 * Runs one schema/migration statement, naming it in the logs if it fails.
 *
 * A schema failure is often the first thing a wrong role hits — the connection
 * itself succeeds, and the problem only appears when a table has to be created.
 * The hint is logged here too, because by then `logConnectionFailure` has
 * already run and reported success.
 */
async function runSchemaStatement(statement: string): Promise<void> {
  try {
    await query(statement);
  } catch (error) {
    const preview = statement.replace(/\s+/g, " ").trim().slice(0, 120);
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[codemasterghana] schema statement failed (${preview}…): ${detail}`);
    const hint = connectionHint(error);
    if (hint) console.error(`[codemasterghana] ${hint}`);
    throw error;
  }
}

/**
 * Connects once to a real database and reports what it found — handy in logs
 * when a deployment reads a connection string other than `DATABASE_URL`.
 */
export async function databaseInfo(): Promise<DatabaseTarget & { version: string | null }> {
  const row = await queryOne<{ version: string }>("select version() as version");
  return { ...databaseTarget(), version: row?.version ?? null };
}

/** Waits for the schema to exist before any query runs. */
export async function ready(): Promise<void> {
  await ensureSchema();
}
