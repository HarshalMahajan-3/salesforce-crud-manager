# Salesforce CRUD Manager

Manage your Salesforce data from one simple interface. Sign in with real Salesforce OAuth 2.0
and perform full CRUD on five standard objects — Account, Opportunity, Lead, Contact and Case —
without opening the native Salesforce UI.

No mock data is used anywhere: every read and write hits the Salesforce REST API of the
authenticated user's org.

## Features

- Salesforce OAuth 2.0 Authorization Code flow via an External Client App (Connected App)
- Token exchange, refresh-token handling and identity lookup entirely server-side
- Signed, HttpOnly session cookie — the browser never sees a token, secret or refresh token
- Object selector for Account, Opportunity, Lead, Contact and Case
- 5–7 configured fields per object from one central configuration file
- Read via SOQL, 20 records per page, infinite scroll using Salesforce `nextRecordsUrl`
- Create, view, update and delete records with modals and toasts
- Delete confirmation dialog, no accidental deletions
- Search/filter across the searchable fields of the selected object
- Object whitelist, record-ID validation and payload sanitising on the server
- Skeleton loaders, loading indicators, disabled submit buttons, empty / error / end-of-results states
- Human-readable error messages; no stack traces or secrets reach the browser
- Responsive from mobile to desktop (table on larger screens, card list on phones)

## Tech Stack

**Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Router, Lucide icons, Sonner toasts
**Backend:** TypeScript server routes running on the TanStack Start server runtime (the same
Node/serverless-style request handlers an Express app would expose — see "Architecture")
**Salesforce:** OAuth 2.0, External Client App, REST API v62.0, SOQL

> Note on the backend: this project runs on TanStack Start's integrated server runtime instead of a
> separate Express process. The responsibilities are identical to the Express backend in the brief —
> HTTP routes, auth middleware, session handling, Salesforce token exchange and REST calls — and all
> of it executes server-side only. Every file under `src/routes/api/**` is a backend HTTP endpoint;
> `*.server.ts` files never enter the browser bundle.

## Architecture

```text
React frontend (src/routes, src/components)
        |
        v
Server API routes (src/routes/api/public/**)
        |
        v
Salesforce OAuth 2.0 (authorization code + refresh)
        |
        v
Salesforce REST API / SOQL (instance_url from OAuth)
        |
        v
Salesforce Developer Org
```

Security boundaries:

- `SALESFORCE_CLIENT_ID` and `SALESFORCE_CLIENT_SECRET` are read only inside server handlers.
- The authorization code is exchanged for tokens on the server.
- Tokens live in a signed, HttpOnly, SameSite=Lax cookie (`Secure` in production).
- The frontend can only call the whitelisted endpoints below; arbitrary SOQL and arbitrary object
  names are rejected.

## Salesforce Setup

1. **Create a Developer Org** — sign up at <https://developer.salesforce.com/signup> (free).
2. **Create an External Client App** — Setup → App Manager → *New External Client App*
   (on older orgs: Setup → App Manager → *New Connected App*).
3. **Enable OAuth** — under API (Enable OAuth Settings), tick *Enable OAuth Settings*.
4. **Callback URL** — add exactly:
   - Local: `http://localhost:5173/api/public/auth/salesforce/callback`
   - Production: `https://<your-app-domain>/api/public/auth/salesforce/callback`
5. **OAuth scopes** — add:
   - `Manage user data via APIs (api)`
   - `Perform requests at any time (refresh_token, offline_access)`
   - `Access the identity URL service (id, profile, email)`
   Leave *Require Proof Key for Code Exchange (PKCE)* **on**, and make sure
   *Require Secret for Web Server Flow* is **on**.
6. **Copy the Consumer Key and Consumer Secret** (App Manager → your app → Manage Consumer Details).
7. **Add them to your environment** as `SALESFORCE_CLIENT_ID` and `SALESFORCE_CLIENT_SECRET`.

Salesforce can take a few minutes to activate a new app. Never put these values in the repository.

## Environment Variables

See `.env.example`:

```env
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_REDIRECT_URI=
SESSION_SECRET=
FRONTEND_URL=
PORT=
```

- `SALESFORCE_LOGIN_URL` — `https://test.salesforce.com` for sandboxes.
- `SALESFORCE_REDIRECT_URI` — optional locally (it defaults to the current origin +
  `/api/public/auth/salesforce/callback`), required in production so it always matches Salesforce.
- `SESSION_SECRET` — random 32+ character string; rotating it invalidates all sessions.
- `FRONTEND_URL` — where users are sent after login.

## Local Development

```bash
npm install        # or bun install
cp .env.example .env
# fill in .env
npm run dev
```

The app (frontend and API routes) is served together on <http://localhost:5173>. Because the API is
same-origin, no CORS configuration or second port is needed; when hosting the API on a different
origin, allow only `FRONTEND_URL` and send credentials.

## OAuth Redirect URL

Configure this exact URL as the callback in the Salesforce External Client App:

```text
<APP ORIGIN>/api/public/auth/salesforce/callback
```

Example local value: `http://localhost:5173/api/public/auth/salesforce/callback`.
Add both the local and production URLs (one per line) so you can develop and deploy with one app.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/public/auth/salesforce` | Redirects to the Salesforce authorize URL (with CSRF `state`) |
| GET | `/api/public/auth/salesforce/callback` | Exchanges the code for tokens, creates the session, redirects to `/dashboard` |
| GET | `/api/public/auth/me` | Returns the authenticated user and org host (never tokens) |
| POST | `/api/public/auth/logout` | Clears the session cookie |
| GET | `/api/public/salesforce/:object` | SOQL read, 20 records; `?search=` and `?next=` cursor |
| POST | `/api/public/salesforce/:object` | Creates a record |
| PATCH | `/api/public/salesforce/:object/:id` | Updates a record |
| DELETE | `/api/public/salesforce/:object/:id` | Deletes a record |

All `/api/public/salesforce/*` routes require a valid session (`requireSession`) and return
`401` otherwise. `:object` must be one of `Account`, `Opportunity`, `Lead`, `Contact`, `Case`
(anything else → `400`), and `:id` must match the Salesforce 15/18-character ID format.

## CRUD Implementation

All five objects share one code path. `src/lib/salesforce/objects.ts` declares each object's fields
(label, type, table visibility, editability, picklist options, badge rendering), so the table
columns, view modal, create form and edit form are generated from configuration — there are no
per-object pages.

- **Read** — `GET /api/public/salesforce/:object` builds
  `SELECT <configured fields> FROM <Object> [WHERE ...] ORDER BY CreatedDate DESC LIMIT 20`
  and calls `/services/data/v62.0/query`.
- **Create** — `POST /services/data/v62.0/sobjects/<Object>` with a payload narrowed to the
  configured editable fields.
- **Update** — `PATCH /services/data/v62.0/sobjects/<Object>/<Id>`; the table row updates in place.
- **Delete** — `DELETE /services/data/v62.0/sobjects/<Object>/<Id>` after confirmation; the row is
  removed from the loaded list without a page reload.

Salesforce validation errors are surfaced verbatim in the toast (e.g. required-field messages),
while unexpected failures fall back to a generic message and are logged server-side only.

## Pagination

- The first page requests `LIMIT 20` via SOQL; Salesforce returns `records`, `totalSize`, `done`
  and `nextRecordsUrl`.
- The server passes `nextRecordsUrl` to the client as an opaque `nextUrl`.
- An `IntersectionObserver` sentinel below the table triggers the next page when it becomes visible.
- The client sends `?next=<cursor>`; the server validates it against
  `/services/data/vXX.X/query/<locator>` before following it, so no arbitrary URL can be fetched.
- Duplicate requests are blocked with an in-flight guard, already-loaded records are preserved and
  de-duplicated by Id, and the list ends with "You've reached the end."

## Deployment

1. Deploy the project (frontend + API routes deploy together).
2. Set `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`, `SALESFORCE_LOGIN_URL`,
   `SALESFORCE_REDIRECT_URI`, `SESSION_SECRET` and `FRONTEND_URL` in the hosting environment.
   No localhost URL is hardcoded anywhere in production logic.
3. Add the production callback URL to the Salesforce External Client App.
4. If you split the API onto a separate host (e.g. Render) and the frontend onto Vercel, set
   `FRONTEND_URL` to the Vercel domain, allow that origin in CORS, and keep the callback URL
   pointing at the API host.

## Git Hygiene

`.gitignore` excludes `.env`, `node_modules`, `dist` and `build`. Only `.env.example` is committed.
