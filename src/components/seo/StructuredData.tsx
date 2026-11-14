import { absoluteUrl, SITE_NAME, SITE_PROFILES, SITE_URL } from "@/lib/site";

/**
 * schema.org data that tells search engines what Fewchurs is: the site's
 * name (shown above the result) and the organization with its logo. Only
 * facts that are true on the site go here.
 *
 * There's deliberately no SoftwareApplication block: Google only accepts one
 * with a real aggregateRating or reviews, and reports it as invalid without.
 * Add it back once Fewchurs has genuine ratings to point to.
 */

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so the JSON can never close the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

export function HomeStructuredData() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": ORG_ID,
            name: SITE_NAME,
            url: absoluteUrl("/"),
            logo: { "@type": "ImageObject", url: absoluteUrl("/apple-icon.png") },
            sameAs: SITE_PROFILES,
          },
          {
            "@type": "WebSite",
            "@id": SITE_ID,
            name: SITE_NAME,
            alternateName: ["fewchurs.com", "Fewchurs feature request SDK"],
            url: absoluteUrl("/"),
            publisher: { "@id": ORG_ID },
          },
        ],
      }}
    />
  );
}

/** "Fewchurs › Docs › Flutter SDK" style breadcrumbs for a docs page. */
export function DocsBreadcrumbs({ path, title }: { path: string; title: string }) {
  const items = [
    { name: SITE_NAME, url: absoluteUrl("/") },
    { name: "Docs", url: absoluteUrl("/docs") },
    ...(path === "/docs" ? [] : [{ name: title, url: absoluteUrl(path) }]),
  ];
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/** Breadcrumbs for any page, e.g. Fewchurs › Compare › Canny. */
export function BreadcrumbStructuredData({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      }}
    />
  );
}

/** The questions and answers shown on the page, as an FAQPage. */
export function FaqStructuredData({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }}
    />
  );
}
