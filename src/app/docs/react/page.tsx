import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Step, Steps, Sub, Table } from "@/components/docs/Docs";

export const metadata: Metadata = pageMetadata({
  title: "React SDK",
  description:
    "Add a floating button to any React app that opens your feature request board in a sheet.",
  path: "/docs/react",
});

const TOC = [
  { id: "install", label: "Install" },
  { id: "add-the-button", label: "Add the feedback button" },
  { id: "change-the-look", label: "Change the look" },
  { id: "own-button", label: "Open the sheet from your own button" },
  { id: "full-page-board", label: "Use a full page board" },
  { id: "api-key", label: "Keeping the key private" },
  { id: "going-live", label: "Localhost and going live" },
  { id: "one-request", label: "Link to one request" },
  { id: "your-own-ui", label: "Build your own UI" },
  { id: "errors", label: "Handling errors" },
  { id: "users", label: "Signed-in users" },
  { id: "badge", label: "The \"Powered by\" badge" },
];

const INSTALL = `npm install @fewchurs/react`;

const UPGRADE = `npm install @fewchurs/react@latest`;

const BUTTON = `import { FewchursButton, FewchursProvider } from "@fewchurs/react";
import "@fewchurs/react/styles.css";

export function App() {
  return (
    <FewchursProvider apiKey={import.meta.env.VITE_FEWCHURS_KEY}>
      {/* the rest of your app */}
      <FewchursButton floating />
    </FewchursProvider>
  );
}`;

const BUTTON_PROPS = `<FewchursButton
  floating="left"
  tabs={["top", "new", "roadmap"]}
  theme={{ primary: "#0f766e", radius: 8 }}
>
  Suggest a feature
</FewchursButton>`;

const BOARD = `import { FewchursBoard, FewchursProvider } from "@fewchurs/react";
import "@fewchurs/react/styles.css";

export function App() {
  return (
    <FewchursProvider apiKey={import.meta.env.VITE_FEWCHURS_KEY}>
      <FewchursBoard />
    </FewchursProvider>
  );
}`;

const PROXY = `// Your server adds the API key. The browser never sees it.
<FewchursProvider baseUrl="/api/fewchurs">
  <FewchursButton floating />
</FewchursProvider>`;

const LOOK = `<FewchursBoard
  theme={{ primary: "#0f766e", radius: 8 }}
  labels={{ title: "Ideas", submit: "Suggest an idea" }}
/>`;

const RENDER = `<FewchursBoard
  renderFeature={(feature, actions) => (
    <MyRow feature={feature} onVote={actions.toggleVote} />
  )}
/>

// Or put the parts together yourself
<FewchursBoard.Root unstyled>
  <FewchursBoard.Tabs />
  <FewchursBoard.List />
  <FewchursBoard.SubmitTrigger />
</FewchursBoard.Root>`;

const DIALOG = `import { useState } from "react";
import { FewchursBoardDialog, FewchursProvider } from "@fewchurs/react";
import "@fewchurs/react/styles.css";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <FewchursProvider apiKey={import.meta.env.VITE_FEWCHURS_KEY}>
      <button onClick={() => setOpen(true)}>Feedback</button>
      <FewchursBoardDialog variant="sheet" open={open} onClose={() => setOpen(false)} />
    </FewchursProvider>
  );
}`;

const ONE_REQUEST = `// e.g. /feedback?request=abc123
const requestId = new URLSearchParams(location.search).get("request");

<FewchursBoard initialFeatureId={requestId ?? undefined} />`;

const ONE_REQUEST_HOOK = `const { feature, isLoading, error, refresh } = useFeature(requestId);`;

const HOOKS = `const { features, isLoading, loadMore, hasMore } = useFeatures({ sort: "top" });
const { hasVoted, upvoteCount, toggle } = useVote(featureId);
const { comments, add } = useComments(featureId);
const { submit, isPending } = useSubmitFeature();
const { isFollowing, follow, unfollow } = useFollow(featureId);
const { feature } = useFeature(featureId);`;

const ERRORS = `import { useSubmitFeature } from "@fewchurs/react";
import { userMessage } from "@fewchurs/react/core";

const { submit, error } = useSubmitFeature();

const feature = await submit({ title, description });
if (!feature && error) {
  showToast(userMessage(error)); // a friendly sentence for your users
}`;

const USERS = `// Use a hash of your user's ID, never the raw ID or an email
<FewchursProvider apiKey={key} deviceId={hashedUserId}>`;

const ENV_LOCAL = `VITE_FEWCHURS_KEY=fr_live_xxx`;

const APP_ID_HEADER = `X-Fewchurs-App-Id: yourcompany.com`;

export default function ReactDocsPage() {
  return (
    <DocsPage
      path="/docs/react"
      title="React"
      intro="A floating button that opens your feature board in a sheet, for any React app: Vite, Create React App, Remix or your own setup."
      meta="Needs React 18 or later."
      toc={TOC}
    >
      <Section id="install" title="Install">
        <CodeBlock code={INSTALL} />
        <P>
          Using Next.js? Follow the <A href="/docs/nextjs">Next.js guide</A> instead. It keeps
          your key on the server.
        </P>
      </Section>

      <Section id="add-the-button" title="Add the feedback button">
        <P>
          Wrap your app in <C>FewchursProvider</C> with your API key, and add{" "}
          <C>FewchursButton</C> once. Import the styles file once too.
        </P>
        <CodeBlock code={BUTTON} filename="App.tsx" />
        <P>
          A <strong>Feedback</strong> button now stays on the bottom right of every page.
          Pressing it slides in your feature board as a sheet, or from the bottom on phones.
        </P>
        <Table
          head={["In the sheet", "What happens"]}
          rows={[
            [
              <strong key="n">New request</strong>,
              "Shows only the form. The requests come back after Cancel or a successful submit.",
            ],
            [
              <strong key="c">Comments</strong>,
              "Opens the comments and a comment box in a popup.",
            ],
            [
              <strong key="f">Notify me</strong>,
              "Opens a popup that asks for an email, to hear when the request ships.",
            ],
          ]}
        />
        <P>
          A popup closes with its × button, Escape, or a click outside it. The sheet stays open
          behind it.
        </P>
        <Note>
          The sheet as described here needs <C>@fewchurs/react</C> 1.7.0 or later. To upgrade, run{" "}
          <C>{UPGRADE}</C>.
        </Note>
      </Section>

      <Section id="api-key" title="Keeping the key private">
        <P>
          In an app with no server, the key ends up in your JavaScript files. That is okay: it
          only works for your board, and each device has daily limits.
        </P>
        <P>
          If you have a server and want to hide the key, send the board&apos;s calls to your own
          server instead. Your server adds the key and forwards the call.
        </P>
        <CodeBlock code={PROXY} />
      </Section>

      <Section id="going-live" title="Localhost and going live">
        <P>
          Your API key only works from the domain you add to your app. The visitor&apos;s browser
          reports the domain on every call, so there is nothing to set in your code.
        </P>

        <Sub>While you build on localhost</Sub>
        <P>You only need your API key. There is nothing to add in the dashboard yet.</P>
        <CodeBlock code={ENV_LOCAL} filename=".env" />
        <P>
          <C>localhost</C> and <C>127.0.0.1</C> always work. That also means a board that works on
          localhost doesn&apos;t prove your domain is set up. You can only check that on your live
          site.
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
            <P>
              Set your key where your site is built, for example <C>VITE_FEWCHURS_KEY</C> on your
              host, then deploy.
            </P>
          </Step>
          <Step>
            <P>Open the board on your live site. You should see your requests.</P>
          </Step>
        </Steps>
        <Note tone="warning">
          Don&apos;t skip the domain. The board can work on localhost and still be refused on your
          live site if your domain isn&apos;t added.
        </Note>

        <Sub>Which addresses work</Sub>
        <P>If you add <C>yourcompany.com</C>:</P>
        <Table
          head={["Your site runs on", "Result"]}
          rows={[
            [<C key="u">http://localhost:5173</C>, "Works"],
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

        <Sub>Staging and preview sites</Sub>
        <P>
          A browser can&apos;t change the domain it reports, so there is no setting to override it.
          A site on a different address, like a preview deployment, needs its own app and API key
          in the dashboard.
        </P>

        <Sub>If you use your own server</Sub>
        <P>
          When your server forwards the calls, it should tell Fewchurs your domain. Add this header
          to each call it forwards:
        </P>
        <CodeBlock code={APP_ID_HEADER} />

        <Sub>If something goes wrong</Sub>
        <P>
          When a call is refused, the sheet shows <strong>Invalid API key</strong>. For a domain
          problem, the line under it names the domain to add. For more detail, open your
          browser&apos;s developer tools, go to the Network tab and click the failed call:
        </P>
        <Table
          head={["Status", "What it means", "What to do"]}
          rows={[
            [
              <C key="s">403</C>,
              <>
                This domain isn&apos;t added to the app for this key. The code is{" "}
                <C>wrong_app</C>.
              </>,
              "Add the domain in the dashboard.",
            ],
            [
              <C key="s">401</C>,
              "The key is wrong or no longer active.",
              "Copy the key from the dashboard and deploy again.",
            ],
          ]}
        />
      </Section>

      <Section id="change-the-look" title="Change the look">
        <P>
          Pass your own label as the button&apos;s text. Use <C>floating=&quot;left&quot;</C> for
          the bottom left, or leave out <C>floating</C> to place the button anywhere in your page.
          Every other prop goes to the board in the sheet.
        </P>
        <CodeBlock code={BUTTON_PROPS} />
        <P>
          <C>className</C> and <C>style</C> go on the button itself.
        </P>
        <P>
          The board takes the same props wherever you show it. Set colors and text with props. You can also set CSS variables like{" "}
          <C>--fw-primary</C> and <C>--fw-radius</C>. Light and dark mode follow the
          visitor&apos;s system setting.
        </P>
        <CodeBlock code={LOOK} />
        <P>Want to draw each row yourself? Use a render function, or build the board from parts:</P>
        <CodeBlock code={RENDER} />
        <P>
          <C>unstyled</C> removes all our styles but keeps the behavior and keyboard support.
        </P>
      </Section>

      <Section id="own-button" title="Open the sheet from your own button">
        <P>
          Want to open the sheet from a menu item or a button you already have? Use{" "}
          <C>FewchursBoardDialog</C>. It takes every board prop, plus <C>open</C> and{" "}
          <C>onClose</C>. Escape closes it, and focus returns to the button that opened it.
        </P>
        <CodeBlock code={DIALOG} filename="FeedbackButton.tsx" />
        <P>
          Leave out <C>variant=&quot;sheet&quot;</C> to show the board in a dialog in the middle of
          the screen instead.
        </P>
      </Section>

      <Section id="full-page-board" title="Use a full page board">
        <P>
          Want the board on its own page instead of in a sheet? Use <C>FewchursBoard</C> inside
          the same provider.
        </P>
        <CodeBlock code={BOARD} filename="FeedbackPage.tsx" />
      </Section>

      <Section id="one-request" title="Link to one request">
        <P>
          <C>initialFeatureId</C> shows one request above the list, with its comments already
          open. Use it for a link from an email or a changelog straight to the request someone
          voted on. It works on <C>FewchursButton</C> and <C>FewchursBoardDialog</C> too.
        </P>
        <CodeBlock code={ONE_REQUEST} />
        <P>
          It works the same on the <A href="/docs/nextjs">Next.js board</A>, where the request is
          rendered on the server. If the id no longer exists, the board says &quot;This request no
          longer exists.&quot; and still shows the list. To
          fetch one request without the board, use <C>useFeature</C>:
        </P>
        <CodeBlock code={ONE_REQUEST_HOOK} />
      </Section>

      <Section id="your-own-ui" title="Build your own UI">
        <P>
          The hooks give you the data and actions with no markup. Use them inside{" "}
          <C>FewchursProvider</C>. They share one store, so a vote updates everywhere at once.
        </P>
        <CodeBlock code={HOOKS} />
      </Section>

      <Section id="errors" title="Handling errors">
        <P>
          Nothing throws. When a call fails, you get an <C>error</C> with a <C>code</C>.{" "}
          <C>userMessage(error)</C> turns it into a short sentence you can show.
        </P>
        <CodeBlock code={ERRORS} />
        <Table
          head={["Code", "What happened"]}
          rows={[
            [
              <C key="1">invalid_key</C>,
              "The API key is wrong or turned off, or this domain isn't added to your app (from version 1.1.0).",
            ],
            [<C key="2">validation_failed</C>, "Something in the form is missing or too long."],
            [<C key="3">rate_limited</C>, "This device hit its daily limit."],
            [<C key="4">limit_reached</C>, "Your plan's limit was reached."],
            [<C key="5">not_found</C>, "That request no longer exists."],
            [<C key="6">network</C>, "No connection, or the server didn't answer."],
            [<C key="7">server</C>, "Something broke on our side. Try again."],
          ]}
        />
      </Section>

      <Section id="users" title="Signed-in users">
        <P>
          By default each visitor gets a random ID, saved in the browser. If your app has
          accounts, pass a hashed user ID. Then votes follow the person to every device.
        </P>
        <CodeBlock code={USERS} />
      </Section>

      <Section id="badge" title='The "Powered by" badge'>
        <P>
          The free plan shows a small &quot;Powered by Fewchurs&quot; line. It goes away on its
          own when you upgrade to <A href="/pricing">Starter or Pro</A>.
        </P>
        <Note>
          Stuck? If the sheet says &quot;Fewchurs isn&apos;t set up&quot;, the API key is missing.
          Check that the environment variable is set where your app is built.
        </Note>
      </Section>
    </DocsPage>
  );
}
