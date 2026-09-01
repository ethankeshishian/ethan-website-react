import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `output: "export"` — deploying to Vercel; keep server features available.
  reactStrictMode: true,
};

export default nextConfig;
