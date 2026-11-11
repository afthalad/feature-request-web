import { SiteNav, SiteFooter } from "@/components/landing/SiteChrome";
import { DocsMobileNav, DocsSidebar } from "@/components/docs/DocsSidebar";
import "@/components/landing/landing.css";

const LINKS = [
  { href: "/#install", label: "Install" },
  { href: "/#board", label: "The board" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
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
