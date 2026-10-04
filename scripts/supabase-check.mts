/**
 * Checks the Supabase configuration: does the key pair work against the
 * project, and is there a bucket for lesson files?
 *
 *   npm run supabase:check
 *
 * Nothing here is required for the database — the app reaches Postgres through
 * DATABASE_URL. These checks matter for the Supabase features layered on top
 * (file storage for lesson uploads), where a wrong key is otherwise only
 * discovered when an upload fails in production.
 */
import { loadEnv, mask } from "./load-env.mts";

const loaded = loadEnv();
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
const publishable = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
const secret = (process.env.SUPABASE_SECRET_KEY ?? "").trim();

console.log(`env      : ${loaded.length ? loaded.join(", ") : "no env files found"}`);
console.log(`url      : ${url || "(unset)"}`);
console.log(`public   : ${mask(publishable)}`);
console.log(`secret   : ${mask(secret)}`);
console.log("");

if (!url) {
  console.log("The project URL is missing, so the keys cannot be used yet.");
  console.log("Supabase dashboard → Project settings → Data API → Project URL, then add to .env.local:");
  console.log("  NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co");
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url)) {
  console.log(`That does not look like a Supabase project URL (${url}).`);
  console.log("Expected something like https://abcdefghijklmnop.supabase.co");
  process.exit(1);
}

type Probe = { label: string; path: string; headers: Record<string, string>; expect: string };

const probes: Probe[] = [];
if (publishable) {
  probes.push({
    label: "publishable key / Data API",
    path: "/rest/v1/",
    headers: { apikey: publishable },
    expect: "the API description (proves the project ref and the key agree)",
  });
}
if (secret) {
  probes.push({
    label: "secret key / Storage",
    path: "/storage/v1/bucket",
    headers: { apikey: secret, Authorization: `Bearer ${secret}` },
    expect: "the list of storage buckets",
  });
}

if (!probes.length) {
  console.log("No keys are set, so there is nothing to check.");
  process.exit(1);
}

let failures = 0;
for (const probe of probes) {
  const started = Date.now();
  try {
    const response = await fetch(`${url}${probe.path}`, {
      headers: probe.headers,
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.text();
    const ms = Date.now() - started;

    if (response.ok) {
      let summary = `${response.status} in ${ms}ms`;
      if (probe.path === "/storage/v1/bucket") {
        try {
          const buckets = JSON.parse(body) as { name: string; public?: boolean }[];
          summary += buckets.length
            ? ` — buckets: ${buckets.map((b) => `${b.name}${b.public ? " (public)" : ""}`).join(", ")}`
            : " — no buckets yet (create one for lesson files)";
        } catch {
          /* leave the status line as it is */
        }
      }
      console.log(`ok    ${probe.label}: ${summary}`);
      continue;
    }

    failures += 1;
    const hint =
      response.status === 401 || response.status === 403
        ? " — the key was rejected. Check it was copied whole and belongs to this project."
        : response.status === 404
          ? " — the project was not found at this URL. Check the project ref."
          : "";
    console.log(`fail  ${probe.label}: ${response.status} in ${ms}ms${hint}`);
    console.log(`      expected ${probe.expect}`);
    console.log(`      response: ${body.slice(0, 160).replace(/\s+/g, " ")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const unreachable = /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|timeout|abort/i.test(message);
    console.log(`fail  ${probe.label}: could not reach ${url}${probe.path}`);
    console.log(`      ${message}`);
    if (unreachable) {
      console.log(
        "      This machine has no route to supabase.com. The Arena preview sandbox only reaches"
      );
      console.log(
        "      GitHub and npm, so run this check from your own machine or from the host that deploys the app."
      );
    }
    failures += 1;
  }
}

console.log("");
if (failures) {
  console.log(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All Supabase checks passed.");
