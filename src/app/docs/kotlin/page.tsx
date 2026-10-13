import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Step, Steps } from "@/components/docs/Docs";

export const metadata: Metadata = {
  title: "Android (Kotlin) — Docs — Fewchurs",
  description: "Add a feature request board to your Android app with Kotlin and Jetpack Compose.",
};

const TOC = [
  { id: "install", label: "Install" },
  { id: "set-up", label: "Set up" },
  { id: "show-the-board", label: "Show the board" },
  { id: "views", label: "Using Views" },
  { id: "colors", label: "Colors and theme" },
  { id: "multiplatform", label: "Kotlin Multiplatform" },
  { id: "api-key", label: "About the API key" },
  { id: "badge", label: "The \"Powered by\" badge" },
];

const REPO_URL = "https://github.com/fewchurs/fewchurs-kotlin";
const VERSION = "1.0.0";

const GRADLE = `dependencies {
    implementation("shop.fewchurs:fewchurs-android:${VERSION}")
}`;

const CATALOG = `[libraries]
fewchurs = { module = "shop.fewchurs:fewchurs-android", version = "${VERSION}" }`;

const CATALOG_USE = `dependencies {
    implementation(libs.fewchurs)
}`;

const CONFIGURE = `import android.app.Application
import com.fewchurs.sdk.Fewchurs

class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Fewchurs.configure(this, apiKey = "fr_live_xxx")
    }
}`;

const MANIFEST = `<application
    android:name=".MyApp"
    ...>`;

const SHEET = `import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.fewchurs.sdk.ui.FewchursBoardSheet

@Composable
fun SettingsScreen() {
    var showBoard by remember { mutableStateOf(false) }

    Button(onClick = { showBoard = true }) {
        Text("Suggest a feature")
    }
    FewchursBoardSheet(visible = showBoard, onDismiss = { showBoard = false })
}`;

const SCREEN = `import com.fewchurs.sdk.ui.FewchursBoard

composable("feedback") {
    FewchursBoard(onClose = { navController.popBackStack() })
}`;

const VIEWS = `import com.fewchurs.sdk.Fewchurs

Fewchurs.showBoard(context)`;

const THEME = `import com.fewchurs.sdk.ui.config.*

Fewchurs.configure(this, apiKey = "fr_live_xxx") {
    theme {
        colors {
            primary = Color(0xFFED5F18)
        }
        cornerRadius = 14.dp
        darkMode = DarkMode.System
    }
}`;

const KMP = `kotlin {
    sourceSets {
        androidMain.dependencies {
            implementation("shop.fewchurs:fewchurs-android:${VERSION}")
        }
    }
}`;

export default function KotlinDocsPage() {
  return (
    <DocsPage
      path="/docs/kotlin"
      title="Android (Kotlin)"
      intro="Add a native feature request board to your Android app. It takes three steps."
      meta="Needs Android 6.0 (API 23) or later and Jetpack Compose with Material 3. Apps built with Views work too."
      toc={TOC}
    >
      <Section id="install" title="Install">
        <Steps>
          <Step title="Add the dependency">
            <P>
              The SDK is on Maven Central, which your project already uses. Add one line:
            </P>
            <CodeBlock code={GRADLE} filename="app/build.gradle.kts" />
          </Step>
          <Step title="Or use a version catalog">
            <P>If your project uses a version catalog, add the library there instead:</P>
            <CodeBlock code={CATALOG} filename="gradle/libs.versions.toml" />
            <CodeBlock code={CATALOG_USE} filename="app/build.gradle.kts" />
          </Step>
        </Steps>
      </Section>

      <Section id="set-up" title="Set up">
        <P>
          Call <C>configure</C> once, when your app starts. Use the API key from your dashboard.
        </P>
        <CodeBlock code={CONFIGURE} filename="MyApp.kt" />
        <P>
          If your app doesn&apos;t have an <C>Application</C> class yet, register the new one in
          your manifest:
        </P>
        <CodeBlock code={MANIFEST} filename="AndroidManifest.xml" />
      </Section>

      <Section id="show-the-board" title="Show the board">
        <P>
          <C>FewchursBoardSheet</C> shows the board in a bottom sheet. It handles everything
          inside: the list, votes, comments and new requests.
        </P>
        <CodeBlock code={SHEET} filename="SettingsScreen.kt" />
        <P>
          To use it as a full screen or a navigation destination, use <C>FewchursBoard</C>.
        </P>
        <CodeBlock code={SCREEN} />
      </Section>

      <Section id="views" title="Using Views">
        <P>If your app doesn&apos;t use Compose, open the board in its own screen from anywhere:</P>
        <CodeBlock code={VIEWS} />
      </Section>

      <Section id="colors" title="Colors and theme">
        <P>
          By default the board follows your app: your <C>MaterialTheme</C> colors, shapes and fonts,
          and light or dark mode. To change it, add a <C>theme</C> block to <C>configure</C>.
        </P>
        <CodeBlock code={THEME} />
        <P>
          The <A href={REPO_URL}>SDK README</A> covers every option: copy, tabs, custom pieces of
          the board, and building your own UI on the headless API.
        </P>
      </Section>

      <Section id="multiplatform" title="Kotlin Multiplatform">
        <P>
          The SDK is for Android, so in a Kotlin Multiplatform project add it to{" "}
          <C>androidMain</C>, not <C>commonMain</C>. On iOS, use the{" "}
          <A href="/docs/swiftui">Swift package</A>.
        </P>
        <CodeBlock code={KMP} filename="shared/build.gradle.kts" />
      </Section>

      <Section id="api-key" title="About the API key">
        <P>
          It&apos;s fine to put this key in your app. It can only do what the board does: list,
          vote, comment and suggest. It can&apos;t change your settings or read anything private.
        </P>
        <Note>
          The SDK gives each device a random ID and saves it on the device. That is how it
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
