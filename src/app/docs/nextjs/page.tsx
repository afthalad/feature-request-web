import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Step, Steps } from "@/components/docs/Docs";

export const metadata: Metadata = {
  title: "Next.js — Docs — Fewchurs",
  description: "Add a server-rendered feature request board to your Next.js app.",
};

const TOC = [
  { id: "set-up", label: "Set up" },
  { id: "signed-in-users", label: "Signed-in users" },
  { id: "change-the-look", label: "Change the look" },
  { id: "your-own-ui", label: "Build your own UI" },
  { id: "badge", label: "The \"Powered by\" badge" },
];

const INSTALL = `npm install @fewchurs/next`;

const ENV = `FEWCHURS_API_KEY=fr_live_xxx`;

const HANDLER = `export { GET, POST, DELETE } from "@fewchurs/next/handler";`;

const PAGE = `import { FewchursBoard } from "@fewchurs/next";
import "@fewchurs/react/styles.css";

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
  tabs={["top", "new", "roadmap"]}
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

      <Section id="badge" title='The "Powered by" badge'>
        <P>
          The free plan shows a small &quot;Powered by Fewchurs&quot; line. It goes away on its
          own when you upgrade to <A href="/pricing">Pro</A>.
        </P>
        <Note>
          Stuck? A board that loads but stays empty usually means <C>FEWCHURS_API_KEY</C> is
          missing on the server. Check your terminal for a message from Fewchurs.
        </Note>
      </Section>
    </DocsPage>
  );
}
