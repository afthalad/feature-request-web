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
  Step,
  Steps,
  Sub,
  Table,
} from "@/components/docs/Docs";

export const metadata: Metadata = pageMetadata({
  title: "Laravel SDK",
  description:
    "Add a feature request board to your Laravel app with one Blade tag, or use the PHP client to create requests, votes and comments.",
  path: "/docs/laravel",
});

const TOC = [
  { id: "install", label: "Install" },
  { id: "show-the-board", label: "Show the board" },
  { id: "sheet", label: "As a sheet" },
  { id: "layout", label: "Use your own layout" },
  { id: "customize", label: "Customize" },
  { id: "client", label: "Build your own UI" },
  { id: "check", label: "Check your setup" },
  { id: "going-live", label: "Localhost and going live" },
  { id: "badge", label: "What your plan changes" },
  { id: "api-key", label: "About the API key" },
];

const REPO_URL = "https://github.com/fewchurs/fewchurs-laravel";

const REQUIRE = `composer require fewchurs/laravel`;
const INSTALL = `php artisan fewchurs:install`;
const ENV = `FEWCHURS_API_KEY=fr_live_xxx`;

const BLADE = `<x-fewchurs::board />`;

const LIVEWIRE = `<livewire:fewchurs-board />`;

const LIVEWIRE_LAZY = `<livewire:fewchurs-board lazy />`;

const SHEET = `<x-fewchurs::sheet />                    {{-- slides in from the right --}}
<x-fewchurs::sheet side="left" />
<x-fewchurs::sheet side="bottom" />`;

const SHEET_LABEL = `<x-fewchurs::sheet label="Suggest a feature" />`;

const SHEET_OWN_BUTTON = `<x-fewchurs::sheet :trigger="false" />

<button data-fewchurs-open>Feedback</button>`;

const LAYOUT = `'board' => [
    'layout' => 'layouts.app',  // your layout view
    'section' => 'content',     // the @yield it renders into
],`;

const THEME = `<x-fewchurs::board :theme="['primary' => '#ED5F18', 'radius' => '12px']" />`;

const PUBLISH = `php artisan vendor:publish --tag=fewchurs-views
php artisan vendor:publish --tag=fewchurs-lang`;

const SLOTS = `<x-fewchurs::board>
    <x-slot:header>
        <h1>Help shape {{ config('app.name') }}</h1>
    </x-slot:header>
</x-fewchurs::board>`;

const CLIENT = `use Fewchurs\\Laravel\\Facades\\Fewchurs;

$page = Fewchurs::features()->top(limit: 20);

$feature = Fewchurs::features()->submit(
    title: 'Add dark mode',
    description: 'Would love a dark theme.',
    email: auth()->user()?->email,
);

Fewchurs::features()->vote($feature->id);
Fewchurs::comments()->create($feature->id, text: '+1');`;

const CHECK = `php artisan fewchurs:check`;

const ENV_LOCAL = `APP_URL=http://localhost:8000
FEWCHURS_API_KEY=fr_live_xxx`;

const ENV_LIVE = `APP_URL=https://yourcompany.com
APP_DEBUG=false
FEWCHURS_API_KEY=fr_live_xxx`;

const CONFIG_CACHE = `php artisan config:cache`;

const CONFIG_CLEAR = `php artisan config:clear`;

const ENV_APP_ID = `FEWCHURS_APP_ID=yourcompany.com`;

const APPS = `'apps' => [
    'docs' => [
        'api_key' => env('FEWCHURS_DOCS_KEY'),
        'app_id' => 'docs.yourcompany.com',
    ],
],`;

/** The first column of a Table doesn't wrap, which is too wide for a full message. */
function Message({ children }: { children: string }) {
  return <span className="block min-w-48 whitespace-normal">{children}</span>;
}

export default function LaravelDocsPage() {
  return (
    <DocsPage
      path="/docs/laravel"
      title="Laravel"
      intro="Add a feature request board to your Laravel app. One package, one env var, one Blade tag."
      meta="Needs PHP 8.2 or later and Laravel 10, 11, 12 or 13. No JavaScript build step and no Tailwind needed."
      toc={TOC}
    >
      <Section id="install" title="Install">
        <Steps>
          <Step title="Add the package">
            <CodeBlock code={REQUIRE} />
          </Step>
          <Step title="Publish the config">
            <CodeBlock code={INSTALL} />
          </Step>
          <Step title="Add your API key">
            <P>
              Use the key from your dashboard. It goes in <C>.env</C>, never in
              your code.
            </P>
            <CodeBlock code={ENV} filename=".env" />
          </Step>
        </Steps>
      </Section>

      <Section id="show-the-board" title="Show the board">
        <P>
          That&apos;s already done: the package adds a ready-made page at{" "}
          <C>/feedback</C>. Open it and you&apos;ll see your board with Top and
          New tabs, voting, comments and a form for new requests.
        </P>
        <P>
          To put the board inside one of your own pages, add the Blade tag
          anywhere:
        </P>
        <CodeBlock code={BLADE} />
        <P>
          It&apos;s rendered on your server, so voting and commenting work even
          with JavaScript turned off. If your app uses Livewire, there&apos;s a
          reactive version too:
        </P>
        <CodeBlock code={LIVEWIRE} />
        <P>
          Votes count the moment someone clicks, and save in the background. If
          the API can&apos;t be reached, the board shows a short message with a
          &quot;Try again&quot; button inside the board, and the rest of your
          page keeps working.
        </P>
        <P>
          Add <C>lazy</C> to the Livewire board to show a loading shimmer until
          it&apos;s ready:
        </P>
        <CodeBlock code={LIVEWIRE_LAZY} />
      </Section>

      <Section id="sheet" title="As a sheet">
        <P>
          Put the board behind a floating button instead of on the page. Add it
          once, for example to your main layout, and it shows on every page:
        </P>
        <CodeBlock code={SHEET} />
        <P>
          The sheet opens on your list of requests. A floating{" "}
          <strong>New request</strong> button switches it to the form and{" "}
          <strong>Back</strong> returns to the list.
        </P>
        <P>
          Change the button text with <C>label</C>:
        </P>
        <CodeBlock code={SHEET_LABEL} />
        <P>
          Or hide the floating button and open the sheet from any element of
          your own with <C>data-fewchurs-open</C>:
        </P>
        <CodeBlock code={SHEET_OWN_BUTTON} />
        <P>
          The board loads only the first time the sheet opens, so pages where
          nobody opens it make no API calls. On phones it fills the screen, and
          without JavaScript the button is a link to <C>/feedback</C>.
        </P>
        <Note>
          The sheet shows <C>/feedback</C> in a frame, so it needs that route.
          If your app sends <C>X-Frame-Options: DENY</C> or a CSP{" "}
          <C>frame-ancestors &apos;none&apos;</C>, allow your own site to frame{" "}
          <C>/feedback</C>.
        </Note>
      </Section>

      <Section id="layout" title="Use your own layout">
        <P>
          To render <C>/feedback</C> inside your app&apos;s layout, with your
          header and footer, set these in <C>config/fewchurs.php</C>:
        </P>
        <CodeBlock code={LAYOUT} filename="config/fewchurs.php" />
        <P>
          The same file sets the URL prefix, which tabs show, how many requests
          per page, whether comments and following are open, whether the email
          field is hidden, optional or required, and whether people must be
          signed in to post.
        </P>
      </Section>

      <Section id="customize" title="Customize">
        <P>Change the color and corner radius right on the tag:</P>
        <CodeBlock code={THEME} />
        <P>Add your own heading above the board with a slot:</P>
        <CodeBlock code={SLOTS} />
        <P>
          To change the markup or the wording, publish the views and
          translations. They&apos;re small Blade and lang files, made to be
          edited:
        </P>
        <CodeBlock code={PUBLISH} />
      </Section>

      <Section id="client" title="Build your own UI">
        <P>
          Prefer your own design? Use the PHP client and render it however you
          like. Every call throws a typed exception on failure, with a{" "}
          <C>userMessage()</C> that&apos;s safe to show.
        </P>
        <CodeBlock code={CLIENT} />
        <P>
          The <A href={REPO_URL}>package README</A> covers everything else:
          visitor identity, more than one board, events, and{" "}
          <C>Fewchurs::fake()</C> for your tests.
        </P>
      </Section>

      <Section id="check" title="Check your setup">
        <P>
          One command tells you whether your key works and the board can be
          reached:
        </P>
        <CodeBlock code={CHECK} />
        <P>
          After a deploy, <C>php artisan fewchurs:warm</C> loads the board
          settings ahead of the first visitor.
        </P>
      </Section>

      <Section id="going-live" title="Localhost and going live">
        <P>
          Your API key only works from the domain you add to your app. Laravel
          handles this for you. It sends the domain each page is opened on with
          every request, so the key works on your live domain whatever{" "}
          <C>APP_URL</C> says. This needs version 1.8.0 or later.
        </P>

        <Sub>While you build on localhost</Sub>
        <P>
          You only need your API key. There is nothing to add in the dashboard
          yet.
        </P>
        <CodeBlock code={ENV_LOCAL} filename=".env" />
        <P>
          <C>localhost</C> and <C>127.0.0.1</C> always work. While{" "}
          <C>APP_DEBUG=true</C> the board shows a small note to remind you to
          add your domain before you go live. Visitors never see this note.
        </P>

        <Sub>When you go live</Sub>
        <Steps>
          <Step>
            <P>
              Open your app in the <A href="/dashboard">Fewchurs dashboard</A>.
            </P>
          </Step>
          <Step>
            <P>
              Under <strong>Where does your app run?</strong> pick{" "}
              <strong>Web</strong>.
            </P>
          </Step>
          <Step>
            <P>
              Add just the domain in <strong>Website domain</strong>, like{" "}
              <C>yourcompany.com</C>. Leave out <C>https://</C>.
            </P>
          </Step>
          <Step>
            <P>
              Click <strong>Save changes</strong>. A new domain can take up to a
              minute to work.
            </P>
          </Step>
          <Step>
            <P>
              Set these in the <C>.env</C> on your live server:
            </P>
            <CodeBlock code={ENV_LIVE} filename=".env" />
            <P>
              The board doesn&apos;t use <C>APP_URL</C>, but{" "}
              <C>php artisan fewchurs:check</C> does. A command has no visitor,
              so it sends the domain in <C>APP_URL</C> instead.
            </P>
          </Step>
          <Step>
            <P>If you cache your config, refresh it:</P>
            <CodeBlock code={CONFIG_CACHE} />
          </Step>
          <Step>
            <P>Check it on your live server:</P>
            <CodeBlock code={CHECK} />
            <P>You should see &quot;Board reachable&quot;.</P>
          </Step>
        </Steps>
        <Note tone="warning">
          Don&apos;t skip the domain. The board can work on localhost and still
          be refused on your live site if your domain isn&apos;t added.
        </Note>

        <Sub>Test your domain before you go live</Sub>
        <P>You can check your domain from localhost:</P>
        <Steps>
          <Step>
            <P>
              Add this line to your local <C>.env</C>:
            </P>
            <CodeBlock code={ENV_APP_ID} filename=".env" />
          </Step>
          <Step>
            <P>Run these:</P>
            <CodeBlock code={CONFIG_CLEAR} />
            <CodeBlock code={CHECK} />
          </Step>
        </Steps>
        <P>
          If you see &quot;Board reachable&quot; your domain is set up. Remove
          the line when you&apos;re done. If you only just added the domain and
          it&apos;s refused, wait a minute and run the check again.
        </P>

        <Sub>Which addresses work</Sub>
        <P>
          If you add <C>yourcompany.com</C>:
        </P>
        <Table
          head={["Page opened on", "Result"]}
          rows={[
            [<C key="u">http://localhost:8000</C>, "Works"],
            [<C key="u">https://yourcompany.com</C>, "Works"],
            [<C key="u">https://www.yourcompany.com</C>, "Works"],
            [<C key="u">https://app.yourcompany.com</C>, "Works"],
            [<C key="u">https://othercompany.com</C>, "Refused"],
          ]}
        />
        <P>
          Subdomains of the domain you add work on their own. It doesn&apos;t
          work the other way: if you add <C>app.yourcompany.com</C> then{" "}
          <C>yourcompany.com</C> is refused. Add the main domain if you use more
          than one.
        </P>

        <Sub>
          When you need <C>FEWCHURS_APP_ID</C>
        </Sub>
        <P>
          Most sites don&apos;t need it. It sends one fixed ID instead of the
          domain each page is opened on, for every page and for{" "}
          <C>fewchurs:check</C>. Use it when your site runs on an address you
          haven&apos;t added, for example a staging site on your host&apos;s own
          domain:
        </P>
        <CodeBlock code={ENV_APP_ID} filename=".env" />
        <P>
          If you have more than one board you can give each one its own ID in{" "}
          <C>config/fewchurs.php</C>:
        </P>
        <CodeBlock code={APPS} filename="config/fewchurs.php" />

        <Sub>If something goes wrong</Sub>
        <Table
          head={["What you see", "What it means", "What to do"]}
          rows={[
            [
              <Message key="m">
                This API key is not set up for yourcompany.com. Add it to your
                app in the Fewchurs dashboard.
              </Message>,
              "This domain isn't added to the app for this key",
              <>
                Add the domain in the dashboard. The message names the domain
                the page was opened on. In <C>fewchurs:check</C> it comes from{" "}
                <C>APP_URL</C>, or from <C>FEWCHURS_APP_ID</C> if you set it.
              </>,
            ],
            [
              <Message key="m">
                Invalid API key. Check the key in your Fewchurs dashboard.
              </Message>,
              "The key is wrong or no longer active",
              <>
                Copy the key from the dashboard into <C>.env</C>.
              </>,
            ],
            [
              <Message key="m">
                Couldn&apos;t reach the feedback service.
              </Message>,
              "Your server can't reach Fewchurs",
              "Check your server's internet connection.",
            ],
            [
              <Message key="m">Something went wrong. Try again.</Message>,
              "Any other error",
              <>
                Set <C>APP_DEBUG=true</C> on a test site to see the real cause,
                and check your log file.
              </>,
            ],
          ]}
        />
        <P>
          Visitors see these messages on your live site too. Keep{" "}
          <C>APP_DEBUG=false</C> there, as Laravel recommends.
        </P>
        <P>
          After you change <C>.env</C> run <C>php artisan config:clear</C>, or{" "}
          <C>php artisan config:cache</C> if you cache your config. The board
          keeps a recent copy of the list, so it can show old requests for a
          while after a key is refused. Run <C>php artisan cache:clear</C> to
          see the current state. <C>php artisan fewchurs:check</C> always checks
          live.
        </P>
      </Section>

      <Section id="badge" title="What your plan changes">
        <P>
          Your plan is applied on our servers, so you never need to change code
          or update the package when it changes. Changes show up within 5
          minutes.
        </P>
        <Table
          head={["", "Free", "Starter", "Pro"]}
          rows={[
            ["Requests the board lists", "First 5", "First 200", "All"],
            ['"Powered by Fewchurs" line', "Shown", "Hidden", "Hidden"],
          ]}
        />
        <P>
          Newer requests are still saved and show in your dashboard. Once your
          app is past its limit, a new request is accepted but doesn&apos;t
          appear in the board&apos;s list. See <A href="/pricing">pricing</A>.
        </P>
      </Section>

      <Section id="api-key" title="About the API key">
        <P>
          Here the key stays on your server: the browser only ever talks to your
          own Laravel routes. The package keeps it out of the page and out of
          your logs. Still, keep it in <C>.env</C> and out of git.
        </P>
        <Note>
          Each visitor gets a random ID in a cookie (or their user ID when
          they&apos;re signed in), hashed with your <C>APP_KEY</C> before
          it&apos;s sent. That is how votes are remembered without an account.
          Read more in <A href="/docs/concepts">How it works</A>.
        </Note>
      </Section>
    </DocsPage>
  );
}
