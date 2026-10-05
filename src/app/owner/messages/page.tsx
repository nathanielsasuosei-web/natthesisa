import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOwner } from "@/lib/session";
import { allMessages } from "@/lib/messages";
import OwnerMessages from "@/components/OwnerMessages";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Messages · Teacher console" };

export const dynamic = "force-dynamic";

export default async function OwnerMessagesPage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/owner-sign-in");

  const messages = await allMessages();
  const open = messages.filter((message) => !message.answered).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">Teacher console</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Messages</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#756f7b]">
            Everything sent through the contact page. {open === 0 ? "Nothing is waiting." : `${open} still need${open === 1 ? "s" : ""} an answer.`}
          </p>
        </div>
        <Link href="/owner" className="inline-flex items-center gap-2 rounded-xl border border-[#dad5df] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-[#4a4450] transition hover:bg-[#f4f2f6]">
          <Icon name="arrow-left" size={14} /> Back to the console
        </Link>
      </header>

      <OwnerMessages initialMessages={messages} />

      <p className="text-[11px] leading-5 text-[#918a97]">
        Messages live in the platform database, not in a third-party form service. Replying happens by email — the
        &ldquo;Reply by email&rdquo; button opens your mail client with the sender&apos;s address and subject filled in. The
        public page that collects them is <Link href="/contact" className="font-bold text-[#5e3de0] underline">/contact</Link>.
      </p>
    </div>
  );
}
