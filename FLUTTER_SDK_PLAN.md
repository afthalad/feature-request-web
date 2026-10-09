# Fewchurs Flutter Package — Plan

A plug-and-play, customizable Flutter package for Fewchurs: add one dependency and one line of code to get a feature-request board (list, vote, comment, follow, submit) that matches the host app's theme, on **Android, iOS, web, macOS, Windows and Linux** from one codebase — plus a headless client for developers who build their own UI.

This plan is based on the live `/api/v1` endpoints in this repo (`src/app/api/v1/**`), and mirrors the concepts and naming of the SwiftUI SDK (`src/app/docs/swiftui/page.tsx`) and the Android plan (`KOTLIN_SDK_PLAN.md`), so docs and support stay shared across platforms.

---

## 1. Goals and non-goals

### Goals
1. **Plug and play.** Board working in under 5 minutes: `flutter pub add fewchurs`, API key, one call.
2. **Looks like the host app by default.** Reads the app's `ThemeData` automatically (the product promise: *"a board that looks like your app"*).
3. **Customizable at every level** — one color → whole theme → wording → replace widgets → fully custom UI.
4. **Every Flutter platform** — mobile, web, desktop — with no platform-specific setup.
5. **A well-behaved dependency.** Minimal packages, no state-management library forced on the host, no crashes, no hidden data collection. Full pub.dev score.

### Non-goals (v1)
- Offline write queue (show a clear "you're offline" error instead).
- Push notifications (Fewchurs notifies by email).
- Server-side Dart / backend usage (the core client *can* run on the Dart VM, but it isn't a supported use case).

---

## 2. Developer experience

### 2.1 Install
```bash
flutter pub add fewchurs
```

### 2.2 Configure
```dart
void main() {
  Fewchurs.configure(apiKey: 'fr_live_xxx');
  runApp(const MyApp());
}
```
The API key comes from the app's settings in the Fewchurs dashboard. It is shown once at creation; a lost key can be regenerated.

### 2.3 Show the board
```dart
// As a screen (push a route)
Fewchurs.showBoard(context);

// As a bottom sheet
Fewchurs.showBoardSheet(context);

// As a widget anywhere — a tab, a drawer page, a go_router route
const FewchursBoard();
```

### 2.4 Submit from your own UI
```dart
try {
  final feature = await Fewchurs.submitFeature(
    title: 'Add dark mode',
    description: 'Would love a dark theme.',
    isSubscriber: user.hasActiveSubscription,
  );
  debugPrint('Submitted ${feature.id} (${feature.status})');
} on FewchursException catch (e) {
  showSnackBar(e.userMessage);
}
```

That is the complete integration for most developers.

---

## 3. Architecture

### 3.1 Packages

| Package | Contents | Depends on |
|---|---|---|
| `fewchurs` | Everything most developers need: widgets, theming, localization, **and re-exports the core**. | `fewchurs_core`, Flutter |
| `fewchurs_core` | Pure Dart: API client, models, errors, device identity interface, board/detail controllers. No Flutter widgets. | `http` |

Developers only ever add `fewchurs`. `fewchurs_core` exists so the logic is testable without Flutter and reusable for fully custom UIs.

Both live in one repo (`github.com/fewchurs/fewchurs-flutter`), managed with Dart **pub workspaces** (or melos).

### 3.2 Repository layout
```
fewchurs-flutter/
├─ packages/
│  ├─ fewchurs_core/lib/
│  │  ├─ fewchurs_core.dart            // public exports
│  │  └─ src/
│  │     ├─ client/fewchurs_client.dart   // HTTP + envelope + retry
│  │     ├─ models/                       // Feature, Comment, FeatureStatus, FeaturePage
│  │     ├─ errors/fewchurs_exception.dart
│  │     ├─ identity/device_id_store.dart // interface + in-memory impl
│  │     └─ controllers/                  // BoardController, FeatureDetailController
│  └─ fewchurs/lib/
│     ├─ fewchurs.dart                  // public exports (+ re-export core)
│     └─ src/
│        ├─ fewchurs.dart                 // Fewchurs facade: configure, showBoard, submitFeature
│        ├─ config/                       // FewchursConfig, BoardOptions
│        ├─ theme/                        // FewchursThemeData (ThemeExtension), FewchursTheme
│        ├─ l10n/                         // ARB files + FewchursLocalizations
│        ├─ identity/prefs_device_id_store.dart // shared_preferences implementation
│        ├─ screens/{board,detail,submit}/
│        └─ widgets/                      // VoteButton, StatusChip, FeatureCard, PoweredByBadge…
├─ example/                            // runnable demo: default, themed, cupertino, headless
└─ .github/workflows/                  // analyze, test, goldens, publish
```

### 3.3 Layering
```
Host app
  │
  ├─ FewchursBoard / Fewchurs.showBoard         (fewchurs: widgets)
  │       │ listens to
  │       ▼
  ├─ BoardController / FeatureDetailController  (core: ChangeNotifier state holders)
  │       │
  │       ▼
  └─ FewchursClient                             (core: package:http)
          │  HTTPS, Bearer key, X-Device-Id
          ▼
     https://fewchurs.com/api/v1
```

### 3.4 Tech choices

| Concern | Choice | Why |
|---|---|---|
| SDK floor | Dart ≥ 3.5, Flutter ≥ 3.24 (roughly the last 4 stable releases; raise yearly) | Recent enough for modern APIs, old enough not to force upgrades. |
| HTTP | **`package:http`** with an injectable `http.Client` | Official, tiny, works on every platform including web. Devs can pass their own client (logging, proxies, certificate pinning). No Dio. |
| JSON | Hand-written `fromJson`/`toJson` | Six small models; avoids build_runner and generated-code churn. Unknown fields ignored. |
| State | **`ChangeNotifier` / `ValueListenable`** (built into Flutter) | No Riverpod/Bloc/Provider forced on the host. Controllers plug into any state library the app uses. |
| Storage | `shared_preferences` (behind an interface) | Works on all 6 platforms (localStorage on web). Replaceable. |
| UI | Material 3 widgets by default, optional Cupertino-adaptive mode | Matches most Flutter apps; iOS-feel option for Cupertino apps. |
| Localization | ARB + `intl`-style generated `FewchursLocalizations` | Standard Flutter l10n; works even if the host doesn't set up delegates (English fallback). |
| Lints | `flutter_lints` + stricter rules (public API docs required) | Keeps pub.dev score at maximum. |

**Dependency budget:** `http`, `shared_preferences`, `meta` (+ Flutter SDK). Adding any new dependency needs a written reason.

---

## 4. API contract

All requests go to `https://fewchurs.com/api/v1` (base URL overridable for staging).

**Headers on every request**
| Header | Value |
|---|---|
| `Authorization` | `Bearer fr_live_…` (required — every endpoint returns `401 invalid_key` without it) |
| `X-Device-Id` | Package-generated device ID (§5); required by all endpoints except the comments list |
| `X-Fewchurs-Sdk` | `flutter/1.0.0 (android)` — browsers don't allow setting `User-Agent`, so a custom header is used on every platform |
| `Accept-Language` | Device locale (for future server-side translation) |

### 4.1 Endpoints

| Method + path | Body / query | Success response | Notes |
|---|---|---|---|
| `GET /config` | — | `{ showBranding: bool }` | Once per session, cached. `false` only on the Pro plan. |
| `GET /features` | `sort=top\|new`, `limit` 1–100 (default 20), `cursor` | `{ features: FeatureWithVote[], nextCursor: String? }` | Includes `hasVoted`, `isFollowing` for this device. |
| `POST /features` | `{ title (3–100), description (≤1000), email?, isSubscriber? }` | `201` `Feature` | With `email`, the server also follows the feature for that email. |
| `POST /features/{id}/vote` | — | `{ upvoteCount, hasVoted: true }` | Idempotent — safe to retry. |
| `DELETE /features/{id}/vote` | — | `{ upvoteCount, hasVoted: false }` | Idempotent. |
| `POST /features/{id}/follow` | `{ email }` (**required**) | `{ following: true }` | Following always needs an email — the UI must ask for one. |
| `DELETE /features/{id}/follow` | — | `{ following: false }` | |
| `GET /features/{id}/comments` | `limit`, `cursor` | `{ comments: Comment[], nextCursor }` | Deleted comments are filtered **after** paging, so a page can be short or empty while `nextCursor` is non-null — the pager must keep going. |
| `POST /comments` | `{ featureId, text (1–1000), authorName? (≤60) }` | `201` `Comment` | |

### 4.2 Errors
Every error body is `{ "error": { "code": "...", "message": "..." } }`, mapped to a sealed exception hierarchy:

| `code` | HTTP | Dart exception | Default user message |
|---|---|---|---|
| `invalid_key` | 401 | `FewchursInvalidApiKeyException` | generic error (plus a loud debug log for the developer) |
| `validation_failed` | 400 | `FewchursValidationException` | server message |
| `rate_limited` | 429 | `FewchursRateLimitedException` | "You've reached today's limit. Try again tomorrow." |
| `limit_reached` | 402 | `FewchursLimitReachedException` | "This board isn't accepting requests right now." |
| `not_found` | 404 | `FewchursNotFoundException` | "This request no longer exists." (removed from the list) |
| `internal` / 5xx | 500 | `FewchursServerException` | "Something went wrong. Try again." |
| no response | — | `FewchursNetworkException` | "You're offline." |
| bad JSON | — | `FewchursUnknownException` | generic |

All extend `sealed class FewchursException implements Exception` with `userMessage`, `code` and `statusCode`, so apps can use exhaustive `switch`.

Server rate limits: **15 submissions / device / day**, **10 comments / device / day**.

### 4.3 Public models
```dart
enum FeatureStatus { open, planned, inProgress, done, declined, unknown }

@immutable
class Feature {
  final String id;
  final String title;
  final String description;
  final FeatureStatus status;
  final int upvoteCount;
  final int commentCount;
  final int followerCount;
  final bool hasVoted;
  final bool isFollowing;
  final bool isMine;         // see §11 item 4
  final DateTime createdAt;  // UTC, parsed from the server's ISO string
  final DateTime updatedAt;
  Feature copyWith({...});
}

@immutable
class Comment {
  final String id;
  final String text;
  final String authorName;
  final bool isDeveloper;
  final bool isMine;
  final DateTime createdAt;
}

@immutable
class FeaturePage { final List<Feature> features; final String? nextCursor; }
```
- Unknown status strings map to `FeatureStatus.unknown` — a new server status must never throw in a shipped app.
- Raw device IDs are never part of the public models.

---

## 5. Device identity

Anonymous users are identified by `X-Device-Id`: votes, follows, "mine" and rate limits all depend on it.

- **Default:** random UUID v4 on first use, saved with `shared_preferences` under `fewchurs.device_id`.
  - Android/iOS/desktop: persists until uninstall.
  - Web: persists per browser (localStorage); clearing site data resets it. Document this.
- No hardware IDs, no advertising IDs.
- **Customizable** for apps with accounts, so votes follow the user across devices and platforms:
  ```dart
  Fewchurs.configure(
    apiKey: 'fr_live_xxx',
    deviceId: () async => auth.currentUser == null ? null : sha256Hex(auth.currentUser!.uid),
  );
  ```
  `null` falls back to the generated ID. Docs recommend a **hash** of the user ID — never an email.
- **Custom storage:** implement `DeviceIdStore` (e.g. `flutter_secure_storage`, Hive) and pass it to `configure`.

---

## 6. UI

### 6.1 Board
- App bar with title (default "Feature requests") and close button when shown as a route/sheet.
- Tabs: **Top** · **New** · **Roadmap** (Roadmap needs server work §11.2; hidden until available).
- Feature card: vote button (arrow + count, filled when voted), title, 2-line description, status chip, comment count.
- Pull to refresh, infinite scroll with footer loader, scroll position kept per tab.
- Primary action "Suggest a feature" (FAB, bottom bar or app-bar action — configurable).
- States: loading skeleton, empty, error with retry, offline banner.
- "Powered by Fewchurs" footer when `showBranding` is true.
- Responsive: on wide screens (tablet, web, desktop) the board is centered with a max width and the detail opens beside the list (master–detail) instead of as a new page.

### 6.2 Feature detail
- Title, full description, status, vote, **Follow** toggle.
- Follow flow: use the configured `userEmail` or a previously remembered one (with consent); otherwise show an email dialog ("We'll email you when this ships").
- Comments: paginated (with the short-page rule from §4.1), "Developer" badge, "You" on own comments.
- Composer: text (1–1000 with counter), optional display name (≤60, remembered), send button with pending state.

### 6.3 Submit
- Title (3–100, live counter), description (optional, ≤1000), email (optional, "Email me when it ships").
- Client validation mirrors the server rules exactly.
- Success: confirmation, then the new request appears at the top of **New**.
- Double-submit protection; draft kept if the sheet is dismissed accidentally.

### 6.4 Interaction rules
- **Optimistic voting:** toggle instantly, reconcile with the returned count, roll back + snackbar on failure; rapid taps collapse to the final state.
- **Hidden vote counts:** when the owner enables it, only the arrow shows (needs server work §11.1).
- Every tap gives immediate feedback (pressed state, spinner on pending actions).
- Keyboard and mouse: hover states, focus traversal, Enter to submit, Esc to close — important on web and desktop.

### 6.5 Accessibility & localization
- `Semantics` everywhere: vote button reads "Upvote, 12 votes, voted"; statuses read by name.
- 48×48 minimum tap targets, text scaling to 2.0, RTL, contrast checked in light and dark.
- Ship **en** at 1.0; es, fr, de, pt-BR, ja in 1.1. Host apps can override any string (§7).

---

## 7. Customization — five levels

### Level 1 — Automatic (no code)
The board reads `Theme.of(context)` — `colorScheme`, `textTheme`, component shapes — and follows the app's light/dark mode. In a Material 3 app it already looks native.

### Level 2 — Theme
Idiomatic Flutter: a `ThemeExtension`, so it lives with the rest of the app theme and animates with theme changes.
```dart
MaterialApp(
  theme: ThemeData(
    colorSchemeSeed: const Color(0xFFED5F18),
    extensions: const [
      FewchursThemeData(
        cardRadius: 14,
        voteButtonStyle: VoteButtonStyle.pill,   // pill | column | minimal
        density: FewchursDensity.compact,        // comfortable | compact
        statusColors: {FeatureStatus.done: Color(0xFF16A34A)},
      ),
    ],
  ),
);
```
Or scoped to one place:
```dart
FewchursTheme(
  data: FewchursThemeData(primary: Colors.teal, fontFamily: 'Inter'),
  child: const FewchursBoard(),
);
```
Tokens: colors (primary, onPrimary, background, surface, onSurface, muted, border, error, per-status), shapes (card, button, chip, sheet radius), text styles (title, body, label, fontFamily), density, vote button style.

**Visual style switch:**
```dart
Fewchurs.configure(apiKey: '…', style: FewchursStyle.adaptive); // material | cupertino | adaptive
```
`adaptive` uses Cupertino widgets (navigation bar, action sheets, switches) on iOS/macOS and Material elsewhere.

### Level 3 — Behavior & wording
```dart
Fewchurs.configure(
  apiKey: 'fr_live_xxx',
  board: const BoardOptions(
    tabs: [BoardTab.top, BoardTab.newest, BoardTab.roadmap],
    defaultTab: BoardTab.top,
    showDeclined: false,
    allowSubmissions: true,
    allowComments: true,
    emailField: EmailField.optional,        // hidden | optional | required
    submitButton: SubmitButtonPlacement.fab,// fab | bottomBar | appBarAction
    pageSize: 20,
  ),
  strings: const FewchursStrings(
    boardTitle: 'Ideas & roadmap',
    submitButton: 'Suggest an idea',
    emptyTitle: 'No ideas yet',
  ),
  isSubscriber: () => billing.hasActiveSubscription,
  userEmail: () => auth.currentUser?.email,
);
```
Translations: add `FewchursLocalizations.delegate` to `localizationsDelegates`; override individual strings through `FewchursStrings` (which wins over the delegate).

### Level 4 — Builders (replace pieces, keep the logic)
```dart
FewchursBoard(
  headerBuilder: (context) => const MyBoardHeader(),
  emptyBuilder: (context) => const MyEmptyIllustration(),
  featureCardBuilder: (context, feature, actions) =>
      MyFeatureRow(feature: feature, onVote: actions.toggleVote, onOpen: actions.open),
  voteButtonBuilder: (context, state) => MyVoteChip(state: state),
  statusChipBuilder: (context, status) => MyStatusTag(status),
);
```
Builders receive state + actions, so paging, optimistic votes and errors keep working.

### Level 5 — Headless (build everything yourself)
```dart
final board = Fewchurs.boardController(sort: FeatureSort.top);

ListenableBuilder(
  listenable: board,
  builder: (context, _) => switch (board.state) {
    BoardLoading() => const CircularProgressIndicator(),
    BoardError(:final error) => Text(error.userMessage),
    BoardContent(:final features, :final canLoadMore) => MyList(features),
  },
);

board.loadMore();
board.toggleVote(featureId);
board.refresh();
board.dispose();

// Or raw client calls
final page = await Fewchurs.client.listFeatures(sort: FeatureSort.newest, limit: 20);
await Fewchurs.client.vote(featureId);
await Fewchurs.client.follow(featureId, email: 'a@b.com');
await Fewchurs.client.addComment(featureId, text: '+1', authorName: 'Sam');
```
Controllers are plain `ChangeNotifier`s, so they fit Provider, Riverpod, Bloc or `setState` equally.

### 7.6 More integration points
- **Presentation:** `showBoard` (route), `showBoardSheet` (modal sheet, draggable), `FewchursBoard` (embed), and a documented go_router example (no go_router dependency).
- **Events for analytics:**
  ```dart
  Fewchurs.events.listen((event) => switch (event) {
    BoardOpened() => analytics.log('fewchurs_open'),
    FeatureSubmitted(:final featureId) => analytics.log('fewchurs_submit', featureId),
    Voted() || Commented() || Followed() => analytics.log(event.name),
    FewchursErrorEvent(:final error) => crashlytics.recordError(error, null),
  });
  ```
  The package sends **no** analytics anywhere itself.
- **Logging:** `logLevel: FewchursLogLevel.none | error | debug` (debug logs requests, never the API key).
- **Custom HTTP client:** `httpClient: myClient` for interceptors, proxies or pinning.
- **Base URL:** `baseUrl: 'https://staging.fewchurs.com/api/v1'`.
- **Branding badge:** controlled only by the server (`showBranding`); no option hides it on the free plan. Upgrading to Pro removes it automatically, like iOS and Android.

---

## 8. Platform notes

| Platform | Notes |
|---|---|
| Android | Needs the `INTERNET` permission in release builds (debug has it by default) — the #1 "works in debug, fails in release" support issue. Docs must say so. |
| iOS | Nothing extra. |
| macOS | Needs `com.apple.security.network.client` in both entitlements files — the #1 macOS issue. |
| Web | **Needs CORS on the server (§11.7).** Device ID is per browser. The API key is visible in the page source (still fine — it's publishable, see §9). |
| Windows / Linux | Nothing extra. |

The example app runs on all six, and CI builds all six.

---

## 9. Reliability, security, privacy

### Reliability
- **Never crash the host.** Using the board before `configure` shows a clear error widget in debug and logs once in release. Every async error is caught and surfaced as a `FewchursException`.
- Timeouts 15s. GETs and idempotent votes retry twice with backoff on network/5xx; creating content is never auto-retried.
- `configure` is synchronous and does no network work — nothing slows app startup.
- Controllers are disposed with their widgets; no leaked listeners or timers.

### Security
- The API key is **publishable by design** — it's inside every app binary and every web page. Say so plainly in the docs. Protection is server-side (per-device limits today; see §11.6).
- HTTPS only. API key never logged.

### Privacy (Google Play Data Safety / Apple privacy labels)
| Data | Collected | Notes |
|---|---|---|
| Email | Optional, user-provided | Only when the user types it; used for "shipped" emails. |
| User content | Yes | Titles, descriptions, comments. |
| App-scoped identifier | Yes | Random UUID, not tied to hardware or ads. |
| Analytics / ads / location / tracking | No | |

Ship a ready-to-copy table for both stores in the docs.

---

## 10. Testing & quality gates

| Layer | Tooling | Covers |
|---|---|---|
| Client | `package:test` + `http/testing` `MockClient` | Every endpoint, headers, error mapping, retries, the short comments page, unknown fields/status. |
| Controllers | `package:test` + `fake_async` | Paging, optimistic vote + rollback, refresh, dispose. |
| Widgets | `flutter_test` | Submit validation, vote toggle, follow email dialog, empty/error/offline states. |
| Goldens | `matchesGoldenFile` (or `alchemist`) | Light/dark, Material vs Cupertino, custom theme, compact density, text scale 2.0, RTL, wide layout. |
| Integration | `integration_test` in `example/` against staging | Full loop on Android, iOS and web. |
| Public API | `dart_apitool` diff in CI | Breaking public changes fail CI unless it's a major version. |
| pub.dev score | `pana` in CI | Must stay at the maximum score. |
| Static analysis | `dart analyze`, `dart format --set-exit-if-changed` | Zero warnings. |

---

## 11. Server work needed (this repo)

Shared with the Android plan (`KOTLIN_SDK_PLAN.md` §10), plus one Flutter-specific item. Items 1–5 and 7 before 1.0.

1. **`/v1/features` ignores `hideVoteCounts`.** The web board hides counts (`src/app/api/public/board/[slug]/features/route.ts`); the SDK endpoint doesn't. Apply the same mapping to the list and vote responses.
2. **No status filter → no Roadmap tab.** Add `?status=planned,in_progress,done` to `GET /v1/features` (Firestore composite indexes: `status + upvoteCount`, `status + createdAt`).
3. **Extend `/v1/config`** to `{ showBranding, hideVoteCounts, appName }`; later, dashboard-controlled theme defaults.
4. **Device IDs leak.** Comments return every commenter's `deviceId` and features return `authorDeviceId`; with the public API key anyone can read them and act as another device. Return `isMine: bool` instead, computed from the caller's `X-Device-Id`.
5. **Add `GET /v1/features/{id}`** (with `hasVoted` / `isFollowing`) for deep links and refreshing the detail screen.
6. **Abuse hardening (after 1.0).** Device IDs are client-chosen; add per-IP limits on write endpoints.
7. **CORS for Flutter web (Flutter-specific).** No CORS headers exist anywhere today, so browsers will block every `/api/v1` call from a Flutter web build. Add CORS to `/api/v1/*`: handle `OPTIONS` preflight, allow `Authorization`, `Content-Type`, `X-Device-Id`, `X-Fewchurs-Sdk`, `Accept-Language`, methods `GET, POST, DELETE`. Allowing any origin is acceptable because auth is a bearer header, not cookies (keep `Access-Control-Allow-Credentials` off).
8. **Web docs:** add `/docs/flutter` (mirroring `/docs/swiftui`) and update the Flutter entry in `src/lib/platforms.ts` — it currently says "coming soon" and has no code snippet or `href`.

---

## 12. Milestones

| # | Milestone | Scope | Done when |
|---|---|---|---|
| M0 | Server prep | §11 items 1–5, 7 | Deployed, tested; a Flutter web build can call the API |
| M1 | Core | Client, models, errors, identity, controllers | Unit tests green on the Dart VM |
| M2 | Default UI | Board, detail, submit, follow, theme bridge, English strings | Example app full loop works on staging on Android, iOS and web |
| M3 | Customization | ThemeExtension, Cupertino/adaptive, options, strings, builders, events, headless API, custom HTTP client | Example app has default / themed / Cupertino / headless variants using only public API |
| M4 | Hardening | a11y, goldens matrix, wide layouts, keyboard/mouse, all 6 platforms in CI, pana max score | All CI gates green |
| M5 | Release 1.0 | pub.dev publish, `/docs/flutter`, changelog, platforms.ts update | `flutter pub add fewchurs` works in a fresh project on every platform |

**1.1 candidates:** more languages, deep link handling for "it shipped" emails, dashboard-driven remote theming, delete own comment, translated titles/descriptions.

---

## 13. Distribution & versioning

- **pub.dev** under a **verified publisher** (`fewchurs.com`), so the package shows the verified badge. Package names `fewchurs` and `fewchurs_core` — confirm both are still free on pub.dev and reserve them early.
- Automated publishing from GitHub Actions on version tags (pub.dev supports OIDC publishing — no long-lived secrets).
- **Semantic versioning.** Breaking changes only in major versions; `@Deprecated` with migration hints for at least one minor release.
- `CHANGELOG.md` (shown on pub.dev), example app linked from the README, API docs generated by `dart doc`.
- The package sends its version in `X-Fewchurs-Sdk` so the server can support old versions deliberately.

---

## 14. Decisions to confirm

1. **Flutter/Dart floor** — Flutter ≥ 3.24 / Dart ≥ 3.5, or wider?
2. **Cupertino-adaptive in 1.0**, or Material only at launch and adaptive in 1.1?
3. **Show declined requests** by default?
4. **Roadmap tab at 1.0** — ship with Top/New only if the server filter slips?
5. **Remember the user's email** after the first follow (with a visible checkbox), or ask every time?
6. **Web support at 1.0** — depends on the CORS change (§11.7); otherwise launch mobile + desktop first.
7. **License** — MIT or BSD-3 (the Flutter ecosystem norm)?

---

## 15. Definition of done (1.0)

- `flutter pub add fewchurs` + `Fewchurs.configure(apiKey: …)` + `Fewchurs.showBoard(context)` shows a working, native-looking board on Android, iOS, web, macOS, Windows and Linux.
- Every customization level in §7 is shown in the example app using public API only.
- Zero crash paths in the host; no network calls at startup; no state-management library forced on the host.
- Server items §11.1–11.5 and §11.7 shipped; branding, hidden vote counts and rate limits behave the same on web, iOS, Android and Flutter.
- Maximum pub.dev score, verified publisher, `/docs/flutter` live, Flutter marked live on the landing page.
