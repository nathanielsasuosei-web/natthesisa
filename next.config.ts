import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Arena's live preview is served from an e2b.app subdomain.
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
