import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <Image src="/logo-mark.svg" alt="" width={24} height={24} priority className="size-6 shrink-0" />
      Fewchurs
    </Link>
  );
}
