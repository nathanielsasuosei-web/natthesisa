import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import OwnerMediaStudio from "@/components/OwnerMediaStudio";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Studio" };

// The page reads the session cookie, so it is never prerendered.
export const dynamic = "force-dynamic";

export default async function OwnerStudioPage() {
  const user = await getCurrentUser();
  // A signed-in student is sent back to something they can use; only the
  // teacher reaches the studio.
  if (user && !isOwner(user)) redirect("/dashboard");
  if (!user) redirect("/owner-sign-in");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/owner" className="inline-flex items-center gap-2 text-xs font-bold text-[#756f7b] transition hover:text-[#332e39]">
          <Icon name="arrow-left" size={14} /> Back to the console
        </Link>
        <Link href="/owner/lessons" className="inline-flex items-center gap-2 rounded-xl border border-[#e2dee6] bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#5e5864] transition hover:bg-[#f7f5f9]">
          <Icon name="upload" size={14} /> Upload lessons
        </Link>
      </div>
      <OwnerMediaStudio />
    </div>
  );
}
