import Link from "next/link";

/**
 * Phone-shaped shell used by the auth screens (sign in, sign up, profile
 * wizard) so joining looks like the app it leads into. On a phone it is simply
 * the full screen; on a desktop the device frame appears.
 */
export default function PhoneFrame({
  children,
  brand = true,
  joinHref = "/signup",
  footer,
}: {
  children: React.ReactNode;
  brand?: boolean;
  /** pass null to hide the "Join" pill (it's the signup screen already) */
  joinHref?: string | null;
  footer?: React.ReactNode;
}) {
  return (
    <div className="app-bg flex min-h-dvh w-full justify-center lg:items-center lg:p-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#120a11] text-white lg:h-[min(880px,94vh)] lg:max-w-[430px] lg:rounded-[2.75rem] lg:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.85)] lg:ring-1 lg:ring-white/15">
        {brand && (
          <header className="glass safe-top flex shrink-0 items-center justify-between px-5 py-3">
            <Link href="/" className="press flex items-center gap-1.5 text-sm font-bold tracking-tight">
              <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-rose-500 to-fuchsia-600 text-[11px]">
                ♥
              </span>
              Sparks
            </Link>
            {joinHref && (
              <Link href={joinHref} className="press rounded-full bg-white/[0.07] px-3 py-1 text-[11px] font-semibold text-white/70 ring-1 ring-white/10">
                {joinHref === "/login" ? "Sign in" : "Join"}
              </Link>
            )}
          </header>
        )}
        <main className="no-scrollbar relative flex-1 overflow-y-auto overscroll-contain">{children}</main>
        {footer && <div className="glass shrink-0 border-t border-white/10 px-5 py-3 text-center text-[11px] leading-relaxed text-white/35">{footer}</div>}
      </div>
    </div>
  );
}
