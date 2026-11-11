import { DOCS_NAV } from "@/lib/docs/nav";

/**
 * The new-design docs live at /docs-v2 and reuse the same page list as /docs.
 * Every internal docs link goes through toV2 so readers stay in the new design.
 */
export const DOCS_HOME = "/docs-v2";

export function toV2(href: string) {
  if (href === "/docs" || href.startsWith("/docs/") || href.startsWith("/docs#")) {
    return DOCS_HOME + href.slice("/docs".length);
  }
  return href;
}

export const DOCS_V2_NAV = DOCS_NAV.map((group) => ({
  title: group.title,
  items: group.items.map((item) => ({ ...item, href: toV2(item.href) })),
}));

export const DOCS_V2_PAGES = DOCS_V2_NAV.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.title })),
);
