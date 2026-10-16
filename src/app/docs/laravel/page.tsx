import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Step, Steps, Table } from "@/components/docs/Docs";

export const metadata: Metadata = {
  title: "Laravel — Docs — Fewchurs",
  description: "Add a feature request board to your Laravel app with one Blade tag.",
};

const TOC = [
  { id: "install", label: "Install" },
  { id: "show-the-board", label: "Show the board" },
  { id: "sheet", label: "As a sheet" },
  { id: "layout", label: "Use your own layout" },
  { id: "customize", label: "Customize" },
  { id: "client", label: "Build your own UI" },
  { id: "check", label: "Check your setup" },
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
            <P>Use the key from your dashboard. It goes in <C>.env</C>, never in your code.</P>
            <CodeBlock code={ENV} filename=".env" />
          </Step>
        </Steps>
      </Section>

      <Section id="show-the-board" title="Show the board">
        <P>
          That&apos;s already done: the package adds a ready-made page at <C>/feedback</C>. Open
          it and you&apos;ll see your board with Top and New tabs, voting, comments and a form for
          new requests.
        </P>
        <P>To put the board inside one of your own pages, add the Blade tag anywhere:</P>
        <CodeBlock code={BLADE} />
        <P>
          It&apos;s rendered on your server, so voting and commenting work even with JavaScript
          turned off. If your app uses Livewire, there&apos;s a reactive version too:
        </P>
        <CodeBlock code={LIVEWIRE} />
        <P>
          Votes count the moment someone clicks, and save in the background. If the API
          can&apos;t be reached, the board shows a short message with a &quot;Try again&quot; button
          inside the board, and the rest of your page keeps working.
        </P>
        <P>Add <C>lazy</C> to the Livewire board to show a loading shimmer until it&apos;s ready:</P>
        <CodeBlock code={LIVEWIRE_LAZY} />
      </Section>

      <Section id="sheet" title="As a sheet">
        <P>
          Put the board behind a floating button instead of on the page. Add it once, for example
          to your main layout, and it shows on every page:
        </P>
        <CodeBlock code={SHEET} />
        <P>Change the button text with <C>label</C>:</P>
        <CodeBlock code={SHEET_LABEL} />
        <P>
          Or hide the floating button and open the sheet from any element of your own with{" "}
          <C>data-fewchurs-open</C>:
        </P>
        <CodeBlock code={SHEET_OWN_BUTTON} />
        <P>
          The board loads only the first time the sheet opens, so pages where nobody opens it make
          no API calls. On phones it fills the screen, and without JavaScript the button is a link
          to <C>/feedback</C>.
        </P>
        <Note>
          The sheet shows <C>/feedback</C> in a frame, so it needs that route. If your app sends{" "}
          <C>X-Frame-Options: DENY</C> or a CSP <C>frame-ancestors &apos;none&apos;</C>, allow your
          own site to frame <C>/feedback</C>.
        </Note>
      </Section>

      <Section id="layout" title="Use your own layout">
        <P>
          To render <C>/feedback</C> inside your app&apos;s layout, with your header and footer,
          set these in <C>config/fewchurs.php</C>:
        </P>
        <CodeBlock code={LAYOUT} filename="config/fewchurs.php" />
        <P>
          The same file sets the URL prefix, which tabs show, how many requests per page, whether
          comments and following are open, whether the email field is hidden, optional or
          required, and whether people must be signed in to post.
        </P>
      </Section>

      <Section id="customize" title="Customize">
        <P>Change the color and corner radius right on the tag:</P>
        <CodeBlock code={THEME} />
        <P>Add your own heading above the board with a slot:</P>
        <CodeBlock code={SLOTS} />
        <P>
          To change the markup or the wording, publish the views and translations. They&apos;re
          small Blade and lang files, made to be edited:
        </P>
        <CodeBlock code={PUBLISH} />
      </Section>

      <Section id="client" title="Build your own UI">
        <P>
          Prefer your own design? Use the PHP client and render it however you like. Every call
          throws a typed exception on failure, with a <C>userMessage()</C> that&apos;s safe to show.
        </P>
        <CodeBlock code={CLIENT} />
        <P>
          The <A href={REPO_URL}>package README</A> covers everything else: visitor identity,
          more than one board, events, and <C>Fewchurs::fake()</C> for your tests.
        </P>
      </Section>

      <Section id="check" title="Check your setup">
        <P>One command tells you whether your key works and the board can be reached:</P>
        <CodeBlock code={CHECK} />
        <P>
          After a deploy, <C>php artisan fewchurs:warm</C> loads the board settings ahead of the
          first visitor.
        </P>
      </Section>

      <Section id="badge" title="What your plan changes">
        <P>
          Your plan is applied on our servers, so you never need to change code or update the
          package when it changes. Changes show up within 5 minutes.
        </P>
        <Table
          head={["", "Free", "Starter", "Pro"]}
          rows={[
            ["Requests the board lists", "First 5", "First 200", "All"],
            ['"Powered by Fewchurs" line', "Shown", "Hidden", "Hidden"],
          ]}
        />
        <P>
          Newer requests are still saved and show in your dashboard. Once your app is past its
          limit, a new request is accepted but doesn&apos;t appear in the board&apos;s list. See{" "}
          <A href="/pricing">pricing</A>.
        </P>
      </Section>

      <Section id="api-key" title="About the API key">
        <P>
          Here the key stays on your server: the browser only ever talks to your own Laravel
          routes. The package keeps it out of the page and out of your logs. Still, keep it in{" "}
          <C>.env</C> and out of git.
        </P>
        <Note>
          Each visitor gets a random ID in a cookie (or their user ID when they&apos;re signed in),
          hashed with your <C>APP_KEY</C> before it&apos;s sent. That is how votes are remembered
          without an account. Read more in <A href="/docs/concepts">How it works</A>.
        </Note>
      </Section>
    </DocsPage>
  );
}
