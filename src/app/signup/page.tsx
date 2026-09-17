import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { MIN_AGE, profileCompleteness } from "@/lib/profile";
import { site } from "@/config/site";
import SignupForm from "@/components/SignupForm";
import PhoneFrame from "@/components/PhoneFrame";

export const metadata = { title: "Join" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(profileCompleteness(user.profile).done ? "/app/discover" : "/onboarding");

  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - MIN_AGE);
  const maxBirthDate = d.toISOString().slice(0, 10);

  return (
    <PhoneFrame
      joinHref={null}
      footer={
        <>
          You must be {MIN_AGE} or older. We only ask for what a profile needs — no phone number, no ID, and
          this demo never sends email.
        </>
      }
    >
      <div className="px-5 pb-8 pt-8">
        <span aria-hidden className="animate-float grid size-14 place-items-center rounded-3xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-2xl shadow-lg shadow-rose-900/40">
          ✨
        </span>
        <h1 className="mt-5 text-[30px] font-bold leading-[1.1] tracking-tight">
          Create your
          <br />
          account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Two minutes to a real profile. Start on Free — {site.currency.symbol}0 — and upgrade only when you want
          more matches.
        </p>
        <div className="mt-7">
          <SignupForm maxBirthDate={maxBirthDate} />
        </div>
      </div>
    </PhoneFrame>
  );
}
