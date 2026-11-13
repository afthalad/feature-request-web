import type { Metadata } from "next";
import { V2Footer, V2Nav } from "@/components/landing-v2/Chrome";
import { V2_HOME } from "@/components/landing-v2/links";
import { jakarta } from "@/components/landing-v2/fonts";
import { DocsMobileNav, DocsSidebar } from "@/components/docs-v2/Sidebar";
import "@/components/landing-v2/v2.css";

/*
 * Preview of the docs in the home-v2 design. The live docs at /docs are
 * untouched; the pages here are copies of them that import docs-v2 components.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: `${V2_HOME}#how`, label: "How it works" },
  { href: `${V2_HOME}#board`, label: "The board" },
  { href: `${V2_HOME}#pricing`, label: "Pricing" },
  { href: "/docs-preview", label: "Docs" },
];

export default function DocsV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.variable} v2-root v2-docs flex flex-1 flex-col overflow-x-clip`}>
      <V2Nav links={LINKS} sticky />
      <div className="flex-1 px-4 sm:px-8">
        <div className="mx-auto grid w-full max-w-6xl lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <DocsSidebar />
          <div className="min-w-0">
            <DocsMobileNav />
            <div className="pt-10 pb-24 lg:pt-14">{children}</div>
          </div>
        </div>
      </div>
      <V2Footer />
    </div>
  );
}
