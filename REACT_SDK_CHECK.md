# React SDK check: is it up to date with Fewchurs web?

Audited 2026-10-19 against `~/Desktop/fewchurs-react` @ `3e355ed` ("Add the Fewchurs React SDK"; `@fewchurs/react` and `@fewchurs/next` 1.0.0, unreleased). Compared with this repo's API (`src/app/api/v1`, `src/lib/validation/schemas.ts`), its docs pages (`/docs/react`, `/docs/nextjs`), and the live API at `https://www.fewchurs.shop/api/v1`.

**Re-checked 2026-10-19**, after `3551349`: every gate was re-run and every fix below that is marked done was verified in the working tree. Fixes 4 and 5 and all three P2 parity gaps are now closed; only publishing (Fix 3) and the Firestore index are left.

## Verdict

The React SDK speaks the current API correctly, and every code sample on `/docs/react` typechecks against it. Typecheck, tests (44 + 13), lint, format, bundle size (10.83 kB of 15 kB) and the packaging check all pass, as does `next build` on Next.js 15.5 with no `fr_live_` string in `.next/static`.

It **can't ship yet**, for one reason: **it isn't published.** `npm view @fewchurs/react` returns 404, and `github.com/fewchurs/fewchurs-react` returns 404, so the docs' `npm install` commands fail today.

Fixed since the audit:
- `3e355ed`: the dead `fewchurs.com` default server and links, the MIT license (now the Fewchurs SDK License), the crashing `attw` check, and placeholder keys that tripped CI's committed-key scan.
- `3551349`: `next build` failed on Next.js 15 for anyone who followed `/docs/nextjs` (Fix 1). The board also showed a Roadmap tab by default, which sends the query that needed a missing Firestore index (Fix 2). It now shows Top and New, like Flutter and Laravel.
- Uncommitted in the working tree: Fix 4 (`@fewchurs/next/styles.css`), Fix 5 (`SDK_VERSION` generated at build time), and the three P2 parity gaps — the loading shimmer, `initialFeatureId`, and docs for `FewchursBoardDialog`. A changeset for the first release is in `.changeset/first-release.md`.

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
| `/docs/nextjs` | `import "@fewchurs/next/styles.css"` after only `npm install @fewchurs/next` | ✅ Fixed (Fix 4). Proved by removing `@fewchurs/react` from `examples/next-app`'s dependencies: `next build` still passes under pnpm |

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

**Fix 3: publish it. Still open — the only thing left blocking a release.** Create `github.com/fewchurs/fewchurs-react`, push `main`, then publish both packages to npm (section 4). Until then, both docs pages give install commands that fail. Confirmed still unpublished on 2026-10-19: `npm view @fewchurs/react` and `npm view @fewchurs/next` both 404, `github.com/fewchurs/fewchurs-react` 404s, the local checkout has no `origin` remote, and `npm whoami` is not logged in. The code is ready and `.changeset/first-release.md` is written; the npm account, its 2FA and the GitHub repository are the remaining manual steps.

### P1: correctness and docs — both fixed

**Fix 4: the Next.js docs import a package they don't install. ✅ Fixed.** `/docs/nextjs` only said `npm install @fewchurs/next`, but the page sample imported `@fewchurs/react/styles.css`. npm hoists it, so it worked; pnpm and Yarn PnP don't, so the import failed. `@fewchurs/next` now re-exports the stylesheet itself:
- `"./styles.css": "./dist/styles.css"` in its `exports`, with `sideEffects: ["*.css"]` so a bundler cannot drop the import.
- `tools/copy-react-styles.mjs` copies it from `@fewchurs/react`'s source at build time, resolved from the package that runs the script, so there is one stylesheet and no build-order dependency.
- `attw` skips the CSS entry point, as it already does for `@fewchurs/react`.
- `/docs/nextjs`, both package READMEs, the repo README and `examples/next-app` now import `@fewchurs/next/styles.css`. The example no longer depends on `@fewchurs/react` at all, which is what proves the pnpm case.

**Fix 5: `SDK_VERSION` is set by hand. ✅ Fixed.** It was written out twice — `packages/react/src/client/constants.ts` and `packages/next/src/constants.ts` (`"next/1.0.0"`) — and Changesets bumps neither. Both are now generated:
- `tools/stamp-version.mjs` writes each package's own version into a generated `version.ts`, as the first step of that package's `build`.
- `constants.ts` imports from it, so `SDK_HEADER` follows the published version by itself.
- A test in each package asserts the header matches its `package.json`, and CI's quality job runs `git diff --exit-code` on both generated files after `pnpm build`, so a bumped version that was not rebuilt fails the run.

Step 3 of the release flow below is therefore no longer a manual edit.

### P2: parity with the other SDKs — all fixed

| Feature | Laravel | Flutter | React |
|---|---|---|---|
| Top and New tabs only by default | ✅ | ✅ 1.2.0 | ✅ since `3551349` |
| Votes update instantly, roll back on failure | ✅ 1.4.0 | ✅ | ✅ |
| Error inside the board with "Try again" | ✅ 1.3.0 | ✅ | ✅ |
| Loading shimmer shaped like the board | ✅ 1.3.0 | — | ✅ |
| Floating button that slides the board in (sheet) | ✅ 1.2.0 | ✅ `showBoardSheet` | ✅ `FewchursBoardDialog`, now documented |
| Open one request by ID | — | ✅ `initialFeatureId` | ✅ `initialFeatureId` + `useFeature` |

All three gaps are closed:

- **Loading shimmer.** `packages/react/src/components/Skeleton.tsx` renders placeholder rows shaped like `FeatureCard` — a vote block and three bars — in place of the single "Loading…" line. The roadmap tab gets column-shaped placeholders. It is one `role="status"` with the `labels.loading` text for screen readers and the bars `aria-hidden`, and the sweep is dropped under `prefers-reduced-motion`.
- **Open one request by ID.** `<FewchursBoard initialFeatureId="…">` shows that request above the list, with its comments already open, and drops it from the list so it is not shown twice. It is fetched into the same store under a `feature:<id>` key, so voting, commenting and following it behave exactly as a row in a list; `@fewchurs/next` seeds it server-side alongside the first page. A missing or deleted id is ignored and the list still renders. `useFeature(featureId)` is the hook on its own.
- **The dialog.** `/docs/react` now has an "Open it in a dialog" section for `FewchursBoardDialog` and a "Link to one request" section, both in the table of contents; `/docs/nextjs` points at the latter from its props section.

Three tests cover the new behaviour (placeholder rows on first paint, the pinned request appearing once with its comments open, and a missing id falling back to the list). The bundle grew from 10.08 kB to 10.83 kB, against a 15 kB budget.

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

1. Describe the change (patch, minor or major): `pnpm changeset`. One is already written for the first release, in `.changeset/first-release.md`.
2. Apply the version bump and changelog: `pnpm changeset version`
3. `SDK_VERSION` needs no edit — `pnpm build` regenerates it from each `package.json` (Fix 5). Commit the regenerated `version.ts` files with the bump, or CI's drift check fails.
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

CI runs the same on React 18 and 19, plus the key-safety job (no `fr_live_` key in the repo or in `.next/static`) and the `SDK_VERSION` drift check (Fix 5).

### Against the live server

1. Copy a key from the dashboard into `examples/vite-spa/.env.local` as `VITE_FEWCHURS_KEY=…`, and into `examples/next-app/.env.local` as `FEWCHURS_API_KEY=…`. Both files are git-ignored.
2. Run each example and open it: `pnpm --filter ./examples/vite-spa dev`, then `pnpm --filter ./examples/next-app dev`.

### Manual checklist

- [ ] Top and New load; on a Free app only 5 requests show
- [ ] Placeholder rows show while the first page loads, and the board does not jump when it lands
- [ ] With `tabs={["top", "new", "roadmap"]}`, Roadmap loads without a 500
- [ ] With `initialFeatureId` set to a real id, that request shows on top with its comments open, and is not listed twice
- [ ] With `initialFeatureId` set to a deleted id, the list still shows
- [ ] `FewchursBoardDialog` opens from a button, closes on Escape and on a backdrop click, and returns focus to the button
- [ ] Vote: the count changes at once; reload, and it stays
- [ ] Vote with the network off: the vote rolls back and a message shows
- [ ] Submit a request, comment on it, follow it with an email
- [ ] Turn on "Hide vote counts" in the dashboard; counts disappear within 5 minutes
- [ ] Free plan shows "Powered by Fewchurs"; Starter or Pro hides it
- [ ] Next.js: `next build` passes, and no `fr_live_` string appears in `.next/static`
- [ ] Wrong key: the board shows "Feedback is unavailable right now." and the page keeps working
