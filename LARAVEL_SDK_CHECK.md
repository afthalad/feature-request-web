# Laravel package check: does it work with Fewchurs and the plan limits?

Audited 2026-10-15 against `github.com/fewchurs/fewchurs-laravel` @ `16b7d24` ("Add the Fewchurs Laravel package", `1.0.0 — unreleased`), on PHP 8.5 with Laravel 12.70, against the live API at `https://www.fewchurs.shop/api/v1`.

## Verdict

The package is well built:
- **35 of 35 tests pass**, and PHPStan finds no errors.
- It speaks the current API correctly.
- The plan limits work in it with no package change, because the server applies them.

But it **isn't usable yet**, for these reasons:

1. **Dead default server.** Its default address is `https://fewchurs.com/api/v1`, a domain that doesn't exist. Every board fails unless the app sets `FEWCHURS_BASE_URL`. The Kotlin and Flutter SDKs had the same bug, and it's fixed in both.
2. **It can't be installed.** The README says `composer require fewchurs/laravel`, but it isn't on Packagist and the repo has no version tags.
3. **`php artisan fewchurs:check` always reports success.** Even with a dead URL or a wrong API key, it says "Board reachable". That's the opposite of its job.

## How a Laravel package is published

A Laravel package is a normal **Composer package**, and Composer installs from **[Packagist](https://packagist.org)**, the public PHP package registry. There's no separate "Laravel store". Publishing it is free:

1. Sign in to packagist.org with GitHub.
2. Click **Submit** and paste `https://github.com/fewchurs/fewchurs-laravel`. The vendor name `fewchurs` comes from `composer.json` (`"name": "fewchurs/laravel"`).
3. Turn on Packagist's GitHub hook. In Packagist, open **Profile → Show API token**, and the package page explains the hook. After that, every pushed tag becomes a version automatically.
4. Tag a release, such as `git tag v1.0.0 && git push origin v1.0.0`. Composer versions come from git tags, and there's no upload step.

After that, apps install it with `composer require fewchurs/laravel`. Laravel finds the service provider and the `Fewchurs` facade by itself, because `extra.laravel` is set in `composer.json`.

**License:** `composer.json` and `LICENSE` say **MIT**, which is open source. The Kotlin SDK uses your proprietary license. Packagist accepts either: set `"license": "proprietary"` and replace `LICENSE` if you want this one closed too. Decide before the first release, because published versions keep the license they shipped with.

---

## 1. API contract: package vs server

| Call | Package | Status |
|---|---|---|
| Headers: `Authorization`, `X-Device-Id` (HMAC-hashed per visitor), `X-Fewchurs-Sdk`, `Accept-Language` | ✅ | ✅ |
| `GET /config` → `showBranding`, `hideVoteCounts`, `appName` | ✅ | ✅ (but see Fix 3) |
| `GET /features?sort=top\|new&limit&cursor` | ✅ Tabs are Top and New only, matching the other SDKs | ✅ |
| `POST /features`, vote, unvote, follow, unfollow | ✅ Proxied server-side, so the key never reaches the browser | ✅ |
| `GET /features/{id}/comments`, `POST /comments` | ✅ | ✅ |
| Errors `{ error: { code, message } }`, including `unauthorized` and `forbidden` | ✅ | ✅ |
| `isMine` | ⚠️ Computed only from `authorDeviceId` and ignores the server's `isMine` (Fix 5) | Works today |
| `GET /features/{id}` (open one request) | ➖ Not used | Optional |

## 2. Plan limits in the Laravel package

All of this is decided on the server, so it works as is.

| Rule | Free | Starter | Pro | How the package gets it |
|---|---|---|---|---|
| Requests the board lists | First 5 submitted | First 200 | All | The API only returns the visible ones |
| "Powered by Fewchurs" line | Shown | Hidden | Hidden | `GET /config` → `showBranding` (`board.blade.php`, `livewire/board.blade.php`) |
| Submitting, voting, commenting | Always allowed | Always allowed | Always allowed | Never blocked by plan |

Behaviors to know about:
- **Caching:** the package caches `/config` for **1 hour** (`cache.config_ttl = 3600`) and lists for 15 seconds. After a plan change, the badge can take up to an hour to update, unless you run `php artisan cache:clear` or lower the TTL.
- **Own submission past the limit:** the user sees the "submitted" message, but the request won't appear in the list. It's saved and shows in the dashboard.

---

## 3. Fix list, in order

### P0: blocks real use

**Fix 1: dead default URL.** In `config/fewchurs.php`, change:

```php
'base_url' => env('FEWCHURS_BASE_URL', 'https://fewchurs.com/api/v1'),     // ❌ does not resolve
'base_url' => env('FEWCHURS_BASE_URL', 'https://www.fewchurs.shop/api/v1'), // ✅
```

Also change `homepage` and `authors.homepage` in `composer.json` to `https://www.fewchurs.shop`. Add a test that the default URL is the live one.

**Fix 2: publish it.** Choose the license, tag `v1.0.0` and submit to Packagist (see above). Until then, apps can install from GitHub (see the test guide below).

**Fix 3: make `fewchurs:check` truthful.** `ConfigResource::get()` catches every error and returns `BoardConfig(showBranding: true)`. That's a good fallback for rendering the board, but `fewchurs:check` calls `fresh()` → `get()`, so its `InvalidApiKeyException` and `FewchursException` branches can never run. Verified live:

| Setup | What `fewchurs:check` printed |
|---|---|
| Default URL (`fewchurs.com`, doesn't resolve) | ✅ "Board reachable", "Branding badge: shown" |
| A rejected API key | ✅ "Board reachable", "Branding badge: shown" |

Fix: give `fresh()` a strict path that throws, for example a `ConfigResource::fetch()` without the catch, and use it in `CheckCommand`. Keep `get()` lenient for the board itself. Add tests for "bad key → FAILURE" and "unreachable → FAILURE".

### P1: correctness

**Fix 4: plan wording.** `CheckCommand` prints `shown (Free/Starter plan)` and `hidden (Pro plan)`. It should be **shown (Free plan)** and **hidden (Starter or Pro plan)**.

**Fix 5: `isMine`.** `Data/Feature.php` and `Data/Comment.php` compute `isMine` only by comparing `authorDeviceId`/`deviceId`. Use the server's `isMine` when it's present, and keep the device-ID comparison only as a fallback. The server may stop sending raw device IDs.

**Fix 6: config cache.** Consider lowering `config_ttl` to 5 minutes, so plan changes (badge) and the **Hide vote counts** switch show up quickly. The SDKs re-read it every time the board opens.

### P2: housekeeping

- `CHANGELOG.md` says `1.0.0 — unreleased`. Date it when you tag.
- PHPStan runs out of memory at PHP's default 128 MB (`--memory-limit=1G` fixes it). Add `memory-limit` to the composer `analyse` script, or set it in CI.
- The website's `/docs/laravel` page still shows a hand-written service class. After publishing, rewrite it to `composer require fewchurs/laravel` + `<x-fewchurs::board />`, like the Android, iOS and Flutter pages.

---

## 4. Test guide

### A. The package's own checks (in the `fewchurs-laravel` repo)

```bash
git clone https://github.com/fewchurs/fewchurs-laravel.git && cd fewchurs-laravel
```

```bash
composer install
```

```bash
composer test
```

```bash
vendor/bin/phpstan analyse --memory-limit=1G
```

Live check against your server. Use a real key from the dashboard:

```bash
CACHE_STORE=array FEWCHURS_API_KEY=fr_live_xxx FEWCHURS_BASE_URL=https://www.fewchurs.shop/api/v1 vendor/bin/testbench fewchurs:check
```

Until Fix 3 lands, this prints "reachable" even when it isn't. Trust the board in step B instead.

### B. In a real Laravel app

1. Create a test app.
   ```bash
   composer create-project laravel/laravel fewchurs-test && cd fewchurs-test
   ```
2. Install from GitHub. Until it's on Packagist, add this to the app's `composer.json`:
   ```json
   "repositories": [{ "type": "vcs", "url": "https://github.com/fewchurs/fewchurs-laravel" }]
   ```
   Then run:
   ```bash
   composer require fewchurs/laravel:dev-main
   ```
   Once it's published, `composer require fewchurs/laravel` is all you need.
3. Set it up.
   ```bash
   php artisan fewchurs:install
   ```
   Add to `.env`. You need `FEWCHURS_BASE_URL` until Fix 1 ships:
   ```dotenv
   FEWCHURS_API_KEY=fr_live_xxx
   FEWCHURS_BASE_URL=https://www.fewchurs.shop/api/v1
   ```
4. Run it and open http://localhost:8000/feedback.
   ```bash
   php artisan serve
   ```
5. Optional: put `<x-fewchurs::board />` in any Blade view. If the app uses Livewire, also try `<livewire:fewchurs-board />`.

### C. Manual checklist

Use a fresh app in the dashboard with **Email on new request** turned on. Switch plans in **Admin → Users → you → Plan override**. After each switch, run `php artisan cache:clear` (config is cached for 1 hour).

**Basics**
- [ ] `/feedback` shows the board inside the app's layout. Top and New tabs work.
- [ ] Voting, unvoting, commenting and following with an email all work.
- [ ] They also work with **JavaScript turned off**, since the board is server-rendered.
- [ ] View the page source: the API key never appears.
- [ ] A wrong key in `.env` makes the board show an error, not a blank page.
- [ ] Turning **Hide vote counts** on in the dashboard hides the numbers after a cache clear, and voting still works.

**Free plan**
- [ ] Submit 5 requests. All 5 show, and 5 full emails arrive.
- [ ] Submit #6 and #7. The "submitted" message shows, but they **don't** appear in the list. The same first 5 stay in both tabs.
- [ ] The emails for #6 and #7 have **hidden details**.
- [ ] The dashboard shows 5 readable rows, plus 2 locked rows at the bottom.
- [ ] **"Powered by Fewchurs"** shows under the board.

**Starter plan** (clear the cache)
- [ ] All requests show.
- [ ] The **"Powered by" line is gone**.
- [ ] A new request's email has full details.

**Pro plan** (clear the cache)
- [ ] All requests show, with no "Powered by" line.

**Back to Free** (clear the cache)
- [ ] Only the first 5 show again, and the badge returns.

**Limits and safety**
- [ ] More than 15 submissions in a day from one visitor, or more than 10 comments, shows the daily-limit message.
- [ ] Very fast repeated posts are throttled (`route.throttle = 30,1`).
- [ ] A form submitted instantly is rejected by the honeypot.
- [ ] Deleting the app in the dashboard makes the board show an error within about a minute.
