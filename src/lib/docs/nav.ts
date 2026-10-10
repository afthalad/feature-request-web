export const API_BASE_URL = `${(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.fewchurs.shop").replace(/\/$/, "")}/api/v1`;

export interface DocsNavItem {
  href: string;
  label: string;
}

export const DOCS_NAV: { title: string; items: DocsNavItem[] }[] = [
  {
    title: "Get started",
    items: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/concepts", label: "How it works" },
    ],
  },
  {
    title: "Mobile",
    items: [
      { href: "/docs/swiftui", label: "iOS (SwiftUI)" },
      { href: "/docs/kotlin", label: "Android (Kotlin)" },
      { href: "/docs/flutter", label: "Flutter" },
    ],
  },
  {
    title: "Web",
    items: [
      { href: "/docs/react", label: "React" },
      { href: "/docs/nextjs", label: "Next.js" },
      { href: "/docs/laravel", label: "Laravel" },
    ],
  },
  {
    title: "Reference",
    items: [{ href: "/docs/api", label: "REST API" }],
  },
];

export const DOCS_PAGES = DOCS_NAV.flatMap((group) => group.items);
