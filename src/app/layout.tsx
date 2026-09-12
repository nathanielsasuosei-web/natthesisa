import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Natthesisa — plan work, ship faster",
  description:
    "A tidy workspace with subscription control built in: upgrade, downgrade, cancel and resume — all enforced server-side.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
