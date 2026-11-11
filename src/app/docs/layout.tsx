import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/landing-v2/SiteChrome";
import { DocsMobileNav, DocsSidebar } from "@/components/docs-v2/DocsSidebar";
import { DOCS_HOME } from "@/components/docs-v2/nav";
import "@/components/landing-v2/landing.css";

export const metadata: Metadata = {
  // A design preview of /docs: keep it out of search results so it doesn't
  // compete with the real docs.
  robots: { index: false, follow: true },
};

const LINKS = [
  { href: "/landing#install", label: "Install" },
  { href: "/landing#board", label: "The board" },
  { href: "/landing#pricing", label: "Pricing" },
  { href: DOCS_HOME, label: "Docs" },
];

export default function DocsV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip bg-background text-foreground">
      <SiteNav links={LINKS} />
      <div className="flex-1 px-4 sm:px-6">
        <div className="lv2-rails relative mx-auto grid w-full max-w-[1200px] lg:grid-cols-[236px_minmax(0,1fr)]">
          <DocsSidebar />
          <div className="min-w-0">
            <DocsMobileNav />
            <div className="px-5 pt-10 pb-24 sm:px-10 lg:pt-14">{children}</div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
