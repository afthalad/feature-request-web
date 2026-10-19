# React SDK check: is it up to date with Fewchurs web?

Audited 2026-10-19 against `~/Desktop/fewchurs-react` @ `3e355ed` ("Add the Fewchurs React SDK"; `@fewchurs/react` and `@fewchurs/next` 1.0.0, unreleased). Compared with this repo's API (`src/app/api/v1`, `src/lib/validation/schemas.ts`), its docs pages (`/docs/react`, `/docs/nextjs`), and the live API at `https://www.fewchurs.shop/api/v1`.

## Verdict

The React SDK speaks the current API correctly, and every code sample on `/docs/react` typechecks against it. Typecheck, tests (39 + 12), lint, format, bundle size (10.09 kB of 15 kB) and the packaging check all pass.

It **can't ship yet**, for one reason: **it isn't published.** `npm view @fewchurs/react` returns 404, and `github.com/fewchurs/fewchurs-react` returns 404, so the docs' `npm install` commands fail today.

Fixed since the audit:
- `3e355ed`: the dead `fewchurs.com` default server and links, the MIT license (now the Fewchurs SDK License), the crashing `attw` check, and placeholder keys that tripped CI's committed-key scan.
- `3551349`: `next build` failed on Next.js 15 for anyone who followed `/docs/nextjs` (Fix 1). The board also showed a Roadmap tab by default, which sends the query that needed a missing Firestore index (Fix 2). It now shows Top and New, like Flutter and Laravel.

## Where React packages are published

On **npm** ([npmjs.com](https://www.npmjs.com)), the React version of pub.dev or Packagist. Both packages go there, under an npm organization named `fewchurs` that reserves the `@fewchurs/` scope.

| Stack | Registry | Status today |
|---|---|---|
| Android | Maven Central | Live as `shop.fewchurs:fewchurs-android` |
| Laravel | Packagist | Live as `fewchurs/laravel` 1.4.0 |
| Flutter | pub.dev | Not yet; installed from GitHub with a `ref` |
| React / Next.js | npm | Not yet |

Step-by-step publishing is in section 4.

---

## 1. API contract: SDK vs server

Checked by reading the SDK client against `src/app/api/v1` and `src/lib/validation/schemas.ts`.

| Call | SDK | Server |
|---|---|---|
| Headers: `Authorization: Bearer`, `X-Device-Id`, `X-Fewchurs-Sdk: react/1.0.0`, `Accept-Language` | ✅ | ✅ |
| `GET /config` → `showBranding`, `hideVoteCounts`, `appName` | ✅ Reads all three | ✅ |
| `GET /features?sort=top\|new&limit&cursor` | ✅ | ✅ |
| `GET /features?status=planned,in_progress,done&sort=top` (Roadmap tab, opt-in since `3551349`) | ✅ Sends it, and filters again on the client | ⚠️ Needed a Firestore index that was missing on 2026-10-15 (see Fix 2) |
| `GET /features/{id}` | ✅ | ✅ |
| `POST /features`: title 3–100, description ≤1000, email | ✅ Same limits (`LIMITS` in `client/constants.ts`) | ✅ |
| `POST`/`DELETE /features/{id}/vote` | ✅ Optimistic, rolls back on failure | ✅ |
| `POST`/`DELETE /features/{id}/follow` | ✅ | ✅ |
| `GET /features/{id}/comments`, `POST /comments`: text 1–1000, name ≤60 | ✅ Same limits | ✅ |
| `isMine`, `hasVoted`, `isFollowing` on features | ✅ Uses the server's `isMine` when sent | ✅ |
| Errors `{ error: { code, message } }`: `invalid_key`, `validation_failed`, `missing_device_id`, `rate_limited`, `not_found`, `limit_reached` | ✅ All mapped; `missing_device_id` folds into `validation_failed` | ✅ |
| Default server | ✅ `https://www.fewchurs.shop/api/v1` (fixed in `3e355ed`) | ✅ Live (401 without a key) |

Plan limits need no SDK change: the server trims the list (Free 5, Starter 200, Pro all) and sends `showBranding: false` on paid plans, and the board hides the "Powered by" line from that.

## 2. Docs pages vs SDK

Each code sample on the two docs pages was pasted into the example apps and typechecked against the built SDK.

| Page | Sample | Result |
|---|---|---|
| `/docs/react` | Install, provider + board, proxy `baseUrl` | ✅ |
| `/docs/react` | `theme` + `labels`, `renderFeature`, `FewchursBoard.Root/Tabs/List/SubmitTrigger`, `unstyled` | ✅ |
| `/docs/react` | `useFeatures`, `useVote`, `useComments`, `useSubmitFeature`, `useFollow` | ✅ Every field named exists |
| `/docs/react` | `userMessage` from `@fewchurs/react/core`, `deviceId` prop | ✅ |
| `/docs/nextjs` | `export { GET, POST, DELETE } from "@fewchurs/next/handler"` | ✅ `next build` passes on 15.5 since `3551349` (Fix 1) |
| `/docs/nextjs` | `createHandler({ deviceId })` | ✅ Same fix |
| `/docs/nextjs` | `<FewchursBoard tabs defaultTab allowComments emailField theme labels />` | ✅ Example now uses `["top", "new"]` (Fix 2) |
| `/docs/nextjs` | `import "@fewchurs/react/styles.css"` after only `npm install @fewchurs/next` | ⚠️ Works with npm; fails with pnpm (Fix 4) |

## 3. Fix list, in order

### P0: blocks real use

**Fix 1: `next build` fails with the route handler. ✅ Fixed in `3551349`.** On Next.js 15.5.25, building `examples/next-app` stopped with:

```
Type error: Route "app/api/fewchurs/[...route]/route.ts" has an invalid "GET" export:
  Type "RouteContext | undefined" is not a valid type for the function's second argument.
```

`RouteHandler` in `packages/next/src/handler.ts` took an optional `context`. Next 15 wants a required `context` whose `params` is a `Promise`. The exported type now says exactly that, while the handler itself still accepts Next 14's plain-object `params`, or none. `next build` now passes on Next.js 15.5.25 (`examples/next-app`, with no `fr_live_` string in `.next/static`) and on 14.2.35 (a fresh app installing the packed tarballs).

**Fix 2: the Roadmap tab, on by default. ✅ SDK and docs part fixed in `3551349`; the index is still to confirm.** React's default tabs were Top, New and Roadmap. Roadmap sends `status` plus `sort=top`, which needs the `features` index (`status` ↑, `upvoteCount` ↓). That index is defined in `firestore.indexes.json` but was not created in Firebase on 2026-10-15 (see `FLUTTER_SDK_CHECK.md`, Fix 2). Do both:
- Confirm the index exists in the Firebase console, or deploy it with `firebase deploy --only firestore:indexes`.
- ✅ Done: `DEFAULT_TABS` in `packages/react/src/components/Board.tsx` is `["top", "new"]`, as in Flutter 1.2.0 and Laravel, and `"roadmap"` is opt-in. The example in `src/app/docs/nextjs/page.tsx` matches, and a test covers both.

**Fix 3: publish it.** Create `github.com/fewchurs/fewchurs-react`, push `main`, then publish both packages to npm (section 4). Until then, both docs pages give install commands that fail.

### P1: correctness and docs

**Fix 4: the Next.js docs import a package they don't install.** `/docs/nextjs` only says `npm install @fewchurs/next`, but the page sample imports `@fewchurs/react/styles.css`. npm hoists it, so it works; pnpm (and Yarn PnP) don't, so the import fails. Either change the install step to `npm install @fewchurs/next @fewchurs/react`, or re-export the stylesheet as `@fewchurs/next/styles.css`.

**Fix 5: `SDK_VERSION` is set by hand.** `packages/react/src/client/constants.ts` says `"1.0.0"`, and Changesets won't bump it. Update it with each release (see section 4, step 3), or generate it from `package.json` at build time.

### P2: parity with the other SDKs

| Feature | Laravel | Flutter | React |
|---|---|---|---|
| Top and New tabs only by default | ✅ | ✅ 1.2.0 | ✅ since `3551349` |
| Votes update instantly, roll back on failure | ✅ 1.4.0 | ✅ | ✅ |
| Error inside the board with "Try again" | ✅ 1.3.0 | ✅ | ✅ |
| Loading shimmer shaped like the board | ✅ 1.3.0 | — | ❌ |
| Floating button that slides the board in (sheet) | ✅ 1.2.0 | ✅ `showBoardSheet` | ➖ `FewchursBoardDialog` exists but isn't documented |
| Open one request by ID | — | ✅ `initialFeatureId` | ➖ client has `getFeature`, board has no prop |

None of these block a release.

## 4. Publish to npm

### One-time setup

1. Create an account at [npmjs.com/signup](https://www.npmjs.com/signup) and turn on two-factor authentication. npm requires 2FA to publish.
2. On npmjs.com: avatar → **Add Organization** → name it `fewchurs`, free plan. This reserves `@fewchurs/react` and `@fewchurs/next`.
3. Log in from the terminal:

```bash
npm login
npm whoami
```

4. Create `fewchurs/fewchurs-react` on GitHub, then push:

```bash
cd ~/Desktop/fewchurs-react
git remote add origin git@github.com:fewchurs/fewchurs-react.git
git push -u origin main
```

### Each release

The repo uses [Changesets](https://github.com/changesets/changesets). `.changeset/config.json` already versions both packages together (`fixed`) and publishes them as public.

1. Describe the change (patch, minor or major): `pnpm changeset`
2. Apply the version bump and changelog: `pnpm changeset version`
3. Set `SDK_VERSION` in `packages/react/src/client/constants.ts` to the same version.
4. Run every check:

```bash
pnpm typecheck && pnpm test && pnpm lint && pnpm format && pnpm size && pnpm check:packaging
```

5. Build the Next example, which also proves the key stays out of the browser:

```bash
cd examples/next-app && FEWCHURS_API_KEY=fr_live_ci_placeholder_key pnpm exec next build && ! grep -rIl fr_live_ .next/static
```

6. Publish both packages, then push the tags:

```bash
pnpm release
git push --follow-tags
```

7. Confirm they're live:

```bash
npm view @fewchurs/react version
npm view @fewchurs/next version
```

Always publish with `pnpm release`. It runs `changeset publish`, which swaps `workspace:^` for the real `@fewchurs/react` version inside `@fewchurs/next`. A bare `npm publish` in `packages/next` would ship a broken dependency.

A published version can't be overwritten, and can only be unpublished within 72 hours. If a release is broken, publish a fixed patch.

Later, to publish from CI: add an npm granular access token for the `fewchurs` scope as the `NPM_TOKEN` secret, and add the [Changesets GitHub Action](https://github.com/changesets/action). Merging its "Version Packages" pull request then publishes.

## 5. How to test the React SDK

### Automated (in `fewchurs-react`)

```bash
pnpm install
pnpm typecheck && pnpm test && pnpm lint && pnpm format && pnpm build && pnpm size && pnpm check:packaging
```

CI runs the same on React 18 and 19, plus the key-safety job (no `fr_live_` key in the repo or in `.next/static`).

### Against the live server

1. Copy a key from the dashboard into `examples/vite-spa/.env.local` as `VITE_FEWCHURS_KEY=…`, and into `examples/next-app/.env.local` as `FEWCHURS_API_KEY=…`. Both files are git-ignored.
2. Run each example and open it: `pnpm --filter ./examples/vite-spa dev`, then `pnpm --filter ./examples/next-app dev`.

### Manual checklist

- [ ] Top and New load; on a Free app only 5 requests show
- [ ] With `tabs={["top", "new", "roadmap"]}`, Roadmap loads without a 500
- [ ] Vote: the count changes at once; reload, and it stays
- [ ] Vote with the network off: the vote rolls back and a message shows
- [ ] Submit a request, comment on it, follow it with an email
- [ ] Turn on "Hide vote counts" in the dashboard; counts disappear within 5 minutes
- [ ] Free plan shows "Powered by Fewchurs"; Starter or Pro hides it
- [ ] Next.js: `next build` passes, and no `fr_live_` string appears in `.next/static`
- [ ] Wrong key: the board shows "Feedback is unavailable right now." and the page keeps working
