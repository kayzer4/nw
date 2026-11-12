import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // R3F 9.7 forces WebGL context loss during Strict Mode's dev effect replay.
  // Re-enable after upgrading to a version that survives the Canvas cleanup replay.
  reactStrictMode: false,
};

export default nextConfig;
