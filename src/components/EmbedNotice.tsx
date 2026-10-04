"use client";

import { useEffect, useState } from "react";

/**
 * Shown only when the app is running inside a frame (the Arena live preview).
 *
 * The session cookie is written as `SameSite=None; Secure` so an embedded frame
 * can use it, but some browsers block third-party cookies outright — and then no
 * cookie setting can help. Opening the app in its own tab makes the cookie
 * first-party, which always works, so this tells the learner that instead of
 * leaving them in a sign-in loop.
 */
export default function EmbedNotice() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (window.self === window.top) return;
    } catch {
      // Accessing window.top can throw for a sandboxed frame; treat it as embedded.
    }
    setHref(window.location.href);
  }, []);

  if (!href) return null;

  return (
    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] leading-5 text-amber-900">
      You are viewing this inside a preview frame. Some browsers block the sign-in cookie there, which sends you
      back to this page. If that happens,{" "}
      <a href={href} target="_blank" rel="noreferrer" className="font-extrabold underline">
        open the app in its own tab
      </a>{" "}
      and sign in there.
    </p>
  );
}
