import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `output: "export"` — deploying to Vercel; keep server features available.
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  // Checkpoint A only: the CRA App.tsx / Body / ScrollToTop / Header still use
  // react-router-dom (no types) and MUI v4 Hidden. These files are all deleted
  // in Checkpoint B. Remove this block in Task 19.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
