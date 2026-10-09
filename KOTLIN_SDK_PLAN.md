# Fewchurs Android SDK (Kotlin) — Plan

A plug-and-play, customizable Android SDK for Fewchurs: add one dependency and one line of code to get a native feature-request board (list, vote, comment, follow, submit) that looks like the host app — plus a headless client for developers who want to build their own UI.

This plan is based on the live `/api/v1` endpoints in this repo (`src/app/api/v1/**`), the SwiftUI SDK docs (`src/app/docs/swiftui/page.tsx`), and the Kotlin snippet already promised on the landing page (`src/lib/platforms.ts`).

---

## 1. Goals and non-goals

### Goals
1. **Plug and play.** From zero to a working board in under 5 minutes: dependency + API key + one call.
2. **Looks like the host app by default.** Inherit the app's Material theme automatically; no styling required. (This is a core product promise: *"a board that looks like your app"*.)
3. **Customizable at every level** — from changing one color to replacing the entire UI.
4. **Parity with the Swift SDK** in concepts and naming, so docs and support are shared.
5. **Small, safe, boring dependency.** Few transitive libraries, no crashes in the host app, no surprise data collection.

### Non-goals (v1)
- Kotlin Multiplatform / iOS from this codebase (Swift SDK already exists).
- Offline write queue (submitting while offline) — show a clear error instead.
- Push notifications (Fewchurs notifies by email).
- Java-first API (Java works through a thin wrapper, see §7.6, but Kotlin + coroutines is the primary API).

---

## 2. Developer experience — what integration looks like

### 2.1 Install
```kotlin
// build.gradle.kts (app)
dependencies {
    implementation("com.fewchurs:fewchurs-android:1.0.0")
}
```

### 2.2 Configure — option A: zero code (manifest)
```xml
<!-- AndroidManifest.xml -->
<application>
    <meta-data
        android:name="com.fewchurs.sdk.API_KEY"
        android:value="fr_live_xxx" />
</application>
```
The SDK auto-initializes through AndroidX App Startup. Nothing else is required.

### 2.3 Configure — option B: code (recommended when customizing)
```kotlin
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Fewchurs.configure(this, apiKey = "fr_live_xxx") {
            isSubscriber = { billing.hasActiveSubscription() }
            userEmail = { auth.currentUser?.email }
        }
    }
}
```

### 2.4 Show the board
```kotlin
// Jetpack Compose — anywhere: a screen, a tab, a nav destination
FewchursBoard(onClose = { navController.popBackStack() })

// Compose — as a bottom sheet
FewchursBoardSheet(visible = showBoard, onDismiss = { showBoard = false })

// Views / XML / anywhere with a Context (launches a themed Activity)
Fewchurs.showBoard(context)
```

### 2.5 Submit from your own UI
```kotlin
lifecycleScope.launch {
    try {
        val feature = Fewchurs.submitFeature(
            title = "Add dark mode",
            description = "Would love a dark theme.",
            isSubscriber = true,
        )
        Log.d("App", "Submitted ${feature.id} (${feature.status})")
    } catch (e: FewchursException) {
        showError(e.userMessage)
    }
}
```

That is the whole integration for most developers. Everything below is optional.

---

## 3. Architecture

### 3.1 Modules (published artifacts)

| Artifact | Contents | Who uses it |
|---|---|---|
| `com.fewchurs:fewchurs-core` | API client, models, errors, device identity, repository, board state holder. **No Compose, no UI.** | Developers building a fully custom UI; also the base of the UI module. |
| `com.fewchurs:fewchurs-android` | Compose UI (board, detail, submit, follow), theming, strings, `FewchursActivity`, App Startup initializer. Depends on `core`. | Everyone else — the default. |

Two artifacts keep the headless path free of Compose for apps that don't use it, without making the default path any harder.

### 3.2 Repository layout (`github.com/fewchurs/fewchurs-kotlin`, mirroring `fewchurs-swift`)
```
fewchurs-kotlin/
├─ fewchurs-core/
│  └─ src/main/kotlin/com/fewchurs/sdk/
│     ├─ Fewchurs.kt                 // public entry point (object)
│     ├─ FewchursConfig.kt           // configuration DSL
│     ├─ model/                      // Feature, Comment, FeatureStatus, Page<T>, FewchursEvent
│     ├─ error/FewchursException.kt  // sealed error hierarchy
│     ├─ internal/network/           // HTTP client, envelope parsing, retry
│     ├─ internal/identity/          // device ID storage
│     ├─ data/FewchursRepository.kt  // caching + optimistic updates
│     └─ state/BoardState.kt         // headless board state holder (StateFlow)
├─ fewchurs-android/
│  └─ src/main/kotlin/com/fewchurs/sdk/ui/
│     ├─ FewchursBoard.kt            // public composables
│     ├─ theme/FewchursTheme.kt      // tokens + Material bridge
│     ├─ screens/{board,detail,submit}/
│     ├─ components/                 // VoteButton, StatusChip, FeatureCard, PoweredByBadge...
│     ├─ FewchursActivity.kt         // for View-based apps
│     └─ FewchursInitializer.kt      // App Startup (manifest config)
│  └─ src/main/res/values*/strings.xml
├─ sample/                            // demo app: default, themed, custom-UI, View-based
└─ build-logic/                       // convention plugins, publishing
```

### 3.3 Layering
```
Host app
  │
  ├─ FewchursBoard / Fewchurs.showBoard      (fewchurs-android: Compose UI)
  │       │  observes
  │       ▼
  ├─ BoardState / FeatureDetailState          (core: StateFlow state holders)
  │       │
  │       ▼
  ├─ FewchursRepository                       (core: cache, optimistic votes, paging)
  │       │
  │       ▼
  └─ FewchursApi (internal)                   (core: OkHttp + kotlinx.serialization)
          │  HTTPS, Bearer key, X-Device-Id
          ▼
     https://fewchurs.com/api/v1
```

### 3.4 Tech choices

| Concern | Choice | Why |
|---|---|---|
| Language | Kotlin 2.x, `explicitApi()` strict mode | Every public symbol is intentional; nothing internal leaks. |
| Min / target SDK | **minSdk 23**, compile/target latest | Library minSdk caps host apps; 23 covers practically all active devices without desugaring. |
| HTTP | **OkHttp** | Already in most Android apps, so it rarely adds weight; mature, testable (MockWebServer). No Retrofit — six endpoints don't need it. |
| JSON | **kotlinx.serialization** | No reflection, R8-friendly, Kotlin-native. `ignoreUnknownKeys = true` for forward compatibility. |
| Async | Coroutines + `StateFlow` | Standard; Compose-native. |
| UI | Jetpack Compose + Material 3 | Default for new Android UI; bridges to the host's `MaterialTheme`. |
| DI | None (manual wiring) | An SDK must not force Hilt/Koin on its host. |
| Images | None | The board has no images; no Coil/Glide dependency. |
| Dates | Epoch millis, parsed internally | Server always sends UTC `toISOString()`; a fixed-format parser avoids `java.time` desugaring on API 23–25. |

**Size budget:** each AAR < 300 KB before its dependencies. Fail CI if exceeded.

---

## 4. API contract (what the SDK talks to)

All requests: `https://fewchurs.com/api/v1` (base URL overridable for staging).

**Headers on every request**
| Header | Value |
|---|---|
| `Authorization` | `Bearer fr_live_…` |
| `X-Device-Id` | SDK-generated device ID (§5) — required by every endpoint except the comments list |
| `User-Agent` | `Fewchurs-Android/1.0.0 (Android 14; com.example.app)` |
| `Accept-Language` | Device locale (future server-side translation, harmless now) |

### 4.1 Endpoints

| Method + path | Body / query | Success response | Notes |
|---|---|---|---|
| `GET /config` | — | `{ showBranding: Boolean }` | Called once per session; cached. `showBranding` is false only on Pro. |
| `GET /features` | `sort=top\|new`, `limit` 1–100 (default 20), `cursor` | `{ features: FeatureWithVote[], nextCursor: String? }` | Includes `hasVoted`, `isFollowing` for this device. |
| `POST /features` | `{ title (3–100), description (≤1000), email?, isSubscriber? }` | `201` `Feature` | If `email` is provided, the server also follows the feature for that email. |
| `POST /features/{id}/vote` | — | `{ upvoteCount, hasVoted: true }` | Idempotent — safe to retry. |
| `DELETE /features/{id}/vote` | — | `{ upvoteCount, hasVoted: false }` | Idempotent. |
| `POST /features/{id}/follow` | `{ email }` (**required**) | `{ following: true }` | Following always needs an email — the UI must ask for one. |
| `DELETE /features/{id}/follow` | — | `{ following: false }` | |
| `GET /features/{id}/comments` | `limit`, `cursor` | `{ comments: Comment[], nextCursor }` | Deleted comments are filtered **after** paging, so a page can be short or even empty while `nextCursor` is non-null. The pager must keep going. |
| `POST /comments` | `{ featureId, text (1–1000), authorName? (≤60) }` | `201` `Comment` | |

### 4.2 Error envelope and mapping
Every error is `{ "error": { "code": "...", "message": "..." } }`.

| `code` | HTTP | SDK exception | User-facing default message |
|---|---|---|---|
| `invalid_key` | 401 | `FewchursException.InvalidApiKey` | (developer error — logged loudly, UI shows generic error) |
| `missing_device_id` | 400 | `FewchursException.Internal` | should never happen; indicates an SDK bug |
| `validation_failed` | 400 | `FewchursException.Validation(message)` | Server message |
| `rate_limited` | 429 | `FewchursException.RateLimited` | "You've reached today's limit. Try again tomorrow." |
| `limit_reached` | 402 | `FewchursException.LimitReached` | "This board isn't accepting requests right now." |
| `not_found` | 404 | `FewchursException.NotFound` | "This request no longer exists." (and remove it from the list) |
| `internal` / 5xx | 500 | `FewchursException.Server` | "Something went wrong. Try again." |
| — (no response) | — | `FewchursException.Network` | "You're offline." |
| — (bad JSON) | — | `FewchursException.Unknown` | generic |

Server rate limits the SDK should know about: **15 submissions / device / day**, **10 comments / device / day**.

### 4.3 Models (public)
```kotlin
public enum class FeatureStatus { OPEN, PLANNED, IN_PROGRESS, DONE, DECLINED, UNKNOWN }

public data class Feature(
    val id: String,
    val title: String,
    val description: String,
    val status: FeatureStatus,
    val upvoteCount: Int,
    val commentCount: Int,
    val followerCount: Int,
    val hasVoted: Boolean,
    val isFollowing: Boolean,
    val isMine: Boolean,          // derived: authorDeviceId == this device (see §10, item 4)
    val createdAtMillis: Long,
    val updatedAtMillis: Long,
)

public data class Comment(
    val id: String,
    val text: String,
    val authorName: String,
    val isDeveloper: Boolean,
    val isMine: Boolean,
    val createdAtMillis: Long,
)

public data class Page<T>(val items: List<T>, val nextCursor: String?)
```
- `FeatureStatus` uses a custom serializer that maps unknown values to `UNKNOWN` — a new server status must never crash a shipped app.
- Raw `deviceId` / `authorDeviceId` values are **never** exposed publicly.

---

## 5. Device identity

The server identifies anonymous users by `X-Device-Id`: votes, follows, "my requests", and rate limits all hang off it.

- **Default:** random UUID v4 generated on first use, stored in the app's private `SharedPreferences` (`fewchurs_sdk`). Stable until uninstall or clear-data.
- **Not** `ANDROID_ID`, not the advertising ID — keeps the SDK out of Play policy trouble and makes the Data Safety answer simple.
- **Included in Auto Backup** so votes survive a reinstall/device restore.
- **Customizable:** for apps with accounts, votes can follow the user across devices:
  ```kotlin
  Fewchurs.configure(this, apiKey = "…") {
      deviceId = { auth.currentUser?.uid?.let(::sha256) } // falls back to the generated ID when null
  }
  ```
  Docs must recommend a **hash** of the user ID, never an email or raw ID.

---

## 6. UI — screens and behavior

### 6.1 Board
- Top bar: title (default "Feature requests", overridable), close/back button when `onClose` is set.
- Tabs: **Top** · **New** · **Roadmap** (Roadmap = Planned / In progress / Done; needs server work §10.2 — hidden until available).
- Feature card: vote button (arrow + count, filled when voted), title, 2-line description, status chip, comment count, "Subscriber" badge is **not** shown to end users (it's a dashboard signal).
- Pull to refresh; infinite scroll with a footer loader; tab state and scroll position survive rotation.
- Primary action: "Suggest a feature" (extended FAB or bottom button — configurable).
- States: loading skeleton, empty ("Be the first to suggest something"), error with retry, offline banner.
- Footer: "Powered by Fewchurs" badge when `showBranding` is true (from `/config`).

### 6.2 Feature detail
- Title, full description, status chip, vote button, **Follow** toggle.
- Follow flow: if an email is known (config `userEmail` or previously entered with consent) follow immediately; otherwise show an email dialog ("We'll email you when this ships").
- Comments: paginated list (with the short-page rule from §4.1), "Developer" badge on developer comments, "You" on own comments.
- Composer: text (1–1000, counter), optional display name (≤60, remembered locally), send button with pending state.

### 6.3 Submit
- Fields: title (3–100, live counter), description (optional, ≤1000), email (optional; label: "Email me when it ships").
- Client-side validation mirrors the server's zod rules exactly, so users rarely see server validation errors.
- On success: confirmation state, new request appears at the top of **New**, board scrolls to it.
- Double-submit protection (button disabled while pending).

### 6.4 Interaction rules
- **Optimistic voting:** toggle instantly, call the API, reconcile with the returned `upvoteCount`, roll back and show a snackbar on failure. Rapid taps are debounced to the final state.
- **Hide vote counts:** when the app owner turns on `hideVoteCounts`, the vote button shows only the arrow (needs server work §10.1).
- Every button gives instant feedback (pressed state + pending indicator), same standard as the web app.

### 6.5 Accessibility and localization
- TalkBack: vote button reads "Upvote. 12 votes. Voted." Status chips read the status name. All icons have content descriptions.
- Touch targets ≥ 48dp, font scaling up to 200%, RTL layouts, sufficient contrast in both themes.
- All strings in `res/values/strings.xml`; ship **en** at 1.0, add es, fr, de, pt-BR, ja in 1.1. Developers can override any string (§7.3).

---

## 7. Customization — five levels

Developers pick the lowest level that meets their needs.

### Level 1 — Automatic (no code)
The board reads the host's `MaterialTheme` (colorScheme, typography, shapes) and follows system dark mode. For a Material 3 app, the board already looks native.

### Level 2 — Theme tokens
```kotlin
Fewchurs.configure(this, apiKey = "…") {
    theme {
        colors {
            primary = Color(0xFFED5F18)
            background = Color.White
            statusColors[FeatureStatus.DONE] = Color(0xFF16A34A)
        }
        cornerRadius = 14.dp
        fontFamily = MyFonts.Inter
        density = FewchursDensity.Compact   // Comfortable | Compact
        darkMode = DarkMode.System          // System | Light | Dark | FollowHost
    }
}
```
Or scoped to one screen, Compose-style:
```kotlin
FewchursTheme(colors = myColors, shapes = myShapes) {
    FewchursBoard()
}
```
`FewchursTheme` tokens: colors (primary, onPrimary, background, surface, onSurface, muted, border, error, per-status colors), shapes (card, button, chip, sheet), typography (title, body, label, fontFamily), spacing (density).

### Level 3 — Behavior & copy
```kotlin
Fewchurs.configure(this, apiKey = "…") {
    board {
        tabs = listOf(BoardTab.Top, BoardTab.New, BoardTab.Roadmap)
        defaultTab = BoardTab.Top
        showDeclined = false
        allowSubmissions = true
        allowComments = true
        emailField = EmailField.Optional        // Hidden | Optional | Required
        submitButtonStyle = SubmitButton.ExtendedFab // ExtendedFab | BottomBar | TopBarAction
        pageSize = 20
    }
    strings {
        boardTitle = "Ideas & roadmap"
        submitButton = "Suggest an idea"
        emptyTitle = "No ideas yet"
    }
    isSubscriber = { billing.hasActiveSubscription() }
    userEmail = { auth.currentUser?.email }
}
```
Strings can also be overridden per locale the Android way — define `fewchurs_board_title` in the app's own `strings.xml`.

### Level 4 — Slots (replace pieces, keep the logic)
```kotlin
FewchursBoard(
    header = { MyBoardHeader() },
    emptyState = { MyEmptyIllustration() },
    featureCard = { feature, actions -> MyFeatureRow(feature, onVote = actions.toggleVote) },
    voteButton = { state -> MyVoteChip(state) },
)
```
Slots receive state + actions, so paging, voting, optimistic updates, and errors keep working.

### Level 5 — Headless (build everything yourself; `fewchurs-core` only)
```kotlin
val board = Fewchurs.boardState(sort = Sort.Top)   // StateFlow-backed state holder

board.state.collect { ui ->
    when (ui) {
        is BoardUiState.Loading -> …
        is BoardUiState.Content -> render(ui.features, ui.canLoadMore)
        is BoardUiState.Error -> showError(ui.error)
    }
}
board.loadMore()
board.toggleVote(featureId)
board.refresh()

// Or raw client calls
val page = Fewchurs.client.listFeatures(sort = Sort.New, limit = 20, cursor = null)
Fewchurs.client.vote(featureId)
Fewchurs.client.follow(featureId, email = "a@b.com")
Fewchurs.client.addComment(featureId, text = "+1", authorName = "Sam")
```

### 7.6 Other customization and integration points
- **Presentation:** full screen (`FewchursBoard`), bottom sheet (`FewchursBoardSheet`), Activity (`Fewchurs.showBoard(context)`), or a Navigation Compose destination (`fewchursGraph(navController)`).
- **Events for analytics:**
  ```kotlin
  Fewchurs.events.collect { event ->
      when (event) {
          is FewchursEvent.BoardOpened -> analytics.log("fewchurs_open")
          is FewchursEvent.FeatureSubmitted -> analytics.log("fewchurs_submit", event.featureId)
          is FewchursEvent.Voted, is FewchursEvent.Commented, is FewchursEvent.Followed -> …
          is FewchursEvent.Error -> crashReporter.log(event.error)
      }
  }
  ```
  The SDK itself sends **no** analytics anywhere.
- **Logging:** `logLevel = LogLevel.None | Error | Debug` (default `Error`; `Debug` logs requests without the API key).
- **Base URL:** `baseUrl = "https://staging.fewchurs.com/api/v1"` for testing.
- **Java:** `FewchursJava.submitFeature(title, description, callback)` wrappers + `@JvmStatic` on `Fewchurs.showBoard`.
- **Branding badge:** controlled only by the server (`showBranding`). There is deliberately no theme option to hide it; upgrading to Pro removes it automatically, the same as on iOS.

---

## 8. Reliability, security, privacy

### Reliability
- **Never crash the host app.** All public calls validate state; UI entry points before `configure` show a clear error screen in debug and log once in release. No `!!` in SDK code.
- Timeouts: 10s connect, 15s read. GETs and idempotent votes retry twice with exponential backoff on network/5xx errors. POSTs that create content are **not** auto-retried (no duplicate requests).
- Process death: board tab, scroll position, and the submit form draft are restored via `SavedStateHandle`.
- Main-safe: all I/O on `Dispatchers.IO`; nothing blocks startup (App Startup initializer only reads meta-data and stores config — no network).

### Security
- The API key is **publishable by design** — it ships inside every APK and can be extracted. Documentation must say this plainly. Abuse protection is server-side (per-device daily limits today; see §10.6 for hardening).
- HTTPS only; no cleartext exceptions. API key never logged.
- R8/ProGuard: ship `consumer-rules.pro` for serialization models so host apps need no extra rules.

### Privacy (Google Play Data Safety answers for developers)
| Data | Collected? | Notes |
|---|---|---|
| Email | Optional, user-provided | Only when the user types it to follow/submit. Used for "shipped" notifications. |
| User content | Yes | Request titles, descriptions, comments. |
| App-scoped identifier | Yes | Random UUID; not linked to device hardware or ads. |
| Analytics / ads / location | No | |

Publish this as a ready-to-copy table in the docs.

---

## 9. Testing & quality gates

| Layer | Tooling | What's covered |
|---|---|---|
| API client | JUnit + OkHttp **MockWebServer** | Every endpoint, headers, error envelope mapping, retry rules, the short-page comments case, unknown status/fields. |
| State / repository | coroutines-test + **Turbine** | Paging, optimistic vote + rollback, refresh, process-death restore. |
| UI | Compose UI tests | Submit validation, vote toggling, follow email dialog, empty/error/offline states. |
| Visual | **Roborazzi** or Paparazzi screenshots | Light/dark, default vs custom theme, compact density, font scale 2.0, RTL. |
| Public API | Kotlin **binary-compatibility-validator** | Any public API change fails CI unless the `.api` file is updated intentionally. |
| Contract | Nightly job against staging | Catches server changes that would break shipped SDKs. |
| Size | AAR size check in CI | Enforces the 300 KB budget. |

Plus a **sample app** with four variants: default, heavily themed, custom UI (headless), and a View/XML app using `showBoard`.

---

## 10. Server work needed first (this repo)

These gaps were found while reading `/api/v1`. Items 1–4 should land before the SDK's 1.0.

1. **`/v1/features` ignores `hideVoteCounts`.** The public web board zeroes vote counts when the owner hides them (`src/app/api/public/board/[slug]/features/route.ts`), but the SDK endpoint doesn't — hidden counts would show in the app. Apply the same mapping to `GET /v1/features` and the vote responses.
2. **No status filter, so no Roadmap tab.** Add `?status=planned,in_progress,done` (or `?tab=roadmap`) to `GET /v1/features`. Needs Firestore composite indexes on `status + upvoteCount` and `status + createdAt`.
3. **`/v1/config` is too thin.** Extend to `{ showBranding, hideVoteCounts, appName }`. Later: dashboard-controlled theme defaults (primary color, radius) so owners can restyle without shipping an app update.
4. **Device IDs leak.** `GET /v1/features/{id}/comments` returns every commenter's `deviceId`, and features return `authorDeviceId`. Anyone with the (public) API key can read them and send requests as another device (e.g. remove their votes). Replace with `isMine: boolean`, computed from the caller's `X-Device-Id`.
5. **No single-feature endpoint.** Add `GET /v1/features/{id}` (with `hasVoted`/`isFollowing`) for deep links and refreshing a detail screen.
6. **Abuse hardening (post-1.0).** Device IDs are client-chosen, so per-device limits can be bypassed by rotating IDs. Add per-IP rate limits on write endpoints; consider optional Play Integrity attestation for Pro apps.
7. **SDK visibility in the dashboard (nice to have).** Read `User-Agent` to show owners which SDK/version their app uses and warn about outdated versions.
8. **Web docs.** Add `/docs/kotlin` (mirroring `/docs/swiftui`) and flip the Kotlin entry in `src/lib/platforms.ts` from "coming soon" to live with an `href`.

---

## 11. Milestones

| # | Milestone | Scope | Done when |
|---|---|---|---|
| M0 | Server prep | §10 items 1–5 | Endpoints deployed, covered by tests, documented |
| M1 | Core | Client, models, errors, device ID, repository, `BoardState`, headless API | MockWebServer + Turbine tests green; headless sample works |
| M2 | Default UI | Board, detail, submit, follow, Material bridge, strings | Sample app full loop works end to end on staging |
| M3 | Customization | Theme tokens, behavior config, slots, events, presentations, manifest auto-init, Java wrappers | Four sample variants built only from public API |
| M4 | Hardening | a11y pass, screenshot matrix, R8 consumer rules, process death, size budget, API dump | All CI gates green; tested on API 23, 29, 34, latest |
| M5 | Release 1.0 | Maven Central publishing, `/docs/kotlin`, changelog, platforms.ts update | `implementation("com.fewchurs:fewchurs-android:1.0.0")` works from a fresh project |

**1.1 candidates:** more languages, deep link handling (`Fewchurs.handleDeepLink(intent)` for "it shipped" emails), dashboard-driven remote theming, delete-own-comment, server-side translation display.

---

## 12. Distribution & versioning

- **Maven Central** under group `com.fewchurs` (namespace verified via the `fewchurs.com` domain). Package `com.fewchurs.sdk` (matches the snippet already on the landing page).
- Signed artifacts with sources + KDoc jars; published from CI on git tags only.
- **Semantic versioning.** Public API changes are only additive within a major version; deprecations live for at least one minor release with `ReplaceWith` hints.
- `CHANGELOG.md` + GitHub Releases; migration notes for every minor.
- The SDK sends its version in `User-Agent` so the server can support old versions deliberately.

---

## 13. Decisions to confirm

1. **minSdk 23** — or go lower (21) at the cost of extra date/compat code?
2. **Material 3 dependency** — acceptable for apps still on Material 2 / custom design systems? (The bridge still works; M3 is just a transitive dependency.)
3. **Show declined requests** by default in the app board, or hide them?
4. **Roadmap tab at 1.0** — requires server item §10.2; ship 1.0 with Top/New only if it slips?
5. **Remember the user's email** after first follow (with a visible "Remember my email" checkbox), or ask every time?
6. **Repo & license** — public `fewchurs/fewchurs-kotlin` under MIT/Apache-2.0 like most SDKs?

---

## 14. Definition of done (1.0)

- A new Android project can show a working, native-looking board with **one dependency + one manifest line**.
- Every customization level in §7 is demonstrated in the sample app using only public API.
- No crash paths in the host app; zero network calls at startup.
- Server gaps §10.1–10.5 fixed; `hideVoteCounts`, branding, and rate limits behave identically on web, iOS, and Android.
- Public docs at `/docs/kotlin`, Data Safety table included, Kotlin marked live on the landing page.
