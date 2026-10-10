import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { DocsMobileNav, DocsSidebar } from "@/components/docs/DocsSidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-12 px-5 pt-10 pb-24 lg:pt-14">
        <DocsSidebar />
        <div className="min-w-0 flex-1">
          <DocsMobileNav />
          {children}
        </div>
      </div>
    </>
  );
}
