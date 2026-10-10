import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, DocsPage, Note, P, Section, Step, Steps } from "@/components/docs/Docs";
import { API_BASE_URL } from "@/lib/docs/nav";

export const metadata: Metadata = {
  title: "Android (Kotlin) — Docs — Fewchurs",
  description: "Use Fewchurs in your Android app with Kotlin.",
};

const TOC = [
  { id: "status", label: "SDK status" },
  { id: "use-the-api", label: "Use the API today" },
  { id: "next", label: "What's next" },
];

const GRADLE = `dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}`;

const CLIENT = `import android.content.Context
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID

class Fewchurs(context: Context, private val apiKey: String) {
    private val http = OkHttpClient()
    private val baseUrl = "${API_BASE_URL}"

    // Made once, then saved. This is how votes are remembered.
    private val deviceId: String = context
        .getSharedPreferences("fewchurs", Context.MODE_PRIVATE)
        .let { prefs ->
            prefs.getString("device_id", null) ?: UUID.randomUUID().toString().also {
                prefs.edit().putString("device_id", it).apply()
            }
        }

    // Call these off the main thread.
    fun topRequests(): JSONObject = send(request("/features?sort=top").build())

    fun vote(featureId: String): JSONObject =
        send(request("/features/$featureId/vote").post(ByteArray(0).toRequestBody()).build())

    fun suggest(title: String, description: String = ""): JSONObject {
        val body = JSONObject()
            .put("title", title)
            .put("description", description)
            .toString()
            .toRequestBody("application/json".toMediaType())
        return send(request("/features").post(body).build())
    }

    private fun request(path: String) = Request.Builder()
        .url(baseUrl + path)
        .header("Authorization", "Bearer $apiKey")
        .header("X-Device-Id", deviceId)

    private fun send(request: Request): JSONObject =
        http.newCall(request).execute().use { response ->
            val json = JSONObject(response.body!!.string())
            if (!response.isSuccessful) error(json.getJSONObject("error").getString("message"))
            json
        }
}`;

const USE = `val fewchurs = Fewchurs(applicationContext, "fr_live_xxx")

lifecycleScope.launch {
    val page = withContext(Dispatchers.IO) { fewchurs.topRequests() }
    val requests = page.getJSONArray("features")
    // show them in your list
}`;

export default function KotlinDocsPage() {
  return (
    <DocsPage
      path="/docs/kotlin"
      title="Android (Kotlin)"
      intro="The Android SDK is on the way. Until then, you can call the REST API from your app with a few lines of Kotlin."
      toc={TOC}
    >
      <Section id="status" title="SDK status">
        <Note title="Coming soon">
          The Android SDK will give you a ready-made board for Jetpack Compose, like the{" "}
          <A href="/docs/swiftui">iOS one</A>. It isn&apos;t released yet.
        </Note>
      </Section>

      <Section id="use-the-api" title="Use the API today">
        <Steps>
          <Step title="Add OkHttp">
            <CodeBlock code={GRADLE} filename="app/build.gradle.kts" />
          </Step>
          <Step title="Add a small client">
            <P>
              Copy this class into your app. It makes a device ID once and sends your key with
              every call.
            </P>
            <CodeBlock code={CLIENT} filename="Fewchurs.kt" />
          </Step>
          <Step title="Use it">
            <CodeBlock code={USE} />
          </Step>
        </Steps>
        <P>
          It&apos;s fine to put the API key in your app. It can only do what the board does.
        </P>
      </Section>

      <Section id="next" title="What's next">
        <P>
          The <A href="/docs/api">REST API reference</A> lists every call: comments, following,
          paging and errors.
        </P>
      </Section>
    </DocsPage>
  );
}
