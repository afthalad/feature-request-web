import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { PlatformPills } from "@/components/docs/PlatformPills";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "Next.js — Docs — Fewchurs",
  description: "Add a server-rendered Fewchurs board to your Next.js app.",
};

const TOC = [
  { id: "installation", label: "Installation" },
  { id: "route-handler", label: "The route handler" },
  { id: "the-board", label: "Render the board" },
  { id: "identity", label: "Identity" },
  { id: "customizing", label: "Customizing" },
  { id: "hooks", label: "Building your own UI" },
  { id: "branding", label: "Removing the badge" },
];

const INSTALL_CODE = `pnpm add @fewchurs/next
# npm install @fewchurs/next`;

const ENV_CODE = `FEWCHURS_API_KEY=fr_live_xxx`;

const HANDLER_CODE = `// app/api/fewchurs/[...route]/route.ts
export { GET, POST, DELETE } from "@fewchurs/next/handler";`;

const PAGE_CODE = `// app/feedback/page.tsx
import { FewchursBoard } from "@fewchurs/next";
import "@fewchurs/react/styles.css";

export default function Page() {
  return <FewchursBoard />;
}`;

const IDENTITY_CODE = `// app/api/fewchurs/[...route]/route.ts
import { createHandler } from "@fewchurs/next/handler";
import { createHash } from "node:crypto";

export const { GET, POST, DELETE } = createHandler({
  deviceId: async () => {
    const session = await auth();
    return session
      ? createHash("sha256").update(session.userId).digest("hex")
      : crypto.randomUUID();
  },
});`;

const PROPS_CODE = `<FewchursBoard
  tabs={["top", "new", "roadmap"]}
  defaultTab="top"
  allowComments
  emailField="optional"
  pageSize={20}
  theme={{ primary: "#0f766e", radius: 8 }}
  labels={{ title: "Ideas", submit: "Suggest an idea" }}
/>`;

const HOOKS_CODE = `"use client";

import { FewchursProvider, useFeatures, useVote } from "@fewchurs/react";

function Ideas() {
  const { features, isLoading, loadMore, hasMore } = useFeatures({ sort: "top" });
  // …your markup, your components
}

export function Feedback() {
  // No key in the browser: the provider talks to your route handler.
  return (
    <FewchursProvider baseUrl="/api/fewchurs">
      <Ideas />
    </FewchursProvider>
  );
}`;

export default function NextJsDocsPage() {
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-12 px-4 py-16">
        <div className="space-y-4">
          <Link href="/docs" className="text-muted-foreground text-sm hover:text-foreground">
            ← Docs
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Next.js</h1>
            <p className="text-muted-foreground">
              A board that renders on the server, with your API key staying there.
            </p>
          </div>
          <PlatformPills activeId="nextjs" />
        </div>

        <nav className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            On this page
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-1">
            {TOC.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-3 border-t border-border pt-3 text-xs">
            Requires Next.js 14+ (App Router), React 18 or 19, and Node 20+.
          </p>
        </nav>

        <section id="installation" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Installation</h2>
          <CodeBlock code={INSTALL_CODE} />
          <p className="text-muted-foreground text-sm">
            Add the API key from your app&apos;s dashboard settings to your environment. It is read
            on the server only — never prefix it with{" "}
            <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_</code>.
          </p>
          <CodeBlock code={ENV_CODE} filename=".env.local" />
        </section>

        <section id="route-handler" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">The route handler</h2>
          <p className="text-muted-foreground text-sm">
            One file. Every click in the board — voting, commenting, submitting — goes to this
            route, which adds the key and forwards the call. Only the endpoints the board needs are
            forwarded; anything else is a 404.
          </p>
          <CodeBlock code={HANDLER_CODE} filename="app/api/fewchurs/[...route]/route.ts" />
        </section>

        <section id="the-board" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Render the board</h2>
          <CodeBlock code={PAGE_CODE} filename="app/feedback/page.tsx" />
          <p className="text-muted-foreground text-sm">
            The board is a server component: the first paint already contains the real requests,
            which is what a crawler sees too. Importing it from a{" "}
            <code className="rounded bg-muted px-1 py-0.5">&quot;use client&quot;</code> file is a
            build error rather than a key quietly ending up in the browser bundle.
          </p>
        </section>

        <section id="identity" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Identity</h2>
          <p className="text-muted-foreground text-sm">
            Votes are anonymous by default: the route handler stores a random id in an{" "}
            <code className="rounded bg-muted px-1 py-0.5">httpOnly</code> cookie, so the server and
            the browser agree on who is voting. If your app has accounts, hash the user id instead
            and votes follow the account across devices.
          </p>
          <CodeBlock code={IDENTITY_CODE} />
          <p className="text-muted-foreground text-sm">
            Always hash. Never send a raw user id or an email address.
          </p>
        </section>

        <section id="customizing" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Customizing</h2>
          <p className="text-muted-foreground text-sm">
            Colours come from CSS variables (
            <code className="rounded bg-muted px-1 py-0.5">--fw-primary</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">--fw-radius</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">--fw-font</code>) or the{" "}
            <code className="rounded bg-muted px-1 py-0.5">theme</code> prop. Light and dark follow{" "}
            <code className="rounded bg-muted px-1 py-0.5">prefers-color-scheme</code>.
          </p>
          <CodeBlock code={PROPS_CODE} />
          <p className="text-muted-foreground text-sm">
            Render props (<code className="rounded bg-muted px-1 py-0.5">renderFeature</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">renderEmpty</code>) and{" "}
            <code className="rounded bg-muted px-1 py-0.5">onEvent</code> are functions, so they
            cannot cross into a server component — use the client board from{" "}
            <code className="rounded bg-muted px-1 py-0.5">@fewchurs/react</code> in your own{" "}
            <code className="rounded bg-muted px-1 py-0.5">&quot;use client&quot;</code> file for
            those.
          </p>
        </section>

        <section id="hooks" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Building your own UI</h2>
          <p className="text-muted-foreground text-sm">
            The hooks are the whole API without the markup. Point the provider at your route
            handler and the key still never reaches the browser.
          </p>
          <CodeBlock code={HOOKS_CODE} />
          <p className="text-muted-foreground text-sm">
            See the{" "}
            <Link href="/docs/react" className="underline underline-offset-2">
              React docs
            </Link>{" "}
            for every hook and prop.
          </p>
        </section>

        <section id="branding" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Removing the &quot;Powered by&quot; badge
          </h2>
          <p className="text-muted-foreground text-sm">
            The board shows a small &quot;Powered by Fewchurs&quot; badge on the free plan. It
            disappears automatically once the app&apos;s owner upgrades to Pro — nothing to change
            in code. See{" "}
            <Link href="/pricing" className="underline underline-offset-2">
              pricing
            </Link>
            .
          </p>
        </section>

        <div className="bg-primary-soft space-y-2 rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold">Stuck on something?</h2>
          <p className="text-muted-foreground text-sm">
            A board that renders but stays empty almost always means the key is missing from the
            server environment — check the terminal for a Fewchurs message on the first request.
          </p>
        </div>
      </div>
    </>
  );
}
