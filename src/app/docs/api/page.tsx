import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Table } from "@/components/docs/Docs";
import { API_BASE_URL } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "REST API — Docs — Fewchurs",
  description: "Use Fewchurs from any language with plain HTTP requests.",
};

const TOC = [
  { id: "basics", label: "Basics" },
  { id: "headers", label: "Headers" },
  { id: "errors", label: "Errors" },
  { id: "objects", label: "Objects" },
  { id: "get-config", label: "Get board settings" },
  { id: "list-requests", label: "List requests" },
  { id: "get-request", label: "Get one request" },
  { id: "create-request", label: "Create a request" },
  { id: "vote", label: "Vote" },
  { id: "list-comments", label: "List comments" },
  { id: "add-comment", label: "Add a comment" },
  { id: "follow", label: "Follow" },
];

const CURL = `curl ${API_BASE_URL}/features?sort=top \\
  -H "Authorization: Bearer fr_live_xxx" \\
  -H "X-Device-Id: 6f1c2a9e-4b7d-4e0a-9d5f-2c8b1e3a7f10"`;

const ERROR = `{
  "error": {
    "code": "validation_failed",
    "message": "String must contain at least 3 character(s)"
  }
}`;

const FEATURE = `{
  "id": "Xk3pQ9rT2mL8",
  "title": "Dark mode",
  "description": "A dark theme that follows the system.",
  "status": "planned",
  "upvoteCount": 42,
  "commentCount": 3,
  "followerCount": 12,
  "hasVoted": true,
  "isFollowing": false,
  "isMine": false,
  "createdAt": "2026-10-01T09:30:00.000Z",
  "updatedAt": "2026-10-04T14:12:00.000Z"
}`;

const COMMENT = `{
  "id": "c7Hq2LmN0pRs",
  "text": "Planned for the next release.",
  "authorName": "Alex",
  "isDeveloper": true,
  "isMine": false,
  "createdAt": "2026-10-04T14:15:00.000Z"
}`;

function Endpoint({
  id,
  title,
  method,
  path,
  children,
}: {
  id: string;
  title: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  children: ReactNode;
}) {
  return (
    <Section id={id} title={title}>
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-semibold",
            method === "GET" && "bg-blue-500/10 text-blue-700 dark:text-blue-400",
            method === "POST" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            method === "DELETE" && "bg-red-500/10 text-red-700 dark:text-red-400"
          )}
        >
          {method}
        </span>
        <span className="break-all">{path}</span>
      </div>
      {children}
    </Section>
  );
}

export default function ApiDocsPage() {
  return (
    <DocsPage
      path="/docs/api"
      title="REST API"
      intro="Use Fewchurs from any language. Every SDK is built on these same calls."
      meta={
        <>
          Base URL: <C>{API_BASE_URL}</C>
        </>
      }
      toc={TOC}
    >
      <Section id="basics" title="Basics">
        <P>
          Send JSON, get JSON back. Every call needs your API key and a device ID. Here is a full
          example:
        </P>
        <CodeBlock code={CURL} />
        <P>
          Browsers can call the API directly. If you can, call it from your server instead, so
          your key stays private.
        </P>
      </Section>

      <Section id="headers" title="Headers">
        <Table
          head={["Header", "Needed", "What to send"]}
          rows={[
            [<C key="a">Authorization</C>, "Always", <>Your API key, like <C>Bearer fr_live_xxx</C>.</>],
            [<C key="d">X-Device-Id</C>, "Almost always", <>A random ID for this device or user. Make it once, save it, reuse it. See <A href="/docs/concepts#who-is-voting">who is voting</A>.</>],
            [<C key="c">Content-Type</C>, "When sending a body", <C key="cv">application/json</C>],
          ]}
        />
      </Section>

      <Section id="errors" title="Errors">
        <P>When something goes wrong, you get an HTTP error code and this body:</P>
        <CodeBlock code={ERROR} />
        <Table
          head={["Code", "HTTP", "What happened"]}
          rows={[
            [<C key="1">invalid_key</C>, "401", "The API key is wrong or turned off."],
            [<C key="2">missing_device_id</C>, "400", "The X-Device-Id header is missing."],
            [<C key="3">validation_failed</C>, "400", "Something in the body is missing or too long. The message says what."],
            [<C key="4">not_found</C>, "404", "That request doesn't exist."],
            [<C key="5">limit_reached</C>, "402", "Your plan's limit was reached."],
            [<C key="6">rate_limited</C>, "429", "This device hit its daily limit. Try again tomorrow."],
            [<C key="7">internal</C>, "500", "Something broke on our side. Try again."],
          ]}
        />
      </Section>

      <Section id="objects" title="Objects">
        <P>
          <strong>Request.</strong> <C>hasVoted</C>, <C>isFollowing</C> and <C>isMine</C> are
          about the device in <C>X-Device-Id</C>.
        </P>
        <CodeBlock code={FEATURE} />
        <P>
          <strong>Comment.</strong> <C>isDeveloper</C> is <C>true</C> for replies you write in
          the dashboard.
        </P>
        <CodeBlock code={COMMENT} />
        <P>
          <C>status</C> is one of <C>open</C>, <C>planned</C>, <C>in_progress</C>, <C>done</C>{" "}
          or <C>declined</C>. Show a plain label if you get a status you don&apos;t know.
        </P>
      </Section>

      <Endpoint id="get-config" title="Get board settings" method="GET" path="/config">
        <P>Tells your board how to look for this app.</P>
        <CodeBlock code={`{ "showBranding": true, "hideVoteCounts": false, "appName": "Habits" }`} />
        <P>
          When <C>showBranding</C> is <C>true</C>, show a small &quot;Powered by Fewchurs&quot;
          line. When <C>hideVoteCounts</C> is <C>true</C>, hide the numbers.
        </P>
      </Endpoint>

      <Endpoint id="list-requests" title="List requests" method="GET" path="/features">
        <Table
          head={["Query", "Default", "What it does"]}
          rows={[
            [<C key="s">sort</C>, <C key="sd">new</C>, <><C>top</C> for most votes, <C>new</C> for newest.</>],
            [<C key="l">limit</C>, "20", "How many to return, from 1 to 100."],
            [<C key="c">cursor</C>, "—", <>Pass <C>nextCursor</C> from the last page to get the next one.</>],
            [<C key="st">status</C>, "all", <>Only these statuses, comma separated. Example: <C>planned,in_progress,done</C>.</>],
          ]}
        />
        <CodeBlock code={`{ "features": [ /* requests */ ], "nextCursor": "Xk3pQ9rT2mL8" }`} />
        <P>
          <C>nextCursor</C> is <C>null</C> on the last page.
        </P>
      </Endpoint>

      <Endpoint id="get-request" title="Get one request" method="GET" path="/features/{id}">
        <P>Returns one request, in the same shape as the list.</P>
      </Endpoint>

      <Endpoint id="create-request" title="Create a request" method="POST" path="/features">
        <Table
          head={["Field", "Needed", "Rules"]}
          rows={[
            [<C key="t">title</C>, "Yes", "3 to 100 characters."],
            [<C key="d">description</C>, "No", "Up to 1000 characters."],
            [<C key="e">email</C>, "No", "If given, the person is told when the status changes."],
            [<C key="i">isSubscriber</C>, "No", <>Send <C>true</C> if this person pays for your app. You&apos;ll see a Subscriber badge in the dashboard.</>],
          ]}
        />
        <CodeBlock code={`{ "title": "Dark mode", "description": "Please add a dark theme." }`} />
        <P>
          Returns the new request with status <C>201</C>. New requests start as <C>open</C>.
        </P>
      </Endpoint>

      <Endpoint id="vote" title="Vote" method="POST" path="/features/{id}/vote">
        <P>
          <C>POST</C> adds this device&apos;s vote. <C>DELETE</C> on the same path removes it.
          Doing it twice is safe: it won&apos;t count twice.
        </P>
        <CodeBlock code={`{ "upvoteCount": 43, "hasVoted": true }`} />
      </Endpoint>

      <Endpoint id="list-comments" title="List comments" method="GET" path="/features/{id}/comments">
        <P>
          Oldest first. Takes <C>limit</C> and <C>cursor</C>, just like the request list.
        </P>
        <CodeBlock code={`{ "comments": [ /* comments */ ], "nextCursor": null }`} />
        <Note>
          A page can come back with fewer comments than <C>limit</C>, or even none, and still
          have a <C>nextCursor</C>. Keep going until <C>nextCursor</C> is <C>null</C>.
        </Note>
      </Endpoint>

      <Endpoint id="add-comment" title="Add a comment" method="POST" path="/comments">
        <Table
          head={["Field", "Needed", "Rules"]}
          rows={[
            [<C key="f">featureId</C>, "Yes", "The request to comment on."],
            [<C key="t">text</C>, "Yes", "1 to 1000 characters."],
            [<C key="a">authorName</C>, "No", "Up to 60 characters."],
          ]}
        />
        <P>
          Returns the new comment with status <C>201</C>.
        </P>
      </Endpoint>

      <Endpoint id="follow" title="Follow" method="POST" path="/features/{id}/follow">
        <P>
          Send <C>{`{ "email": "you@example.com" }`}</C>. The person gets an email when the status
          changes. <C>DELETE</C> on the same path stops it.
        </P>
        <CodeBlock code={`{ "following": true }`} />
      </Endpoint>
    </DocsPage>
  );
}
