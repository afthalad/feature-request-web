import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronUp, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { PLATFORMS } from "@/lib/platforms";
import { Halftone } from "@/components/landing-v2/Halftone";
import { RequestCarousel } from "@/components/landing-v2/RequestCarousel";
import { ResponsiveBoard } from "@/components/landing-v2/ResponsiveBoard";
import { COMING_SOON, V2Footer, V2Nav } from "@/components/landing-v2/Chrome";
import { jakarta } from "@/components/landing-v2/fonts";
import { Reveal } from "@/components/landing-v2/Reveal";
import "@/components/landing-v2/v2.css";

/*
 * Experimental redesign of the home page. Lives at /home-v2 so the live home
 * page at / is untouched; kept out of search until it replaces it.
 */

export const metadata: Metadata = {
  title: "Home (preview)",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#board", label: "The board" },
  { href: "#pricing", label: "Pricing" },
  { href: "/docs-preview", label: "Docs" },
];

const HERO_ICONS = ["swiftui", "kotlin", "flutter", "react"];
const TILTS = ["-rotate-8", "rotate-4", "-rotate-3", "rotate-8"];

const CALLOUTS_LEFT = [
  { title: "Suggest in one tap", body: "Users post an idea from inside your app. No web form, no email." },
  { title: "Vote without signing up", body: "Votes are counted per device, so there's no login wall." },
  { title: "Comments on every idea", body: "Users add the detail you'd otherwise have to ask for." },
];
const CALLOUTS_RIGHT = [
  { title: "They hear back", body: "Followers get an email when the status changes." },
  { title: "Fits every screen", body: "The same board reflows for phones, tablets and the web." },
  { title: "Native everywhere", body: "SwiftUI, Kotlin, Flutter, React, Next.js and Laravel. WordPress, Webflow and Bubble soon." },
];

const DIY = [
  { what: "Database and API", note: "Requests, votes, comments", time: "~1 week" },
  { what: "Anonymous voting", note: "Device IDs, no double votes", time: "~3 days" },
  { what: "Native board UI", note: "iOS, Android and web", time: "~3 weeks" },
  { what: "Status emails", note: "Followers, unsubscribes", time: "~3 days" },
  { what: "Admin dashboard", note: "Triage, statuses, export", time: "~1 week" },
];

const FAQ = [
  { q: "Do I need a backend?", a: "No. Fewchurs is the backend. Add the SDK and you're done." },
  {
    q: "What's on the free plan?",
    a: "One app on one platform, the first 5 feature requests visible, unlimited votes and comments. Free forever.",
  },
  { q: "Can users vote without an account?", a: "Yes, anonymously by device. No login required for anyone but you." },
  { q: "Do I need to build the UI?", a: "No. The SDK renders the whole board. On Pro you can also link to a public web board." },
  { q: "Can I remove the badge?", a: 'Yes, on Starter and Pro. The "Powered by" badge only shows on Free.' },
];

function iconFill(color: string) {
  // Next.js's brand colour is black, which would vanish in dark mode: use the text colour.
  return color.toLowerCase() === "#000000" ? undefined : color;
}

export default function HomeV2() {
  const heroIcons = HERO_ICONS.map((id) => PLATFORMS.find((p) => p.id === id)!).filter(Boolean);

  return (
    <div className={`${jakarta.variable} v2-root flex flex-1 flex-col overflow-x-clip`}>
      <V2Nav links={NAV} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate pt-28 sm:pt-36">
          <Halftone mode="corners" className="-z-10 h-[760px]" />
          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
            <div
              className="v2-appear flex items-center gap-2.5 rounded-full bg-[var(--v2-card)] shadow-sm py-1.5 pr-4 pl-1.5 text-sm text-[var(--v2-fg-2)]"
              style={{ "--d": "0ms" } as React.CSSProperties}
            >
              <span className="flex -space-x-1.5">
                {PLATFORMS.slice(0, 4).map((p) => (
                  <span key={p.id} className="grid size-6 place-items-center rounded-full border border-[var(--v2-bg)] bg-[var(--v2-tile)] shadow-sm">
                    <BrandIcon path={p.iconPath} color={iconFill(p.iconColor)} className="size-3" />
                  </span>
                ))}
              </span>
              <span>
                <b className="font-bold text-[var(--v2-fg)]">6 SDKs</b>, one board
              </span>
            </div>

            <h1
              className="v2-appear mt-7 text-[2.6rem] leading-[1.08] tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl"
              style={{ "--d": "80ms" } as React.CSSProperties}
            >
              Ship what your{" "}
              <span className="inline-flex translate-y-[-0.06em] items-center gap-[0.08em] align-middle">
                <span className="sr-only">iOS, Android, Flutter and web</span>
                {heroIcons.map((p, i) => (
                  <span
                    key={p.id}
                    aria-hidden
                    className={`flex size-[0.95em] items-center justify-center rounded-[0.26em] border border-[var(--v2-line)] bg-[var(--v2-tile)] shadow-lg ${TILTS[i]}`}
                  >
                    <BrandIcon path={p.iconPath} color={iconFill(p.iconColor)} className="size-[0.55em]" />
                  </span>
                ))}
              </span>{" "}
              users actually want.
            </h1>

            <p
              className="v2-appear mt-6 max-w-xl text-base leading-relaxed text-[var(--v2-fg-2)] sm:text-lg"
              style={{ "--d": "160ms" } as React.CSSProperties}
            >
              Drop the Fewchurs SDK into your app. Users suggest features and vote on them, and you get a ranked
              roadmap instead of scattered emails, reviews and DMs.
            </p>

            <div className="v2-appear mt-8 flex flex-col items-center gap-3" style={{ "--d": "240ms" } as React.CSSProperties}>
              <Link
                href="/login"
                className={buttonVariants({ size: "lg", className: "h-12 rounded-xl px-7 text-base font-bold" })}
              >
                Start free
                <ArrowRight className="size-4" />
              </Link>
              <p className="text-sm text-[var(--v2-fg-3)]">Free forever for one app. No credit card.</p>
            </div>
          </div>

          <div className="v2-appear mt-14" style={{ "--d": "360ms" } as React.CSSProperties}>
            <RequestCarousel />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-8 px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-3 max-w-xl text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                Five lines of code. Then it runs on its own.
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <Reveal delay={0}>
                <StepCard n="01" title="Add the SDK" body="Install the package for your platform and pass your API key. The SDK draws the whole board for you.">
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p, i) => (
                      <span
                        key={p.id}
                        className={
                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold " +
                          (i === 0 ? "bg-[var(--v2-orange)]/12 text-[var(--v2-fg)]" : "bg-[var(--v2-chip)] text-[var(--v2-fg-2)]")
                        }
                      >
                        <BrandIcon path={p.iconPath} color={iconFill(p.iconColor)} className="size-3" />
                        {p.name}
                      </span>
                    ))}
                    {COMING_SOON.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v2-chip)] px-2.5 py-1.5 text-xs font-semibold text-[var(--v2-fg-3)]"
                      >
                        <SoonIcon {...p} />
                        {p.name}
                        <span className="rounded bg-[var(--v2-orange)]/12 px-1 py-px text-[9px] font-bold tracking-wide text-[var(--v2-orange)] uppercase">
                          Soon
                        </span>
                      </span>
                    ))}
                  </div>
                </StepCard>
              </Reveal>
              <Reveal delay={100}>
                <StepCard n="02" title="Users suggest and vote" body="Ideas come in from inside your app. The ones most people want rise to the top on their own.">
                  <div className="space-y-2">
                    {[
                      ["Dark mode", 128],
                      ["Home screen widget", 119],
                      ["Export to CSV", 96],
                    ].map(([t, v], i) => (
                      <div key={t} className="flex items-center gap-3 rounded-lg bg-[var(--v2-chip)] px-2.5 py-2">
                        <span
                          className={
                            "flex w-11 items-center justify-center gap-0.5 rounded-md py-1 text-xs font-bold tabular-nums " +
                            (i === 0 ? "bg-[var(--v2-orange)] text-white" : "bg-[var(--v2-chip)] text-[var(--v2-fg-2)]")
                          }
                        >
                          <ChevronUp className="size-3" strokeWidth={3} />
                          {v}
                        </span>
                        <span className="text-sm font-semibold text-[var(--v2-fg)]">{t}</span>
                      </div>
                    ))}
                  </div>
                </StepCard>
              </Reveal>
              <Reveal delay={200}>
                <StepCard n="03" title="Ship it and tell them" body="Move ideas through Planned, In progress and Done. Everyone following gets an email when it ships.">
                  <div className="space-y-2 font-mono text-xs">
                    {[
                      ["Planned", "bg-blue-400", "Widget"],
                      ["In progress", "bg-amber-400", "CSV export"],
                      ["Done", "bg-emerald-400", "Dark mode"],
                    ].map(([s, dot, t]) => (
                      <div key={s} className="flex items-center justify-between rounded-lg bg-[var(--v2-chip)] px-3 py-2">
                        <span className="flex items-center gap-2 text-[var(--v2-fg-2)]">
                          <span className={`size-1.5 rounded-full ${dot}`} />
                          {s}
                        </span>
                        <span className="text-[var(--v2-fg-3)]">{t}</span>
                        {s === "Done" ? <Mail className="size-3.5 text-[var(--v2-orange)]" /> : <span className="size-3.5" />}
                      </div>
                    ))}
                  </div>
                </StepCard>
              </Reveal>
            </div>
          </div>
        </section>

        {/* The board, annotated */}
        <section id="board" className="scroll-mt-8 px-4 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <h2 className="mx-auto max-w-2xl text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                Then every day, a clearer roadmap.
              </h2>
              <p className="mt-4 text-[var(--v2-fg-2)]">The board the SDK puts in your app, on a phone or on the web. Votes here are coming in live.</p>
            </Reveal>

            <Reveal className="mt-10">
              <ResponsiveBoard left={CALLOUTS_LEFT} right={CALLOUTS_RIGHT} />
            </Reveal>
          </div>
        </section>

        {/* Build it yourself */}
        <section className="px-4 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <Eyebrow>Or build it yourself</Eyebrow>
              <h2 className="mt-3 max-w-2xl text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                Six weeks of plumbing, or one package.
              </h2>
              <p className="mt-4 max-w-2xl text-[var(--v2-fg-2)]">
                A feature request board sounds small until you need a database, voting that can&apos;t be gamed, a UI for
                every platform, emails and an admin panel. Fewchurs is all of it.
              </p>
            </Reveal>

            <Reveal className="mt-10">
              <div className="grid overflow-hidden rounded-2xl shadow-[var(--v2-shadow)] md:grid-cols-[1.3fr_1fr]">
                <div className="bg-[var(--v2-card)] p-6 sm:p-8">
                  <p className="text-sm font-semibold text-[var(--v2-fg-2)]">Building it yourself</p>
                  <ul className="mt-5 divide-y divide-[var(--v2-line)]">
                    {DIY.map((d) => (
                      <li key={d.what} className="flex items-center justify-between gap-4 py-3">
                        <span>
                          <span className="block font-semibold text-[var(--v2-fg)]">{d.what}</span>
                          <span className="text-sm text-[var(--v2-fg-3)]">{d.note}</span>
                        </span>
                        <span className="font-mono text-sm text-[var(--v2-fg-2)]">{d.time}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center justify-between border-t border-[var(--v2-line-strong)] pt-4">
                    <span className="font-bold">Before your first vote</span>
                    <span className="font-mono text-lg font-bold text-[var(--v2-fg)] line-through decoration-[var(--v2-orange)] decoration-2">
                      ~6 weeks
                    </span>
                  </div>
                </div>
                <div className="relative flex flex-col justify-between gap-8 overflow-hidden bg-[var(--v2-orange-wash)] p-6 sm:p-8">
                  <div className="absolute -top-24 -right-24 size-64 rounded-full bg-[var(--v2-orange)]/25 blur-3xl" />
                  <div className="relative">
                    <p className="text-sm font-semibold text-[var(--v2-orange)]">Fewchurs Free</p>
                    <p className="mt-3 text-6xl font-extrabold tracking-[-0.05em]">$0</p>
                    <p className="mt-2 text-[var(--v2-fg-2)]">About five minutes to install. Votes from day one.</p>
                  </div>
                  <ul className="relative space-y-2 text-sm">
                    {["No backend to run", "Users vote without signing up", "The same board on every platform"].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check className="size-4 text-[var(--v2-orange)]" strokeWidth={3} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--v2-fg-3)]">Rough estimates for one developer.</p>
            </Reveal>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-8 px-4 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-6xl space-y-10">
            <Reveal>
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="mt-3 text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">Free for your first app.</h2>
              <p className="mt-4 text-[var(--v2-fg-2)]">Upgrade when you have more apps or want the badge gone. Cancel any time.</p>
            </Reveal>
            <PricingPlans />
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-3 text-4xl leading-[1.05] tracking-[-0.04em]">Questions, answered.</h2>
            </div>
            <div className="divide-y divide-[var(--v2-line)] border-y border-[var(--v2-line)]">
              {FAQ.map((f) => (
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

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-8 sm:pb-24">
          <Reveal className="mx-auto max-w-6xl">
            <div className="relative isolate grid overflow-hidden rounded-3xl bg-[var(--v2-raised)] shadow-[var(--v2-shadow)] lg:grid-cols-[1.1fr_1fr]">
              <Halftone mode="right" className="-z-10" />
              <div className="p-8 sm:p-12">
                <h2 className="max-w-md text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                  Your next release could be the one they voted for.
                </h2>
                <p className="mt-5 max-w-md text-[var(--v2-fg-2)]">
                  Add the SDK, open your board, and see your first request today. Free for one app, forever.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/login"
                    className={buttonVariants({ size: "lg", className: "h-12 rounded-xl px-6 text-base font-bold" })}
                  >
                    Start free
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link href="/docs-preview" className="px-3 text-sm font-semibold text-[var(--v2-fg)] hover:text-[var(--v2-fg)]">
                    Read the docs
                  </Link>
                </div>
              </div>
              <div aria-hidden className="relative hidden min-h-[320px] lg:block">
                {[
                  { t: "Dark mode", v: 931, s: "Done", c: "bg-emerald-400", x: "18%", y: "22%", r: "-6deg", d: "0ms" },
                  { t: "Offline maps", v: 448, s: "In progress", c: "bg-amber-400", x: "48%", y: "12%", r: "4deg", d: "700ms" },
                  { t: "Home screen widget", v: 412, s: "Planned", c: "bg-blue-400", x: "34%", y: "52%", r: "-2deg", d: "1400ms" },
                ].map((k) => (
                  <div
                    key={k.t}
                    className="v2-float absolute w-52 rounded-2xl bg-[var(--v2-raised)] p-4 shadow-[var(--v2-shadow)]"
                    style={{ left: k.x, top: k.y, "--r": k.r, "--d": k.d } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-[var(--v2-orange)] text-white">
                        <ChevronUp className="size-3.5" strokeWidth={3} />
                        <span className="text-xs font-bold">{k.v}</span>
                      </span>
                      <span>
                        <span className="block text-sm font-bold">{k.t}</span>
                        <span className="flex items-center gap-1.5 text-[11px] text-[var(--v2-fg-3)]">
                          <span className={`size-1.5 rounded-full ${k.c}`} />
                          {k.s}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <V2Footer />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs font-medium tracking-[0.18em] text-[var(--v2-orange)] uppercase">{children}</p>;
}

function StepCard({ n, title, body, children }: { n: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-[var(--v2-card)] p-6 shadow-[var(--v2-shadow)]">
      <div className="min-h-[148px]">{children}</div>
      <p className="mt-6 font-mono text-sm text-[var(--v2-orange)]">{n}</p>
      <h3 className="mt-2 text-xl tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--v2-fg-2)]">{body}</p>
    </div>
  );
}

function SoonIcon({ path, color }: { path?: string; color?: string }) {
  if (path) return <BrandIcon path={path} color={color} className="size-3 opacity-70" />;
  return (
    <span className="grid size-3 place-items-center rounded-full bg-[var(--v2-fg-3)] text-[8px] leading-none font-extrabold text-[var(--v2-bg)]">
      b
    </span>
  );
}
