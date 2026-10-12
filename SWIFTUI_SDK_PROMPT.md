# Prompt: Bring FeatureRequestKit (Swift SDK) up to date with the Fewchurs API and ship it production-ready

> Paste everything below the line into a Claude Code session opened in `~/FeatureRequestKit`
> (remote `github.com/fewchurs/fewchurs-swift`). The web/API repo is at
> `~/Desktop/feature-request-web` — read it whenever you need to confirm the contract.
>
> Audited 2026-10-11 against web `main` @ `71d37dd` and package `main` @ `4fba2ae`.

---

You are working on **FeatureRequestKit**, the SwiftUI SDK for Fewchurs (a feature-request board for apps). The package already works and has shipped fixes for comments (405), tab caching and unknown statuses. The server has changed since then, and the package is **behind the API in several places, including one that breaks a feature completely**. Your job: align the package with the current API, fix the bugs below, make it production-ready, and tag a release that the public docs can point to.

**Ground rules**
- The **server is the source of truth.** Before changing any request or response shape, confirm it in `~/Desktop/feature-request-web/src/app/api/v1/**/route.ts`, `src/lib/features/service.ts`, `src/lib/comments/service.ts`, `src/lib/followers/service.ts`, `src/lib/validation/schemas.ts` and `src/types/index.ts`. If anything below disagrees with the code, the code wins. Tell me about the difference.
- Keep the module name `FeatureRequestKit` and the public entry points `FeatureRequestKit.configure(...)` and `FeatureRequestBoardView`. The website docs already use these names. **Do not rename anything** and do not make source-breaking changes. Every change must be additive.
- Zero dependencies. URLSession + Codable only. iOS 17+, Swift 5.9 tools.
- Every bug fix comes with a regression test. Follow the existing test style in `Tests/FeatureRequestKitTests`.
- Small, focused commits, one concern each. Don't push, tag or publish until I say so.

---

## 1. Current API contract (`/api/v1`)

**Base URL (production):** `https://www.fewchurs.shop/api/v1` (canonical, from web `src/lib/docs/nav.ts`).

**Headers sent on every call**
| Header | Value |
|---|---|
| `Authorization` | `Bearer <apiKey>` |
| `X-Device-Id` | Keychain UUID (required on every endpoint except `GET /config` and `GET /features/{id}/comments`. Send it anyway: comments use it to compute `isMine`) |
| `Content-Type` | `application/json` |
| `X-Fewchurs-Sdk` | `swift/<semver>`. The server allows this header (CORS list in `src/middleware.ts`). Send it now so per-version analytics work later |
| `Accept-Language` | Device's preferred language, e.g. `en-US`. Also allowed. Send it for future localisation |

**Errors** always have the shape `{ "error": { "code", "message" } }`:
| code | HTTP |
|---|---|
| `invalid_key` | 401 |
| `missing_device_id` | 400 |
| `validation_failed` | 400 |
| `not_found` | 404 |
| `limit_reached` | 402 |
| `rate_limited` | 429 |
| `internal` | 500 |
| `unauthorized` | 401 |
| `forbidden` | 403 |

Non-JSON error bodies can also arrive: Next.js 405, Vercel 502/504 HTML pages, timeouts. They must map to a friendly generic message, never raw text.

**Endpoints**
| Method & path | Request | Response |
|---|---|---|
| `GET /config` | – | `{ showBranding: Bool, hideVoteCounts: Bool, appName: String? }` |
| `GET /features?sort=top\|new&limit=1..100&cursor=&status=a,b` | `status` is optional, comma-separated, unknown names ignored | `{ features: [Feature], nextCursor: String? }` |
| `GET /features/{id}` | – | `Feature` **(new: enables detail refresh and deep links)** |
| `POST /features` | `{ title 3–100, description ≤1000 (optional), email (optional, valid), isSubscriber Bool (optional, default false) }` | `201` + Feature **without** `hasVoted` / `isFollowing` / `isMine`. If `email` was sent the server already auto-followed, and `followerCount` is 1 |
| `POST` / `DELETE /features/{id}/vote` | – | `{ upvoteCount: Int, hasVoted: Bool }` (idempotent) |
| `POST /features/{id}/follow` | `{ email }` | **`{ following: true }`**. Nothing else |
| `DELETE /features/{id}/follow` | – | **`{ following: false }`** |
| `GET /features/{id}/comments?limit=&cursor=` | – | `{ comments: [Comment], nextCursor: String? }`, oldest first. **A page can contain fewer than `limit` items, even zero, and still have a cursor** |
| `POST /comments` | `{ featureId, text 1–1000, authorName ≤60 (optional) }` | `201` + Comment **without** `isMine` |

**Feature JSON fields:** `id`, `title`, `description`, `status`, `upvoteCount`, `commentCount`, `followerCount`, `hasVoted`, `isFollowing`, `isMine`, `authorIsSubscriber`, `translation` (`{lang,title,description}` or null), `authorDeviceId`, `createdAt`, `updatedAt`. All dates are ISO-8601 UTC with milliseconds.

**Comment JSON fields:** `id`, `text`, `authorName` (the server defaults it to `"App User"`), `isDeveloper`, `isMine` (only when `X-Device-Id` is sent), `deviceId`, `createdAt`.

**Statuses:** `open`, `planned`, `in_progress`, `done`, `declined`. Keep the existing `.unknown` fallback.

**Server limits** (surface them kindly; don't pre-empt them on the client):
- 15 submissions per device per day → `rate_limited`
- 10 comments per device per day → `rate_limited`
- Votes and follows are not rate limited

---

## 2. Audit findings. Fix them in this order.

### P0: broken today or blocks a release

1. **Follow and unfollow are broken (decoding failure).** `APIClient.swift` decodes the follow response as `FollowResponse { followerCount, isFollowing }`. The server returns `{ following: Bool }`.
   - What users see: `toggleFollow` throws `.decoding` even though the server **did** follow. The UI rolls back and shows "Received an unexpected response". Followers get emails for something the app says failed.
   - The auto-follow after submit fails silently too (`try?`).
   - Fix: decode `{ following }`, keep the optimistic `followerCount`, and set `isFollowing = following`.
   - Add a test that decodes the real server payload.
2. **There is no installable release.** The repo has **no git tags** locally or on `origin`. The website tells people to use `.package(url: …, from: "1.0.0")`, and SPM cannot resolve that today.
   - Prepare a release (see §4).
   - Don't tag it yourself. Give me the exact commands to run.
3. **Default base URL is not the canonical domain.** `Configuration.defaultBaseURL` is `https://fewchurs.vercel.app/api/v1`.
   - Change it to `https://www.fewchurs.shop/api/v1`.
   - Expose a public `baseURL:` parameter on `configure` (default production) for staging and local testing. Keep `baseURLOverride` working for tests.
4. **No privacy manifest.** Add `Sources/FeatureRequestKit/PrivacyInfo.xcprivacy` and declare it as a resource in `Package.swift`. It must declare:
   - collected data: user content (titles, comments) and optional email address, both linked to the app's functionality only, no tracking
   - Keychain-stored device identifier: app functionality only, not linked to identity, no tracking
   - `NSPrivacyTracking = false`, no tracking domains
   - Required-reason APIs: check whether any are used (e.g. `UserDefaults`). Declare them only if used.

### P1: aligns the SDK with server features that already exist

5. **`hideVoteCounts` is ignored.**
   - Add `hideVoteCounts: Bool` to `BoardConfig`. Decode it tolerantly, default `false`, and keep `fallback.hideVoteCounts = false`.
   - When it's true, hide the number in the row, the detail view and the vote button. Voting still works.
   - Note: `/features` still sends `upvoteCount`. Hiding is the client's job.
   - Test both values.
6. **`appName` from `/config`** is already decoded. Use it as the default navigation title when the host hasn't set one (keep the current title as the fallback).
7. **`isMine`.**
   - Decode `isMine` (default `false`) on `FeatureRequest` and `Comment`.
   - Show a subtle "You" / "Your request" marker.
   - When creating a feature or comment, set `isMine = true` locally, because those responses omit it.
   - **Never decode or store `authorDeviceId` or comment `deviceId`.** They are other users' device IDs.
8. **Create a feature in one round trip.**
   - Send `email` and `isSubscriber` in the `POST /features` body.
   - Delete the second `/follow` call in `FeatureBoardModel.submit`.
   - After creation, set `isFollowing = (email != nil)`, `isMine = true` and `hasVoted = false`.
9. **Pass the subscriber flag through.** Add a public way to report it without breaking anything, e.g. `FeatureRequestKit.configure(apiKey:theme:baseURL:isSubscriber:)` where `isSubscriber` is `(@Sendable () -> Bool)?`, or a settable `FeatureRequestKit.isSubscriber` closure. Pick the one that reads best and document it.
10. **`GET /features/{id}` exists now.**
    - Add `Endpoint.feature(id:)`.
    - `FeatureDetailModel` should fetch the feature when it's missing from the board cache, and refresh it on pull-to-refresh, instead of showing "Request Not Found".
    - This also unblocks a public `FeatureRequestBoardView(featureId:)` / deep-link entry point. Add it if it stays small; otherwise list it as a follow-up.
11. **Roadmap tab.** The server supports `?status=` and the composite indexes are in `firestore.indexes.json`.
    - Add a `Roadmap` sort/tab that requests `status=planned,in_progress,done` (sorted by top), grouped or labelled by status.
    - It must be opt-in so default behaviour doesn't change. Use the existing per-tab cache.
12. **Error mapping is incomplete.** `APIError.from` sends `limit_reached`, `internal`, `unauthorized` and `forbidden` to `.server(rawMessage)`, which shows server text to end users.
    - Add explicit cases with friendly copy.
    - Non-JSON or empty error bodies get a friendly generic message. Keep the status code in `debugDetail` only.
13. **Client validation doesn't match the server.** Today the title max is **80** (server 100), description max **500** (server 1000), and comment text and author name have **no cap** (server 1000 / 60).
    - Put all four limits in one `enum ValidationLimits` that cites `src/lib/validation/schemas.ts`.
    - Apply them in `SubmitFeatureView`, `CommentInputView` and `IdentityPromptSheet` (display name).
    - Show a counter near the limit, and trim before checking.
14. **`identify(userId:email:)` is public but does nothing.** `userId` and `email` are stored and never read.
    - Use `email` as the pre-filled or default email for follow and submit when `UserIdentity.email` is empty.
    - If there's no sensible use for `userId`, mark it `@available(*, deprecated, message:)` and explain why. Don't delete it.
15. **Send the `X-Fewchurs-Sdk` and `Accept-Language` headers.** Keep the version in a single `static let sdkVersion` constant and add a test for it.
16. **Empty-page paging stall.** Paging fires from `.onAppear` on the last row. If a page comes back with **zero** rows and a non-nil cursor, nothing new appears and paging stops.
    - In both models, fetch the next page automatically when a page is empty but has a cursor.
    - Cap it, e.g. at 5 consecutive empty pages.
    - Test it with a stubbed client.
17. **`translation`.** This is an owner-side dashboard translation, not meant for end users. Make sure it decodes tolerantly and **is not displayed**. No other work.

### P2: production hardening

18. **Networking.**
    - Use a dedicated `URLSession` configuration with `timeoutIntervalForRequest` of about 15s.
    - Retry `GET`s once on a transient failure (timeout, connection lost, 502/503/504).
    - **Never retry `POST /features` or `POST /comments`**, because they aren't idempotent.
    - Vote and follow are idempotent, so one retry is fine.
19. **Testability.**
    - Introduce a `URLProtocol` stub and test the full request/response path: path, method, headers, body and decoding for **every endpoint**, using the exact JSON payloads from §1.
    - Add view-model tests for optimistic vote/follow and rollback, submit, comment posting, paging, `hideVoteCounts` and the empty-page rule.
20. **Contract test (opt-in).** Add a test that only runs when `FEWCHURS_CONTRACT_API_KEY` is set in the environment. It calls the live API and decodes every response type. This is what would have caught both the 405 and the follow bug.
21. **Swift 6 strict concurrency.** Enable `.enableExperimentalFeature("StrictConcurrency")` (or `swiftLanguageVersions` if the tools allow it) and fix the warnings. Public types are `Sendable` and UI state is `@MainActor`.
22. **Accessibility.**
    - The vote and follow buttons (`FeatureRowView`, `CommentInputView`) use **32×32** frames. Give them hit targets of at least 44×44 pt while keeping the visual size.
    - Check Dynamic Type up to AX5, VoiceOver labels and values (e.g. "Upvote, 42 votes, selected"; omit the count when hidden), and RTL layout.
23. **Branding.** The footer text is `"Powered by fewchurs"`. Use the brand capitalisation **"Powered by Fewchurs"** to match the web.
    - It stays server-driven (`showBranding` is true on Free **and** Starter, false on Pro).
    - There must be no client override.
24. **Strings.** Move user-facing literals into a String Catalog (`Localizable.xcstrings`, `en` only for now) via `String(localized:bundle: .module)`. This is preparation, not translation work.

---

## 3. Out of scope for this pass (list as follow-ups, don't build)
- Full theme token set, view slots, a headless public API, an analytics event stream. These are the customisation levels in `SWIFTUI_SDK_PLAN.md` §6.
- Renaming the module to `Fewchurs`.
- Server changes. Report them to me instead. These are already known:
  - `/features` and the comments endpoints still return `authorDeviceId` / `deviceId` (device-ID leak).
  - `/features` doesn't zero counts when `hideVoteCounts` is set.
  - `X-Fewchurs-Sdk` isn't read yet.

---

## 4. Release checklist

1. `swift build` and `swift test` pass. Report the test count before and after.
2. The SampleApp builds for an iOS 17 simulator and shows all of the following against production:
   - the board loads
   - vote and unvote
   - follow and unfollow **without an error banner**
   - submit with an email (one network call)
   - comment
   - the Roadmap tab (if enabled in the sample)
   - hidden vote counts (toggle it in the dashboard to check)
3. `README.md` matches the real API: install via SPM `from: "1.1.0"`, `configure`, `identify`, theme, subscriber flag, baseURL, privacy manifest note.
4. Add a `CHANGELOG.md` with **1.1.0** (everything above). Mention the follow fix and the comments fix prominently.
5. `sdkVersion` = `1.1.0`.
6. Give me the exact commands to run myself (don't run them):
   ```
   git tag 1.1.0 && git push origin main --tags
   ```
   Also suggest whether to tag `1.0.0` on an earlier commit so the docs' current `from: "1.0.0"` resolves in the meantime.

---

## 5. Website changes I'll make afterwards (list them, don't edit the web repo)

Check `~/Desktop/feature-request-web/src/app/docs/swiftui/page.tsx` against the finished package. Tell me the exact edits needed. Known so far:
- The install snippet should say `from: "1.1.0"`.
- The badge section says it goes away on **Pro**, which is correct, but it should say it shows on Free **and Starter**.
- Add short sections for: the subscriber flag, `identify`, `baseURL`, hidden vote counts, Roadmap, and opening a single request (if built).
- Theme table: confirm `.system` and `.midnight` still exist.

---

## 6. When you finish, reply with
1. A table of every numbered item in §2: **done / partial / skipped**, plus the commit hash.
2. Any place where the server code disagreed with this prompt.
3. Public API changes (all additive), with signatures.
4. Test count before and after, and the contract-test result if you ran it.
5. The release commands for me to run, and the website doc edits from §5.
