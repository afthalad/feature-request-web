# SDK changes for app-locked API keys

Each Fewchurs app now saves the IDs of the product it belongs to:

- iOS Bundle ID, like `com.company.app`
- Android package name, like `com.company.app`
- Website domain, like `company.com`

The API key only works from those IDs. This stops one key being reused in other apps.

How to use this file: open a session in the SDK's repo and paste **Shared** plus that SDK's section.

---

## Shared (paste this into every SDK session)

### How the server finds the caller's ID

1. If the request has an `Origin` header (any browser), the server uses its host name.
   Browsers set this header themselves, so web SDKs send nothing extra.
2. Otherwise it uses the `X-Fewchurs-App-Id` header.

### What the server allows

| Situation | Result |
|---|---|
| App has no IDs saved (older apps) | Allowed |
| No `Origin` and no `X-Fewchurs-App-Id` | Allowed for now. It will be refused later, so every SDK must send it. |
| Caller is `localhost`, `127.0.0.1` or `[::1]` | Allowed, for local development |
| Caller ID equals a saved ID, or sits under it (`com.company.app.debug`, `com.company.app.widget`) | Allowed |
| Caller domain equals the saved domain, or is a subdomain (`app.company.com`) | Allowed |
| Anything else | `403` with the body below |

```json
{
  "error": {
    "code": "wrong_app",
    "message": "This API key is not set up for com.other.app. Add it to your app in the Fewchurs dashboard."
  }
}
```

Matching ignores upper and lower case.

### What every SDK must do

1. Send `X-Fewchurs-App-Id: <id>` on every request, where the SDK cannot rely on `Origin`.
   Read the ID automatically. Never ask the developer to type it.
2. Handle `wrong_app`:
   - Map it to the SDK's existing **invalid API key** error type. Do not add a new public error
     type, so apps that switch over every error type keep compiling.
   - Keep the server's `message`. It tells the developer which ID to add.
   - Never retry it.
   - Log the message once in debug builds, like the invalid key case does.
3. Keep sending `X-Fewchurs-Sdk: <name>/<version>`. It is still used for version stats.
4. Add tests:
   - The app ID header is sent with the right value on every endpoint.
   - A `403` with `wrong_app` becomes the invalid API key error, keeps the message, and is not
     retried.
5. Release as a minor version. Changelog line:
   "Sends the app ID so your API key only works in your own apps. Handles `wrong_app`."
6. README: add a short note under setup:
   "Add your Bundle ID / package name / domain to your app in the Fewchurs dashboard.
   The API key only works there." If the README lists error codes, add `wrong_app`.

Keep the code clean, with simple names and no comments.

---

## SwiftUI (iOS)

- ID: `Bundle.main.bundleIdentifier`.
- Send it as `X-Fewchurs-App-Id` from the shared request builder, so every endpoint gets it.
- Map `wrong_app` to the existing invalid API key error case.
- Test with the existing `URLProtocol` stubs.

## Kotlin (Android)

- ID: `context.packageName`. This is the final application ID, so debug builds with
  `applicationIdSuffix ".debug"` send `com.company.app.debug`, which the server allows.
- Send it as `X-Fewchurs-App-Id` from the shared HTTP client. The SDK already gets a `Context`
  in `Fewchurs.configure(...)`.
- Map `wrong_app` to the existing invalid API key exception.
- Test with `MockWebServer`.

## Flutter

- Mobile: read the ID with `package_info_plus` (`PackageInfo.fromPlatform()).packageName`).
  On iOS this is the Bundle ID, on Android the package name.
- Web: send nothing. The browser sends `Origin`.
- Add an `appId` field to `FewchursClient` in `fewchurs_core` and send it as
  `X-Fewchurs-App-Id` when it is set. The `fewchurs` package fills it on start-up.
- Error mapping in `packages/fewchurs_core/lib/src/client.dart`. Today a 403 falls into
  `FewchursUnknownException`:

  ```dart
  ('invalid_key' || 'unauthorized' || 'wrong_app', _) ||
  (null, 401) =>
    FewchursInvalidApiKeyException(message, statusCode: status),
  ```

- Add cases to `client_test.dart`. Release `fewchurs_core` first, then `fewchurs`.

## React (`@fewchurs/react`)

- The React SDK runs in the browser, so `Origin` is sent automatically. No header change.
- Error mapping in `src/client/errors.ts`, `errorFromResponse`. Today a 403 falls into
  `default` and becomes `server`, which looks like an outage and may be retried:

  ```ts
  case "invalid_key":
  case "wrong_app":
    return { code: "invalid_key", status, message };
  ```

- Add a test for the mapping.

## Next.js (`@fewchurs/next`)

- Calls go from the developer's server, so there is no `Origin`. Send `X-Fewchurs-App-Id`.
- ID: a new optional `appId` option on `createHandler` and the server helpers. When it is not set,
  use the host name of the incoming request (`new URL(request.url).hostname`). For server
  components, read the `host` header with `headers()` from `next/headers`.
- In the proxy handler, also stop passing on the browser's `X-Fewchurs-Sdk` header. Always send
  `SDK_HEADER` (`next/<version>`).
- The error mapping comes from `@fewchurs/react`. Release React first, then bump the dependency.
- Test: the handler sends the request's host as `X-Fewchurs-App-Id`, and `appId` overrides it.

## Laravel (`fewchurs/laravel`)

- Calls go from the developer's server, so there is no `Origin`. Send `X-Fewchurs-App-Id`.
- ID: a new `app_id` config value. Default:
  `env('FEWCHURS_APP_ID', parse_url(config('app.url'), PHP_URL_HOST))`.
- Send it on every request, including the proxy routes.
- Map `wrong_app` to the existing invalid API key exception. Check it is not retried.
- Test with `Http::fake()`.

---

## Release order

1. React, then Next.js (it depends on React).
2. Flutter, SwiftUI, Kotlin and Laravel, in any order.
3. Web repo, when most traffic sends an ID:
   - Refuse requests with no `Origin` and no `X-Fewchurs-App-Id`, for apps that have IDs saved
     (`isCallerAllowed` in `src/lib/apps/appIds.ts`).
   - Decide what people who call the REST API directly (`/docs/api`) should send.

## Honest limit

This stops normal key reuse. Someone who writes their own HTTP code can still send a fake
`X-Fewchurs-App-Id`. Browsers cannot fake `Origin`. Full proof for mobile needs Apple App Attest
and Google Play Integrity, which is a later project.
