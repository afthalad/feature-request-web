import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siAndroid, siApple, siFlutter, siLaravel, siNextdotjs, siReact } from "simple-icons";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { A, C, DocsPage, P, Section, Step, Steps } from "@/components/docs/Docs";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Docs",
  description:
    "Add a feature request board to your app. Guides for iOS, Android, Flutter, React, Next.js and Laravel.",
  path: "/docs",
});

const STACKS = [
  { href: "/docs/swiftui", name: "iOS (SwiftUI)", icon: siApple, line: "Native board view for iPhone apps." },
  { href: "/docs/kotlin", name: "Android (Kotlin)", icon: siAndroid, line: "Add the board to your Android app with Kotlin." },
  { href: "/docs/flutter", name: "Flutter", icon: siFlutter, line: "One package for iOS, Android and the web." },
  { href: "/docs/react", name: "React", icon: siReact, line: "Board component and hooks for any React app." },
  { href: "/docs/nextjs", name: "Next.js", icon: siNextdotjs, line: "Server-rendered board. Your key stays on the server." },
  { href: "/docs/laravel", name: "Laravel", icon: siLaravel, line: "Server-side board. Your key stays on the server." },
];

const TOC = [
  { id: "quick-start", label: "Quick start" },
  { id: "pick-your-stack", label: "Pick your stack" },
  { id: "no-code", label: "No code at all" },
];

export default function DocsOverviewPage() {
  return (
    <DocsPage
      path="/docs"
      title="Documentation"
      intro="Fewchurs gives your app a feature request board. Your users suggest ideas and vote on them. You see what to build next."
      toc={TOC}
    >
      <Section id="quick-start" title="Quick start">
        <Steps>
          <Step title="Create an app">
            <P>
              <A href="/login">Sign in</A> and create an app in your dashboard. Each app gets its own board. Add your
              iOS Bundle ID, Android package name or website domain. The API key only works in those apps and
              websites.
            </P>
          </Step>
          <Step title="Copy your API key">
            <P>
              You see the key once, right after you create the app. It starts with <C>fr_live_</C>. Lost it? Make a
              new one in your app&apos;s <strong>Settings</strong>.
            </P>
          </Step>
          <Step title="Add the board to your app">
            <P>Pick your stack below and follow the guide. Most take about five minutes.</P>
          </Step>
        </Steps>
      </Section>

      <Section id="pick-your-stack" title="Pick your stack">
        <ul className="grid gap-3 sm:grid-cols-2">
          {STACKS.map((stack) => (
            <li key={stack.href}>
              <Link
                href={stack.href}
                className="group flex h-full items-start gap-4 rounded-2xl bg-[var(--v2-card)] p-5 shadow-[var(--v2-shadow)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--v2-chip)]">
                  <BrandIcon
                    path={stack.icon.path}
                    color={`#${stack.icon.hex}`}
                    className={cn(
                      "size-5",
                      stack.icon === siApple || stack.icon === siNextdotjs ? "dark:invert" : "",
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold tracking-[-0.01em]">{stack.name}</span>
                  <span className="mt-0.5 block text-sm text-[var(--v2-fg-3)]">{stack.line}</span>
                </span>
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-[var(--v2-fg-3)] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--v2-orange)]" />
              </Link>
            </li>
          ))}
        </ul>
        <P>
          Using something else? Any language that can send HTTP requests works with the{" "}
          <A href="/docs/api">REST API</A>.
        </P>
      </Section>

      <Section id="no-code" title="No code at all">
        <P>
          On Pro, every app also gets a public board at <C>/b/your-app-name</C>. Share the link in your app, on your
          site or in an email. People can read and vote without making an account.
        </P>
      </Section>
    </DocsPage>
  );
}
