import Link from "next/link";
import {
  ArrowRight,
  Inbox,
  TrendingUp,
  ListChecks,
  Bell,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { PlatformPills } from "@/components/docs/PlatformPills";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { Marquee } from "@/components/marketing/Marquee";
import { BorderGrid, BorderGridCell } from "@/components/marketing/BorderGrid";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS } from "@/lib/platforms";

const CODE_SNIPPET = `import Fewchurs

Fewchurs.configure(apiKey: "fr_live_xxx")
Fewchurs.showBoard()`;

const CHAPTERS = [
  {
    step: "01",
    icon: Inbox,
    title: "Ideas land in one place",
    body: "Someone taps “Suggest a feature” while they're using your app. No email thread, no DM you forget to answer.",
  },
  {
    step: "02",
    icon: TrendingUp,
    title: "Votes settle the argument",
    body: "The loudest person stops winning. The top of the board is simply what most people asked for.",
  },
  {
    step: "03",
    icon: ListChecks,
    title: "You mark what you're doing",
    body: "Open, Planned, Done or Declined — with a short note, so nobody wonders if you read it.",
  },
  {
    step: "04",
    icon: Bell,
    title: "They hear back when it ships",
    body: "Everyone who followed a request gets an email the day it's Done. That's usually the day they reopen your app.",
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: "A board that looks like your app",
    body: "It picks up your colours and corner radius, so it never feels bolted on.",
  },
  {
    icon: Bell,
    title: "Email when someone asks",
    body: "A short note the moment a request arrives. Turn it off whenever you want quiet.",
  },
  {
    icon: TrendingUp,
    title: "Top, New and Roadmap",
    body: "Three tabs people already understand. Nothing to explain to your users.",
  },
  {
    icon: Inbox,
    title: "A public board link",
    body: "Share fewchurs.com/b/yourapp anywhere — no login needed to view or vote.",
  },
  {
    icon: ListChecks,
    title: "Status you control",
    body: "Move things along in one click and the public roadmap updates itself.",
  },
  {
    icon: MessageSquare,
    title: "Reply right in the thread",
    body: "Comment on any request with a Developer badge, so people know you saw it.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I used to lose feature requests in a pile of App Store reviews. Now they're in one ranked list and I actually know what to build next.",
    name: "Indie iOS developer",
    role: "Solo founder",
  },
  {
    quote:
      "The email when something ships is the whole trick. People come back to check, and a few of them vote on the next thing too.",
    name: "Weekend app builder",
    role: "Two apps on the App Store",
  },
  {
    quote:
      "Three lines of code and I had a board. That's the entire pitch, and it's true.",
    name: "iOS contractor",
    role: "Ships for clients",
  },
];

const FAQ_ROW_1 = [
  { q: "Do I need a backend?", a: "No — Fewchurs is the backend. Add the SDK and you're done." },
  { q: "What's on the free plan?", a: "One app, 50 requests, unlimited votes and comments — free forever." },
  { q: "Can users vote without an account?", a: "Yes, anonymously by device. No login required for anyone but you." },
  { q: "Do I need to build the UI?", a: "No — the SDK renders the whole board, or link to your public board instead." },
];

const FAQ_ROW_2 = [
  { q: "How do I get notified?", a: "Turn on \"Email on new request\" in settings and you'll hear about every submission." },
  { q: "Can I remove the badge?", a: "Yes, on the Pro plan — the \"Powered by\" badge only shows on Free." },
  { q: "What if I have more than one app?", a: "Free covers 1 app, Pro covers 5. Each gets its own board and API key." },
  { q: "Is there a link I can share?", a: "Every app gets a public board at /b/your-app-name — no login needed to view or vote." },
];

function FaqCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="w-[320px] shrink-0 rounded-lg border border-border bg-card p-5 sm:w-[380px]">
      <p className="font-semibold">{q}</p>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{a}</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <MarketingHeader />

      {/* Hero */}
      <section className="border-b border-border py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="space-y-6">
            <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
              Built for indie iOS apps
            </span>
            <h1 className="text-4xl leading-[1.08] font-bold text-balance sm:text-5xl">
              Let your app&apos;s users tell you what to build next.
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg text-balance">
              Drop the Fewchurs SDK into your app and turn scattered feedback into a ranked,
              shippable roadmap.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login" className={buttonVariants({ size: "lg", className: "px-6" })}>
                Start free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/docs"
                className={buttonVariants({ variant: "outline", size: "lg", className: "px-6" })}
              >
                Read the docs
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              Free forever for one app. No credit card.
            </p>
            <div className="space-y-3 border-t border-border pt-6">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Available for
              </p>
              <PlatformPills />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <PhoneMockup />
            </div>
            <CodeBlock code={CODE_SNIPPET} filename="ContentView.swift" />
          </div>
        </div>
      </section>

      {/* Integrations marquee */}
      <section className="border-b border-border py-16">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-5">
          <p className="text-muted-foreground text-center text-xs font-semibold tracking-[0.2em] uppercase">
            Works with your stack
          </p>
          <div className="space-y-3">
            <Marquee durationSeconds={32}>
              {PLATFORMS.map((platform) => (
                <span
                  key={platform.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
                >
                  <BrandIcon path={platform.iconPath} color={platform.iconColor} className="size-4" />
                  {platform.name}
                </span>
              ))}
            </Marquee>
            <Marquee reverse durationSeconds={36}>
              {[...PLATFORMS].reverse().map((platform) => (
                <span
                  key={platform.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
                >
                  <BrandIcon path={platform.iconPath} color={platform.iconColor} className="size-4" />
                  {platform.name}
                </span>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* Story chapters */}
      <section id="how" className="border-b border-border py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">
              From &ldquo;I think people want this&rdquo; to &ldquo;they told me, so I built
              it.&rdquo;
            </h2>
          </div>
          <div className="mt-14">
            <BorderGrid cols={2}>
              {CHAPTERS.map((c) => (
                <BorderGridCell key={c.step}>
                  <div className="text-muted-foreground flex items-center gap-3">
                    <c.icon className="size-5" strokeWidth={1.6} />
                    <span className="text-xs font-medium tracking-[0.2em]">{c.step}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{c.title}</h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{c.body}</p>
                </BorderGridCell>
              ))}
            </BorderGrid>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border py-24">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-5">
          <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            Everything the board needs, nothing it doesn&apos;t
          </h2>
          <BorderGrid cols={3}>
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <BorderGridCell key={title}>
                <div className="space-y-3">
                  <Icon className="text-primary size-5" />
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              </BorderGridCell>
            ))}
          </BorderGrid>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border py-24">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-5 text-center">
          <div className="mx-auto max-w-2xl space-y-2">
            <h2 className="text-3xl font-bold sm:text-4xl">Simple pricing</h2>
            <p className="text-muted-foreground">
              Free forever for a hobby project. Upgrade once you&apos;re shipping.
            </p>
          </div>
          <PricingPlans />
          <p className="text-muted-foreground text-sm">
            <Link href="/pricing" className="hover:text-foreground underline underline-offset-4">
              See the full plan comparison
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border py-24">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-5">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold sm:text-4xl">What indie developers say</h2>
            <Badge variant="secondary" className="text-[10px]">
              Sample quotes
            </Badge>
          </div>
          <BorderGrid cols={3}>
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <BorderGridCell key={name}>
                <figure className="flex h-full flex-col justify-between gap-6">
                  <p className="text-[15px] leading-relaxed">&ldquo;{quote}&rdquo;</p>
                  <figcaption>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-muted-foreground text-xs">{role}</p>
                  </figcaption>
                </figure>
              </BorderGridCell>
            ))}
          </BorderGrid>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b border-border py-24">
        <div className="mx-auto w-full max-w-6xl space-y-10 px-5">
          <div className="mx-auto max-w-2xl space-y-2 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Questions</h2>
            <p className="text-muted-foreground">The short answers, before you ask.</p>
          </div>
          <div className="space-y-4">
            <Marquee durationSeconds={45}>
              {FAQ_ROW_1.map((item) => (
                <FaqCard key={item.q} q={item.q} a={item.a} />
              ))}
            </Marquee>
            <Marquee reverse durationSeconds={50}>
              {FAQ_ROW_2.map((item) => (
                <FaqCard key={item.q} q={item.q} a={item.a} />
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-5 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Ship what your users actually want.</h2>
          <p className="text-muted-foreground">
            Free forever for your first app — takes less time to set up than a coffee break.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className={buttonVariants({ size: "lg", className: "px-6" })}>
              Start free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/docs"
              className={buttonVariants({ variant: "outline", size: "lg", className: "px-6" })}
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
