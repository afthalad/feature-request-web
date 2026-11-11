import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic pages (the home page reads the session cookie) otherwise stream
  // <title>/<meta description> into the <body> for regular browsers. Always put
  // them in the <head>, where every crawler and audit tool expects them.
  htmlLimitedBots: /.*/,
  // The new home page and docs were previewed at /landing and /docs-v2 before
  // they went live; keep any shared preview links working.
  async redirects() {
    return [
      { source: "/landing", destination: "/", permanent: true },
      { source: "/docs-v2", destination: "/docs", permanent: true },
      { source: "/docs-v2/:path*", destination: "/docs/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
