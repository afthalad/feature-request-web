"use client";

import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/landing/Frame";
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
      <Eyebrow>On this page</Eyebrow>
      <ul className="space-y-0.5 border-l border-border text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1.5 pl-3.5 leading-snug transition-colors",
                active === item.id
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
