import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Arena's live preview is served from an e2b.app subdomain.
  allowedDevOrigins: ["*.e2b.app"],
  // Keep the database drivers out of the bundler: `pg` is a normal Node
  // package, and PGlite (the embedded PostgreSQL used when DATABASE_URL is not
  // set) ships its own WebAssembly runtime.
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
};

export default nextConfig;
