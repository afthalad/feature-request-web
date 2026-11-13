"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Right-hand table of contents that highlights the section you're reading. */
export function OnThisPage({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const update = () => {
      // The current section is the last one whose heading has passed the top third of the screen.
      const line = window.innerHeight * 0.3;
      let current = sections[0].id;
      for (const el of sections) {
        if (el.getBoundingClientRect().top - line <= 0) current = el.id;
      }
      // At the very bottom, the last section wins even if it's short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1].id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  return (
    <div className="sticky top-24 space-y-4">
      <p className="font-mono text-xs font-medium tracking-[0.18em] text-[var(--v2-orange)] uppercase">On this page</p>
      <ul className="space-y-0.5 text-sm">
        {items.map((item) => {
          const on = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "flex items-center gap-2.5 py-1.5 leading-snug transition-colors",
                  on ? "font-semibold text-[var(--v2-fg)]" : "text-[var(--v2-fg-3)] hover:text-[var(--v2-fg)]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full transition-colors",
                    on ? "bg-[var(--v2-orange)] shadow-[0_0_8px_var(--v2-orange)]" : "bg-[var(--v2-line-strong)]",
                  )}
                />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
