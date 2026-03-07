# Ops changelog

Manual or out-of-band changes that affect production. Use this to keep repo memory in sync with deployed reality.

---

## 2025-03 — Amplify, Cognito, API Gateway (production setup)

**System area**: Amplify Hosting, Cognito User Pool, API Gateway HTTP API.

**Exact values**:
- **Amplify**: Custom domain `app.blomso.com`; app URL `https://app.blomso.com`. Environment variables set in Amplify console: `VITE_APP_URL`, `VITE_API_URL`, `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID`, `VITE_MAPBOX_TOKEN`.
- **Cognito**: Domain `https://blomso-auth.auth.us-east-2.amazoncognito.com`. **Managed login** (not classic Hosted UI); branding customized in console. App client callback URLs: `https://app.blomso.com/auth/callback`, Amplify main branch URL, `http://localhost:5173/auth/callback`. Sign-out URLs: same origins (app base, Amplify, localhost).
- **API Gateway**: CORS updated in console to allow origins: `https://app.blomso.com`, Amplify main URL, `http://localhost:5173`. Headers: `Authorization`, `Content-Type`. Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.

**Why it matters**: Production app and CORS work; auth and branding match current UX.

**Mirror to IaC/code?**: Yes — add `https://app.blomso.com/auth/callback` (and production sign-out origin) to backend CDK User Pool Client callback/logout URLs (e.g. via context or config) so future CDK deploys do not overwrite. Ensure API Gateway CORS in repo (CDK/OpenAPI) matches console or document manual step after deploy. See NEXT_ACTIONS.md.
