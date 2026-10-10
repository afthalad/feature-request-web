import type { Metadata } from "next";
import { A, C, DocsPage, Note, P, Section, Table } from "@/components/docs/Docs";

export const metadata: Metadata = {
  title: "How it works — Docs — Fewchurs",
  description: "The few ideas behind Fewchurs: apps, API keys, requests, votes, statuses and device IDs.",
};

const TOC = [
  { id: "the-pieces", label: "The pieces" },
  { id: "statuses", label: "Statuses" },
  { id: "who-is-voting", label: "Who is voting" },
  { id: "emails", label: "Emails" },
  { id: "limits", label: "Limits" },
];

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
            [<strong key="a">App</strong>, "One of your products. Each app has its own board, requests and API key."],
            [<strong key="k">API key</strong>, <>A secret-looking string that starts with <C>fr_live_</C>. It tells Fewchurs which app a request is for.</>],
            [<strong key="b">Board</strong>, "The list your users see. They can read, vote, comment and suggest new ideas."],
            [<strong key="r">Request</strong>, "One idea from a user, with a title and an optional description."],
            [<strong key="v">Vote</strong>, "One per person per request. The board can sort by most votes."],
            [<strong key="c">Comment</strong>, "A reply under a request. Your replies show a Developer badge."],
          ]}
        />
      </Section>

      <Section id="statuses" title="Statuses">
        <P>
          You set the status of each request from your dashboard. Users see it on the board, so
          they know what is happening.
        </P>
        <Table
          head={["Status", "Shown as", "Meaning"]}
          rows={[
            [<C key="1">open</C>, "Pending", "New. You have not decided yet."],
            [<C key="2">planned</C>, "Planned", "You plan to build it."],
            [<C key="3">in_progress</C>, "In progress", "You are building it now."],
            [<C key="4">done</C>, "Done", "It shipped."],
            [<C key="5">declined</C>, "Declined", "You won't build it."],
          ]}
        />
      </Section>

      <Section id="who-is-voting" title="Who is voting">
        <P>
          Your users don&apos;t need an account. Each device gets a random ID, called a{" "}
          <strong>device ID</strong>. Fewchurs uses it to remember who voted for what, so nobody
          votes twice.
        </P>
        <P>
          The SDKs make and store this ID for you. If you call the <A href="/docs/api">REST API</A>{" "}
          yourself, send it in the <C>X-Device-Id</C> header. Create it once, save it, and reuse
          it every time.
        </P>
        <Note title="Use your own user ID if you have one">
          If your app has accounts, use a hash of the user&apos;s ID as the device ID. Then votes
          follow the person to every device. Never send a raw user ID or an email address.
        </Note>
      </Section>

      <Section id="emails" title="Emails">
        <P>
          Users can follow a request by leaving their email. When you change its status, they get
          an email. You can also get an email each time someone suggests something new. Turn it on
          in your dashboard settings.
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
          Your plan sets how many apps you can have and how many requests stay visible. See{" "}
          <A href="/pricing">pricing</A>.
        </P>
      </Section>
    </DocsPage>
  );
}
