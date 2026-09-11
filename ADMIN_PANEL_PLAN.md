# Admin Panel — Plan

## Recommendation: in-app `/admin`, not a subdomain

Build this inside the existing Next.js app at `/admin`, gated by an admin allowlist — not a
separate `admin.fewchurs.com` deployment.

A subdomain buys isolation you don't need yet, at a real cost: a second deploy target, its own
DNS/TLS, and — the part that actually bites — Firebase session cookies are scoped to the domain
they're set on, so a subdomain either needs its own login flow or careful `Domain=.fewchurs.com`
cookie sharing wired up front. An in-app route reuses everything that already works today:
Firebase Auth, `getSessionUser()`/session cookies, `firebase-admin`, the design system, and
`firestore.rules` (already `allow read, write: if false` for clients — admin reads go through
`firebase-admin` exactly like every other route in this app, no rule changes needed).

If this ever grows into a multi-person ops team with its own release cadence, splitting it out
later is a mechanical move, not a rewrite — the API routes and admin-only logic below stay the
same either way.

## Access control

- Add an admin allowlist: simplest is an env var `ADMIN_UIDS` (comma-separated Firebase UIDs) —
  no schema change, no risk of a Firestore write accidentally granting admin. A `role` field on
  the user doc is the alternative if you want to grant admin access without a redeploy, at the
  cost of it being one Firestore write away from a privilege escalation bug.
- `src/lib/auth/requireAdmin.ts`: wraps `getSessionUser()` (pages) and
  `getUserFromAuthHeader()` (API routes), checks the uid against the allowlist, throws/redirects
  otherwise. Every `/admin` page and every `/api/admin/*` route calls this first — never trust a
  client-side flag.
- `/admin` layout renders nothing (redirects to `/dashboard`) for a signed-in non-admin, and to
  `/login` for signed-out — same pattern as `AuthGuard`, just with the extra allowlist check.

## Current data model (from the actual codebase, not guessed)

```
users/{uid}                        — email, displayName, photoURL, plan, createdAt,
                                      dodoCustomerId, subscriptionId, subscriptionStatus,
                                      billingPeriod, nextBillingDate,
                                      emailsSentMonth, emailsSentMonthCount
apps/{appId}                       — ownerUid, name, bundleId, slug, apiKeyPrefix,
                                      notificationEmail, emailOnNewRequest, featureCount, createdAt
  apps/{appId}/features/{id}       — title, description, status, upvoteCount, commentCount,
                                      followerCount, authorDeviceId, createdAt, updatedAt
    features/{id}/comments/{id}    — text, authorName, deviceId, isDeveloper, isDeleted, createdAt
    features/{id}/votes/{deviceId}       — createdAt
    features/{id}/followers/{deviceId}   — email, createdAt
  apps/{appId}/quotas/{deviceId}          — day, submitsToday
  apps/{appId}/commentQuotas/{deviceId}  — day, commentsToday
apiKeys/{sha256(key)}              — appId, ownerUid, active, createdAt
dodoWebhookEvents/{webhookId}      — type, receivedAt   (idempotency ledger, not user data)
unsubscribes/{sha256(email)}       — createdAt          (see note below)
```

**Note on `unsubscribes`:** the doc ID is a one-way hash of the email and no plaintext email is
stored, so there is no way to *list* who's unsubscribed today — only to check/clear one specific
address you already have. If you want a real "unsubscribed users" list in the admin panel, that
needs a small schema change (store the plaintext email alongside the hash, or key the doc by
email directly). Flagging this now since it changes Phase 4's scope — your call on whether it's
worth it.

## Per-entity plan

| Entity | List | View detail | Edit | Delete | Notes |
|---|---|---|---|---|---|
| Users | ✅ paginated, search by email | ✅ full profile + apps owned | ✅ plan override (free/starter/pro), subscription status | ⚠️ soft-disable only, no hard delete | Manual plan override matters — it's the fix for exactly the kind of "webhook never landed" issue you hit earlier this session |
| Apps | ✅ paginated, search by name/bundle/slug | ✅ owner, key prefix, feature count | ✅ name, notification email, emailOnNewRequest, slug | ✅ with a typed confirmation (cascades to features/comments/votes/followers/quotas) | Recursive delete needs a real batched-delete helper, not a naive `.delete()` |
| Features | ✅ per-app, paginated (reuse the cursor pattern already built) | ✅ | ✅ status, title, description | ✅ (moderation — spam/abuse) | |
| Comments | ✅ per-feature | ✅ | — | ✅ soft-delete already exists (`isDeleted`); admin gets a hard-delete too | |
| API Keys | ✅ per-app | ✅ prefix, active, createdAt | — | ✅ revoke (`active: false`) | Never show/reconstruct the real key — only the hash exists server-side, by design |
| Dodo webhook events | ✅ per-user (via their subscriptionId), read-only | ✅ raw event log | — | — | This is your audit trail for "why didn't the plan update" — direct payoff from the earlier billing-sync issue |
| Unsubscribes | ⚠️ see note above | — | — | ✅ remove one by email (re-subscribe for support) | Full list needs the schema change noted above |
| Votes / Followers | — | shown as counts on the feature detail view | — | — | Raw device-id lists aren't actionable; not worth a dedicated CRUD screen |

## Route structure

```
/admin                              — overview: user count, app count, MRR-ish plan breakdown
/admin/users                        — paginated table, search
/admin/users/[uid]                  — profile, owned apps, plan override, webhook event log
/admin/apps                         — paginated table, search
/admin/apps/[appId]                 — settings edit, feature list (reuses FeatureList-style paging)
/admin/apps/[appId]/features/[id]   — feature detail, comments, delete
/admin/api-keys                     — cross-app key list (active/revoked filter)
/admin/unsubscribes                 — lookup + remove by email

/api/admin/users                    — GET (list, paginated)
/api/admin/users/[uid]              — GET, PATCH (plan override)
/api/admin/apps                     — GET (list, paginated)
/api/admin/apps/[appId]             — GET, PATCH, DELETE (cascading)
/api/admin/apps/[appId]/features    — GET (paginated, reuse listFeaturesForOwner)
/api/admin/apps/[appId]/features/[id] — PATCH, DELETE
/api/admin/api-keys/[hash]          — PATCH (revoke)
/api/admin/unsubscribes             — GET (single lookup), DELETE
```

Every `/api/admin/*` route: `requireAdmin()` first, same `ok()`/`errorResponse()` helpers already
used everywhere else, same cursor-pagination pattern from the recent pagination work.

## Audit log

Admin actions that mutate data (plan override, app delete, feature delete, key revoke) write to a
new `adminAuditLog` collection: `{adminUid, action, targetType, targetId, before, after, at}`.
Cheap to add now, expensive to reconstruct later if something goes wrong and you need to know who
changed what.

## Suggested phases (same pause-between-phases rhythm as the rest of this build)

1. **Foundation** — `requireAdmin()`, `/admin` layout + guard, overview page, `ADMIN_UIDS` env var.
2. **Users** — list, detail, plan override, webhook event log (this is the one with the most
   immediate payoff given the billing-sync issue earlier).
3. **Apps + Features + Comments** — list, edit, moderation deletes, cascading app delete.
4. **API Keys + Unsubscribes + audit log** — the schema decision on `unsubscribes` gets made here.

## Open questions for you

1. Allowlist via env var (`ADMIN_UIDS`), or a `role` field on the user doc? (Recommendation: env
   var — simpler, no accidental-escalation risk.)
2. Is a hard app-delete actually needed, or is "disable" (e.g. clear the slug so the public board
   404s, keep the data) enough? Hard delete is the riskier feature to build correctly.
3. Worth the `unsubscribes` schema change to get a real list, or is "look up one email" enough?
