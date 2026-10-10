import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, TriangleAlert } from "lucide-react";
import { DOCS_PAGES } from "@/lib/docs/nav";
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
  /** One short line under the intro, e.g. requirements. */
  meta?: ReactNode;
  toc?: TocItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex gap-12">
      <article className="min-w-0 max-w-3xl flex-1">
        <header className="space-y-3 border-b border-border pb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">{intro}</p>
          {meta && <p className="text-muted-foreground text-sm">{meta}</p>}
        </header>
        <div className="space-y-12 pt-10">{children}</div>
        <PrevNext path={path} />
      </article>
      {toc && toc.length > 0 && (
        <aside className="hidden w-48 shrink-0 xl:block">
          <div className="sticky top-20 space-y-2 text-sm">
            <p className="text-xs font-semibold">On this page</p>
            <ul className="space-y-1.5">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-muted-foreground hover:text-foreground block leading-snug transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="group text-xl font-semibold tracking-tight">
        <a href={`#${id}`} className="hover:underline hover:decoration-border hover:underline-offset-4">
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-foreground/85 leading-7">{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
  return (
    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em] break-words">
      {children}
    </code>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-foreground font-medium underline underline-offset-4 decoration-border hover:decoration-foreground">
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
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm leading-6",
        tone === "warning"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-muted/50"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "warning" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        )}
      />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-foreground/85">{children}</div>
      </div>
    </div>
  );
}

/** Numbered steps with a thin line connecting them. */
export function Steps({ children }: { children: ReactNode }) {
  return <ol className="space-y-8 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="relative pl-10 [counter-increment:step] before:absolute before:top-0 before:left-0 before:flex before:size-7 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-card before:text-xs before:font-semibold before:content-[counter(step)] after:absolute after:top-9 after:bottom-[-1.5rem] after:left-3.5 after:w-px after:bg-border last:after:hidden">
      <h3 className="pt-0.5 font-semibold">{title}</h3>
      <div className="mt-3 space-y-4">{children}</div>
    </li>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border align-top">
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
    <nav className="mt-16 grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="hover:border-foreground/30 rounded-lg border border-border p-4 transition-colors"
        >
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <ArrowLeft className="size-3" /> Previous
          </span>
          <span className="mt-1 block font-medium">{prev.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          href={next.href}
          className="hover:border-foreground/30 rounded-lg border border-border p-4 text-right transition-colors"
        >
          <span className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
            Next <ArrowRight className="size-3" />
          </span>
          <span className="mt-1 block font-medium">{next.label}</span>
        </Link>
      )}
    </nav>
  );
}
