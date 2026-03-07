# Hosting and SPA routing (Amplify)

The app is a client-side SPA: all routes (e.g. `/Dashboard`, `/Upload`, `/auth/callback`) are handled by React Router after the same `index.html` loads. Direct navigation or refresh to any path (e.g. `https://app.blomso.com/Dashboard`) must return that HTML, not 404.

## Required: SPA rewrite

**Amplify Hosting** must serve `index.html` for every path so the SPA can mount and React Router can match the URL.

- **Rule**: 200 rewrite — source `/<*>`, target `/index.html`.
- **In repo**: `amplify-spa-rewrite.json` holds this rule. If your Amplify app does not pick it up automatically, in **Amplify Console → App → Hosting → Rewrites and redirects**, add:
  - Type: **Rewrite**
  - Source: `/<*>`
  - Target: `/index.html`
  - Type: **200 (Rewrite)**

After this is in place:
- Direct URLs like `/Dashboard`, `/Upload`, `/MyRecords` load the app and show the correct page.
- Auth callback lands at `/auth/callback`; the app parses the token and redirects to the default (or sanitized `returnTo`) path, which is then served by the same `index.html`.

## Path convention

App routes use **PascalCase** paths (e.g. `/Dashboard`, `/Upload`, `/FieldVisualization`). All in-app links use `createPageUrl('PageName')` from `@/utils` so paths stay consistent. The auth callback default return path is `AUTH_RETURN_DEFAULT` from `@/utils` (`/Dashboard`).

## Manual step (if needed)

If deploying without automatic use of `amplify-spa-rewrite.json`, configure the single rewrite above in Amplify Console once per app. See `amplify.yml` for build artifact location (`dist`, Vite output).
