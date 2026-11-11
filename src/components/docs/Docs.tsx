import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, TriangleAlert } from "lucide-react";
import { Eyebrow } from "@/components/landing/Frame";
import { DOCS_NAV, DOCS_PAGES } from "@/lib/docs/nav";
import { OnThisPage } from "@/components/docs/OnThisPage";
import { DocsBreadcrumbs } from "@/components/seo/StructuredData";
import { cn } from "@/lib/utils";

/* Small building blocks so every docs page has the same rhythm. */

export interface TocItem {
  id: string;
  label: string;
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
    <div className="flex gap-12">
      <DocsBreadcrumbs path={path} title={title} />
      <article className="min-w-0 max-w-3xl flex-1">
        <header className="space-y-5 pb-10">
          <Eyebrow>{group}</Eyebrow>
          <h1 className="text-[clamp(2.4rem,5vw,3.75rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance">
            {title}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>
          {meta && (
            <p className="inline-flex rounded-md border border-dashed border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">
              {meta}
            </p>
          )}
        </header>
        <div className="space-y-14 border-t border-border pt-10">{children}</div>
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
      <h2 className="group flex items-baseline gap-2 text-2xl font-semibold tracking-[-0.035em] sm:text-[1.75rem]">
        <a href={`#${id}`} className="flex items-baseline gap-2">
          {title}
          <span
            aria-hidden
            className="font-mono text-base text-primary opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </span>
        </a>
      </h2>
      {children}
    </section>
  );
}

export function Sub({ children }: { children: ReactNode }) {
  return <h3 className="pt-4 text-lg font-semibold tracking-[-0.02em]">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-7 text-foreground/85">{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.84em] break-words">
      {children}
    </code>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
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
  const Icon = tone === "warning" ? TriangleAlert : Info;
  const warn = tone === "warning";
  return (
    <div
      className={cn(
        "relative flex gap-3 border-l-2 py-4 pr-4 pl-5 text-sm leading-6",
        warn ? "border-amber-500 bg-amber-500/[0.06]" : "border-primary bg-primary/[0.05]",
      )}
    >
      <span aria-hidden className={cn("absolute -top-[3px] -left-[4px] size-[6px]", warn ? "bg-amber-500" : "bg-primary")} />
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", warn ? "text-amber-600 dark:text-amber-400" : "text-primary")}
      />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-foreground/85">{children}</div>
      </div>
    </div>
  );
}

/** Numbered steps: mono numbers in small squares, joined by a dashed rail. */
export function Steps({ children }: { children: ReactNode }) {
  return <ol className="space-y-10 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <li className="relative pl-12 [counter-increment:step] before:absolute before:top-0 before:left-0 before:flex before:size-8 before:items-center before:justify-center before:rounded-md before:border before:border-primary/40 before:bg-primary/10 before:font-mono before:text-xs before:font-semibold before:text-primary before:content-[counter(step,decimal-leading-zero)] after:absolute after:top-10 after:bottom-[-2rem] after:left-4 after:border-l after:border-dashed after:border-border last:after:hidden">
      {title && <h3 className="pt-1 text-lg font-semibold tracking-[-0.02em]">{title}</h3>}
      <div className={cn("space-y-4", title && "mt-3")}>{children}</div>
    </li>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-mono text-[11px] font-medium tracking-[0.12em] whitespace-nowrap text-muted-foreground uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border align-top first:border-t-0">
              {row.map((cell, j) => (
                <td key={j} className={cn("px-4 py-3 leading-6", j === 0 && "whitespace-nowrap")}>
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

  return (
    <nav aria-label="Previous and next page" className="mt-20 grid border border-border sm:grid-cols-2">
      {prev ? (
        <Link href={prev.href} className="group p-5 transition-colors hover:bg-muted/50 sm:border-r sm:border-border">
          <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" /> Previous
          </span>
          <span className="mt-1.5 block text-lg font-semibold tracking-[-0.02em]">{prev.label}</span>
        </Link>
      ) : (
        <span className="hidden sm:block sm:border-r sm:border-border" />
      )}
      {next && (
        <Link
          href={next.href}
          className="group border-t border-border p-5 text-right transition-colors hover:bg-muted/50 sm:border-t-0"
        >
          <span className="flex items-center justify-end gap-1.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            Next <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1.5 block text-lg font-semibold tracking-[-0.02em]">{next.label}</span>
        </Link>
      )}
    </nav>
  );
}
