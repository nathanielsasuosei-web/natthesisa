"use client";

import { useState } from "react";
import Icon from "./Icon";

/**
 * One log-out button for every signed-in surface (sidebar, compact mobile
 * header, teacher console). It clears the session cookie server-side, then
 * does a full navigation — a client router push could keep serving the
 * signed-in shell from its cache.
 */

interface Props {
  /** Where to land once the session is cleared. */
  redirectTo?: string;
  /** Icon-only variant for tight layouts. */
  iconOnly?: boolean;
  iconSize?: number;
  className?: string;
}

export default function SignOutButton({ redirectTo = "/", iconOnly = false, iconSize = 16, className = "" }: Props) {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.replace(redirectTo);
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      title="Log out"
      aria-label="Log out"
      className={className}
    >
      <Icon name="logout" size={iconSize} />
      {!iconOnly && <span>{busy ? "Logging out…" : "Log out"}</span>}
    </button>
  );
}
