# Fewchurs React / Next.js Package — Plan

npm packages that drop a Fewchurs feature-request board into any React app: `@fewchurs/react` for React (Vite, CRA, Remix, any SPA) and `@fewchurs/next` for Next.js, where the API key stays on the server.

Based on the live `/api/v1` endpoints (`src/app/api/v1/**`) and the Next.js snippet on the landing page (`src/lib/platforms.ts`). Companion to the Swift, Kotlin, Flutter and Laravel plans.

---

## 1. The decision that shapes everything: where does the key live?

Two deployment shapes, two security models.

### 1.1 Next.js (or any React app with a server) — key stays secret
The board renders on the server; browser interactions go through the app's own route handler, which adds the key.

```
Browser → /api/fewchurs/* (app's route handler) → api/v1
```
No key in the bundle. No CORS needed. This is the recommended path and the default for `@fewchurs/next`.

### 1.2 Client-only SPA (Vite, CRA, static hosting) — key is public
No server exists, so the browser calls `api/v1` directly with the key in the bundle. This is the same model as the mobile SDKs: the key is publishable, protection is server-side rate limiting.

**This mode requires CORS on the server, which does not exist today (§8.6).** Until that ships, `@fewchurs/react` works only behind a proxy.

### 1.3 A problem with the promised API
The landing page shows:
```tsx
import { FewchursBoard } from "@fewchurs/next";
<FewchursBoard apiKey="fr_live_xxx" />
```
That is safe only while `FewchursBoard` is a **server component**. The moment someone uses it inside a `"use client"` file, the key is serialized into the client bundle — silently.

Resolution: `@fewchurs/next` exports a server-only `<FewchursBoard>` that reads `process.env.FEWCHURS_API_KEY` by default, and throws a clear build-time error if an `apiKey` prop reaches a client boundary. Interactive parts are separate client components that never receive the key.

---

## 2. Developer experience

### 2.1 Next.js (App Router)
```bash
pnpm add @fewchurs/next
```
```dotenv
FEWCHURS_API_KEY=fr_live_xxx
```
```ts
// app/api/fewchurs/[...route]/route.ts
export { GET, POST, DELETE } from "@fewchurs/next/handler";
```
```tsx
// app/feedback/page.tsx
import { FewchursBoard } from "@fewchurs/next";
import "@fewchurs/react/styles.css";

export default function Page() {
  return <FewchursBoard />;
}
```
The board renders on the server with real data; voting, commenting and submitting post to the route handler.

### 2.2 React SPA
```bash
pnpm add @fewchurs/react
```
```tsx
import { FewchursProvider, FewchursBoard } from "@fewchurs/react";
import "@fewchurs/react/styles.css";

export function App() {
  return (
    <FewchursProvider apiKey={import.meta.env.VITE_FEWCHURS_KEY}>
      <FewchursBoard />
    </FewchursProvider>
  );
}
```
Or point it at a proxy instead of exposing the key:
```tsx
<FewchursProvider baseUrl="/api/fewchurs">
```

### 2.3 Hooks
```tsx
const { features, isLoading, error, loadMore, hasMore } = useFeatures({ sort: "top" });
const { vote, unvote, isPending } = useVote(featureId);
const { comments, loadMore } = useComments(featureId);
const { submit, isPending } = useSubmitFeature();
const { showBranding } = useFewchursConfig();
```

---

## 3. Packages

| Package | Contents | Environment |
|---|---|---|
| `@fewchurs/react` | Client: fetch client, store, hooks, components, styles | Browser (any React 18+) |
| `@fewchurs/next` | Server component board, route handler, server actions, cookie identity | Next.js 14+ App Router |

`@fewchurs/next` depends on `@fewchurs/react`. Installing only `@fewchurs/react` is valid; installing only `@fewchurs/next` pulls both.

### 3.1 Layout
```
packages/
├─ react/src/
│  ├─ client/          fetch client, error mapping, endpoints
│  ├─ store/           cache + optimistic updates (useSyncExternalStore)
│  ├─ hooks/           useFeatures, useComments, useVote, useSubmitFeature, useFollow
│  ├─ components/      Board, FeatureList, FeatureCard, VoteButton, CommentList, SubmitForm
│  ├─ context/         FewchursProvider
│  ├─ identity/        device id (cookie-first, SSR safe)
│  ├─ types/
│  └─ styles.css
└─ next/src/
   ├─ board.tsx        server component
   ├─ handler.ts       route handler factory (GET/POST/DELETE)
   ├─ actions.ts       server actions
   └─ identity.ts      httpOnly cookie via next/headers
examples/
├─ next-app/
├─ vite-spa/
└─ remix/
```

---

## 4. Technical choices

| Concern | Choice |
|---|---|
| Runtime deps | None. React is a peer dependency (`>=18`). |
| Language | TypeScript, strict. Public types exported. |
| Build | `tsup` → ESM + CJS + `.d.ts`, `"use client"` banners preserved, `sideEffects: false`. |
| Data layer | Internal store on `useSyncExternalStore`. No React Query or SWR dependency; both work alongside it via the exported client. |
| Styling | Prebuilt CSS with custom properties, scoped under `.fw-*`. No Tailwind requirement, no CSS-in-JS runtime. `unstyled` mode for headless use. |
| State sharing | One store per provider; deduped in-flight requests; cache keyed by `sort`. |
| SSR | No `localStorage` reads during render. Device id comes from a cookie so server and client agree. |
| Bundle budget | `@fewchurs/react` ≤ 15 kB gzipped including styles. Enforced by `size-limit` in CI. |
| Node | 20+ for the Next handler. Edge runtime supported (fetch only, no Node APIs). |

### 4.1 Code standards
- Small modules, one responsibility each; named exports only.
- Comments explain *why*, never *what*. No section banners, no commented-out code, no JSDoc restating the signature.
- Explicit return types on everything public; no `any`; no non-null assertions.
- No abstraction until there are three call sites.
- ESLint + Prettier + `publint` + `@arethetypeswrong/cli` in CI.

---

## 5. API contract

Base `https://fewchurs.com/api/v1`, or the app's proxy path.

**Headers:** `Authorization: Bearer fr_live_…` (server side, or client in SPA mode), `X-Device-Id`, `X-Fewchurs-Sdk: react/1.0.0`, `Accept-Language`.

| Method + path | Body / query | Response |
|---|---|---|
| `GET /config` | — | `{ showBranding }` |
| `GET /features` | `sort=top\|new`, `limit` 1–100 (default 20), `cursor` | `{ features, nextCursor }` |
| `POST /features` | `{ title, description?, email?, isSubscriber? }` | `201` Feature |
| `POST` / `DELETE /features/{id}/vote` | — | `{ upvoteCount, hasVoted }` |
| `POST /features/{id}/follow` | `{ email }` required | `{ following: true }` |
| `DELETE /features/{id}/follow` | — | `{ following: false }` |
| `GET /features/{id}/comments` | `limit`, `cursor` | `{ comments, nextCursor }` |
| `POST /comments` | `{ featureId, text, authorName? }` | `201` Comment |

Two traps, both already hit by other SDKs:
- Creating a comment is `POST /comments` with `featureId` in the body. `POST /features/{id}/comments` returns 405.
- The server filters deleted comments **after** paging, so a page can be short or empty while `nextCursor` is set. Page on the cursor, never on page length.

**Validation** (mirror exactly, one shared constants module): title 3–100, description ≤1000, comment 1–1000, authorName ≤60, valid email required to follow.

**Limits:** 15 submissions and 10 comments per device per day.

**Errors** → typed union, never thrown from hooks:
```ts
type FewchursError =
  | { code: "invalid_key"; status: 401 }
  | { code: "validation_failed"; status: 400; message: string }
  | { code: "rate_limited"; status: 429 }
  | { code: "not_found"; status: 404 }
  | { code: "limit_reached"; status: 402 }
  | { code: "server"; status: number }
  | { code: "network" };
```
`limit_reached` is swallowed in the UI — submissions are no longer capped server-side. `invalid_key` logs a clear developer message in development.

`FeatureStatus` includes `"unknown"` so a new server status renders without breaking the list.

---

## 6. Identity

`X-Device-Id` identifies anonymous voters.

- **Next.js:** `httpOnly` cookie set by the route handler on first request. Server and client agree, no hydration mismatch.
- **SPA:** cookie when same-origin, `localStorage` fallback, generated on first use.
- **Signed-in users:** hash the user id so votes follow the account.
  ```tsx
  <FewchursProvider deviceId={hashedUserId}>
  ```
  ```ts
  // next.config-level default
  export const { GET, POST, DELETE } = createHandler({
    deviceId: async () => hash((await auth()).userId),
  });
  ```
Docs: always hash; never send an email or raw id.

---

## 7. Components and customization

### Level 1 — defaults
`<FewchursBoard />` renders tabs, list, voting, detail, comments, submit form, and the branding badge when `showBranding` is true. Light/dark follows `prefers-color-scheme`.

### Level 2 — CSS variables
```css
.fewchurs {
  --fw-primary: #ed5f18;
  --fw-radius: 12px;
  --fw-font: var(--font-sans);
  --fw-surface: #fff;
}
```
Or `<FewchursBoard theme={{ primary: "#0f766e", radius: 4 }} />`.

### Level 3 — props
```tsx
<FewchursBoard
  tabs={["top", "new", "roadmap"]}
  defaultTab="top"
  showDeclined={false}
  allowComments
  emailField="optional"
  pageSize={20}
  labels={{ title: "Ideas", submit: "Suggest an idea" }}
/>
```

### Level 4 — slots
```tsx
<FewchursBoard
  renderHeader={() => <MyHeader />}
  renderEmpty={() => <MyEmpty />}
  renderFeature={(feature, actions) => (
    <MyRow feature={feature} onVote={actions.toggleVote} />
  )}
/>
```

### Level 5 — headless
Compose the primitives, or use hooks with your own markup:
```tsx
<FewchursBoard.Root>
  <FewchursBoard.Tabs />
  <FewchursBoard.List />
  <FewchursBoard.SubmitTrigger />
</FewchursBoard.Root>
```
`unstyled` drops all classes and keeps behavior, ARIA and keyboard handling.

### Other
- `onEvent` callback for analytics: `boardOpened`, `featureSubmitted`, `voted`, `commented`, `followed`, `error`.
- `<FewchursBoardDialog>` for modal usage.
- `isSubscriber` and `userEmail` props prefill submissions.
- `baseUrl` for proxy or staging.

---

## 8. Server work needed (this repo)

1. **`/v1/features` ignores `hideVoteCounts`** — the SDK path shows counts the owner hid; the web board hides them.
2. **No status filter → no Roadmap tab.** Add `?status=planned,in_progress,done` with the matching Firestore indexes.
3. **Extend `/v1/config`** to `{ showBranding, hideVoteCounts, appName }`.
4. **Device ids leak.** Comments return every commenter's `deviceId`, features return `authorDeviceId`. Return `isMine` instead. On the web these land in page HTML.
5. **Add `GET /v1/features/{id}`** for per-request pages, deep links and SEO.
6. **CORS** — required for SPA mode. Handle `OPTIONS`, allow `Authorization`, `Content-Type`, `X-Device-Id`, `X-Fewchurs-Sdk`, `Accept-Language`; methods `GET, POST, DELETE`. Auth is a bearer header, not cookies, so keep `Access-Control-Allow-Credentials` off.
7. **Docs:** add `/docs/react` and `/docs/nextjs`, and update `src/lib/platforms.ts` — both entries say "coming soon".

---

## 9. Testing

| Layer | Tooling | Covers |
|---|---|---|
| Client | Vitest + MSW | Endpoints, headers, error mapping, retries, short comment pages, unknown status |
| Hooks | Testing Library | Paging, optimistic vote + rollback, dedupe, unmount safety |
| Components | Testing Library + jest-axe | Keyboard flow, ARIA, empty/error states, escaping |
| Next | Playwright on `examples/next-app` | RSC render, route handler, cookie identity, server actions |
| Key safety | Build assertion | `fr_live_` must never appear in a client bundle |
| Packaging | `publint`, `are-the-types-wrong`, `size-limit` | ESM/CJS exports, types, bundle budget |

---

## 10. Milestones

| # | Milestone | Done when |
|---|---|---|
| M0 | Server prep (§8.1–8.6) | Deployed; a Vite SPA can call the API |
| M1 | `@fewchurs/react` core: client, store, hooks | Vitest + MSW green |
| M2 | Components + styles | Board works end to end in the Vite example |
| M3 | `@fewchurs/next`: server board, route handler, cookie identity, server actions | Next example works with no key in the bundle |
| M4 | Customization levels 2–5, unstyled mode, events | Examples cover every level using public API |
| M5 | Hardening: a11y, size budget, packaging checks, SSR/hydration | CI gates green on React 18 and 19 |
| M6 | Release 1.0 via Changesets | `pnpm add @fewchurs/next` works from scratch |

**1.1:** Roadmap tab, per-feature pages with metadata, Remix/TanStack Start adapters, i18n bundles, React Query adapter.

---

## 11. Decisions to confirm

1. Package names — `@fewchurs/react` + `@fewchurs/next`, and is the npm org free?
2. React 18 floor, or 19 only?
3. Ship CSS as a separate import (`styles.css`) or inject at runtime? Separate is cleaner for RSC and CSP; requires one extra import line.
4. Pages Router support, or App Router only in 1.0?
5. SPA mode at 1.0 — depends on CORS (§8.6). Ship Next-only first if it slips?
6. Anonymous voting by default, matching the public web board?

---

## 12. Definition of done

- `pnpm add @fewchurs/next` + one env var + one component renders a working board, with no key in the client bundle.
- SPA mode works once CORS ships, with the key treated as publishable and documented as such.
- No hydration warnings; works with React 18 and 19, ESM and CJS.
- Validation, errors, branding and limits match the other four SDKs.
- `/docs/react` and `/docs/nextjs` live; both marked live on the landing page.
