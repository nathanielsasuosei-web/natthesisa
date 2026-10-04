import { hydrateState } from "./app-state";
import { databaseInfo, ensureSchema } from "./db";
import { createOwnerAccount, ownerAccount, saveUser } from "./store";

/**
 * First-run setup, in one place.
 *
 * Keeping this out of `db.ts` matters: `store.ts` imports `db.ts`, so a
 * dynamic import of the store from inside the database module creates a
 * circular dependency that deadlocks the bundler's module graph. Here the
 * dependency runs one way only: bootstrap -> (db, store).
 *
 * Everything is cached per process, so calling `ensureReady()` from a request
 * costs nothing after the first call.
 */

const g = globalThis as unknown as { __codaraReady?: Promise<void> };

async function setup(): Promise<void> {
  await ensureSchema();
  // Published lessons and branding are read synchronously from a cache that has
  // to be filled from the database first.
  await hydrateState();

  const existing = await ownerAccount();
  if (existing) {
    // Keep the configured display name in step with the environment. Only the
    // name is touched here — never the password, which belongs to the account.
    const preferred = process.env.OWNER_NAME?.trim().slice(0, 60);
    if (preferred && preferred !== existing.name) {
      existing.name = preferred;
      await saveUser(existing);
      console.info(`[codemasterghana] Owner display name set to ${preferred} from OWNER_NAME`);
    }
    return;
  }

  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[codemasterghana] No owner account exists yet. Set OWNER_EMAIL and OWNER_PASSWORD and restart to create one."
    );
    return;
  }

  await createOwnerAccount(email, password, process.env.OWNER_NAME);
  console.info(`[codemasterghana] Owner account created for ${email}`);
}

export async function ensureReady(): Promise<void> {
  if (!g.__codaraReady) {
    g.__codaraReady = setup().catch((error) => {
      g.__codaraReady = undefined;
      throw error;
    });
  }
  return g.__codaraReady;
}

/** Used by `npm run db:check` to report the connection the app would use. */
export async function reportDatabase(): Promise<{ driver: string; version: string | null; owner: string | null }> {
  await ensureReady();
  const info = await databaseInfo();
  const owner = await ownerAccount();
  return { driver: info.driver, version: info.version, owner: owner?.email ?? null };
}
