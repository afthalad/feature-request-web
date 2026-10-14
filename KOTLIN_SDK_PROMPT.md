# Prompt: Bring the Fewchurs Kotlin SDK up to date with the API and ship it production-ready

> Paste everything below the line into a Claude Code session opened in `~/Desktop/fewchurs-kotlin`
> (remote `github.com/fewchurs/fewchurs-kotlin`). The web/API repo is `~/Desktop/feature-request-web`.
> Read it whenever you need to confirm the contract.
>
> Audited 2026-10-13 against web `main` @ `571bf10` and package `main` @ `eea2dbe` (28 unit tests, no tags).

---

You are working on the **Fewchurs Android SDK**. It has three modules:
- `:fewchurs-core`: API client, repository, headless state, events
- `:fewchurs-android`: Compose UI, `FewchursActivity`, App Startup initializer
- `:sample`

There is also a mock server in `tools/mock-server`.

The package is well built. It already has tolerant decoding, an `UNKNOWN` status fallback, optimistic debounced voting, a shared cache, empty-page paging guards, retries, validation constants that match the server, `isSubscriber`/`email` on create, a single round-trip submit, `hideVoteCounts`, R8 rules, Java wrappers and a Data Safety table.

**What blocks it from being real is distribution and one bad default.** Every call fails out of the box, and nobody can install it. The server has also shipped the features this SDK was waiting for. Your job is to:
- fix the blockers
- turn on the features the server now supports
- harden the build for publishing
- get it ready for a first public release

**Ground rules**
- The server is the source of truth. Confirm shapes in these files before changing a request or response: `~/Desktop/feature-request-web/src/app/api/v1/**/route.ts`, `src/lib/features/service.ts`, `src/lib/comments/service.ts`, `src/lib/followers/service.ts`, `src/lib/validation/schemas.ts`, `src/types/index.ts`, `src/middleware.ts`. If this prompt disagrees with the code, the code wins. Tell me where they differed.
- No source-breaking changes to the public API. `explicitApi()` is on, so keep every new public symbol deliberate and documented with KDoc.
- No new runtime dependencies unless I approve them. In particular, no Play Services.
- Every fix comes with a test. Use the existing `MockWebServer`, Turbine and coroutines-test style.
- Small commits, one concern each. **Don't push, tag or publish.** Prepare everything and give me the commands.

---

## 1. Current API contract (`/api/v1`)

**Production base URL:** `https://www.fewchurs.shop/api/v1`. This is the canonical value from web `src/lib/docs/nav.ts`. `fewchurs.shop` 308-redirects to it. **`fewchurs.com` does not resolve.**

**Headers:**
- `Authorization: Bearer <key>`
- `X-Device-Id`
- `Content-Type: application/json`
- `X-Fewchurs-Sdk: android/<version>` (allowed by CORS; the server will use it for per-version analytics)
- `Accept-Language`

**Error envelope:** `{ "error": { "code", "message" } }`. Codes and HTTP statuses:

| Code | HTTP |
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

Non-JSON bodies happen too (Next.js 405, Vercel 502/504 HTML).

**Endpoints:**

| Endpoint | Request | Response |
|---|---|---|
| `GET /config` | – | `{ showBranding, hideVoteCounts, appName? }` |
| `GET /features` | `?sort=top\|new&limit=1..100&cursor=&status=a,b`. `status` is comma-separated and unknown names are dropped. Composite indexes for `status`+`upvoteCount` and `status`+`createdAt` are in `firestore.indexes.json`. | `{ features, nextCursor? }` |
| `GET /features/{id}` | – | Feature with `hasVoted` / `isFollowing` / `isMine`. **This is live now.** |
| `POST /features` | `{ title 3–100, description ≤1000?, email?, isSubscriber? }` | `201`, Feature **without** `hasVoted` / `isFollowing` / `isMine`. If `email` was sent, the server already followed it. |
| `POST` / `DELETE /features/{id}/vote` | – | `{ upvoteCount, hasVoted }`. Idempotent. |
| `POST /features/{id}/follow` | `{ email }` | `{ following: true }` |
| `DELETE /features/{id}/follow` | – | `{ following: false }` |
| `GET /features/{id}/comments` | `?limit&cursor` | `{ comments, nextCursor? }`, oldest first. Pages can be short or empty and still have a cursor. |
| `POST /comments` | `{ featureId, text 1–1000, authorName ≤60? }` | `201`, Comment **without** `isMine`. |

**Fields:**
- **Feature:** `id`, `title`, `description`, `status`, `upvoteCount`, `commentCount`, `followerCount`, `hasVoted`, `isFollowing`, `isMine`, `authorIsSubscriber`, `translation` (`{lang,title,description}` or null; an owner-side dashboard translation, **don't show it**), `authorDeviceId`, `createdAt`, `updatedAt`.
- **Comment:** `id`, `text`, `authorName` (server default `"App User"`), `isDeveloper`, `isMine`, `deviceId`, `createdAt`.

**What has changed on the server:**
- `isMine` is now sent on list and detail responses, and on comments whenever `X-Device-Id` is present.
- `/features` **does not** zero `upvoteCount` when `hideVoteCounts` is on. Hiding the count is the client's job.
- API keys are cached per instance on the server, so a revoked key can keep working for up to 60s. There is no SDK impact, but don't write tests that assume instant revocation.

**Limits:** 15 submissions per device per day and 10 comments per device per day. Both return `rate_limited`. Votes and follows are not limited.

---

## 2. Audit findings. Fix them in this order.

### P0: blocks a real release

1. **The default base URL is dead.** `FewchursConfig.DEFAULT_BASE_URL = "https://fewchurs.com/api/v1"`, and that domain does not resolve. Any app that doesn't override `baseUrl` gets `Network` errors on every call.
   - Change it to `https://www.fewchurs.shop/api/v1`.
   - Fix the README links too: the dashboard link points at `fewchurs.com`.
   - Add a test that asserts the default URL.
2. **Nobody can install the package.**
   - There is no publishing setup: no `maven-publish`, no signing, no POM.
   - The repo has no git tags.
   - The README says `implementation("com.fewchurs:fewchurs-android:1.0.0")`, which resolves nowhere.

   Set up publishing for **both** routes below, so I can ship today and move to Central later.

   **a. Maven Central (the real target).** Use `com.vanniktech.maven.publish`, which publishes through the Sonatype **Central Portal**. The old OSSRH service is gone.
   - Configure `publishToMavenCentral(automaticRelease = false)` and `signAllPublications()`.
   - Set the full POM: name, description, url, MIT or Apache-2.0 license (ask me which), developer, scm.
   - Publish sources and Javadoc jars (Dokka) for both library modules.
   - Read credentials and signing keys from `~/.gradle/gradle.properties` or env vars. **Never commit them.**
   - **The group ID needs a decision. Stop and ask me.** Central requires proof that we own the namespace. `com.fewchurs` needs DNS on `fewchurs.com`, **which we don't own**. Present these options:
     - `shop.fewchurs`: verify with a DNS TXT record on `fewchurs.shop`, which we own
     - `io.github.fewchurs`: verify through the GitHub org
     - buy `fewchurs.com`

     Whatever I choose, update the group in `build.gradle.kts`, the README and the CHANGELOG. Package names (`com.fewchurs.sdk.*`) can stay as they are; only the Maven coordinates change.

   **b. JitPack (works today with just a git tag).**
   - Add a `jitpack.yml` with `jdk: openjdk17`, and confirm `./gradlew publishToMavenLocal` works, since JitPack runs that.
   - Document the coordinates: `com.github.fewchurs.fewchurs-kotlin:fewchurs-android:<tag>`, with `maven("https://jitpack.io")` in `dependencyResolutionManagement`.
   - Confirm the transitive `fewchurs-core` dependency resolves on JitPack too. Its POM must point at the JitPack coordinates, not `com.fewchurs`.
3. **Consumer compatibility claims are unverified.**
   - The README says *Kotlin 2.0+*, but the library is compiled with Kotlin 2.2.20. Pin `languageVersion` and `apiVersion` to `KOTLIN_2_0` in both library modules, or raise the documented minimum. Pick one and test it.
   - Work out the **minimum `compileSdk`** that consumers need. It comes from the AAR metadata of `core-ktx` 1.16, `activity` 1.10, and the Compose BOM.
   - Put both numbers in the README requirements table.
4. **Lock the public API.** Turn on binary-compatibility validation: Kotlin's built-in ABI validation, or `org.jetbrains.kotlinx.binary-compatibility-validator`. Commit the `.api` dumps so future changes can't break apps by accident.

### P1: the server now supports what the SDK was waiting for

5. **Roadmap tab.** `BoardViewModel` filters out `BoardTab.Roadmap` with the comment *"hidden until the API supports it"*. It's supported now.
   - Add an optional `statuses: Set<FeatureStatus>?` parameter to `FewchursApi.listFeatures`, `FewchursRepository.listFeatures`, `FewchursClient.listFeatures` and `Fewchurs.boardState`, using default arguments so nothing breaks.
   - Send it as `status=planned,in_progress,done`.
   - Enable the Roadmap tab: Top sort, those three statuses, labelled by status.
   - The shared cache must not mix roadmap pages into Top/New ordering. Check `BoardState`'s per-state `ids` list.
   - Add tests.
6. **`hideDeclined` should use the server filter.** Today it filters on the client, which is why `fetchVisible` has to loop over empty pages.
   - When `hideDeclined = true`, request `status=open,planned,in_progress,done`.
   - Keep the loop as a safety net.
7. **`GET /features/{id}` is live.**
   - Remove the "Requires a server with…" caveat from the KDoc.
   - Check that deep links and process-death restore of the detail screen fetch the feature when it isn't cached, both through `FeatureDetailState` and through the UI.
   - If there isn't one yet, add a public way to open a single request. Use additive overloads, for example `Fewchurs.showBoard(context, featureId)` and a `FewchursBoard(initialFeatureId = …)` parameter.
   - Add tests.
8. **Send `X-Fewchurs-Sdk: android/<VERSION_NAME>` on every request.** Keep the `User-Agent` as it is. Add a test with `MockWebServer`.
9. **`isMine` is now first-class.**
   - Keep the `authorDeviceId`/`deviceId` fallback only for an `isMine` that is *absent*. The server will soon stop sending raw device IDs, because they leak other users' IDs. Add a test proving that the SDK works when both of those fields are missing.
   - Mark the fallback as deprecated and slated for removal in the code comments.
10. **Error mapping.**
    - Add explicit cases for `unauthorized` (treat it as `InvalidApiKey`) and `forbidden` (generic message).
    - Make sure a non-JSON 405 or 5xx body never reaches `userMessage`.
    - Check `LimitReached`: the server no longer turns submissions away for plan volume, so its copy *"This board isn't accepting requests right now"* should almost never appear. Keep the mapping.
11. **Device ID persistence and parity with iOS.** iOS keeps the device ID in the Keychain, so it survives a reinstall. Android keeps it in SharedPreferences (`fewchurs_sdk`), which **is wiped on uninstall** unless Auto Backup restores it.
    - Don't add Play Services.
    - Document in the README that the host app's `dataExtractionRules`/`fullBackupContent` must **include** `sharedpref/fewchurs_sdk.xml`. Ship a ready-made snippet.
    - Make the sample app use those rules.
    - Mention that `deviceId = { sha256(userId) }` is the reliable cross-install option.
12. **Update `CONTRIBUTING.md` "Known server dependencies".** `hideVoteCounts`, `isMine`, `GET /features/{id}` and the status filter have all shipped. The only one still outstanding is "counts zeroed in `/features`", and that stays the client's job anyway.

### P2: production hardening

13. **Dependency refresh.** Check the latest **stable** releases of AGP, Kotlin, the Compose BOM, Activity, Lifecycle, coroutines, serialization and Turbine.
    - Bump them only where that doesn't raise the consumer minimums from item 3 without a reason.
    - Stay on OkHttp 4.12.x unless there's a clear benefit. 5.x changes artifacts and could clash with host apps.
    - Report each version, old → new.
14. **Tests.**
    - Use `MockWebServer` to cover the path, method, headers (including `X-Fewchurs-Sdk`) and body for every endpoint, plus decoding of the exact §1 payloads.
    - Add `BoardState` roadmap and status tests.
    - Test the follow and unfollow `{ following }` shape.
    - Test that create with an email results in `isFollowing = true` and `isMine = true`.
    - Test a comment create where `isMine` is missing.
    - Add at least one Compose UI test, or a Paparazzi/Roborazzi screenshot test if that stays cheap, for: board, hidden counts, branding badge, and the Roadmap tab.
15. **Opt-in contract test.** Only run it when `FEWCHURS_CONTRACT_API_KEY` is set. It should call production and decode every response type. It must never run in default CI.
16. **CI.** Add a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs:
    - `./gradlew check apiCheck :sample:assembleRelease`
    - an AAR-size guard: each AAR under 300 KB, as CONTRIBUTING already says
17. **Release build sanity.**
    - Build `:sample:assembleRelease` with R8 full mode and confirm serialization still works on a real request (the consumer rules).
    - Confirm the sample's `network_security_config` cleartext exception only applies to the mock-server host and isn't shipped in a library module.
18. **Accessibility.** Check these on the vote/follow/send controls:
    - touch targets of at least 48dp
    - TalkBack content descriptions with state (e.g. "Upvote, 42 votes, selected"; leave out the count when counts are hidden)
    - font scale at 200%
    - RTL

---

## 3. Out of scope (list as follow-ups)
- Kotlin Multiplatform, a separate Views/XML UI, push notifications.
- Server changes. Report them to me; don't work around them:
  - removing `authorDeviceId`/`deviceId` from responses
  - zeroing counts when `hideVoteCounts` is on
  - reading `X-Fewchurs-Sdk`

---

## 4. Release checklist (prepare everything, run nothing irreversible)
1. `./gradlew clean check apiCheck :sample:assembleRelease` is green. Report test counts before and after.
2. Run the sample against **production** with a real key and confirm each of these:
   - the board loads
   - vote and unvote
   - follow and unfollow
   - submit with an email (one request, already followed)
   - comment
   - the Roadmap tab
   - hidden counts (toggle them in the dashboard)
   - the branding badge appears on a Free or Starter key
   - a deep link to one request works
   - a process-death restore of the detail screen works
3. Run `./gradlew publishToMavenLocal` and build a **fresh** throwaway app against `mavenLocal()` using only the README instructions.
4. README:
   - the new coordinates (Central and JitPack)
   - the requirements table (minSdk, compileSdk, Kotlin, AGP)
   - the backup-rules snippet
   - Roadmap
   - opening a single request
5. CHANGELOG: change `1.0.0 (unreleased)` into the real release entry. Lead with the base-URL fix.
6. Give me the exact commands. Don't run them.
   ```
   git tag v1.0.0 && git push origin main --tags                 # JitPack picks this up
   ./gradlew publishToMavenCentral --no-configuration-cache      # then "Publish" in central.sonatype.com
   ```

---

## 5. Website edits I'll make afterwards (list them, don't edit the web repo)

`~/Desktop/feature-request-web/src/app/docs/kotlin/page.tsx` currently tells people to **copy a hand-written OkHttp client**. It doesn't mention the SDK at all. Draft the replacement content for me. Mirror the structure of `/docs/swiftui`:
- Install (Gradle line plus repository)
- Set up (manifest meta-data **or** `Fewchurs.configure`)
- Show the board (Compose, bottom sheet, `showBoard(context)` for Views)
- Theme
- Subscribers and email
- Roadmap
- Open one request
- About the API key
- Device ID and backups
- The "Powered by" badge: it shows on Free **and** Starter and goes away on Pro, with no code change

---

## 6. When you finish, reply with
1. A table of every numbered item in §2: **done / partial / skipped / needs my decision**, plus the commit hash.
2. Every place where the server code disagreed with this prompt.
3. New public API, with signatures, and confirmation that `apiCheck` passes.
4. Dependency versions, old → new.
5. Test counts before and after, and the contract-test result if you ran it.
6. Release commands, the group-ID decision you need from me, and the drafted `/docs/kotlin` content.
