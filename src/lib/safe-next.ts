/**
 * Where to send a student after they sign in.
 *
 * Only a path on this site is accepted (`/learn/...`, `/dashboard/...`). An
 * absolute URL or a protocol-relative `//host` would send the browser off the
 * site after login, so anything else is ignored and the default page is used.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return null;
  if (path.length > 300) return null;
  return path;
}
