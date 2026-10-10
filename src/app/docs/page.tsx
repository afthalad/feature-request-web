import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siAndroid, siApple, siFlutter, siLaravel, siNextdotjs, siReact } from "simple-icons";
import { BrandIcon } from "@/components/marketing/BrandIcon";
import { A, C, DocsPage, P, Section, Step, Steps } from "@/components/docs/Docs";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Docs — Fewchurs",
  description: "Add a feature request board to your app. Guides for iOS, Android, Flutter, React, Next.js and Laravel.",
};

const STACKS = [
  { href: "/docs/swiftui", name: "iOS (SwiftUI)", icon: siApple, line: "Native board view for iPhone apps.", ready: true },
  { href: "/docs/react", name: "React", icon: siReact, line: "Board component and hooks for any React app.", ready: true },
  { href: "/docs/nextjs", name: "Next.js", icon: siNextdotjs, line: "Server-rendered board. Your key stays on the server.", ready: true },
  { href: "/docs/kotlin", name: "Android (Kotlin)", icon: siAndroid, line: "SDK on the way. Use the REST API today.", ready: false },
  { href: "/docs/flutter", name: "Flutter", icon: siFlutter, line: "SDK on the way. Use the REST API today.", ready: false },
  { href: "/docs/laravel", name: "Laravel", icon: siLaravel, line: "Package on the way. Use the REST API today.", ready: false },
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
              <A href="/login">Sign in</A> and create an app in your dashboard. Each app gets its
              own board.
            </P>
          </Step>
          <Step title="Copy your API key">
            <P>
              You see the key once, right after you create the app. It starts with{" "}
              <C>fr_live_</C>. Lost it? Make a new one in your app&apos;s <strong>Settings</strong>.
            </P>
          </Step>
          <Step title="Add the board to your app">
            <P>Pick your stack below and follow the guide. Most take about five minutes.</P>
          </Step>
        </Steps>
      </Section>

      <Section id="pick-your-stack" title="Pick your stack">
        <div className="grid gap-3 sm:grid-cols-2">
          {STACKS.map((stack) => (
            <Link
              key={stack.href}
              href={stack.href}
              className="group hover:border-foreground/30 flex items-start gap-4 rounded-lg border border-border p-4 transition-colors"
            >
              <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                <BrandIcon
                  path={stack.icon.path}
                  color={`#${stack.icon.hex}`}
                  className={cn("size-5", stack.icon === siApple || stack.icon === siNextdotjs ? "dark:invert" : "")}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  {stack.name}
                  {!stack.ready && (
                    <span className="text-muted-foreground rounded border border-border px-1.5 py-px text-[10px] font-medium">
                      Soon
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-sm">{stack.line}</span>
              </span>
              <ArrowRight className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
        <P>
          Using something else? Any language that can send HTTP requests works with the{" "}
          <A href="/docs/api">REST API</A>.
        </P>
      </Section>

      <Section id="no-code" title="No code at all">
        <P>
          Every app also gets a public board at <C>/b/your-app-name</C>. Share the link in your
          app, on your site or in an email. People can read and vote without making an account.
        </P>
      </Section>
    </DocsPage>
  );
}
