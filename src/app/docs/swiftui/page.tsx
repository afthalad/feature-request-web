import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Step, Steps, Table } from "@/components/docs/Docs";

export const metadata: Metadata = {
  title: "iOS (SwiftUI) — Docs — Fewchurs",
  description: "Add a feature request board to your iOS app with SwiftUI.",
};

const TOC = [
  { id: "install", label: "Install" },
  { id: "set-up", label: "Set up" },
  { id: "show-the-board", label: "Show the board" },
  { id: "uikit", label: "Using UIKit" },
  { id: "colors", label: "Colors and theme" },
  { id: "api-key", label: "About the API key" },
  { id: "badge", label: "The \"Powered by\" badge" },
];

const PACKAGE_URL = "https://github.com/fewchurs/fewchurs-swift";

const PACKAGE_SWIFT = `dependencies: [
    .package(url: "${PACKAGE_URL}", from: "1.0.0")
]`;

const CONFIGURE = `import SwiftUI
import FeatureRequestKit

@main
struct MyApp: App {
    init() {
        FeatureRequestKit.configure(apiKey: "fr_live_xxx")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`;

const SHEET = `import SwiftUI
import FeatureRequestKit

struct SettingsView: View {
    @State private var showBoard = false

    var body: some View {
        Button("Suggest a feature") {
            showBoard = true
        }
        .sheet(isPresented: $showBoard) {
            FeatureRequestBoardView()
        }
    }
}`;

const UIKIT = `import UIKit
import SwiftUI
import FeatureRequestKit

let board = UIHostingController(rootView: FeatureRequestBoardView())
present(board, animated: true)`;

const THEME = `// A built-in dark theme
FeatureRequestKit.configure(apiKey: "fr_live_xxx", theme: .midnight)

// Or your own colors
let theme = FeatureRequestTheme(
    background: Color(.systemBackground),
    accent: .orange,
    cornerRadius: 16
)
FeatureRequestKit.configure(apiKey: "fr_live_xxx", theme: theme)`;

export default function SwiftUIDocsPage() {
  return (
    <DocsPage
      path="/docs/swiftui"
      title="iOS (SwiftUI)"
      intro="Add a native feature request board to your iPhone app. It takes three steps."
      meta="Needs iOS 17 or later and Swift 5.9 or later. No other packages needed."
      toc={TOC}
    >
      <Section id="install" title="Install">
        <Steps>
          <Step title="Add the package in Xcode">
            <P>
              In Xcode, open <strong>File → Add Package Dependencies…</strong> and paste this
              URL:
            </P>
            <CodeBlock code={PACKAGE_URL} />
          </Step>
          <Step title="Or add it to Package.swift">
            <P>If your project uses a Package.swift file, add this line instead:</P>
            <CodeBlock code={PACKAGE_SWIFT} filename="Package.swift" />
          </Step>
        </Steps>
      </Section>

      <Section id="set-up" title="Set up">
        <P>
          Call <C>configure</C> once, when your app starts. Use the API key from your dashboard.
        </P>
        <CodeBlock code={CONFIGURE} filename="MyApp.swift" />
      </Section>

      <Section id="show-the-board" title="Show the board">
        <P>
          <C>FeatureRequestBoardView</C> is a normal SwiftUI view. Show it in a sheet, a tab, or
          push it onto a navigation stack. It handles everything inside: the list, votes,
          comments and new requests.
        </P>
        <CodeBlock code={SHEET} filename="SettingsView.swift" />
      </Section>

      <Section id="uikit" title="Using UIKit">
        <P>
          Wrap the board in a <C>UIHostingController</C> and present it from any view controller.
        </P>
        <CodeBlock code={UIKIT} />
      </Section>

      <Section id="colors" title="Colors and theme">
        <P>
          By default the board follows your app: system colors, your accent color, and light or
          dark mode. To change it, pass a <C>theme</C> to <C>configure</C>.
        </P>
        <CodeBlock code={THEME} />
        <Table
          head={["Theme", "What it looks like"]}
          rows={[
            [<C key="s">.system</C>, "Default. Follows the phone's light or dark mode."],
            [<C key="m">.midnight</C>, "Always dark, black and white."],
            [<C key="c">FeatureRequestTheme(…)</C>, "Your own background, accent color and corner radius."],
          ]}
        />
      </Section>

      <Section id="api-key" title="About the API key">
        <P>
          It&apos;s fine to put this key in your app. It can only do what the board does: list,
          vote, comment and suggest. It can&apos;t change your settings or read anything private.
        </P>
        <Note>
          The SDK gives each device a random ID and keeps it in the Keychain. That is how it
          remembers votes without an account. Read more in <A href="/docs/concepts">How it works</A>.
        </Note>
      </Section>

      <Section id="badge" title='The "Powered by" badge'>
        <P>
          On the free plan the board shows a small &quot;Powered by Fewchurs&quot; line. It goes
          away on its own when you upgrade to <A href="/pricing">Pro</A>. You don&apos;t need to
          change any code.
        </P>
      </Section>
    </DocsPage>
  );
}
