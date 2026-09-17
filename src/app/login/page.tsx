import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { profileCompleteness } from "@/lib/profile";
import { site } from "@/config/site";
import LoginForm from "@/components/LoginForm";
import PhoneFrame from "@/components/PhoneFrame";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user)
    redirect(
      user.role === "admin"
        ? "/admin"
        : profileCompleteness(user.profile).done
          ? "/app/discover"
          : "/onboarding"
    );

  return (
    <PhoneFrame
      footer={
        <>
          Demo only · passwords hashed with scrypt, data lives in memory and resets on restart · prices in{" "}
          {site.currency.label} ({site.currency.symbol}) · no real payments
        </>
      }
    >
      <div className="px-5 pb-8 pt-8">
        <span aria-hidden className="animate-float grid size-14 place-items-center rounded-3xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-2xl shadow-lg shadow-rose-900/40">
          💘
        </span>
        <h1 className="mt-5 text-[30px] font-bold leading-[1.1] tracking-tight">
          Welcome
          <br />
          back.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Your matches, your date ideas and the profile other members swipe on — all still where you left them.
        </p>

        <div className="mt-7">
          <LoginForm
            demo={{
              member: { email: site.demo.memberEmail, password: site.demo.memberPassword },
              admin: { email: site.demo.adminEmail, password: site.demo.adminPassword },
            }}
          />
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Forgot it? There are no reset emails in this demo —{" "}
          <Link href="/signup" className="font-semibold text-rose-300">
            create a new profile
          </Link>
          .
        </p>
      </div>
    </PhoneFrame>
  );
}
