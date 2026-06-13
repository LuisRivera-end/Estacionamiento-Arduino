import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained .next/standalone build so the Docker image can run
  // `node server.js` without shipping the full node_modules. Compatible with
  // `next start` on Render (the cloud deploy is unaffected).
  output: "standalone",
};

export default nextConfig;
