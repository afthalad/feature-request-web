import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Step, Steps, Table } from "@/components/docs/Docs";

export const metadata: Metadata = {
  title: "Flutter — Docs — Fewchurs",
  description: "Add a feature request board to your Flutter app on mobile, web and desktop.",
};

const TOC = [
  { id: "install", label: "Install" },
  { id: "platforms", label: "Platform setup" },
  { id: "set-up", label: "Set up" },
  { id: "show-the-board", label: "Show the board" },
  { id: "colors", label: "Colors and theme" },
  { id: "badge", label: "What your plan changes" },
  { id: "api-key", label: "About the API key" },
];

const PUB_URL = "https://pub.dev/packages/fewchurs";
// Latest version of the fewchurs package on pub.dev. Bump it here when a new version ships.
const VERSION = "1.5.2";

const PUB_ADD = `flutter pub add fewchurs`;

const PUBSPEC = `dependencies:
  fewchurs: ^${VERSION}`;

const PUB_GET = `flutter pub get`;

const ANDROID = `<uses-permission android:name="android.permission.INTERNET"/>`;

const MACOS = `<key>com.apple.security.network.client</key>
<true/>`;

const CONFIGURE = `import 'package:fewchurs/fewchurs.dart';
import 'package:flutter/material.dart';

void main() {
  Fewchurs.configure(apiKey: 'fr_live_xxx');
  runApp(const MyApp());
}`;

const SHOW = `FilledButton(
  onPressed: () => Fewchurs.showBoard(context),
  child: const Text('Suggest a feature'),
)`;

const SHEET = `Fewchurs.showBoardSheet(context);`;

const WIDGET = `// In a tab or a page that has its own app bar
const FewchursBoard(showAppBar: false)`;

const DEEP_LINK = `Fewchurs.showBoard(
  context,
  board: FewchursBoard(showCloseButton: true, initialFeatureId: id),
);`;

const THEME = `MaterialApp(
  theme: ThemeData(
    colorSchemeSeed: const Color(0xFFED5F18),
    extensions: const [
      FewchursThemeData(
        cardRadius: 14,
        voteButtonStyle: VoteButtonStyle.pill,
      ),
    ],
  ),
)`;

export default function FlutterDocsPage() {
  return (
    <DocsPage
      path="/docs/flutter"
      title="Flutter"
      intro="Add a native feature request board to your Flutter app. One package, one line of setup."
      meta="Needs Flutter 3.10 or later and Dart 3.0 or later. Runs on Android, iOS, web, macOS, Windows and Linux."
      toc={TOC}
    >
      <Section id="install" title="Install">
        <Steps>
          <Step title="Add the package">
            <P>
              The package is on <A href={PUB_URL}>pub.dev</A>. Add it from your project folder:
            </P>
            <CodeBlock code={PUB_ADD} />
          </Step>
          <Step title="Or edit pubspec.yaml">
            <P>If you prefer, add it to your app&apos;s <C>pubspec.yaml</C> yourself:</P>
            <CodeBlock code={PUBSPEC} filename="pubspec.yaml" />
            <CodeBlock code={PUB_GET} />
          </Step>
        </Steps>
        <Note>
          {VERSION} is the latest version. It brings in <C>fewchurs_core</C>, the API client, on
          its own, so you don&apos;t need to add it.
        </Note>
      </Section>

      <Section id="platforms" title="Platform setup">
        <P>
          <strong>Android:</strong> release builds need the internet permission in{" "}
          <C>android/app/src/main/AndroidManifest.xml</C>. Debug builds have it already, which is
          why a missing one only shows up in release.
        </P>
        <CodeBlock code={ANDROID} filename="AndroidManifest.xml" />
        <P>
          <strong>macOS:</strong> allow network access in both{" "}
          <C>macos/Runner/DebugProfile.entitlements</C> and <C>Release.entitlements</C>:
        </P>
        <CodeBlock code={MACOS} />
        <P>iOS, web, Windows and Linux need nothing.</P>
      </Section>

      <Section id="set-up" title="Set up">
        <P>
          Call <C>configure</C> once, before <C>runApp</C>. Use the API key from your dashboard. It
          makes no network calls, so it doesn&apos;t slow down startup.
        </P>
        <CodeBlock code={CONFIGURE} filename="main.dart" />
      </Section>

      <Section id="show-the-board" title="Show the board">
        <P>
          Open the board as a full-screen page. It handles everything inside: the Top and New tabs,
          votes, comments and new requests.
        </P>
        <CodeBlock code={SHOW} />
        <P>Or as a bottom sheet:</P>
        <CodeBlock code={SHEET} />
        <P>
          Or put <C>FewchursBoard</C> anywhere, like a tab or a route:
        </P>
        <CodeBlock code={WIDGET} />
        <P>
          On tablets, web and desktop the board shows the list and the open request side by side.
        </P>
        <P>
          To open one request, for example from a deep link or a notification, pass its ID:
        </P>
        <CodeBlock code={DEEP_LINK} />
      </Section>

      <Section id="colors" title="Colors and theme">
        <P>
          By default the board follows your app&apos;s <C>Theme</C>: colors, fonts and light or dark
          mode. To change it, add a <C>FewchursThemeData</C> to your theme&apos;s extensions.
        </P>
        <CodeBlock code={THEME} />
        <P>
          The <A href={PUB_URL}>package README</A> covers every option: tabs, copy and
          translations, iOS-style widgets, custom pieces of the board, and building your own UI.
        </P>
      </Section>

      <Section id="badge" title="What your plan changes">
        <P>
          Your plan is applied on our servers, so you never need to change code or update the
          package when it changes.
        </P>
        <Table
          head={["", "Free", "Starter", "Pro"]}
          rows={[
            ["Requests the board lists", "First 5", "First 200", "All"],
            ['"Powered by Fewchurs" line', "Shown", "Hidden", "Hidden"],
          ]}
        />
        <P>
          Newer requests are still saved and show in your dashboard. A request someone just
          submitted appears on their board straight away, but once the app is past its limit it
          leaves the list on the next refresh. See <A href="/pricing">pricing</A>.
        </P>
      </Section>

      <Section id="api-key" title="About the API key">
        <P>
          It&apos;s fine to put this key in your app. It can only do what the board does: list,
          vote, comment and suggest. It can&apos;t change your settings or read anything private.
        </P>
        <Note>
          The package gives each device a random ID and saves it on the device. That is how it
          remembers votes without an account. Read more in <A href="/docs/concepts">How it works</A>.
        </Note>
      </Section>
    </DocsPage>
  );
}
