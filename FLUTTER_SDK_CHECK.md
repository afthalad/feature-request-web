# Flutter SDK check: does it work with Fewchurs and the plan limits?

Audited 2026-10-15 against `github.com/fewchurs/fewchurs-flutter` @ `5fc256a` ("Fewchurs Flutter SDK 1.0.0") and the live API at `https://www.fewchurs.shop/api/v1`.

## Verdict

The SDK talks to the API correctly and the plan limits work in it **without any SDK change**, because the server applies them. But it **won't work out of the box**, for two reasons:

1. Its default server address is `https://fewchurs.com/api/v1`, a domain that doesn't exist. Every call fails unless the app passes `baseUrl`.
2. The **Roadmap** tab gets a 500 error from the server, because a Firestore index is missing. This is a server problem that affects every SDK, not just Flutter.

Fix those two first. Then work through the rest of the list.

---

## 1. API contract: SDK vs server

Checked by reading the SDK code and replaying its exact requests against the live API.

| Call | SDK | Live result |
|---|---|---|
| Headers: `Authorization`, `X-Device-Id`, `X-Fewchurs-Sdk: flutter/<ver> (<platform>)`, `Accept-Language` | ✅ All sent | ✅ Accepted |
| `GET /config` → `showBranding`, `hideVoteCounts`, `appName` | ✅ | ✅ |
| `GET /features?sort=top\|new&limit&cursor` | ✅ | ✅ |
| `GET /features?...&status=planned,in_progress,done` (Roadmap) | ✅ Sends `status` | ❌ **500 with `sort=top`** (missing index, see Fix 2). ✅ OK with `sort=new` |
| `POST /features` (title 3–100, description ≤1000, email, isSubscriber) | ✅ Same limits as the server | ✅ |
| `POST`/`DELETE /features/{id}/vote` | ✅ | ✅ |
| `POST`/`DELETE /features/{id}/follow` | ✅ | ✅ |
| `GET /features/{id}/comments`, `POST /comments` (text 1–1000, name ≤60) | ✅ | ✅ |
| `GET /features/{id}` (open one request) | ➖ Not used | Available if wanted (Fix 7) |
| Feature fields incl. `isMine`, `isFollowing`, `hasVoted` | ✅ Uses `isMine`, falls back to `authorDeviceId` | ✅ |
| Errors `{ error: { code, message } }` | ✅ Maps codes and statuses. Non-JSON bodies don't crash. | ✅ |
| Flutter **web** CORS preflight | ✅ | ✅ All SDK headers allowed |
| Bad API key | ✅ → `FewchursInvalidApiKeyException` | ✅ `invalid_key` |

## 2. Plan limits in the Flutter SDK

All of these come from the server, so they work with SDK 1.0.0 as it is.

| Rule | Free | Starter | Pro | How the SDK gets it |
|---|---|---|---|---|
| Requests the board lists | First 5 submitted | First 200 | All | The API only returns the visible ones, so the board just shows a shorter list and stops paging |
| "Powered by Fewchurs" line | Shown | Hidden | Hidden | `GET /config` → `showBranding`, drawn by `FewchursPoweredBy` |
| Public web board | No | No | Yes | Not part of the SDK |
| Submitting, voting, commenting | Always allowed | Always allowed | Always allowed | Never blocked by plan |

Behaviors to know about:

- **Own submission past the limit:** a request the user just submitted appears at the top of their **New** tab straight away (`board_screen.dart` `_onSubmitted` → `insertAtTop`). On the next refresh it leaves the list, because the server doesn't return it. It's still saved and shows in the dashboard. Kotlin and iOS behave the same way.
- **Declined requests are hidden by default** (`BoardOptions.showDeclined = false`) by filtering on the device. On Free that can make the board show fewer than 5, if some of the first 5 were declined.
- **If `/config` fails**, the SDK falls back to `RemoteConfig()` with `showBranding: false`, so Free apps briefly lose the badge. The Kotlin SDK falls back to showing it. Decide which you want (Fix 6).

---

## 3. Fix list, in order

### P0: blocks real use

**Fix 1: dead default URL.** In `packages/fewchurs_core/lib/src/client.dart`:

```dart
static const defaultBaseUrl = 'https://fewchurs.com/api/v1';   // ❌ does not resolve
static const defaultBaseUrl = 'https://www.fewchurs.shop/api/v1'; // ✅
```

Also change `fewchurs.com` to `fewchurs.shop` in:
- both `pubspec.yaml` `homepage:` fields
- the README dashboard link (around line 35)
- the README staging example (around line 238)

Then add a test that asserts the default URL.

**Fix 2: missing Firestore index (server, all SDKs).** Roadmap-style requests (`status` filter plus `sort=top`) fail with 500. Click this link while signed in to Firebase, and click **Create index**:

https://console.firebase.google.com/v1/r/project/ifeatures-9a971/firestore/indexes?create_composite=ClBwcm9qZWN0cy9pZmVhdHVyZXMtOWE5NzEvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2ZlYXR1cmVzL2luZGV4ZXMvXxABGgoKBnN0YXR1cxABGg8KC3Vwdm90ZUNvdW50EAIaDAoIX19uYW1lX18QAg

It's already defined in `firestore.indexes.json` (`features`: `status` ↑, `upvoteCount` ↓), but it was never created in Firebase. While you're there, check that the `dodoWebhookEvents` index (`customerId` ↑, `receivedAt` ↓) from the admin fix exists too.

**Fix 3: you can't install it the way the README says.**
- The README says `flutter pub add fewchurs`, but nothing is published on pub.dev.
- The git install it also shows uses `ref: v1.0.0`, but the repo has **no tags**.

Choose one:
- **Quick:** push a `1.0.0` tag and fix the README so the git install is the main option.
- **Proper:** publish `fewchurs_core`, then `fewchurs`, to pub.dev. You need a verified publisher (`fewchurs.shop` via DNS, like Maven Central). Afterwards, update the website's `/docs/flutter` page, which still tells people to paste their own client, to a one-line install like Android and iOS.

### P1: correctness and docs

**Fix 4: plan wording.** In the README:
- Around line 530, "disappears automatically on the Pro plan" should say **Starter or Pro**.
- Around line 514, `limit_reached` is described as "Board isn't accepting requests". Plans don't block submissions any more, so mark it as rare.

**Fix 5: error codes.** In `_mapError` in `client.dart`:
- `unauthorized` (401) falls through to `Unknown`. Map it to `FewchursInvalidApiKeyException`.
- Add `forbidden` (403) as a generic error.

**Fix 6: badge fallback.** If `/config` fails, decide whether to show the badge or not, and make it match Kotlin and iOS:
- `RemoteConfig()` defaults to `showBranding: false`.
- `RemoteConfig.fromJson` defaults to `true`.

### P2: nice to have

**Fix 7: open one request.** Add `FewchursClient.getFeature(id)` (`GET /features/{id}`) and a `FewchursBoard(initialFeatureId:)` for deep links and notifications. The server returns a locked request only to the device that submitted it, and "not found" to everyone else.

**Fix 8: CI.** CI runs `analyze` and tests on Dart 3.0 and Flutter 3.10. Add a check that `defaultBaseUrl` resolves, so a dead domain can't ship again.

---

## 4. How to test the Flutter SDK

### One-time setup

1. Install Flutter. It includes Dart.
   ```bash
   brew install --cask flutter
   flutter doctor
   ```
2. Get the code.
   ```bash
   git clone https://github.com/fewchurs/fewchurs-flutter.git && cd fewchurs-flutter
   ```
3. Make a fresh test app in the Fewchurs dashboard and copy its API key (`fr_live_…`). Turn on **Email on new request**.
4. To switch plans while testing, go to **Admin → Users → you → Plan override**. Wait **1 minute** after each switch.

### Automated tests

```bash
cd packages/fewchurs_core && dart pub get && dart analyze && dart test
```

```bash
cd packages/fewchurs && flutter pub get && flutter analyze && flutter test
```

### Run the example app against the live server

Until Fix 1 ships, pass `FEWCHURS_BASE_URL`:

```bash
cd packages/fewchurs/example && flutter run --dart-define=FEWCHURS_API_KEY=fr_live_xxx --dart-define=FEWCHURS_BASE_URL=https://www.fewchurs.shop/api/v1
```

Run it on an iPhone simulator, an Android emulator and Chrome (`-d chrome`), so each platform gets tested.

### Manual checklist

**Setup and basics**
- [ ] The board opens and loads requests. No "invalid key" or "offline" message.
- [ ] Top and New tabs work. Pull to refresh works.
- [ ] Open a request: details, comments, follow with email.
- [ ] Airplane mode shows an offline message, and **Retry** works once you're back online.
- [ ] A wrong API key shows the invalid-key message.

**Free plan**
- [ ] Submit 5 requests. All 5 show in Top and New, and 5 full emails arrive.
- [ ] Submit #6 and #7. They appear at the top right after submitting.
- [ ] Pull to refresh. #6 and #7 leave the list, and the **same first 5** stay in both tabs.
- [ ] The emails for #6 and #7 have **hidden details**.
- [ ] The dashboard shows 5 readable rows, plus 2 locked rows at the bottom.
- [ ] The **"Powered by Fewchurs"** line shows at the end of the list.
- [ ] Voting works on visible requests, and Top re-sorts after a refresh.
- [ ] Comments and follow work on visible requests.
- [ ] The Roadmap tab (`BoardOptions(tabs: [BoardTab.top, BoardTab.newest, BoardTab.roadmap])`) loads with no error. This needs Fix 2.

**Starter plan** (switch plan, wait 1 minute, pull to refresh)
- [ ] The board shows all requests.
- [ ] The **"Powered by" line is gone**.
- [ ] A new submission's email has full details.

**Pro plan**
- [ ] The board shows all requests, with no "Powered by" line.
- [ ] The Roadmap tab loads with no error. This is the case that returns 500 until Fix 2.

**Back to Free**
- [ ] Only the first 5 show again, and the "Powered by" line returns.

**Settings from the dashboard**
- [ ] Turning on **Hide vote counts** hides the numbers in the app after a refresh, and voting still works.
- [ ] Deleting the app in the dashboard makes the SDK show the invalid-key message within about a minute.

**Limits on one device**
- [ ] More than 15 submissions in a day, or more than 10 comments, shows "You've reached today's limit".
