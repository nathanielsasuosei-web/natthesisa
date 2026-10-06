import { initials } from "@/lib/format";

interface Props {
  /** The public name, used for the alt text and the initials fallback. */
  name: string;
  /** `/api/account/avatar…`, or null when this account has no picture. */
  src?: string | null;
  className?: string;
}

/**
 * One account's picture, or their initials when there is none.
 *
 * Rendered inside a sized, rounded box the caller styles (the header uses a
 * circle, the account page a rounded square), so the shape lives with the
 * layout and this stays a two-line decision. Plain `<img>` on purpose: the
 * picture is served by an access-checked route, and Next's image optimizer
 * fetches it *without* the viewer's session cookie, which would answer 401.
 */
export default function AvatarImage({ name, src, className = "size-full object-cover" }: Props) {
  if (!src) return <>{initials(name)}</>;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt={`${name}’s profile picture`} loading="lazy" decoding="async" className={className} />
  );
}
