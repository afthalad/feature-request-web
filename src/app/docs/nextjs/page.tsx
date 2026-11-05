import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Step, Steps, Sub, Table } from "@/components/docs/Docs";

export const metadata: Metadata = {
  title: "Next.js — Docs — Fewchurs",
  description: "Add a server-rendered feature request board to your Next.js app.",
};

const TOC = [
  { id: "set-up", label: "Set up" },
  { id: "signed-in-users", label: "Signed-in users" },
  { id: "change-the-look", label: "Change the look" },
  { id: "your-own-ui", label: "Build your own UI" },
  { id: "going-live", label: "Localhost and going live" },
  { id: "badge", label: "The \"Powered by\" badge" },
];

const INSTALL = `npm install @fewchurs/next`;

const ENV = `FEWCHURS_API_KEY=fr_live_xxx`;

const HANDLER = `export { GET, POST, DELETE } from "@fewchurs/next/handler";`;

const PAGE = `import { FewchursBoard } from "@fewchurs/next";
import "@fewchurs/next/styles.css";

export default function FeedbackPage() {
  return <FewchursBoard />;
}`;

const USERS = `import { createHandler } from "@fewchurs/next/handler";
import { createHash } from "node:crypto";

export const { GET, POST, DELETE } = createHandler({
  deviceId: async () => {
    const session = await auth(); // your own auth
    return session
      ? createHash("sha256").update(session.userId).digest("hex")
      : crypto.randomUUID();
  },
});`;

const PROPS = `<FewchursBoard
  tabs={["top", "new"]}
  defaultTab="top"
  allowComments
  emailField="optional"
  theme={{ primary: "#0f766e", radius: 8 }}
  labels={{ title: "Ideas", submit: "Suggest an idea" }}
/>`;

const HOOKS = `"use client";

import { FewchursProvider, useFeatures } from "@fewchurs/react";

function Ideas() {
  const { features, loadMore, hasMore } = useFeatures({ sort: "top" });
  // your own markup
}

export function Feedback() {
  // Talks to your route handler, so the key stays on the server
  return (
    <FewchursProvider baseUrl="/api/fewchurs">
      <Ideas />
    </FewchursProvider>
  );
}`;

const ENV_APP_ID = `FEWCHURS_APP_ID=yourcompany.com`;

const APP_ID_OPTION = `// app/api/fewchurs/[...route]/route.ts
export const { GET, POST, DELETE } = createHandler({ appId: "docs.yourcompany.com" });

// app/feedback/page.tsx
<FewchursBoard appId="docs.yourcompany.com" />`;

const REFUSED_LOG = `[fewchurs] This API key is not set up for yourcompany.com. Add it to your app in the Fewchurs dashboard.`;

export default function NextJsDocsPage() {
  return (
    <DocsPage
      path="/docs/nextjs"
      title="Next.js"
      intro="A board that renders on your server. Your API key never reaches the browser."
      meta="Needs Next.js 14 or later with the App Router, React 18 or later, and Node 20 or later."
      toc={TOC}
    >
      <Section id="set-up" title="Set up">
        <Steps>
          <Step title="Install the package">
            <CodeBlock code={INSTALL} />
          </Step>
          <Step title="Add your API key">
            <P>
              Put the key in your environment file. Don&apos;t start the name with{" "}
              <C>NEXT_PUBLIC_</C>, or it will be sent to the browser.
            </P>
            <CodeBlock code={ENV} filename=".env.local" />
          </Step>
          <Step title="Add the route handler">
            <P>
              Create this one file. When a visitor votes or comments, the board calls this route.
              The route adds your key and passes the call to Fewchurs.
            </P>
            <CodeBlock code={HANDLER} filename="app/api/fewchurs/[...route]/route.ts" />
          </Step>
          <Step title="Show the board on a page">
            <CodeBlock code={PAGE} filename="app/feedback/page.tsx" />
            <P>
              The board loads on the server, so the page arrives with the requests already in it.
              Search engines can read them too.
            </P>
          </Step>
        </Steps>
      </Section>

      <Section id="signed-in-users" title="Signed-in users">
        <P>
          By default each visitor gets a random ID, saved in a cookie. If your app has accounts,
          use a hash of the user&apos;s ID instead. Then votes follow the person to every device.
        </P>
        <CodeBlock code={USERS} filename="app/api/fewchurs/[...route]/route.ts" />
        <Note tone="warning">Always hash the ID. Never send a raw user ID or an email address.</Note>
      </Section>

      <Section id="change-the-look" title="Change the look">
        <P>
          Pick which tabs to show, whether people can comment, and your colors and text. You can
          also use CSS variables like <C>--fw-primary</C>, <C>--fw-radius</C> and{" "}
          <C>--fw-font</C>.
        </P>
        <CodeBlock code={PROPS} />
        <P>
          <C>initialFeatureId</C> shows one request above the list, with its comments open and
          rendered on the server — handy for a link from an email straight to a request. See{" "}
          <A href="/docs/react#one-request">Link to one request</A>.
        </P>
        <P>
          Need functions as props, like <C>renderFeature</C>? Those can&apos;t be passed to a
          server component. Use the board from <A href="/docs/react">@fewchurs/react</A> in a{" "}
          <C>&quot;use client&quot;</C> file instead.
        </P>
      </Section>

      <Section id="your-own-ui" title="Build your own UI">
        <P>
          Use the React hooks in a client component. Point the provider at your route handler and
          the key still stays on the server.
        </P>
        <CodeBlock code={HOOKS} />
        <P>
          Every hook is listed in the <A href="/docs/react">React guide</A>.
        </P>
      </Section>

      <Section id="going-live" title="Localhost and going live">
        <P>
          Your API key only works from the domain you add to your app. Next.js handles this for
          you. The package reads the domain from each request and sends it to Fewchurs. This
          applies to <C>@fewchurs/next</C> 1.1.0 and later.
        </P>

        <Sub>While you build on localhost</Sub>
        <P>
          You only need your API key. There is nothing to add in the dashboard yet.{" "}
          <C>localhost</C> and <C>127.0.0.1</C> always work.
        </P>

        <Sub>When you go live</Sub>
        <Steps>
          <Step>
            <P>Open your app in the <A href="/dashboard">Fewchurs dashboard</A>.</P>
          </Step>
          <Step>
            <P>Under <strong>Where does your app run?</strong> pick <strong>Web</strong>.</P>
          </Step>
          <Step>
            <P>
              Add just the domain in <strong>Website domain</strong>, like <C>yourcompany.com</C>.
              Leave out <C>https://</C>.
            </P>
          </Step>
          <Step>
            <P>
              Click <strong>Save changes</strong>. A new domain can take up to a minute to work.
            </P>
          </Step>
          <Step>
            <P>Add <C>FEWCHURS_API_KEY</C> to the environment variables on your host, then deploy.</P>
          </Step>
          <Step>
            <P>Open the board on your live site. You should see your requests.</P>
          </Step>
        </Steps>
        <Note tone="warning">
          Don&apos;t skip the domain. The board can work on localhost and still be refused on your
          live site if your domain isn&apos;t added. If you&apos;re upgrading from an older version,
          add it before you deploy the upgrade.
        </Note>

        <Sub>Test your domain before you go live</Sub>
        <P>You can check your domain from localhost:</P>
        <Steps>
          <Step>
            <P>Add this line to your <C>.env.local</C>:</P>
            <CodeBlock code={ENV_APP_ID} filename=".env.local" />
          </Step>
          <Step>
            <P>Restart your dev server and open the board.</P>
          </Step>
        </Steps>
        <P>
          If you see your requests your domain is set up. Remove the line when you&apos;re done. If
          you only just added the domain and it&apos;s refused, wait a minute and reload.
        </P>

        <Sub>Which addresses work</Sub>
        <P>If you add <C>yourcompany.com</C>:</P>
        <Table
          head={["Your site runs on", "Result"]}
          rows={[
            [<C key="u">http://localhost:3000</C>, "Works"],
            [<C key="u">https://yourcompany.com</C>, "Works"],
            [<C key="u">https://www.yourcompany.com</C>, "Works"],
            [<C key="u">https://app.yourcompany.com</C>, "Works"],
            [<C key="u">https://othercompany.com</C>, "Refused"],
            [<C key="u">https://yourapp.vercel.app</C>, "Refused"],
          ]}
        />
        <P>
          Subdomains of the domain you add work on their own. It doesn&apos;t work the other way:
          if you add <C>app.yourcompany.com</C> then <C>yourcompany.com</C> is refused. Add the
          main domain if you use more than one.
        </P>

        <Sub>
          When you need <C>FEWCHURS_APP_ID</C>
        </Sub>
        <P>
          Most sites don&apos;t need it. It replaces the domain the package reads from the request.
          Use it when your site runs on an address you didn&apos;t add, for example a preview
          deployment:
        </P>
        <CodeBlock code={ENV_APP_ID} />
        <P>
          If you have more than one board you can give each one its own ID. Set it on both the route
          handler and the board:
        </P>
        <CodeBlock code={APP_ID_OPTION} />

        <Sub>If something goes wrong</Sub>
        <P>
          When a call is refused, visitors see &quot;Feedback is unavailable right now.&quot; If the
          domain is the cause, your server log names it:
        </P>
        <CodeBlock code={REFUSED_LOG} />
        <P>
          Add that domain in the dashboard. If the domain in the message is wrong, set{" "}
          <C>FEWCHURS_APP_ID</C>. If the log doesn&apos;t mention a domain, copy your key from the
          dashboard into your environment variables and deploy again.
        </P>
      </Section>

      <Section id="badge" title='The "Powered by" badge'>
        <P>
          The free plan shows a small &quot;Powered by Fewchurs&quot; line. It goes away on its
          own when you upgrade to <A href="/pricing">Starter or Pro</A>.
        </P>
        <Note>
          Stuck? A board that loads but stays empty usually means <C>FEWCHURS_API_KEY</C> is
          missing on the server. Check your terminal for a message from Fewchurs.
        </Note>
      </Section>
    </DocsPage>
  );
}
