import { NextResponse } from "next/server";
import { CONNECTION_STRING_VARS, connectionHint, databaseInfo, databaseTarget, ready } from "@/lib/db";

// A diagnosis must never be answered from a cache, and must never itself be
// the thing that hangs: a database that never answers would otherwise hold the
// request open until the platform's own limit kills it.
export const dynamic = "force-dynamic";

const PROBE_TIMEOUT_MS = 12_000;

/** How the app decided where to connect. */
export interface HealthReport {
  ok: boolean;
  database: {
    driver: "postgres" | "embedded";
    connected: boolean;
    /** The environment variable the connection string came from, if any. */
    source: string | null;
    /** Hostname only — never a user, password or database name. */
    host: string | null;
    server: string | null;
    /**
     * Whether the tables sign-in needs exist (they are created on first use).
     * Null when there is no connection to ask.
     */
    schema: boolean | null;
    /** Plain-language next step when the connection failed. */
    hint: string | null;
  };
  checked: readonly string[];
  error?: string;
}

/**
 * Rejects with a message as soon as the timer fires, so a stalled probe cannot
 * hold the response. The underlying promise is abandoned, not cancelled —
 * there is no way to cancel a `pg` connect — but it finishes or fails on its
 * own, and its error is already handled below.
 */
function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No answer within ${ms / 1000}s.`)), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * `GET /api/health` — what the deployment is actually connected to.
 *
 * The sign-in banner deliberately says nothing specific, and the real reason
 * only exists in the host's logs. This endpoint is the way to read it from the
 * deployment itself: open `/api/health` and the `database.hint` field names
 * the fix (a Supabase direct host, a rejected password, a missing role, an
 * allowlist blocking the host, no connection string configured at all).
 *
 * It is public, so it never reports anything that is not already implied by
 * the deployment being up: no credentials, no account data, and only the
 * hostname of the database — never the user, password or database name.
 */
export async function GET() {
  const target = databaseTarget();
  const report: HealthReport = {
    ok: false,
    database: {
      driver: target.driver,
      connected: false,
      source: target.source,
      host: target.host,
      server: null,
      schema: null,
      hint: null,
    },
    checked: CONNECTION_STRING_VARS,
  };

  try {
    // The probe proves the connection; `ready()` proves the schema, which is
    // what sign-in actually needs. They can disagree: a connection made with a
    // role that cannot create tables succeeds here and fails on the first
    // sign-in, so the report distinguishes the two.
    const info = await withTimeout(databaseInfo(), PROBE_TIMEOUT_MS);
    report.database.connected = true;
    report.database.driver = info.driver;
    report.database.source = info.source;
    report.database.host = info.host;
    report.database.server = info.version?.split(" ").slice(0, 2).join(" ") ?? null;

    await withTimeout(ready(), PROBE_TIMEOUT_MS);
    report.database.schema = true;
    report.ok = true;
  } catch (error) {
    if (!report.database.connected) {
      report.database.connected = false;
      report.database.schema = null;
    } else {
      report.database.schema = false;
    }
    report.database.hint = connectionHint(error);
    report.error = error instanceof Error ? error.message : String(error);
    if (!report.database.hint) {
      report.database.hint =
        target.driver === "embedded"
          ? "No PostgreSQL connection string is configured, so the app fell back to its embedded database. " +
            "Set one of the variables in `checked` in the host's environment variables and redeploy."
          : "The database could not be reached and the error did not match a known cause. Read the " +
            "`[codemasterghana] database connection failed …` line in the host's logs.";
    }
    console.error("[codemasterghana] health check failed", error);
  }

  return NextResponse.json(report, {
    status: report.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
