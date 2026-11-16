import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // R3F 9.7 forces WebGL context loss during Strict Mode's dev effect replay.
  // Re-enable after upgrading to a version that survives the Canvas cleanup replay.
  reactStrictMode: false,
  // The TypeScript 5.9 CLI can exit before flushing --showConfig when Next
  // captures it through a worker pipe. Use the compiler API for build checks.
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
