import type { Metadata } from "next";
import { requireCurrentUser } from "@/lib/require-user";
import CodeLab from "@/components/CodeLab";

export const metadata: Metadata = { title: "Code lab" };

export default async function CodeLabPage() {
  const user = await requireCurrentUser();
  return (
    <div>
      {user.suspended && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          Your account is paused, so this work cannot be saved to the server — anything you write in the lab still
          runs in your browser, and it is kept locally until your account is restored.
        </div>
      )}
      <CodeLab studentId={user.id} studentName={user.name} />
    </div>
  );
}
