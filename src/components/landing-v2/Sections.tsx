import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pieces shared by the home and pricing pages. */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs font-medium tracking-[0.18em] text-[var(--v2-orange)] uppercase", className)}>
      {children}
    </p>
  );
}

export const FAQ = [
  { q: "Do I need a backend?", a: "No. Fewchurs is the backend. Add the SDK and you're done." },
  {
    q: "What's on the free plan?",
    a: "One app on one platform, the first 5 feature requests visible, unlimited votes and comments. Free forever.",
  },
  { q: "Can users vote without an account?", a: "Yes, anonymously by device. No login required for anyone but you." },
  { q: "Do I need to build the UI?", a: "No. The SDK renders the whole board. On Pro you can also link to a public web board." },
  { q: "Can I remove the badge?", a: 'Yes, on Starter and Pro. The "Powered by" badge only shows on Free.' },
  {
    q: "What if I have more than one app?",
    a: "Free covers 1 app on one platform. Starter covers 3 apps and Pro 5, all on every platform. Every app gets its own board and API key.",
  },
];

/** "Questions, answered." block: heading on the left, an accordion on the right. */
export function FaqSection({ items = FAQ }: { items?: { q: string; a: string }[] }) {
  return (
    <section className="px-4 pb-20 sm:px-8 sm:pb-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-4xl leading-[1.05] tracking-[-0.04em]">Questions, answered.</h2>
        </div>
        <div className="divide-y divide-[var(--v2-line)] border-y border-[var(--v2-line)]">
          {items.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="relative size-3 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-current after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-current after:transition-transform after:duration-300 group-open:after:scale-y-0"
                />
              </summary>
              <p className="pb-5 text-[var(--v2-fg-2)]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
