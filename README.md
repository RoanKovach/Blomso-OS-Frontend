# Blomso OS

Vite + React application. Configure your API URL and Mapbox token to run and deploy.

## Environment variables

Copy `.env.example` to `.env.local` and set:

- **VITE_API_URL** – Backend API base URL (e.g. `https://your-api.execute-api.region.amazonaws.com/prod`). Leave empty until your AWS backend is deployed; the app will show unauthenticated state and empty data.
- **VITE_MAPBOX_TOKEN** – Mapbox access token for the Field Visualization map. Get one at [Mapbox](https://account.mapbox.com/).

Do not commit `.env.local` or any file containing secrets.

### Auth (testing)

Protected backend calls use `Authorization: Bearer <IdToken>`. The token is read from `localStorage` / `sessionStorage` under the key `blomso_auth_token`. When `VITE_API_URL` is set, the Upload page shows a temporary “Set token” control: paste a Cognito IdToken (JWT) and click **Set token** to run the upload flow against the real backend. Production should use Cognito Hosted UI (or another login) to set this token after sign-in.

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

Output is in `dist/`. Deploy `dist/` to S3 + CloudFront or use Amplify Hosting. Set `VITE_API_URL` and `VITE_MAPBOX_TOKEN` in your build environment so they are baked into the build.

### AWS Amplify SPA routing

Direct URLs (e.g. `/upload`, `/my-records`) must serve `index.html` so the React router can handle them. In the Amplify Console: **Hosting** > **Rewrites and redirects** > **Manage redirects**. Add a rewrite with source `/<*>`, target `/index.html`, type **200 (Rewrite)**. You can copy the rule from `amplify-spa-rewrite.json` in this repo.

### Post-deploy validation

After deploying, verify:

1. **Routing** – Open `/upload` and `/my-records` directly (hard refresh). Both should load the app, not 404.
2. **Guest mode** – With no auth token, open the app and navigate. Console should not show repeated "User not authenticated" stack traces.
3. **Runtime** – No `TypeError: j is not a function` (or similar) in the console when moving between Dashboard, Upload, and My Records.

## Lint

```bash
npm run lint
```
