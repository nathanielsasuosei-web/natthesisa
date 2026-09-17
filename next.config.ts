import type { NextConfig } from "next";

/**
 * The member app moved to /app/* (phone-style shell). /dashboard/* URLs are
 * kept alive as redirects so old links, bookmarks and tests still land
 * somewhere sensible.
 */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/app/discover", permanent: false },
      { source: "/dashboard/matches", destination: "/app/matches", permanent: false },
      { source: "/dashboard/profile", destination: "/app/profile", permanent: false },
      { source: "/dashboard/settings", destination: "/app/settings", permanent: false },
      { source: "/dashboard/plans", destination: "/app/membership", permanent: false },
      { source: "/dashboard/membership", destination: "/app/membership", permanent: false },
      { source: "/dashboard/billing", destination: "/app/billing", permanent: false },
      { source: "/dashboard/activity", destination: "/app/timeline", permanent: false },
      { source: "/dashboard/timeline", destination: "/app/timeline", permanent: false },
      { source: "/dashboard/:path*", destination: "/app/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
