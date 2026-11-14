import type { NextConfig } from "next";

const POSTHOG_REGION = process.env.NEXT_PUBLIC_POSTHOG_REGION === "eu" ? "eu" : "us";

const nextConfig: NextConfig = {
  // PostHog's API paths end in a slash; redirecting them would break event uploads.
  skipTrailingSlashRedirect: true,
  // Proxies PostHog through this domain (see src/instrumentation-client.ts).
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `https://${POSTHOG_REGION}-assets.i.posthog.com/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `https://${POSTHOG_REGION}.i.posthog.com/:path*`,
      },
    ];
  },
  // Dynamic pages (the home page reads the session cookie) otherwise stream
  // <title>/<meta description> into the <body> for regular browsers. Always put
  // them in the <head>, where every crawler and audit tool expects them.
  htmlLimitedBots: /.*/,
  // Home page and docs redesigns were previewed at these paths before they
  // went live; keep any shared preview links working.
  async redirects() {
    return [
      { source: "/landing", destination: "/", permanent: true },
      { source: "/home-v2", destination: "/", permanent: true },
      { source: "/docs-v2", destination: "/docs", permanent: true },
      { source: "/docs-v2/:path*", destination: "/docs/:path*", permanent: true },
      { source: "/docs-preview", destination: "/docs", permanent: true },
      { source: "/docs-preview/:path*", destination: "/docs/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
