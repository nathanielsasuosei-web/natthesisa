import { query, queryOne } from "./db";

/**
 * Small key/value state that is not a user record: the owner's published
 * lessons and branding.
 *
 * This used to be `lessons.json` / `branding.json` on the server's disk, which
 * is the wrong place for it — on a host with an ephemeral filesystem (Vercel,
 * most container platforms) every redeploy would drop the lessons the owner
 * published. It lives in PostgreSQL now, next to the accounts.
 *
 * Reads stay synchronous because the content helpers that consume this are
 * called from render paths that are already synchronous (`contentLessons()`
 * merges published lessons into the catalog). The values are held in a
 * per-process cache, hydrated once per boot, and written through on save.
 */

const g = globalThis as unknown as {
  __codaraState?: Map<string, unknown>;
  __codaraStateHydrated?: Promise<void>;
};

function cache(): Map<string, unknown> {
  return (g.__codaraState ??= new Map());
}

/**
 * Loads every row into the cache. Called from first-run setup, which runs
 * before the first authenticated request — so any page that can read content
 * has already hydrated. Idempotent, and retried if it fails.
 */
export async function hydrateState(): Promise<void> {
  if (!g.__codaraStateHydrated) {
    g.__codaraStateHydrated = (async () => {
      const rows = await query<{ key: string; value: unknown }>("select key, value from app_state");
      const store = cache();
      for (const row of rows) store.set(row.key, row.value);
    })().catch((error) => {
      g.__codaraStateHydrated = undefined;
      throw error;
    });
  }
  return g.__codaraStateHydrated;
}

/** Synchronous read. Falls back when the key was never written. */
export function readState<T>(key: string, fallback: T): T {
  const value = cache().get(key);
  return value === undefined ? fallback : (value as T);
}

/** True once the cache holds whatever the database had at boot. */
export function stateHydrated(): boolean {
  return Boolean(g.__codaraState);
}

/** Writes through: the cache updates immediately, the database is awaited. */
export async function writeState(key: string, value: unknown): Promise<void> {
  cache().set(key, value);
  await query(
    `insert into app_state (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}

/** Reads a single key straight from the database, ignoring the cache. */
export async function readStateFresh<T>(key: string): Promise<T | null> {
  const row = await queryOne<{ value: T }>("select value from app_state where key = $1", [key]);
  return row?.value ?? null;
}
