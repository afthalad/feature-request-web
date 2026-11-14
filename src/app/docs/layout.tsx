import { SiteFooter, SiteNav } from "@/components/landing-v2/Chrome";
import { jakarta } from "@/components/landing-v2/fonts";
import { DocsMobileNav, DocsSidebar } from "@/components/docs/DocsSidebar";
import "@/components/landing-v2/v2.css";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#board", label: "The board" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.variable} v2-root v2-docs flex flex-1 flex-col overflow-x-clip`}>
      <SiteNav links={LINKS} sticky />
      <div className="flex-1 px-4 sm:px-8">
        <div className="mx-auto grid w-full max-w-6xl lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <DocsSidebar />
          <div className="min-w-0">
            <DocsMobileNav />
            <div className="pt-10 pb-24 lg:pt-14">{children}</div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
