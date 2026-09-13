import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { PlatformPills } from "@/components/docs/PlatformPills";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const metadata: Metadata = {
  title: "SwiftUI — Docs — Fewchurs",
  description: "Add Fewchurs to your SwiftUI app.",
};

const TOC = [
  { id: "installation", label: "Installation" },
  { id: "configure", label: "Configure the SDK" },
  { id: "show-the-board", label: "Show the board" },
  { id: "submit-programmatically", label: "Submit programmatically" },
  { id: "branding", label: "Removing the badge" },
];

const INSTALL_CODE = `// Xcode → File → Add Package Dependencies…
https://github.com/fewchurs/fewchurs-swift`;

const PACKAGE_SWIFT_CODE = `dependencies: [
    .package(url: "https://github.com/fewchurs/fewchurs-swift", from: "1.0.0")
]`;

const CONFIGURE_CODE = `import SwiftUI
import Fewchurs

@main
struct MyApp: App {
    init() {
        Fewchurs.configure(apiKey: "fr_live_xxx")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`;

const SHEET_CODE = `import SwiftUI
import Fewchurs

struct SettingsView: View {
    @State private var showBoard = false

    var body: some View {
        Button("Request a feature") {
            showBoard = true
        }
        .sheet(isPresented: $showBoard) {
            FewchursBoardView()
        }
    }
}`;

const IMPERATIVE_CODE = `// UIKit, or anywhere outside a SwiftUI view hierarchy
Fewchurs.showBoard()`;

const SUBMIT_CODE = `Task {
    do {
        let feature = try await Fewchurs.submitFeature(
            title: "Add dark mode",
            description: "Would love a dark theme.",
            isSubscriber: currentUser.hasActiveSubscription
        )
        print(feature.id, feature.status)
    } catch {
        print("Failed to submit:", error)
    }
}`;

export default function SwiftUIDocsPage() {
  return (
    <>
      <MarketingHeader />
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-12 px-4 py-16">
        <div className="space-y-4">
          <Link href="/docs" className="text-muted-foreground text-sm hover:text-foreground">
            ← Docs
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">SwiftUI</h1>
            <p className="text-muted-foreground">
              Drop the Fewchurs board into any SwiftUI app in a few minutes.
            </p>
          </div>
          <PlatformPills activeId="swiftui" />
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
            Requires iOS 16+ and Swift 5.9+.
          </p>
        </nav>

        <section id="installation" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Installation</h2>
          <p className="text-muted-foreground text-sm">Add the package through Xcode:</p>
          <CodeBlock code={INSTALL_CODE} />
          <p className="text-muted-foreground text-sm">Or add it directly to your Package.swift:</p>
          <CodeBlock code={PACKAGE_SWIFT_CODE} />
        </section>

        <section id="configure" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Configure the SDK</h2>
          <p className="text-muted-foreground text-sm">
            Call <code className="rounded bg-muted px-1 py-0.5">configure</code> once, on launch,
            with the API key from your app&apos;s dashboard settings.
          </p>
          <CodeBlock code={CONFIGURE_CODE} />
        </section>

        <section id="show-the-board" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Show the board</h2>
          <p className="text-muted-foreground text-sm">
            Present <code className="rounded bg-muted px-1 py-0.5">FewchursBoardView</code> like any
            other SwiftUI view — as a sheet, a tab, or pushed onto a navigation stack. It handles
            listing, voting, comments, and submitting a new request on its own.
          </p>
          <CodeBlock code={SHEET_CODE} />
          <p className="text-muted-foreground text-sm">
            Outside a SwiftUI hierarchy (e.g. from a UIKit view controller), present it imperatively
            instead:
          </p>
          <CodeBlock code={IMPERATIVE_CODE} />
        </section>

        <section id="submit-programmatically" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Submit programmatically</h2>
          <p className="text-muted-foreground text-sm">
            To collect a request from your own custom UI instead of the bundled board:
          </p>
          <CodeBlock code={SUBMIT_CODE} />
          <p className="text-muted-foreground text-sm">
            <code className="rounded bg-muted px-1 py-0.5">isSubscriber</code> is optional and
            defaults to <code className="rounded bg-muted px-1 py-0.5">false</code>. Pass{" "}
            <code className="rounded bg-muted px-1 py-0.5">true</code> when the submitter is a
            paying customer of your app (from StoreKit, RevenueCat, etc.) and a &quot;Subscriber&quot;
            badge will show up on that request in your dashboard.
          </p>
        </section>

        <section id="branding" className="scroll-mt-20 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Removing the &quot;Powered by&quot; badge</h2>
          <p className="text-muted-foreground text-sm">
            <code className="rounded bg-muted px-1 py-0.5">FewchursBoardView</code> shows a small
            &quot;Powered by Fewchurs&quot; badge on the free plan. It disappears automatically once the
            app&apos;s owner upgrades to Pro — nothing to change in code. See{" "}
            <Link href="/pricing" className="underline underline-offset-2">
              pricing
            </Link>
            .
          </p>
        </section>

        <div className="bg-primary-soft space-y-2 rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold">Stuck on something?</h2>
          <p className="text-muted-foreground text-sm">
            Most integration issues come down to a missing API key or an app that hasn&apos;t been
            created yet in the dashboard — double check those first.
          </p>
        </div>
      </div>
    </>
  );
}
