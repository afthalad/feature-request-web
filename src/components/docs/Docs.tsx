import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, TriangleAlert } from "lucide-react";
import { DOCS_NAV, DOCS_PAGES } from "@/lib/docs/nav";
import { OnThisPage } from "@/components/docs/OnThisPage";
import { DocsBreadcrumbs } from "@/components/seo/StructuredData";
import { cn } from "@/lib/utils";

/* Small building blocks so every docs page has the same rhythm. */

export interface TocItem {
  id: string;
  label: string;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs font-medium tracking-[0.18em] text-[var(--v2-orange)] uppercase", className)}>
      {children}
    </p>
  );
}

export function DocsPage({
  path,
  title,
  intro,
  meta,
  toc,
  children,
}: {
  /** This page's route, used for the previous/next links. */
  path: string;
  title: string;
  intro: ReactNode;
  meta?: ReactNode;
  toc?: TocItem[];
  children: ReactNode;
}) {
  const group = DOCS_NAV.find((g) => g.items.some((item) => item.href === path))?.title ?? "Docs";

  return (
    <div className="flex gap-14">
      <DocsBreadcrumbs path={path} title={title} />
      <article className="min-w-0 max-w-3xl flex-1">
        <header className="pb-12">
          <Eyebrow>{group}</Eyebrow>
          <h1 className="mt-3 text-[clamp(2.4rem,5vw,3.5rem)] leading-[1.03] font-extrabold tracking-[-0.045em] text-balance">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--v2-fg-2)]">{intro}</p>
          {meta && (
            <p className="mt-5 inline-flex rounded-full bg-[var(--v2-chip)] px-3.5 py-1.5 font-mono text-xs text-[var(--v2-fg-2)]">
              {meta}
            </p>
          )}
        </header>
        <div className="space-y-16">{children}</div>
        <PrevNext path={path} />
      </article>
      {toc && toc.length > 0 && (
        <aside className="hidden w-52 shrink-0 xl:block">
          <OnThisPage items={toc} />
        </aside>
      )}
    </div>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <h2 className="group text-2xl font-extrabold tracking-[-0.035em] sm:text-[1.85rem]">
        <a href={`#${id}`} className="inline-flex items-baseline gap-2">
          {title}
          <span aria-hidden className="font-mono text-base text-[var(--v2-orange)] opacity-0 transition-opacity group-hover:opacity-100">
            #
          </span>
        </a>
      </h2>
      {children}
    </section>
  );
}

export function Sub({ children }: { children: ReactNode }) {
  return <h3 className="pt-4 text-lg font-bold tracking-[-0.02em]">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-7 text-[var(--v2-fg-2)]">{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-[var(--v2-chip)] px-1.5 py-0.5 font-mono text-[0.84em] break-words text-[var(--v2-fg)]">
      {children}
    </code>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-[var(--v2-fg)] underline decoration-[var(--v2-orange)]/50 underline-offset-4 transition-colors hover:text-[var(--v2-orange)] hover:decoration-[var(--v2-orange)]"
    >
      {children}
    </Link>
  );
}

export function Note({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning";
  title?: string;
  children: ReactNode;
}) {
  const warn = tone === "warning";
  const Icon = warn ? TriangleAlert : Info;
  return (
    <div
      className={cn(
        "flex gap-3.5 rounded-2xl p-5 text-sm leading-6",
        warn ? "bg-amber-500/10" : "bg-[var(--v2-orange-wash)]",
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full text-white",
          warn ? "bg-amber-500" : "bg-[var(--v2-orange)]",
        )}
      >
        <Icon className="size-3.5" strokeWidth={2.5} />
      </span>
      <div className="space-y-1 pt-0.5">
        {title && <p className="font-bold">{title}</p>}
        <div className="text-[var(--v2-fg-2)]">{children}</div>
      </div>
    </div>
  );
}

/** Numbered steps: orange numbers on a quiet rail. */
export function Steps({ children }: { children: ReactNode }) {
  return <ol className="space-y-10 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <li className="relative pl-12 [counter-increment:step] before:absolute before:top-0 before:left-0 before:flex before:size-8 before:items-center before:justify-center before:rounded-full before:bg-[var(--v2-orange)] before:font-mono before:text-xs before:font-bold before:text-white before:content-[counter(step)] after:absolute after:top-11 after:bottom-[-2rem] after:left-4 after:w-px after:bg-[var(--v2-line)] last:after:hidden">
      {title && <h3 className="pt-1 text-lg font-bold tracking-[-0.02em]">{title}</h3>}
      <div className={cn("space-y-4", title && "mt-3")}>{children}</div>
    </li>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-[var(--v2-card)] shadow-[var(--v2-shadow)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-[var(--v2-chip)]">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-mono text-xs font-medium tracking-[0.12em] whitespace-nowrap text-[var(--v2-fg-3)] uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--v2-line)]">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td key={j} className={cn("px-4 py-3 leading-6 text-[var(--v2-fg-2)]", j === 0 && "whitespace-nowrap text-[var(--v2-fg)]")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrevNext({ path }: { path: string }) {
  const index = DOCS_PAGES.findIndex((page) => page.href === path);
  const prev = index > 0 ? DOCS_PAGES[index - 1] : null;
  const next = index >= 0 && index < DOCS_PAGES.length - 1 ? DOCS_PAGES[index + 1] : null;
  const card =
    "group rounded-2xl bg-[var(--v2-card)] p-5 shadow-[var(--v2-shadow)] transition-transform duration-300 hover:-translate-y-0.5";

  return (
    <nav aria-label="Previous and next page" className="mt-20 grid gap-4 sm:grid-cols-2">
      {prev ? (
        <Link href={prev.href} className={card}>
          <span className="flex items-center gap-1.5 font-mono text-xs tracking-[0.14em] text-[var(--v2-fg-3)] uppercase">
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" /> Previous
          </span>
          <span className="mt-1.5 block text-lg font-bold tracking-[-0.02em]">{prev.label}</span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link href={next.href} className={cn(card, "text-right")}>
          <span className="flex items-center justify-end gap-1.5 font-mono text-xs tracking-[0.14em] text-[var(--v2-fg-3)] uppercase">
            Next <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1.5 block text-lg font-bold tracking-[-0.02em]">{next.label}</span>
        </Link>
      )}
    </nav>
  );
}
