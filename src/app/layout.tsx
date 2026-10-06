import type { Metadata, Viewport } from "next";
import { site, siteUrl } from "@/config/site";
import { brandAssets } from "@/config/branding";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: ["coding courses", "web development", "app development", "computer science", "learn programming"],
  // The favicon, the touch icon and the PNG app icons are file conventions in
  // this folder (`favicon.ico`, `icon.png`, `apple-icon.png`), generated from
  // the owner's artwork — see `src/config/branding.ts`.
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [{ url: brandAssets.social, width: 1200, height: 630, alt: `${site.name} — ${site.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [brandAssets.social],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17151f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
