# Fewchurs Swift SDK — Update Plan (v1.1 → v1.2)

The SwiftUI package already ships (`github.com/fewchurs/fewchurs-swift`, documented at `/docs/swiftui`). The web system has moved on since it was written, and parts of the package are now **behind the server**. This plan covers: what drifted, what breaks in already-shipped apps, how to catch up, and how to bring Swift in line with the Android and Flutter plans so all three platforms behave identically.

**Audit status (2026-09-20):** this plan was originally written against the *documented* API only, because the Swift repo wasn't available. It has now been **audited against the real package** at `~/FeatureRequestKit` (module `FeatureRequestKit`, iOS 17+, 38 tests). Every **VERIFY** item below is resolved, and several findings the original plan missed have been added. Three fixes have already landed in the package — see §0.

---

## 0. Landed in this pass

| Fix | Why it mattered |
|---|---|
| **Commenting was completely broken (HTTP 405)** | The SDK POSTed to `/v1/features/{id}/comments`, which is **GET-only** on the server. Every comment attempt in every shipped app failed with "Something went wrong, please try again (405)". Now posts to `POST /v1/comments` with `featureId` in the body, matching `createSdkCommentSchema`. Covered by a regression test. |
| **Tab switching blocked on the network** | `sort.didSet` cleared nothing but re-fetched from scratch, so Top↔New showed the *old* tab's rows until a full round trip finished. The board model now keeps a per-sort page cache: a warm tab renders instantly, and a stale one (>30s) refreshes silently underneath without a spinner or clearing content. Vote/follow/comment-count edits are applied to every cached tab so the two never disagree. |
| **An unknown status broke the whole board** | `FeatureStatus` was a plain `String` enum, so a single new status added server-side would throw a `DecodingError` that failed the **entire** list response — not one row. Added a `.unknown` fallback case (rendered with no badge). This was §3.2 below, and it resolved to "broken". |

---

## 1. The comments-pagination finding — already handled

The original headline finding was that `GET /v1/features/{id}/comments` became paginated (commit `41949e9`, `limit` default 20, max 100, plus `cursor`) and silently truncated comments.

**The package already handles this.** `FeatureDetailModel` reads `nextCursor`, requests `limit=50`, and pages via `loadMoreComments()`, keying "is there more" off `nextCursor != nil` rather than off an empty page — which is exactly the trap the original note warned about (the server filters deleted comments *after* paging, so a short or empty page can still have a cursor).

**One residual risk:** paging is *triggered* by `.onAppear` on the last rendered comment row. If a page comes back entirely empty while `nextCursor` is still set, no new last row appears and paging stalls until the user scrolls again. Same pattern on the feature list. Worth driving the next page from the model when a non-nil cursor returns zero rows.

`/v1/features` paging: also confirmed present (limit 20 + cursor).

---

## 2. Everything else that drifted

| # | Change on the server | Status in the package | Action |
|---|---|---|---|
| 1 | Comments paginated | **Done** — cursor-based, correct termination | Fix the empty-page stall (§1) |
| 2 | `showBranding` changed from `plan === "free"` to `plan !== "pro"` | Correct at runtime (server-driven via `/v1/config`, with a safe `.fallback`) | **Docs fix** — the badge now also shows on **Starter** |
| 3 | Plans went from free/pro to **free / starter / pro** | No SDK impact | **Docs fix** |
| 4 | `isSubscriber` added to `POST /v1/features` | **Not sent.** `Endpoint.createFeature` encodes only `title` + `description`; the server defaults it to `false`, so every request from iOS is recorded as non-subscriber | 1.1 — needs a `config.isSubscriber` provider (§6.2) |
| 5 | Submissions no longer capped by plan (`LimitExceededError` is declared but never thrown) | `limit_reached` isn't mapped in `APIError.from`, so it falls through to `.server(message)` and **displays the server's raw text to the user** | 1.1 — map it explicitly and swallow the message |
| 6 | `Feature` gained `followerCount`/`translation`; lists include `isFollowing` | **Safe.** Custom `init(from:)` uses `decodeIfPresent` with defaults, and unknown JSON keys are ignored. `followerCount`/`isFollowing` are adopted; `translation` is not read | 1.2 — adopt `translation` |
| 7 | `hideVoteCounts` added for owners, but `/v1/features` ignores it | iOS shows counts the owner switched off | **Server fix** (§5.1), then SDK respects it |
| 8 | Dashboard/admin, translation, fan-out, 3-tier pricing | No SDK impact | 1.1 — send `X-Fewchurs-Sdk` (**absent today**) |
| 9 | `POST /v1/features` accepts `email` and auto-follows server-side | The SDK ignores this and makes a **second** round trip to `/follow` after creating | 1.1 — pass `email` in the create body, drop the extra call |

---

## 3. Audit checklist — resolved

| # | Item | Result |
|---|---|---|
| 1 | Tolerant decoding | **Pass.** `FeatureRequest` and `Comment` decode optional fields with `decodeIfPresent` + defaults; unknown keys ignored. |
| 2 | Unknown status handling | **Was broken → fixed in §0.** |
| 3 | Pagination everywhere | **Pass.** Both lists page. |
| 4 | Device ID storage | **Pass, and better than assumed.** `DeviceIdentity` stores a random `UUID` in the **Keychain** (`kSecAttrAccessibleAfterFirstUnlock`), so votes survive reinstall. **This settles decision §9.2 — Android and Flutter must match Keychain semantics.** |
| 5 | Error mapping | **Partial.** `invalid_key`, `missing_device_id`, `validation_failed`, `rate_limited`, `not_found`, offline and decoding are mapped. `limit_reached` and `internal` fall through to `.server(rawMessage)`. |
| 6 | Rate limits surfaced kindly | **Pass.** `.rateLimited` carries the server's message with a friendly fallback. |
| 7 | Client-side validation | **Fail — mismatched with the server.** See table below. |
| 8 | Follow flow email | **Pass.** `IdentityPromptSheet` prompts for an email, persists it via `UserIdentity`, and reuses it next time. |
| 9 | Retry/timeout policy | **Neither.** No retry anywhere (so creates are at least safe) and no explicit `timeoutIntervalForRequest` — it inherits URLSession's 60s default. GETs and votes should get a short timeout + one retry. |
| 10 | Swift 6 strict concurrency | **Not enabled.** `Package.swift` sets no `swiftSettings`; the package builds under Swift 5 language mode. Types are `@MainActor`/`Sendable`-annotated, so turning it on is likely cheap — but it's unproven. |

### 3a. Validation mismatches (item 7)

| Field | Server | SDK | Effect |
|---|---|---|---|
| Title | 3–100 | min 3, **max 80** | Users can't use the last 20 characters they're entitled to |
| Description | ≤1000 | **≤500** | Same, at twice the size |
| Comment text | 1–1000 | **no limit** | A 1,500-char comment round-trips and fails with `validation_failed` |
| Author name | ≤60 | **no limit** | Same |

Comment and author-name caps are the ones that actually produce a failed request; the title/description caps just under-deliver. All four should be driven from one shared constants file so they can't drift again.

---

## 4. Target: parity across the three platforms

| Capability | Swift today | Target |
|---|---|---|
| Board (list, vote, submit) | Yes | Yes |
| Comments | **Yes — fixed (§0)**, paginated | Yes |
| Follow a request | **Yes**, with email prompt + saved identity | Yes |
| Top / New tabs | **Yes**, now instant (§0) | Yes |
| Roadmap tab | No | Yes (needs server §5.2) |
| Hidden vote counts respected | No | Yes (needs server §5.1) |
| "Mine" badge on own items | No | Yes (needs server §5.4) |
| Theme customization | Partial — `FeatureRequestTheme` (accent, background, corner radius, dark) via `configure(theme:)` and a `.featureRequestTheme` environment key | Full token set (§6.1) |
| Behavior + copy config | No | Yes (§6.2) |
| View slots | No | Yes (§6.3) |
| Headless / custom UI | Everything is `internal` — only `configure`, `identify` and `FeatureRequestBoardView` are `public` | Full state model + client (§6.4) |
| Analytics events | No | Yes (§6.5) |
| Localization | English only, hardcoded literals | String Catalog, en at 1.2 |
| Deep link from "shipped" email | No — **structurally blocked**, see §5.5 | 1.3 |

**Note on headless (§6.4):** the gap is bigger than "partial". `APIClient`, `FeatureBoardModel`, `FeatureRequest`, `Comment` and `FeatureStatus` are all `internal`, so there is no public surface to build a custom UI on at all. Level 5 is a deliberate API-design exercise, not an incremental addition.

---

## 5. Server work needed (this repo)

Same list as the other two SDKs — fixing it once fixes all three platforms.

1. **`/v1/features` ignores `hideVoteCounts`.** The public web board zeroes counts (`src/app/api/public/board/[slug]/features/route.ts`); the SDK endpoint doesn't, so iOS shows numbers the owner hid. Apply the same mapping to the list and vote responses.
2. **No status filter → no Roadmap tab.** Add `?status=planned,in_progress,done` to `GET /v1/features` (needs Firestore composite indexes `status + upvoteCount`, `status + createdAt`).
3. **Extend `/v1/config`** from `{ showBranding }` to `{ showBranding, hideVoteCounts, appName }`; later, dashboard-controlled theme defaults so owners can restyle without an App Store release.
4. **Device IDs leak.** Comments return every commenter's `deviceId`, features return `authorDeviceId`. With the (public) API key, anyone can read those and send requests as another device — for example removing their votes. Return `isMine: Bool` computed from the caller's `X-Device-Id` instead.
5. **Add `GET /v1/features/{id}`** with `hasVoted`/`isFollowing`. **Confirmed as a hard blocker, not a nice-to-have:** `FeatureDetailView` has no way to fetch a feature — it reads `boardModel.feature(withId:)` out of the list cache and renders "Request Not Found" on a miss. Deep links and detail refresh are impossible until this exists.
6. **Abuse hardening (post-1.0):** device IDs are client-chosen, so per-device limits can be bypassed by rotating them. Add per-IP limits on write endpoints.
7. **Version visibility:** read `X-Fewchurs-Sdk` and show app owners which SDK versions their users are on.
8. **Consider a 405 guard.** The commenting outage (§0) was invisible because the nested route simply had no `POST` export, so Next.js returned a bare 405 with no error body — the SDK couldn't map it to anything better than a raw status code. An explicit `POST` handler on `/v1/features/{id}/comments` that either works or returns a structured `{error:{code,message}}` would have made this obvious on day one. A contract test (§7) is the real fix.

---

## 6. Customization — bringing Swift up to the shared design

Same five levels as Android and Flutter, expressed the SwiftUI way. Unchanged from the original plan; none of it is built yet.

### 6.1 Level 1–2: automatic, then theme tokens
Default: inherit the host's `Font`, `.tint`, color scheme and Dynamic Type — the board should already look like the app. (`FeatureRequestTheme` today covers accent/background/corner radius only.)

```swift
Fewchurs.configure(apiKey: "fr_live_xxx") { config in
    config.theme.primary = Color("BrandOrange")
    config.theme.cornerRadius = 14
    config.theme.statusColors[.done] = .green
    config.theme.density = .compact          // .comfortable | .compact
    config.theme.voteButtonStyle = .pill     // .pill | .column | .minimal
}
```
Or scoped, the SwiftUI way, via the environment:
```swift
FewchursBoardView()
    .fewchursTheme(FewchursTheme(primary: .teal, cornerRadius: 12))
```

### 6.2 Level 3: behavior and copy
```swift
Fewchurs.configure(apiKey: "fr_live_xxx") { config in
    config.board.tabs = [.top, .new, .roadmap]
    config.board.defaultTab = .top
    config.board.showDeclined = false
    config.board.allowComments = true
    config.board.emailField = .optional      // .hidden | .optional | .required
    config.strings.boardTitle = "Ideas & roadmap"
    config.strings.submitButton = "Suggest an idea"
    config.isSubscriber = { StoreKitHelper.hasActiveSubscription }   // unblocks §2.4
    config.userEmail = { Auth.current?.email }
}
```
All copy moves into a **String Catalog** (`.xcstrings`) so it can be localized and overridden.

### 6.3 Level 4: view slots
```swift
FewchursBoardView(
    header: { MyBoardHeader() },
    emptyState: { MyEmptyView() },
    featureRow: { feature, actions in
        MyFeatureRow(feature: feature, onVote: actions.toggleVote)
    }
)
```
Slots get state + actions, so paging, optimistic voting and error handling keep working.

### 6.4 Level 5: headless
```swift
@State private var board = Fewchurs.boardModel(sort: .top)   // @Observable

ForEach(board.features) { feature in MyRow(feature) }
    .task { await board.loadFirstPage() }

await board.loadMore()
await board.toggleVote(feature.id)

let page = try await Fewchurs.client.listFeatures(sort: .new, limit: 20, cursor: nil)
try await Fewchurs.client.follow(featureID, email: "a@b.com")
try await Fewchurs.client.addComment(featureID, text: "+1", authorName: "Sam")
```
Requires promoting the model/client/entity types from `internal` to `public` — see §4.

### 6.5 Events, presentation, misc
```swift
for await event in Fewchurs.events {
    switch event {
    case .boardOpened: Analytics.log("fewchurs_open")
    case .featureSubmitted(let id): Analytics.log("fewchurs_submit", id)
    case .voted, .commented, .followed: break
    case .error(let error): Crashlytics.record(error)
    }
}
```
- Presentation: `.sheet { FewchursBoardView() }`, push onto a `NavigationStack`, embed in a tab, or `Fewchurs.showBoard()` from UIKit.
- `Fewchurs.deviceID = { sha256(user.id) }` so votes follow a signed-in user across devices (docs must say: hash it, never send an email or raw ID).
- `config.baseURL` for staging; `config.logLevel = .debug` (never logs the API key).
- Badge: server-driven only; no option to hide it on non-Pro plans, matching Android and Flutter.

---

## 7. Swift-specific technical notes

| Topic | Decision | Reality check |
|---|---|---|
| Platform floor | **iOS 17+ / Swift 5.9.** | The package **already declares `.iOS(.v17)`** and uses `@Observable` unconditionally. The "iOS 16+" line in `/docs/swiftui` is **wrong and must be corrected** — and decision §9.1 is therefore already made. |
| Naming | Module is `FeatureRequestKit`, entry point `FeatureRequestKit.configure(apiKey:theme:)`, view `FeatureRequestBoardView`. | **Conflicts with this plan and the docs**, which use `Fewchurs.*` throughout. Renaming is a source-breaking change → 2.0, or keep `FeatureRequestKit` and rewrite the docs. **Decide before writing any 1.2 docs.** |
| Concurrency | Compile under Swift 6 strict concurrency; public types `Sendable`; UI state `@MainActor`. | Not enabled. Annotations are mostly in place, so this is likely cheap — but unproven until the flag is on. |
| Dependencies | **None.** `URLSession` + `Codable` only. | Confirmed — zero dependencies. |
| Distribution | SPM only. | Confirmed. |
| Decoding | Central tolerant decoder: unknown keys ignored, unknown enum cases → fallback, ISO-8601 UTC dates. | `APIClient.decoder` handles ISO-8601 with and without fractional seconds. Enum fallback landed in §0. |
| Device ID | Random UUID in the Keychain, survives reinstall. | Confirmed — **Android and Flutter must match this.** |
| Accessibility | VoiceOver labels, Dynamic Type to XXXL, 44pt targets, RTL, light/dark. | Buttons carry `accessibilityLabel`s. Dynamic Type / RTL / 44pt not verified — the vote and follow buttons use fixed 32pt frames, which is **under the 44pt minimum**. |
| Privacy | Ship `PrivacyInfo.xcprivacy`: user content + optional email + app-scoped identifier; no tracking, no ads. | **Missing — no manifest anywhere in the package.** Required by App Store review, and it declares Keychain use. Highest-priority 1.1 item after the §0 fixes. |
| Testing | `URLProtocol` stubs, snapshot tests, nightly contract test against staging. | 38 tests covering endpoints, decoding, errors and device identity. **No `URLProtocol` stubs and no view-model tests** — which is exactly why the 405 and the tab-switch latency shipped. No contract test. |

---

## 8. Release plan

| Version | Contents | Breaking? |
|---|---|---|
| **1.0.x** | Hotfix: the comment 405 (§0). This is a total feature outage and should not wait for 1.1. | No |
| **1.1.0** | Privacy manifest; validation limits aligned (§3a); `limit_reached`/`internal` mapped; `isSubscriber` + `email` sent on create (drops a round trip); `X-Fewchurs-Sdk` header; empty-page paging stall; timeout + retry policy; Swift 6 strict concurrency; `URLProtocol` stubs + view-model tests; docs corrections (Starter plan, badge wording, **iOS 17 floor**) | No |
| **1.2.0** | Customization levels 1–5 (§6), public headless surface, String Catalog, events, `hideVoteCounts` + Roadmap tab (after server §5.1–5.2), `isMine` (after §5.4) | No (additive) |
| **1.3.0** | Deep links from "it shipped" emails (after server §5.5), more languages | No |
| **2.0.0** | Only if the module is renamed to `Fewchurs` (§7) or the public API is reshaped | Yes |

Each release: CHANGELOG entry, `/docs/swiftui` updated the same day, and a short migration note. Deprecations stay for at least one minor version with `@available(*, deprecated, renamed:)`.

**Docs to update on the website** (this repo), in `src/app/docs/swiftui/page.tsx`:
- The badge paragraph says the badge shows "on the free plan" — with three tiers it now shows on Free **and** Starter.
- The platform requirement says iOS 16; the package is **iOS 17+**.
- Reconcile the `Fewchurs.*` naming with the shipped `FeatureRequestKit.*` API (§7).

---

## 9. Decisions to confirm

1. ~~**iOS floor:** 16 or 17?~~ **Already 17** in `Package.swift`. Confirm and fix the docs.
2. ~~**Device ID storage:** UserDefaults or Keychain?~~ **Already Keychain**, survives reinstall. Confirm Android/Flutter match.
3. **Module naming:** rename to `Fewchurs` (2.0, source-breaking) or keep `FeatureRequestKit` and rewrite the docs and both sibling plans? *(new — blocks 1.2 docs)*
4. **Roadmap tab in 1.2** — depends on server §5.2; ship 1.2 without it if that slips?
5. **Show declined requests** by default?
6. ~~**Remember the user's email** after the first follow?~~ **Already implemented** — saved via `UserIdentity` and reused, with a "Change" affordance on the submit form.
7. **Do we backport the comment 405 fix** to a 1.0.x patch? *(Recommended yes — commenting is fully broken without it.)*

---

## 10. Definition of done

- Commenting works. *(Fixed — §0.)*
- No shipped app silently truncates comments; paging works past deleted-comment gaps, including a fully empty page.
- The SDK tolerates new server fields and statuses without breaking — proven by a test that feeds it a future-looking payload. *(Status fallback done and tested — §0.)*
- Tab switches are instant. *(Done — §0.)*
- A `PrivacyInfo.xcprivacy` ships with the package.
- Client-side validation matches the server exactly, from shared constants.
- A nightly contract test against staging fails loudly the next time the API changes. **This is the item that would have caught the 405, and it is still the highest-leverage thing on this list.**
- Swift, Kotlin and Flutter agree on branding, hidden vote counts, rate-limit messages, follow rules, device-ID persistence and status names.
- Customization levels 1–5 are demonstrated in the sample app using only public API.
- `/docs/swiftui` matches the shipped package: three-tier plan wording, iOS 17 floor, and the real module name.
