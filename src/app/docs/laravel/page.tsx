import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { A, C, DocsPage, Note, P, Section, Step, Steps } from "@/components/docs/Docs";
import { API_BASE_URL } from "@/lib/docs/nav";

export const metadata: Metadata = {
  title: "Laravel — Docs — Fewchurs",
  description: "Use Fewchurs in your Laravel app.",
};

const TOC = [
  { id: "set-up", label: "Set up" },
  { id: "next", label: "What's next" },
];

const ENV = `FEWCHURS_API_KEY=fr_live_xxx`;

const CONFIG = `'fewchurs' => [
    'key' => env('FEWCHURS_API_KEY'),
],`;

const SERVICE = `<?php

namespace App\\Services;

use Illuminate\\Http\\Client\\PendingRequest;
use Illuminate\\Support\\Facades\\Http;

class Fewchurs
{
    public function __construct(private string $deviceId) {}

    public function topRequests(): array
    {
        return $this->http()->get('features', ['sort' => 'top'])->json('features');
    }

    public function vote(string $featureId): array
    {
        return $this->http()->post("features/{$featureId}/vote")->json();
    }

    public function suggest(string $title, string $description = ''): array
    {
        return $this->http()->post('features', compact('title', 'description'))->json();
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl('${API_BASE_URL}')
            ->withToken(config('services.fewchurs.key'))
            ->withHeaders(['X-Device-Id' => $this->deviceId])
            ->acceptJson()
            ->throw();
    }
}`;

const CONTROLLER = `<?php

namespace App\\Http\\Controllers;

use App\\Services\\Fewchurs;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Cookie;
use Illuminate\\Support\\Str;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        return view('feedback', [
            'requests' => $this->fewchurs($request)->topRequests(),
        ]);
    }

    public function vote(Request $request, string $id)
    {
        $this->fewchurs($request)->vote($id);

        return back();
    }

    private function fewchurs(Request $request): Fewchurs
    {
        // Signed in: votes follow the account. Guest: a random ID in a cookie.
        if ($request->user()) {
            return new Fewchurs(hash('sha256', (string) $request->user()->id));
        }

        $deviceId = $request->cookie('fewchurs_device') ?? (string) Str::uuid();
        Cookie::queue('fewchurs_device', $deviceId, 60 * 24 * 365);

        return new Fewchurs($deviceId);
    }
}`;

const ROUTES = `use App\\Http\\Controllers\\FeedbackController;

Route::get('/feedback', [FeedbackController::class, 'index']);
Route::post('/feedback/{id}/vote', [FeedbackController::class, 'vote']);`;

const VIEW = `@foreach ($requests as $item)
    <form method="POST" action="/feedback/{{ $item['id'] }}/vote">
        @csrf
        <button>▲ {{ $item['upvoteCount'] }}</button>
        {{ $item['title'] }}
    </form>
@endforeach`;

export default function LaravelDocsPage() {
  return (
    <DocsPage
      path="/docs/laravel"
      title="Laravel"
      intro="Add Fewchurs to your Laravel app. Every call runs on your server with Laravel's HTTP client."
      toc={TOC}
    >
      <Section id="set-up" title="Set up">
        <P>
          Here, every call happens on your server. Your API key never reaches the browser.
        </P>
        <Steps>
          <Step title="Add your API key">
            <CodeBlock code={ENV} filename=".env" />
            <CodeBlock code={CONFIG} filename="config/services.php" />
          </Step>
          <Step title="Add a small service">
            <CodeBlock code={SERVICE} filename="app/Services/Fewchurs.php" />
          </Step>
          <Step title="Add a controller">
            <P>
              It picks a device ID for each visitor, so votes are remembered. Signed-in users get
              a hash of their user ID. Guests get a random ID in a cookie.
            </P>
            <CodeBlock code={CONTROLLER} filename="app/Http/Controllers/FeedbackController.php" />
          </Step>
          <Step title="Add routes and a view">
            <CodeBlock code={ROUTES} filename="routes/web.php" />
            <CodeBlock code={VIEW} filename="resources/views/feedback.blade.php" />
          </Step>
        </Steps>
        <Note tone="warning">
          Never put <C>FEWCHURS_API_KEY</C> in a Blade view or in JavaScript. Keep it on the
          server.
        </Note>
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
