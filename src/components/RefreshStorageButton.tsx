"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshStorageButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="mt-2 inline-flex items-center rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-amber-900 transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Checking storage…" : "Check again"}
    </button>
  );
}
