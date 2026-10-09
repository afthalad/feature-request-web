# Fewchurs Laravel Package — Plan

A drop-in Composer package that puts a Fewchurs feature-request board into any Laravel app: install, add one env var, drop one Blade tag. Server-rendered by default, reactive with Livewire if the app uses it, and a plain PHP client for fully custom UIs.

Based on the live `/api/v1` endpoints in this repo (`src/app/api/v1/**`) and the Laravel snippet already promised on the landing page (`src/lib/platforms.ts`). Companion to `KOTLIN_SDK_PLAN.md`, `FLUTTER_SDK_PLAN.md` and `SWIFTUI_SDK_PLAN.md`.

---

## 1. What makes Laravel different from the mobile SDKs

This is not "the mobile SDK in PHP". Three things change the design:

### 1.1 The API key can finally be a real secret
On iOS, Android and Flutter the key ships inside the binary and is extractable. In Laravel the key lives in `.env`, and **all API calls happen server-side**. The browser never sees it.

Consequence: any browser-facing interactivity (voting, commenting) must go through **the Laravel app's own routes**, which then call Fewchurs. The package ships those proxy routes. **The key must never be echoed into a Blade view, a JS config object, or an Inertia page prop.**

### 1.2 There is no "device"
The server must supply `X-Device-Id` per visitor. The package resolves it (§5):
- signed cookie for anonymous visitors, or
- a hash of the authenticated user's ID, so votes follow the user across browsers and devices.

This is *better* than mobile: the app controls identity, so it's far harder to spoof.

### 1.3 No CORS problem — but a new rate-limit problem
Because calls are server-to-server, the missing CORS headers that block Flutter web (`FLUTTER_SDK_PLAN.md` §11.7) don't affect Laravel at all.

But the reverse bites: **every request from a Laravel site arrives from one server IP.** The per-IP rate limiting proposed as abuse hardening (§9.6) would throttle an entire website as if it were one abusive user. That has to be designed around before it ships — see §9.6.

---

## 2. Developer experience

### 2.1 Install
```bash
composer require fewchurs/laravel
php artisan fewchurs:install     # publishes config, prints next steps
```
```dotenv
FEWCHURS_API_KEY=fr_live_xxx
```
Service provider and Blade components register automatically (package auto-discovery). Nothing else is required.

### 2.2 Show the board
```blade
{{-- Any Blade view --}}
<x-fewchurs::board />
```
```blade
{{-- Reactive, if the app already uses Livewire --}}
<livewire:fewchurs-board />
```
```php
// Or a ready-made route: config('fewchurs.route.prefix') => /feedback
// GET /feedback renders a full page inside the app's layout
```

### 2.3 Use the client directly
```php
use Fewchurs\Laravel\Facades\Fewchurs;

$page = Fewchurs::features()->top(limit: 20);          // FeaturePage
$feature = Fewchurs::features()->submit(
    title: 'Add dark mode',
    description: 'Would love a dark theme.',
    email: auth()->user()?->email,                      // server auto-follows this email
);

Fewchurs::features()->vote($featureId);
Fewchurs::features()->unvote($featureId);
Fewchurs::features()->follow($featureId, email: 'a@b.com');
Fewchurs::comments()->list($featureId, limit: 50);
Fewchurs::comments()->create($featureId, text: '+1', authorName: 'Sam');
$config = Fewchurs::config();                           // showBranding, cached
```

### 2.4 Verify the setup
```bash
php artisan fewchurs:check
# ✓ API key valid   ✓ Board reachable   ✓ Branding badge: shown (Free/Starter plan)
# ✗ FEWCHURS_API_KEY missing — add it to .env
```
A single command that answers "is my key right?" removes the most common support ticket.

---

## 3. Architecture

### 3.1 Package layout (`github.com/fewchurs/fewchurs-laravel` → Packagist `fewchurs/laravel`)
```
src/
├─ FewchursServiceProvider.php      // bindings, routes, views, publishing, Livewire/Blade registration
├─ Fewchurs.php                     // facade root: entry point
├─ Client/
│  ├─ FewchursClient.php            // Http::fewchurs() wrapper, envelope + retry
│  ├─ FeaturesResource.php          // list / submit / vote / unvote / follow / unfollow
│  ├─ CommentsResource.php          // list / create
│  └─ ConfigResource.php            // /config + cache
├─ Data/                            // Feature, Comment, FeaturePage, FeatureStatus (enum), BoardConfig
├─ Exceptions/                      // FewchursException + one subclass per error code
├─ Identity/
│  ├─ DeviceIdResolver.php          // contract
│  ├─ CookieDeviceId.php            // default (anonymous)
│  └─ UserDeviceId.php              // hashed auth user id
├─ Http/
│  ├─ Controllers/BoardController.php     // server-rendered pages + form posts
│  ├─ Controllers/ProxyController.php     // JSON endpoints for Livewire/Alpine/Inertia/SPA
│  ├─ Requests/                           // validation mirroring the server's rules
│  └─ Middleware/                         // throttle + honeypot for public boards
├─ View/Components/Board.php        // <x-fewchurs::board />
├─ Livewire/FewchursBoard.php       // registered only if Livewire is installed
├─ Events/                          // FeatureSubmitted, Voted, Commented, Followed
├─ Testing/FewchursFake.php         // Fewchurs::fake() + assertions
└─ Console/{InstallCommand,CheckCommand}.php
config/fewchurs.php
resources/views/                     // Blade (Tailwind), publishable
resources/lang/en/                   // publishable strings
routes/fewchurs.php
tests/                               // Pest + Testbench
```

### 3.2 Request flow
```
Browser
  │  (no API key ever reaches here)
  ├─ GET  /feedback                → BoardController  → FewchursClient → api/v1
  └─ POST /fewchurs/vote/{id}      → ProxyController  → FewchursClient → api/v1
        (web middleware: session, CSRF, throttle)         adds Authorization + X-Device-Id
```

### 3.3 Tech choices

| Concern | Choice | Why |
|---|---|---|
| PHP / Laravel | PHP 8.2+, Laravel 11 & 12 (add 13 on release) | Matches Laravel's own support window. |
| HTTP | Laravel `Http` facade (Guzzle) via an `Http::fewchurs()` macro | Already in every Laravel app; gives retries, timeouts, and `Http::fake()` in host tests for free. |
| Data objects | Readonly PHP classes with `fromArray()` | No `spatie/laravel-data` dependency; typed and simple. `FeatureStatus` is a backed enum with an `Unknown` fallback. |
| Views | Blade + Tailwind, fully publishable | Tailwind is the Laravel default; publishing means any app can restyle without forking. |
| Reactivity | Optional Livewire v3 component; graceful no-JS fallback | Works whether or not the app uses Livewire. |
| Dependencies | **None beyond Laravel itself** | A package that drags in extra libraries is a hard sell. |

### 3.4 Progressive enhancement (important for a web board)
The board must work in three environments, in this order:
1. **No JavaScript** — voting and commenting are `<form>` POSTs to the package's routes, then redirect back. Everything works.
2. **Alpine.js present** (ships with Breeze/Jetstream) — votes update optimistically via `fetch` to the proxy routes.
3. **Livewire present** — the reactive component, no page reloads at all.

Building it this way also makes it accessible and SEO-visible by default, which matters because a Laravel board is often a **public** page, unlike an in-app mobile board.

---

## 4. API contract

Base URL `https://fewchurs.com/api/v1`, overridable via `FEWCHURS_BASE_URL`.

**Headers added by the client on every request**

| Header | Value |
|---|---|
| `Authorization` | `Bearer fr_live_…` (server-side only; every endpoint 401s without it) |
| `X-Device-Id` | Resolved per visitor (§5); required by everything except the comments list |
| `X-Fewchurs-Sdk` | `laravel/1.0.0 (php 8.3; laravel 12)` |
| `Accept-Language` | `app()->getLocale()` (for future server-side translation) |

### 4.1 Endpoints used

| Method + path | Body / query | Response | Notes |
|---|---|---|---|
| `GET /config` | — | `{ showBranding }` | Cached (default 1h). `false` only on Pro. |
| `GET /features` | `sort=top\|new`, `limit` 1–100 (default 20), `cursor` | `{ features, nextCursor }` | Includes `hasVoted`, `isFollowing` for the resolved device. |
| `POST /features` | `{ title (3–100), description (≤1000), email?, isSubscriber? }` | `201` Feature | Passing `email` makes the server follow it too — **don't make a second follow call**. |
| `POST /features/{id}/vote` | — | `{ upvoteCount, hasVoted: true }` | Idempotent. |
| `DELETE /features/{id}/vote` | — | `{ upvoteCount, hasVoted: false }` | Idempotent. |
| `POST /features/{id}/follow` | `{ email }` **required** | `{ following: true }` | UI must collect an email. |
| `DELETE /features/{id}/follow` | — | `{ following: false }` | |
| `GET /features/{id}/comments` | `limit`, `cursor` | `{ comments, nextCursor }` | Deleted comments are filtered **after** paging → a page can be short or empty while `nextCursor` is set. Keep paging on the cursor, never on "page was empty". |
| `POST /comments` | `{ featureId, text (1–1000), authorName? (≤60) }` | `201` Comment | **Note the shape:** the create endpoint is `/comments` with `featureId` in the body, *not* `/features/{id}/comments` (that path is GET-only and returns 405 for POST — this exact mistake shipped in the iOS SDK). |

### 4.2 Validation — mirror these exactly
| Field | Rule |
|---|---|
| `title` | 3–100 chars |
| `description` | ≤1000, optional |
| comment `text` | 1–1000 |
| `authorName` | ≤60, optional |
| `email` | valid email; **required** to follow |

Keep them in one `Fewchurs\Laravel\Validation\Rules` class used by both the Form Requests and the Blade views (maxlength attributes), so they can't drift. (The iOS package drifted here — its caps were 80/500 and it had none for comments.)

### 4.3 Error handling
`{ "error": { "code", "message" } }` maps to typed exceptions:

| code | HTTP | Exception | Shown to the visitor |
|---|---|---|---|
| `invalid_key` | 401 | `InvalidApiKeyException` | generic error; logged as **critical** (developer misconfiguration) |
| `validation_failed` | 400 | `ValidationFailedException` | mapped into Laravel's validation errors on the form field |
| `rate_limited` | 429 | `RateLimitedException` | "You've reached today's limit. Try again tomorrow." |
| `limit_reached` | 402 | `LimitReachedException` | swallow — submissions are no longer capped; never show the raw server text |
| `not_found` | 404 | `NotFoundException` | "This request no longer exists." |
| `internal` / 5xx | 500 | `ServerException` | "Something went wrong. Try again." |
| transport | — | `ConnectionException` | "Couldn't reach the feedback service." |

Server-side limits to design for: **15 submissions** and **10 comments** per device per day.

Logging: every failure logs `code`, `status`, endpoint and the device ID — **with the API key redacted**. Add a `Http::globalMiddleware` redactor so a key can never appear in logs or exception traces.

---

## 5. Identity (`X-Device-Id`)

```php
// config/fewchurs.php
'identity' => [
    'mode' => env('FEWCHURS_IDENTITY', 'hybrid'), // cookie | user | hybrid
    'cookie' => ['name' => 'fewchurs_did', 'lifetime_days' => 365],
],
```
- **cookie** — random UUID in a signed, `httpOnly`, `SameSite=Lax` cookie. Anonymous visitors can vote (matching the public web board's behavior).
- **user** — `hash_hmac('sha256', $user->getAuthIdentifier(), config('app.key'))`. Votes follow the user across browsers and devices. Guests fall back to a cookie.
- **hybrid** (default) — cookie for guests, user hash once signed in.

Custom resolution (multi-tenant, team-level identity, etc.):
```php
Fewchurs::resolveDeviceIdUsing(fn (Request $r) => hash('sha256', $r->user()->team_id));
```
Docs must say: always **hash**; never send an email or raw ID as a device ID.

**Privacy note for the package's docs:** the cookie is functional (it records which requests this visitor voted on), so most cookie-consent setups class it as necessary rather than tracking — but it's a first-party identifier and should appear in the host app's privacy policy. Provide sample wording.

---

## 6. Customization — five levels

### Level 1 — Config only
```php
// config/fewchurs.php
return [
    'api_key' => env('FEWCHURS_API_KEY'),
    'base_url' => env('FEWCHURS_BASE_URL', 'https://fewchurs.com/api/v1'),

    'route' => [
        'prefix' => 'feedback',            // page + proxy routes; null disables routes entirely
        'middleware' => ['web'],
        'throttle' => '30,1',              // per minute per visitor for writes
    ],

    'board' => [
        'layout' => 'layouts.app',         // the host app's Blade layout
        'section' => 'content',
        'tabs' => ['top', 'new', 'roadmap'],
        'default_tab' => 'top',
        'show_declined' => false,
        'allow_submissions' => true,
        'allow_comments' => true,
        'email_field' => 'optional',       // hidden | optional | required
        'per_page' => 20,
        'require_auth' => false,           // or ['auth'] middleware on write routes
    ],

    'theme' => [
        'primary' => '#ED5F18',
        'radius' => '0.75rem',
        'dark_mode' => 'auto',             // auto | light | dark | class
    ],

    'cache' => ['store' => null, 'config_ttl' => 3600, 'list_ttl' => 15],
];
```

### Level 2 — Theme tokens
The published views read CSS custom properties, so a colour change needs no view edits:
```blade
<x-fewchurs::board :theme="['primary' => '#0F766E', 'radius' => '4px']" />
```

### Level 3 — Publish the views and the strings
```bash
php artisan vendor:publish --tag=fewchurs-views   # resources/views/vendor/fewchurs/**
php artisan vendor:publish --tag=fewchurs-lang    # lang/vendor/fewchurs/en/messages.php
```
Views are small, single-purpose Blade files (`board.blade.php`, `partials/feature-card.blade.php`, `partials/comment.blade.php`, `partials/submit-form.blade.php`) meant to be edited. Translations use normal Laravel lang files, so `lang/vendor/fewchurs/fr/messages.php` just works.

### Level 4 — Slots
```blade
<x-fewchurs::board>
    <x-slot:header>
        <h1 class="text-3xl">Help shape {{ config('app.name') }}</h1>
    </x-slot:header>

    <x-slot:empty>
        <x-my-empty-illustration />
    </x-slot:empty>

    @scope('feature', $feature, $actions)
        <x-my-feature-row :feature="$feature" :vote-url="$actions->voteUrl" />
    @endscope
</x-fewchurs::board>
```

### Level 5 — Headless
Use `Fewchurs::features()` / `Fewchurs::comments()` (§2.3) and build the UI however the app likes — Blade, Livewire, Inertia + Vue/React, or a JSON API of the app's own. The package's proxy routes can stay enabled for the browser side, or be disabled (`route.prefix => null`) so the app defines its own.

### 6.6 Other integration points
- **Multiple boards in one app** (e.g. separate products):
  ```php
  'apps' => ['product' => ['api_key' => env('FEWCHURS_PRODUCT_KEY')],
             'docs'    => ['api_key' => env('FEWCHURS_DOCS_KEY')]],
  ```
  ```blade
  <x-fewchurs::board app="docs" />
  ```
  ```php
  Fewchurs::app('docs')->features()->top();
  ```
- **Events** for the host app's own listeners:
  ```php
  Event::listen(FeatureSubmitted::class, fn ($e) => Slack::send("New request: {$e->feature->title}"));
  ```
  Events: `FeatureSubmitted`, `Voted`, `Unvoted`, `Commented`, `Followed`, `RequestFailed`.
- **Auth integration:** prefill the email from `auth()->user()?->email`, prefill `authorName` from the user's name, and mark `isSubscriber` from the app's billing (`$user->subscribed()` with Cashier).
- **Testing helper for host apps:**
  ```php
  Fewchurs::fake([...features]);
  // … exercise the app …
  Fewchurs::assertSubmitted(fn ($f) => $f->title === 'Add dark mode');
  Fewchurs::assertNothingSubmitted();
  ```

---

## 7. Caching and performance

A Laravel board is server-rendered on every page view, so uncached it adds a full API round trip to page load.

| Data | Strategy |
|---|---|
| `/config` (`showBranding`) | Cache 1h, app-wide. Rarely changes. |
| Feature list | Cache per `sort + cursor` for a short TTL (default 15s). **Problem:** `hasVoted`/`isFollowing` are per-visitor, so a shared cache would leak one visitor's vote state to everyone. Solution: cache the list **without** the per-visitor flags, and layer the flags per request (from a small per-device cache or a second call). If that proves fiddly, cache per device instead and document the memory cost. |
| Writes | Never cached; invalidate the relevant list keys on vote/submit/comment. |
| Failure mode | Serve stale cache when the API is unreachable, with a quiet "showing recent data" note — better than an error page. |

Also: `php artisan fewchurs:warm` to pre-warm the first page of each tab after a deploy.

---

## 8. Security

- **Never expose the key.** CI check (and a test) asserting the key can't appear in rendered HTML or JSON. `fewchurs:check` warns if `FEWCHURS_API_KEY` is set in a `.env.example` or committed file.
- **CSRF** on all proxy POST/DELETE routes (they run in the `web` group).
- **Throttling** on write routes (`throttle:30,1` by default) — a public board is a spam target, unlike a mobile board.
- **Honeypot + minimum-time check** on the submit form (optional middleware, on by default) to stop basic bots without a CAPTCHA.
- **Escaping:** feature titles, descriptions and comments are user content from strangers. Blade escapes by default; the published views must never use `{!! !!}` on them. Call that out in the views with a comment, since developers editing views are exactly the people who'd change it.
- **Input validation** server-side (§4.2), not just `maxlength` in HTML.
- Optional `require_auth` so the board only accepts writes from signed-in users.

---

## 9. Server work needed (this repo)

Shared with the mobile SDK plans, plus one Laravel-specific item.

1. **`/v1/features` ignores `hideVoteCounts`.** The public web board hides counts; the SDK endpoint doesn't, so a Laravel board shows numbers the owner switched off.
2. **No status filter → no Roadmap tab.** Add `?status=planned,in_progress,done` (Firestore composite indexes `status + upvoteCount`, `status + createdAt`).
3. **Extend `/v1/config`** to `{ showBranding, hideVoteCounts, appName }`.
4. **Device IDs leak.** Comments return every commenter's `deviceId`; features return `authorDeviceId`. Return `isMine` instead. (On the web this is worse than on mobile: anything the server returns can end up in page HTML.)
5. **Add `GET /v1/features/{id}`** for deep-linkable detail pages — important for SEO on a public board.
6. **Per-IP rate limiting must not treat a whole website as one user (Laravel-specific).** All traffic from a Laravel site arrives from one server IP. If per-IP limits are added as planned, exempt server-side keys, raise their ceiling, or key the limit on `X-Device-Id` for them. Getting this wrong takes a customer's board down entirely.
7. **Web docs:** add `/docs/laravel` and update `src/lib/platforms.ts` — the Laravel entry says "coming soon" and has no `href`.

---

## 10. Testing and quality

| Layer | Tooling | Covers |
|---|---|---|
| Client | Pest + `Http::fake()` | Every endpoint, headers, error-envelope mapping, the comments-create path shape, short/empty comment pages, unknown status. |
| Package integration | **Orchestra Testbench** | Service provider, config publishing, routes, middleware, Livewire registration when present *and absent*. |
| Views | Blade render tests | Escaping (an XSS payload in a title must render inert), no-JS form flow, empty/error states. |
| Identity | Feature tests | Cookie issued once and reused; user mode stable across sessions; hybrid switches correctly on login. |
| Security | Test | Rendered HTML and JSON never contain `fr_live_`. |
| Static analysis | PHPStan level 8 (Larastan), Laravel Pint | Zero errors. |
| Matrix | GitHub Actions: PHP 8.2/8.3/8.4 × Laravel 11/12, `prefer-lowest` and `prefer-stable` | Real-world dependency ranges. |
| Contract | Nightly run against staging | Catches the next server change before customers do. |

---

## 11. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Server prep (§9.1–9.5) | Deployed and tested |
| M1 | Client + data objects + exceptions + identity | Pest suite green against fakes and staging |
| M2 | Server-rendered board (no-JS), routes, Blade component, install/check commands | A fresh Laravel app shows a working board in under 5 minutes |
| M3 | Progressive enhancement: Alpine optimistic votes, Livewire component | All three modes pass the same feature tests |
| M4 | Customization: config, theme, publishable views + lang, slots, multi-app, events, `Fewchurs::fake()` | Demo app shows every level using public API only |
| M5 | Hardening: caching, throttling, honeypot, escaping tests, PHPStan 8, key-leak test, a11y pass | All CI gates green |
| M6 | Release 1.0: Packagist, `/docs/laravel`, changelog, platforms.ts update | `composer require fewchurs/laravel` works from scratch |

**1.1 candidates:** Roadmap tab (after §9.2), Inertia starter components, Filament plugin for viewing requests inside a Filament admin panel, more translations, `fewchurs:warm` scheduling.

---

## 12. Decisions to confirm

1. **Package name** — `fewchurs/laravel` (matches the landing-page snippet `Fewchurs::configure`), or `fewchurs/fewchurs-laravel`? Reserve on Packagist early.
2. **Laravel support window** — 11 + 12 only, or include 10 (still common in the wild)?
3. **Livewire** — first-class optional component in 1.0, or push to 1.1 and ship Alpine-only?
4. **Anonymous voting** — allowed by default (matches the public web board), or require auth?
5. **Tailwind assumption** — default views use Tailwind classes. Ship a second class-free/Bootstrap view set, or rely on publishing?
6. **Public board SEO** — should the package render a crawlable detail page per request (needs server §9.5)?
7. **Filament plugin** — worth it? Many Laravel SaaS apps use Filament and would want requests inside their admin.

---

## 13. Definition of done (1.0)

- `composer require` + one env var + `<x-fewchurs::board />` gives a working, styled, accessible board.
- It works with JavaScript disabled, and better with Alpine or Livewire.
- The API key never reaches the browser — enforced by a test.
- Validation, error messages, branding and rate-limit behavior match the iOS, Android and Flutter SDKs exactly.
- Server items §9.1–9.5 shipped, and §9.6 (per-IP limits) resolved before any IP limiting goes live.
- `/docs/laravel` published and Laravel marked live on the landing page.
