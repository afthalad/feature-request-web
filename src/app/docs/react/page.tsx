import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { PlatformPills } from "@/components/docs/PlatformPills";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "React — Docs — Fewchurs",
  description: "Add a Fewchurs feature-request board to any React app.",
};

const TOC = [
  { id: "installation", label: "Installation" },
  { id: "the-board", label: "Render the board" },
  { id: "keys", label: "Where the key lives" },
  { id: "hooks", label: "Hooks" },
  { id: "errors", label: "Errors" },
  { id: "customizing", label: "Customizing" },
  { id: "identity", label: "Identity" },
  { id: "branding", label: "Removing the badge" },
];

const INSTALL_CODE = `pnpm add @fewchurs/react
# npm install @fewchurs/react`;

const BOARD_CODE = `import { FewchursBoard, FewchursProvider } from "@fewchurs/react";
import "@fewchurs/react/styles.css";

export function App() {
  return (
    <FewchursProvider apiKey={import.meta.env.VITE_FEWCHURS_KEY}>
      <FewchursBoard />
    </FewchursProvider>
  );
}`;

const PROXY_CODE = `// Your server adds the Authorization header; the browser never sees the key.
<FewchursProvider baseUrl="/api/fewchurs">
  <FewchursBoard />
</FewchursProvider>`;

const HOOKS_CODE = `const { features, isLoading, error, loadMore, hasMore } = useFeatures({ sort: "top" });
const { hasVoted, upvoteCount, toggle, isPending } = useVote(featureId);
const { comments, add, loadMore: loadMoreComments } = useComments(featureId);
const { submit, isPending: isSubmitting } = useSubmitFeature();
const { isFollowing, follow, unfollow } = useFollow(featureId);
const { showBranding, hideVoteCounts } = useFewchursConfig();`;

const ERROR_CODE = `const { submit, error } = useSubmitFeature();

const feature = await submit({ title, description, email });
if (!feature && error) {
  // error.code is one of: invalid_key | validation_failed | rate_limited
  //                       not_found | limit_reached | server | network
  toast(userMessage(error));
}`;

const SLOTS_CODE = `<FewchursBoard
  theme={{ primary: "#0f766e", radius: 8 }}
  labels={{ title: "Ideas", submit: "Suggest an idea" }}
  renderFeature={(feature, actions) => (
    <MyRow feature={feature} onVote={actions.toggleVote} />
  )}
/>

// Or compose the parts yourself:
<FewchursBoard.Root unstyled>
  <FewchursBoard.Tabs />
  <FewchursBoard.List />
  <FewchursBoard.SubmitTrigger />
</FewchursBoard.Root>`;

const IDENTITY_CODE = `// Hash the id — never send a raw user id or an email address.
<FewchursProvider apiKey={key} deviceId={hashedUserId}>`;

export default function ReactDocsPage() {
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-12 px-4 py-16">
        <div className="space-y-4">
          <Link href="/docs" className="text-muted-foreground text-sm hover:text-foreground">
            ← Docs
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">React</h1>
            <p className="text-muted-foreground">
              A drop-in board for Vite, CRA, Remix — any React app.
            </p>
          </div>
          <PlatformPills activeId="react" />
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
            Requires React 18 or 19. No other runtime dependencies.
          </p>
        </nav>

        <section id="installation" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Installation</h2>
          <CodeBlock code={INSTALL_CODE} />
          <p className="text-muted-foreground text-sm">
            On Next.js, install{" "}
            <Link href="/docs/nextjs" className="underline underline-offset-2">
              @fewchurs/next
            </Link>{" "}
            instead — it renders the board on the server and keeps the key there.
          </p>
        </section>

        <section id="the-board" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Render the board</h2>
          <CodeBlock code={BOARD_CODE} filename="App.tsx" />
          <p className="text-muted-foreground text-sm">
            That is the whole integration: tabs, voting, comments, the submit form and the styles.
            The stylesheet is a plain CSS file — no Tailwind, no CSS-in-JS runtime.
          </p>
        </section>

        <section id="keys" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Where the key lives</h2>
          <p className="text-muted-foreground text-sm">
            In a client-only app the key ships in the bundle, the same way a Stripe or PostHog
            public key does — it can only reach the feature-request endpoints for your app, and it
            is rate limited per device. If you would rather not publish it at all, point the
            provider at a path on your own server and add the{" "}
            <code className="rounded bg-muted px-1 py-0.5">Authorization</code> header there.
          </p>
          <CodeBlock code={PROXY_CODE} />
        </section>

        <section id="hooks" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Hooks</h2>
          <p className="text-muted-foreground text-sm">
            Every hook reads from one shared store, so two components asking for the same list
            trigger one request, and a vote updates every view of that request at once.
          </p>
          <CodeBlock code={HOOKS_CODE} />
        </section>

        <section id="errors" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Errors</h2>
          <p className="text-muted-foreground text-sm">
            Nothing throws. A failed call is a typed value with a code you can branch on, and{" "}
            <code className="rounded bg-muted px-1 py-0.5">userMessage(error)</code> gives a
            sentence that is safe to show a visitor.
          </p>
          <CodeBlock code={ERROR_CODE} />
        </section>

        <section id="customizing" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Customizing</h2>
          <p className="text-muted-foreground text-sm">
            Five levels, in order of how much you want to own: defaults, CSS variables (
            <code className="rounded bg-muted px-1 py-0.5">--fw-primary</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5">--fw-radius</code>), props, render
            slots, and headless.
          </p>
          <CodeBlock code={SLOTS_CODE} />
          <p className="text-muted-foreground text-sm">
            <code className="rounded bg-muted px-1 py-0.5">unstyled</code> drops every class name
            and keeps the behaviour, the ARIA roles and the keyboard handling.
          </p>
        </section>

        <section id="identity" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Identity</h2>
          <p className="text-muted-foreground text-sm">
            Each visitor gets a random id in a cookie (with{" "}
            <code className="rounded bg-muted px-1 py-0.5">localStorage</code> as a fallback), which
            is what ties a vote to a device. If your app has accounts, pass a hashed user id and
            votes follow the account instead.
          </p>
          <CodeBlock code={IDENTITY_CODE} />
        </section>

        <section id="branding" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Removing the &quot;Powered by&quot; badge
          </h2>
          <p className="text-muted-foreground text-sm">
            The badge shows on the free plan and disappears once the app&apos;s owner upgrades to
            Pro — nothing to change in code. See{" "}
            <Link href="/pricing" className="underline underline-offset-2">
              pricing
            </Link>
            .
          </p>
        </section>

        <div className="bg-primary-soft space-y-2 rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold">Stuck on something?</h2>
          <p className="text-muted-foreground text-sm">
            An empty board with a console message about the API key means the key is wrong or
            inactive — check the app&apos;s dashboard settings. In development the SDK prints
            exactly what it could not do.
          </p>
        </div>
      </div>
    </>
  );
}
