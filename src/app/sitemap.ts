import type { MetadataRoute } from "next";
import { DOCS_PAGES } from "@/lib/docs/nav";
import { absoluteUrl } from "@/lib/site";

/** Every public marketing and docs page, so search engines find them all. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...DOCS_PAGES.map((page) => ({
      url: absoluteUrl(page.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: page.href === "/docs" ? 0.9 : 0.7,
    })),
  ];
}
