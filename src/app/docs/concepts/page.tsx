import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { CodeBlock } from "@/components/docs/CodeBlock";
import {
  A,
  C,
  DocsPage,
  Note,
  P,
  Section,
  Sub,
  Table,
} from "@/components/docs/Docs";

export const metadata: Metadata = pageMetadata({
  title: "How it works",
  description:
    "The few ideas behind Fewchurs: apps, API keys, requests, votes, statuses and device IDs.",
  path: "/docs/concepts",
});

const TOC = [
  { id: "the-pieces", label: "The pieces" },
  { id: "app-ids", label: "Find your app IDs" },
  { id: "statuses", label: "Statuses" },
  { id: "who-is-voting", label: "Who is voting" },
  { id: "emails", label: "Emails" },
  { id: "limits", label: "Limits" },
];

const GRADLE = `android {
    defaultConfig {
        applicationId = "com.yourcompany.app"
    }
}`;

const FIND_IDS = `grep applicationId android/app/build.gradle*
grep PRODUCT_BUNDLE_IDENTIFIER ios/Runner.xcodeproj/project.pbxproj`;

export default function ConceptsPage() {
  return (
    <DocsPage
      path="/docs/concepts"
      title="How it works"
      intro="A few simple ideas. Read this once and every guide will make sense."
      toc={TOC}
    >
      <Section id="the-pieces" title="The pieces">
        <Table
          head={["Word", "What it means"]}
          rows={[
            [
              <strong key="a">App</strong>,
              "One of your products. Each app has its own board, requests and API key.",
            ],
            [
              <strong key="k">API key</strong>,
              <>
                A secret-looking string that starts with <C>fr_live_</C>. It
                tells Fewchurs which app a request is for. It only works in the apps and
                websites you added: your iOS Bundle ID, Android package name or website domain.
              </>,
            ],
            [
              <strong key="b">Board</strong>,
              "The list your users see. They can read, vote, comment and suggest new ideas.",
            ],
            [
              <strong key="r">Request</strong>,
              "One idea from a user, with a title and an optional description.",
            ],
            [
              <strong key="v">Vote</strong>,
              "One per person per request. The board can sort by most votes.",
            ],
            [
              <strong key="c">Comment</strong>,
              "A reply under a request. Your replies show a Developer badge.",
            ],
          ]}
        />
      </Section>

      <Section id="app-ids" title="Find your app IDs">
        <P>
          Your API key only works in the apps and websites you add to your app in the dashboard.
          Here is where to find each ID.
        </P>
        <Table
          head={["You build with", "iOS Bundle ID", "Android package name"]}
          rows={[
            [
              <strong key="f">Flutter</strong>,
              <>
                Open <C>ios/Runner.xcworkspace</C> in Xcode, then Runner → General → Bundle
                Identifier.
              </>,
              <>
                <C>applicationId</C> in <C>android/app/build.gradle</C> or{" "}
                <C>build.gradle.kts</C>.
              </>,
            ],
            [
              <strong key="s">SwiftUI</strong>,
              "In Xcode: your target → General → Bundle Identifier.",
              "—",
            ],
            [
              <strong key="k">Kotlin</strong>,
              "—",
              <>
                <C>applicationId</C> in <C>app/build.gradle.kts</C>.
              </>,
            ],
          ]}
        />
        <P>In a Flutter project, the Android package name looks like this:</P>
        <CodeBlock code={GRADLE} filename="android/app/build.gradle.kts" />
        <P>Or run this in your Flutter project folder to print both:</P>
        <CodeBlock code={FIND_IDS} />
        <P>
          For iOS, use the line without <C>RunnerTests</C>. On iOS and Android the ID is often
          the same, like <C>com.yourcompany.app</C>.
        </P>
        <Note title="Use applicationId, not namespace">
          Android projects also have a <C>namespace</C>. It can be different. Fewchurs checks the{" "}
          <C>applicationId</C>. Debug builds that add <C>.debug</C> to the end work too.
        </Note>
        <Sub>Website domain</Sub>
        <P>
          For React, Next.js and Laravel, the ID is your website&apos;s domain. It&apos;s the
          address your live site opens on, without the rest of the link:
        </P>
        <Table
          head={["You build with", "Where to find it"]}
          rows={[
            [
              <strong key="r">React</strong>,
              "The address bar when you open your live site.",
            ],
            [
              <strong key="n">Next.js</strong>,
              <>
                The address bar when you open your live site, or the domain listed in your
                host&apos;s settings, like <strong>Domains</strong> on Vercel.
              </>,
            ],
            [
              <strong key="l">Laravel</strong>,
              "The address bar when you open your live site.",
            ],
          ]}
        />
        <P>Take the main domain out of the address:</P>
        <Table
          head={["Your site's address", "Add this"]}
          rows={[
            [<C key="a">https://yourcompany.com</C>, <C key="b">yourcompany.com</C>],
            [<C key="a">https://www.yourcompany.com/feedback</C>, <C key="b">yourcompany.com</C>],
            [<C key="a">https://app.yourcompany.com</C>, <C key="b">yourcompany.com</C>],
          ]}
        />
        <P>
          Leave out <C>https://</C>, <C>www.</C> and anything after the domain. Subdomains like{" "}
          <C>www.yourcompany.com</C> and <C>app.yourcompany.com</C> work on their own once you add
          the main domain. If you add a subdomain instead, only that subdomain and the ones under
          it work.
        </P>
        <P>
          You don&apos;t need to add <C>localhost</C>. It always works while you build. Each
          guide&apos;s &quot;Localhost and going live&quot; section shows the full steps:{" "}
          <A href="/docs/react#going-live">React</A>, <A href="/docs/nextjs#going-live">Next.js</A>{" "}
          and <A href="/docs/laravel#going-live">Laravel</A>.
        </P>
      </Section>

      <Section id="statuses" title="Statuses">
        <P>
          You set the status of each request from your dashboard. Users see it
          on the board, so they know what is happening.
        </P>
        <Table
          head={["Status", "Shown as", "Meaning"]}
          rows={[
            [<C key="1">open</C>, "Pending", "New. You have not decided yet."],
            [<C key="2">planned</C>, "Planned", "You plan to build it."],
            [
              <C key="3">in_progress</C>,
              "In progress",
              "You are building it now.",
            ],
            [<C key="4">done</C>, "Done", "It shipped."],
            [<C key="5">declined</C>, "Declined", "You won't build it."],
          ]}
        />
      </Section>

      <Section id="who-is-voting" title="Who is voting">
        <P>
          Your users don&apos;t need an account. Each device gets a random ID,
          called a <strong>device ID</strong>. Fewchurs uses it to remember who
          voted for what, so nobody votes twice.
        </P>
        <P>
          The SDKs make and store this ID for you. If you call the{" "}
          <A href="/docs/api">REST API</A> yourself, send it in the{" "}
          <C>X-Device-Id</C> header. Create it once, save it, and reuse it every
          time.
        </P>
        <Note title="Use your own user ID if you have one">
          If your app has accounts, use a hash of the user&apos;s ID as the
          device ID. Then votes follow the person to every device. Never send a
          raw user ID or an email address.
        </Note>
      </Section>

      <Section id="emails" title="Emails">
        <P>
          Users can follow a request by leaving their email. When you change its
          status, they get an email. You can also get an email each time someone
          suggests something new. Turn it on in your dashboard settings.
        </P>
      </Section>

      <Section id="limits" title="Limits">
        <Table
          head={["What", "Limit"]}
          rows={[
            ["New requests", "15 per device, per day"],
            ["Comments", "10 per device, per day"],
            ["Votes", "No limit"],
          ]}
        />
        <P>
          Your plan sets how many apps you can have and how many requests stay
          visible. See <A href="/pricing">pricing</A>.
        </P>
      </Section>
    </DocsPage>
  );
}
