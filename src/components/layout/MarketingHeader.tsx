import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export function MarketingHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-1">
          <Link href="/docs" className="text-muted-foreground px-3 text-sm hover:text-foreground">
            Docs
          </Link>
          <Link href="/pricing" className="text-muted-foreground px-3 text-sm hover:text-foreground">
            Pricing
          </Link>
          <Link href="/login" className="text-muted-foreground px-3 text-sm hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
