"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import AuthForm from "./AuthForm";
import Icon from "./Icon";

/**
 * The sign-in window: the sign-in form opened over the page you are on.
 *
 * Opening it is instant and keeps your place; closing it (Escape, the close
 * button, or a click on the backdrop) plays the exit before unmounting. The
 * same AuthForm runs inside, so the rules, errors and motion match the full
 * /login page. Links to /login still work without JavaScript.
 */

export type AuthWindowMode = "signin" | "signup";

interface AuthWindowApi {
  open: (mode?: AuthWindowMode) => void;
  close: () => void;
}

interface WindowState {
  mode: AuthWindowMode;
  phase: "open" | "closing";
  /** Bumped on every open so the form starts fresh each time. */
  key: number;
}

const EXIT_MS = 260;

const AuthWindowContext = createContext<AuthWindowApi | null>(null);

/** Outside the provider, fall back to the full sign-in page instead of doing nothing. */
const fallback: AuthWindowApi = {
  open: (mode = "signin") => window.location.assign(mode === "signup" ? "/login?mode=signup" : "/login"),
  close: () => undefined,
};

export function useAuthWindow(): AuthWindowApi {
  return useContext(AuthWindowContext) ?? fallback;
}

export function AuthWindowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WindowState | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const open = useCallback((mode: AuthWindowMode = "signin") => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setState((current) => ({ mode, phase: "open", key: (current?.key ?? 0) + 1 }));
  }, []);

  const close = useCallback(() => {
    setState((current) => (current && current.phase === "open" ? { ...current, phase: "closing" } : current));
  }, []);

  // Unmount once the exit animation has played.
  useEffect(() => {
    if (state?.phase !== "closing") return;
    const timer = window.setTimeout(() => {
      setState(null);
      returnFocus.current?.focus({ preventScroll: true });
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [state?.phase]);

  // While open: Escape closes, the page behind does not scroll, focus moves into the window.
  const isOpen = state !== null;
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const field = dialog.current?.querySelector<HTMLInputElement>("input");
      (field ?? dialog.current)?.focus({ preventScroll: true });
    }, 180);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, close]);

  const api = useMemo<AuthWindowApi>(() => ({ open, close }), [open, close]);
  const closing = state?.phase === "closing";

  return (
    <AuthWindowContext.Provider value={api}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            aria-hidden
            onClick={close}
            className={`absolute inset-0 bg-[#120f18]/55 backdrop-blur-[3px] ${closing ? "auth-backdrop-out" : "auth-backdrop-in"}`}
          />
          <div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label={state.mode === "signup" ? "Create your account" : "Sign in"}
            tabIndex={-1}
            className={`relative max-h-[92vh] w-full max-w-[440px] overflow-y-auto rounded-[24px] border border-white/60 bg-white p-7 shadow-[0_30px_80px_rgba(18,15,24,.35)] outline-none sm:p-9 ${closing ? "auth-window-out" : "auth-window-in"}`}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close sign in"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-[#77717e] transition hover:rotate-90 hover:bg-[#f3f1f5] hover:text-[#211d27]"
            >
              <Icon name="close" size={16} />
            </button>
            <AuthForm key={state.key} initialMode={state.mode} />
          </div>
        </div>
      )}
    </AuthWindowContext.Provider>
  );
}
