"use client";

import { useAuthWindow } from "./AuthWindow";

/**
 * Opens the teacher sign-in in the sign-in window. It never navigates away:
 * the teacher signs in inside the window, the same way a student does.
 */
export default function TeacherWindowLink({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const { open } = useAuthWindow();
  return (
    <button type="button" onClick={() => open("teacher")} className={className}>
      {children}
    </button>
  );
}
