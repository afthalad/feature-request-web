"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { cn } from "@/lib/utils";

export interface SdkPillPlatform {
  id: string;
  name: string;
  iconPath: string;
  /** Leave out to use the text colour (for brands whose colour is black). */
  iconColor?: string;
  href?: string;
}

/**
 * The hero's "6 SDKs, one board" pill. Hovering it, focusing it or pressing it opens a small
 * panel that lists every platform, each linking to its guide.
 */
export function SdkPill({
  platforms,
  soon = [],
  className,
  style,
}: {
  platforms: SdkPillPlatform[];
  soon?: string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  // Hover opens it for a mouse; a press pins it open, which is what touch and keyboard use.
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setHovered(false);
      setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className={cn("relative z-20", className)}
      style={style}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setPinned((v) => !v)}
        className="flex cursor-pointer items-center gap-2.5 rounded-full bg-[var(--v2-card)] py-1.5 pr-3 pl-1.5 text-sm text-[var(--v2-fg-2)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-orange)]"
      >
        <span className="flex -space-x-1.5">
          {platforms.slice(0, 4).map((p) => (
            <span
              key={p.id}
              className="grid size-6 place-items-center rounded-full border border-[var(--v2-bg)] bg-[var(--v2-tile)] shadow-sm"
            >
              <BrandIcon path={p.iconPath} color={p.iconColor} className="size-3" />
            </span>
          ))}
        </span>
        <span>
          <b className="font-bold text-[var(--v2-fg)]">{platforms.length} SDKs</b>, one board
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 text-[var(--v2-fg-3)] transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* The top padding keeps the pointer inside the wrapper on its way from the pill to the panel. */}
      <div
        id={panelId}
        className={cn(
          "absolute top-full left-1/2 w-[min(21rem,calc(100vw-2rem))] -translate-x-1/2 pt-2.5 transition-[opacity,translate,visibility] duration-200 motion-reduce:transition-none",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
        )}
      >
        <div className="rounded-2xl border border-[var(--v2-line)] bg-[var(--v2-raised)] p-2 text-left shadow-[var(--v2-shadow)]">
          <ul className="grid grid-cols-2 gap-1">
            {platforms.map((p) => (
              <li key={p.id}>
                <Link
                  href={p.href ?? "/docs"}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-semibold text-[var(--v2-fg)] outline-none transition-colors hover:bg-[var(--v2-chip)] focus-visible:bg-[var(--v2-chip)]"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[var(--v2-line)] bg-[var(--v2-tile)] shadow-sm">
                    <BrandIcon path={p.iconPath} color={p.iconColor} className="size-3.5" />
                  </span>
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
          {soon.length > 0 && (
            <p className="mt-1 border-t border-[var(--v2-line)] px-2 pt-2.5 pb-1 text-xs text-[var(--v2-fg-3)]">
              <span className="mr-1.5 font-bold tracking-wide text-[var(--v2-orange)] uppercase">Soon</span>
              {soon.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
