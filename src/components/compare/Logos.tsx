import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A product's app icon on the compare pages, as a rounded square. The name is
 * always written next to it, so the image is decorative (empty alt).
 */
export function ProductIcon({ src, size = 40, className }: { src: string; size?: number; className?: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-[24%]", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** The Fewchurs mark on a tile the same size as the other icons. */
export function FewchursIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-[24%] bg-[var(--v2-raised)] shadow-[var(--v2-shadow)]", className)}
      style={{ width: size, height: size }}
    >
      <Image src="/logo-mark.svg" alt="" width={size} height={size} style={{ width: size * 0.6, height: size * 0.6 }} />
    </span>
  );
}

/** Fewchurs icon, "vs", then the other product's icon. */
export function VsLockup({ logo, size = 56 }: { logo: string; size?: number }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <FewchursIcon size={size} />
      <span className="font-mono text-xs font-medium tracking-[0.18em] text-[var(--v2-fg-3)] uppercase">vs</span>
      <ProductIcon src={logo} size={size} className="shadow-[var(--v2-shadow)]" />
    </div>
  );
}
