/** One place for the facts search engines and link previews read about the site. */

// The canonical address. fewchurs.com redirects here, so every canonical URL,
// sitemap entry and share link uses the www host.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fewchurs.com").replace(/\/$/, "");

export const SITE_NAME = "Fewchurs";

export const SITE_TAGLINE = "Feature request SDK for iOS, Android and web apps";

export const SITE_DESCRIPTION =
  "Add a feature request board to your app. Users suggest and vote on ideas, you ship what they want most. SDKs for SwiftUI, Kotlin, Flutter, React, Next.js and Laravel.";

/** Official package and source pages, used as the organization's "sameAs" links. */
export const SITE_PROFILES = [
  "https://github.com/fewchurs/fewchurs-swift",
  "https://github.com/fewchurs/fewchurs-kotlin",
  "https://github.com/fewchurs/fewchurs-laravel",
  "https://pub.dev/packages/fewchurs",
  "https://www.npmjs.com/package/@fewchurs/react",
  "https://www.npmjs.com/package/@fewchurs/next",
];

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Title, description, canonical URL and link-preview tags for one page.
 * A page that sets its own `openGraph` replaces the layout's (share image
 * included), so build it here every time, pointing at the share image of
 * its section: the docs card for /docs pages, the home card for the rest.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }) {
  const image = path === "/docs" || path.startsWith("/docs/") ? "/docs/opengraph-image" : "/opengraph-image";
  const images = [{ url: image, width: 1200, height: 630, alt: `${title} | ${SITE_NAME}` }];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      url: path,
      title: `${title} | ${SITE_NAME}`,
      description,
      images,
    },
    twitter: { card: "summary_large_image" as const, title: `${title} | ${SITE_NAME}`, description, images },
  };
}
