import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Table } from "@/components/docs/Docs";

export const metadata: Metadata = {
  title: "React — Docs — Fewchurs",
  description: "Add a feature request board to any React app.",
};

const TOC = [
  { id: "install", label: "Install" },
  { id: "show-the-board", label: "Show the board" },
  { id: "api-key", label: "Keeping the key private" },
  { id: "change-the-look", label: "Change the look" },
  { id: "your-own-ui", label: "Build your own UI" },
  { id: "errors", label: "Handling errors" },
  { id: "users", label: "Signed-in users" },
  { id: "badge", label: "The \"Powered by\" badge" },
];

const INSTALL = `npm install @fewchurs/react`;

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
  <FewchursBoard />
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

const HOOKS = `const { features, isLoading, loadMore, hasMore } = useFeatures({ sort: "top" });
const { hasVoted, upvoteCount, toggle } = useVote(featureId);
const { comments, add } = useComments(featureId);
const { submit, isPending } = useSubmitFeature();
const { isFollowing, follow, unfollow } = useFollow(featureId);`;

const ERRORS = `import { useSubmitFeature } from "@fewchurs/react";
import { userMessage } from "@fewchurs/react/core";

const { submit, error } = useSubmitFeature();

const feature = await submit({ title, description });
if (!feature && error) {
  showToast(userMessage(error)); // a friendly sentence for your users
}`;

const USERS = `// Use a hash of your user's ID, never the raw ID or an email
<FewchursProvider apiKey={key} deviceId={hashedUserId}>`;

export default function ReactDocsPage() {
  return (
    <DocsPage
      path="/docs/react"
      title="React"
      intro="Add a feature request board to any React app: Vite, Create React App, Remix or your own setup."
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

      <Section id="show-the-board" title="Show the board">
        <P>
          Wrap the board in <C>FewchursProvider</C> and give it your API key. Import the styles
          file once.
        </P>
        <CodeBlock code={BOARD} filename="App.tsx" />
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

      <Section id="change-the-look" title="Change the look">
        <P>
          Set colors and text with props. You can also set CSS variables like{" "}
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
            [<C key="1">invalid_key</C>, "The API key is wrong or turned off."],
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
          own when you upgrade to <A href="/pricing">Pro</A>.
        </P>
        <Note>
          Stuck? A board that loads but stays empty usually means the API key is missing. Check
          that the environment variable is set where your app is built.
        </Note>
      </Section>
    </DocsPage>
  );
}
