import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      module: {
        browser: "./lib/empty-node-module.ts",
      },
    },
  },
};

export default nextConfig;
