import type { CSSProperties } from "react";

interface Props {
  /** A same-site path to land on after signing in (carried through the flow). */
  next?: string | null;
  /** Shown in each button's accessible name — the same action either way. */
  mode: "signin" | "signup";
  style?: CSSProperties;
}

const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
  { id: "apple", label: "Apple" },
] as const;

function GoogleMark() {
  // The four-colour G, in the coordinates Google's own button uses.
  return (
    <svg viewBox="0 0 18 18" aria-hidden className="size-4">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="currentColor" d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.49.96 1.39 2.1 2.94 3.6 2.88 1.44-.06 1.99-.93 3.73-.93 1.74 0 2.23.93 3.76.9 1.56-.03 2.54-1.41 3.49-2.81 1.1-1.61 1.55-3.17 1.58-3.25-.03-.02-3.03-1.16-3.06-4.58zM14.2 4.4c.8-.97 1.34-2.31 1.19-3.65-1.15.05-2.55.77-3.37 1.73-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.4-1.63z" />
    </svg>
  );
}

const MARKS = { google: GoogleMark, facebook: FacebookMark, apple: AppleMark } as const;

/**
 * "Continue with Google / Facebook / Apple".
 *
 * Plain links to `/api/auth/oauth/<provider>`: a full navigation (with
 * `target="_top"` so it also works from the embedded classroom) is what lets
 * the provider round-trip set the session cookie and land on the dashboard
 * without the form ever handling tokens itself.
 */
export default function SocialAuthButtons({ next = null, mode, style }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2.5" style={style}>
      {PROVIDERS.map((provider) => {
        const Mark = MARKS[provider.id];
        const href = `/api/auth/oauth/${provider.id}${next ? `?next=${encodeURIComponent(next)}` : ""}`;
        return (
          <a
            key={provider.id}
            href={href}
            target="_top"
            aria-label={`${mode === "signup" ? "Sign up" : "Sign in"} with ${provider.label}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dcd8e2] bg-white py-2.5 text-xs font-bold text-[#3b3542] transition duration-200 hover:-translate-y-0.5 hover:border-[#c9c2d4] hover:shadow-[0_6px_16px_rgba(31,24,45,.07)]"
          >
            <Mark />
            <span>{provider.label}</span>
          </a>
        );
      })}
    </div>
  );
}
