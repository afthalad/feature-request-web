import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { pageMetadata } from "@/lib/site";
import { COMPETITORS, getCompetitor } from "@/lib/compare";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter, SiteNav } from "@/components/landing-v2/Chrome";
import { Halftone } from "@/components/landing-v2/Halftone";
import { Reveal } from "@/components/landing-v2/Reveal";
import { Eyebrow, FaqSection } from "@/components/landing-v2/Sections";
import { jakarta } from "@/components/landing-v2/fonts";
import { BreadcrumbStructuredData, FaqStructuredData } from "@/components/seo/StructuredData";
import { FewchursIcon, ProductIcon, VsLockup } from "@/components/compare/Logos";
import "@/components/landing-v2/v2.css";

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/compare", label: "Compare" },
  { href: "/docs", label: "Docs" },
];

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getCompetitor((await params).slug);
  if (!c) return {};
  return pageMetadata({ title: c.title, description: c.description, path: `/compare/${c.slug}` });
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCompetitor((await params).slug);
  if (!c) notFound();
  const others = COMPETITORS.filter((o) => o.slug !== c.slug);

  return (
    <div className={`${jakarta.variable} v2-root flex flex-1 flex-col overflow-x-clip`}>
      <BreadcrumbStructuredData
        items={[
          { name: "Fewchurs", path: "/" },
          { name: "Compare", path: "/compare" },
          { name: `Fewchurs vs ${c.name}`, path: `/compare/${c.slug}` },
        ]}
      />
      <FaqStructuredData items={c.faq} />
      <SiteNav links={NAV} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate px-4 pt-28 pb-16 sm:px-8 sm:pt-36 sm:pb-20">
          <Halftone mode="corners" className="-z-10 h-[560px]" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="v2-appear mb-8">
              <VsLockup logo={c.logo} />
            </div>
            <nav aria-label="Breadcrumb" className="v2-appear mb-5 text-sm text-[var(--v2-fg-3)]">
              <Link href="/compare" className="hover:text-[var(--v2-fg)]">
                Compare
              </Link>
              <span aria-hidden className="mx-2">
                /
              </span>
              <span className="text-[var(--v2-fg-2)]">{c.name}</span>
            </nav>
            <h1
              className="v2-appear text-[2.6rem] leading-[1.06] tracking-[-0.04em] text-balance sm:text-6xl"
              style={{ "--d": "80ms" } as React.CSSProperties}
            >
              {c.headline}
            </h1>
            <p
              className="v2-appear mx-auto mt-6 max-w-2xl text-base leading-relaxed text-balance text-[var(--v2-fg-2)] sm:text-lg"
              style={{ "--d": "160ms" } as React.CSSProperties}
            >
              {c.intro}
            </p>
          </div>

          <div
            className="v2-appear mx-auto mt-10 max-w-3xl rounded-2xl bg-[var(--v2-raised)] p-6 shadow-[var(--v2-shadow)] sm:p-8"
            style={{ "--d": "240ms" } as React.CSSProperties}
          >
            <Eyebrow>The short answer</Eyebrow>
            <p className="mt-3 text-lg leading-relaxed font-semibold text-balance sm:text-xl">{c.verdict}</p>
          </div>
        </section>

        {/* Side by side */}
        <section id="compare" className="scroll-mt-8 px-4 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-5xl">
            <Reveal className="text-center">
              <Eyebrow>Side by side</Eyebrow>
              <h2 className="mt-3 text-4xl leading-[1.05] tracking-[-0.04em] text-balance sm:text-5xl">
                Fewchurs and {c.name}, point by point.
              </h2>
            </Reveal>

            <Reveal className="mt-10">
              {/* Table from md up */}
              <div className="hidden overflow-hidden rounded-2xl bg-[var(--v2-card)] shadow-[var(--v2-shadow)] md:block">
                <table className="w-full table-fixed text-left text-sm">
                  <thead>
                    <tr className="bg-[var(--v2-chip)]">
                      <th scope="col" className="w-[24%] px-6 py-4">
                        <span className="sr-only">Feature</span>
                      </th>
                      <th scope="col" className="bg-[var(--v2-orange)]/10 px-5 py-4 text-base font-bold text-[var(--v2-orange)]">
                        <span className="flex items-center gap-2.5">
                          <FewchursIcon size={26} />
                          Fewchurs
                        </span>
                      </th>
                      <th scope="col" className="px-5 py-4 text-base font-bold">
                        <span className="flex items-center gap-2.5">
                          <ProductIcon src={c.logo} size={26} />
                          {c.name}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--v2-line)]">
                    {c.rows.map((row) => (
                      <tr key={row.label} className="align-top">
                        <th scope="row" className="px-6 py-4 font-semibold">
                          {row.label}
                        </th>
                        <td className="bg-[var(--v2-orange)]/[0.05] px-5 py-4 leading-relaxed">{row.fewchurs}</td>
                        <td className="px-5 py-4 leading-relaxed text-[var(--v2-fg-2)]">{row.them}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Stacked cards on phones */}
              <dl className="space-y-3 md:hidden">
                {c.rows.map((row) => (
                  <div key={row.label} className="rounded-2xl bg-[var(--v2-card)] p-5 shadow-[var(--v2-shadow)]">
                    <dt className="font-bold">{row.label}</dt>
                    <dd className="mt-3 space-y-3 text-sm leading-relaxed">
                      <p>
                        <span className="mb-1 flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-[var(--v2-orange)] uppercase">
                          <FewchursIcon size={18} className="shadow-none" />
                          Fewchurs
                        </span>
                        {row.fewchurs}
                      </p>
                      <p className="text-[var(--v2-fg-2)]">
                        <span className="mb-1 flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-[var(--v2-fg-3)] uppercase">
                          <ProductIcon src={c.logo} size={18} />
                          {c.name}
                        </span>
                        {row.them}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 text-center text-xs leading-relaxed text-[var(--v2-fg-3)]">
                {c.name} details come from its own pages, checked {c.checked}:{" "}
                {c.sources.map((s, i) => (
                  <span key={s.href}>
                    {i > 0 && ", "}
                    <a href={s.href} rel="nofollow noopener" target="_blank" className="underline underline-offset-2 hover:text-[var(--v2-fg)]">
                      {s.label}
                    </a>
                  </span>
                ))}
                . Prices can change, so check before you buy.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Which to pick */}
        <section className="px-4 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            <Reveal className="rounded-2xl bg-[var(--v2-card)] p-6 shadow-[var(--v2-shadow)] sm:p-8">
              <h2 className="flex items-center gap-3 text-2xl tracking-[-0.03em]">
                <ProductIcon src={c.logo} size={32} />
                Pick {c.name} if
              </h2>
              <ul className="mt-5 space-y-3 text-[var(--v2-fg-2)]">
                {c.chooseThem.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-[var(--v2-fg-3)]" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="rounded-2xl bg-[var(--v2-orange-wash)] p-6 shadow-[var(--v2-shadow)] sm:p-8">
              <h2 className="flex items-center gap-3 text-2xl tracking-[-0.03em]">
                <FewchursIcon size={32} />
                Pick Fewchurs if
              </h2>
              <ul className="mt-5 space-y-3">
                {c.chooseUs.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-[var(--v2-orange)]" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <FaqSection items={c.faq} />

        {/* Other comparisons */}
        <section className="px-4 pb-20 sm:px-8 sm:pb-24">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>More comparisons</Eyebrow>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/compare/${o.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl bg-[var(--v2-card)] p-5 shadow-[var(--v2-shadow)] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <ProductIcon src={o.logo} size={44} />
                  <span className="flex-1">
                    <span className="block font-bold">Fewchurs vs {o.name}</span>
                    <span className="mt-1 block text-sm text-[var(--v2-fg-2)]">{o.blurb}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-[var(--v2-fg-3)] transition-colors group-hover:text-[var(--v2-orange)]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-8 sm:pb-24">
          <Reveal className="mx-auto max-w-6xl">
            <div className="relative isolate overflow-hidden rounded-3xl bg-[var(--v2-raised)] px-6 py-14 text-center shadow-[var(--v2-shadow)] sm:px-12 sm:py-16">
              <Halftone mode="right" className="-z-10 opacity-70" />
              <h2 className="mx-auto max-w-xl text-4xl leading-[1.05] tracking-[-0.04em] text-balance sm:text-5xl">
                Try Fewchurs free.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[var(--v2-fg-2)]">
                One app is free forever. Add the SDK in about five minutes.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/login"
                  className={buttonVariants({ size: "lg", className: "h-12 rounded-xl px-6 text-base font-bold" })}
                >
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/pricing" className="px-3 text-sm font-semibold text-[var(--v2-fg)] hover:text-[var(--v2-orange)]">
                  See pricing
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
