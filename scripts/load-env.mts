/**
 * Loads `.env.local` / `.env` for scripts run outside Next.
 *
 * `next dev` reads these files itself, but `tsx scripts/...` does not, so a
 * script that checks configuration would otherwise report everything as
 * missing. Real environment variables always win, so `DATABASE_URL=... npm run
 * db:check` still overrides the file.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function loadEnv(files: string[] = [".env.local", ".env"]): string[] {
  const loaded: string[] = [];
  for (const name of files) {
    const file = path.join(process.cwd(), name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const key = match[1];
      if (process.env[key] !== undefined) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
    loaded.push(name);
  }
  return loaded;
}

/** Prints a secret without revealing it: prefix, length, nothing usable. */
export function mask(value: string | undefined, keep = 10): string {
  if (!value) return "(unset)";
  return `${value.slice(0, keep)}… (${value.length} chars)`;
}
