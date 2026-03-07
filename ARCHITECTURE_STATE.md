# Architecture state

**What the system is**: Blomso OS frontend (Vite + React) and backend (AWS CDK: API Gateway HTTP API, Cognito User Pool, S3, DynamoDB). Auth via Cognito Hosted UI / Managed Login. Upload spine: init → presigned S3 PUT → complete.

**Major flows**:
- **Auth**: Sign in → redirect to Cognito (login URL from `VITE_COGNITO_DOMAIN` + `/login` with client_id, response_type=token, scope=openid email, redirect_uri=app + `/auth/callback`). User signs in at Cognito; callback returns to app with `id_token` in URL fragment. Callback parses fragment, calls `setAuthToken(id_token)`, then full-page redirect to app. `User.me()` calls `GET /me` with Bearer token; backend returns identity from JWT claims.
- **Logout**: Clear token from storage, redirect to Cognito `/logout` with logout_uri = app base.
- **Upload**: Authenticated user calls `POST /functions/upload/init` (filename, contentType) → backend returns presigned PUT URL and key; client PUTs file to S3; then `POST /functions/upload/complete` (uploadId, key, filename, contentType) → backend writes placeholder record to DynamoDB keyed by user `sub`.
- **Demo vs full mode**: Guest (not signed in) = demo mode (sessionStorage, no backend persistence for records). Signed in = full mode.

**Deployed domains** (from out-of-band / production):
- Production app: `https://app.blomso.com`
- API: from Amplify env (e.g. `https://…execute-api.us-east-2.amazonaws.com`)
- Cognito: `https://blomso-auth.auth.us-east-2.amazoncognito.com` (Managed login; branding customized in console)

**Environment variables** (frontend): `VITE_APP_URL`, `VITE_API_URL`, `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID`, `VITE_MAPBOX_TOKEN`. See README and `.env.example`.

**Key dependencies**:
- Frontend: `User.me()` → `apiGet('/me')`; auth in `src/api/auth.js` and `src/api/client.js` (token from localStorage/sessionStorage, sent as `Authorization: Bearer <token>`).
- Backend (from repo): `GET /me` returns `{ ok, sub, username, email, authProvider: 'cognito' }` from JWT claims. No `full_name` in current response.

**Constraints / invariants**:
- Callback path must match Cognito app client callback URLs (`/auth/callback`).
- Token is returned in fragment (implicit flow).
- Current `/me` does not return `full_name`; with email sign-in, Cognito `username` may be the raw `sub` (UUID).

**Known manual AWS changes**: Custom domain (app.blomso.com), CORS on API Gateway, Cognito Managed login and branding, callback/sign-out URL list. See OPS_CHANGELOG.md.

**Drift warnings**: CORS and Cognito app client URLs are maintained in AWS console; CDK/frontend config may not include all production URLs. Document sync items in NEXT_ACTIONS.md.
