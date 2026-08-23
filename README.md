# Fewchurs

A feature-request platform for indie iOS developers. Sign in with Google, create an app, get an
API key, embed it in your iOS app, and let your users submit and upvote feature requests. See
them in a dashboard, change their status, and get an email on each new request.

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind + shadcn/ui, Firebase Auth (Google) + Firestore,
firebase-admin for all server-side data access, Resend for email, zod for validation.

## Setup

### 1. Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → enable **Google**.
3. **Firestore Database** → create a database (production mode — the app never relies on
   client-side security rules, see [Firestore security rules](#firestore-security-rules) below).
4. **Project settings** → **General** → add a Web app → copy the `firebaseConfig` values into
   `NEXT_PUBLIC_FIREBASE_*` below.
5. **Project settings** → **Service accounts** → **Generate new private key** → downloads a JSON
   file. Copy `project_id`, `client_email`, and `private_key` into the `FIREBASE_*` vars below.

### 2. Resend

1. Create an account at [resend.com](https://resend.com) and copy an API key into
   `RESEND_API_KEY`.
2. Until you verify your own sending domain, Resend restricts the shared `onboarding@resend.dev`
   sender to only deliver to **the email address on your Resend account**. Set each app's
   notification email (in its Settings page) to that address to test email notifications, or
   verify a domain at [resend.com/domains](https://resend.com/domains) and point `EMAIL_FROM` at
   an address on that domain to send anywhere.

### 3. Stripe Payment Link (optional, for Pro upgrades)

No billing integration is built — the `/pricing` page's upgrade button just links to a
[Stripe Payment Link](https://dashboard.stripe.com/payment-links) you create by hand and paste
into `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`. When Stripe emails you about a payment, set that user's
`plan` field to `"pro"` in Firestore directly. Leave the env var empty to show a "not open yet"
placeholder instead of the button.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from the steps above:

```bash
cp .env.example .env.local
```

`FIREBASE_PRIVATE_KEY` contains literal `\n` sequences — paste it exactly as it appears in the
downloaded JSON file, wrapped in quotes; the app replaces `\n` with real newlines at runtime.

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firestore security rules

`firestore.rules` denies **all** client reads and writes:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

This is intentional. Every read and write in this app goes through a Next.js server route or
server component using `firebase-admin`, which bypasses security rules entirely and enforces
authorization in application code (checking `app.ownerUid` against the caller, or checking a
hashed API key). No client ever talks to Firestore directly, so there is nothing for permissive
rules to protect — and nothing for a misconfigured rule to accidentally expose. Deploy the rules
file with:

```bash
firebase deploy --only firestore:rules
```

## Public SDK API — `/api/v1`

Every request must include:

```
Authorization: Bearer fr_live_xxx
X-Device-Id: <a stable per-device UUID your app generates and persists>
```

The API key is public — it ships inside your app binary — and can only list features, create a
feature, and toggle a vote. It cannot read or modify anything else.

Error responses are always shaped:

```json
{ "error": { "code": "invalid_key", "message": "..." } }
```

| Code | HTTP status | Meaning |
|---|---|---|
| `invalid_key` | 401 | Missing/unknown/inactive API key |
| `missing_device_id` | 400 | `X-Device-Id` header missing |
| `validation_failed` | 400 | Request body failed validation |
| `rate_limited` | 429 | Device hit the 5-submissions-per-day cap |
| `not_found` | 404 | Feature doesn't exist |
| `internal` | 500 | Unexpected server error |

Replace `fr_live_xxx` and the device id below with real values (create an app in the dashboard to
get a key).

### List features

```bash
curl "http://localhost:3000/api/v1/features?sort=new&limit=20" \
  -H "Authorization: Bearer fr_live_xxx" \
  -H "X-Device-Id: 11111111-1111-1111-1111-111111111111"
```

`sort` is `top` (by upvotes) or `new` (by creation date, default). Paginate with
`&cursor=<last feature id from the previous page>`; `nextCursor` in the response is `null` on the
last page.

### Create a feature request

```bash
curl -X POST "http://localhost:3000/api/v1/features" \
  -H "Authorization: Bearer fr_live_xxx" \
  -H "X-Device-Id: 11111111-1111-1111-1111-111111111111" \
  -H "Content-Type: application/json" \
  -d '{"title":"Add dark mode","description":"Would love a dark theme."}'
```

`title` is required, 3–100 characters. `description` is optional, up to 1000 characters. Limited
to 5 submissions per device per day. If the app has email notifications enabled, this triggers a
fire-and-forget email to the app's notification address (submission never fails because of an
email error).

### Upvote a feature

```bash
curl -X POST "http://localhost:3000/api/v1/features/<featureId>/vote" \
  -H "Authorization: Bearer fr_live_xxx" \
  -H "X-Device-Id: 11111111-1111-1111-1111-111111111111"
```

Idempotent — voting twice from the same device does not double-count. Returns
`{ "upvoteCount": 13, "hasVoted": true }`.

### Remove an upvote

```bash
curl -X DELETE "http://localhost:3000/api/v1/features/<featureId>/vote" \
  -H "Authorization: Bearer fr_live_xxx" \
  -H "X-Device-Id: 11111111-1111-1111-1111-111111111111"
```

Returns `{ "upvoteCount": 12, "hasVoted": false }`.
