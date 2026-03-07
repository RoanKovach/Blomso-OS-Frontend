# Ops changelog

Manual or out-of-band changes that affect production. Use this to keep repo memory in sync with deployed reality.

---

## 2025-03 — Checker: F2/F1 contract alignment (frontend save endpoint)

**System area**: Frontend (Blomso-OS-Frontend) and world-model docs.

**Change**: Frontend was calling `POST /records/{uploadId}/save` (non-existent). Backend only exposes `POST /records/normalized` (one record per request). Updated `src/api/records.js`: `saveNormalizedRecords(uploadId, tests)` now calls `POST /records/normalized` once per test with body `{ sourceUploadId, zone_name, test_date, soil_data, field_name, field_id, crop_type, soil_type }`. ARCHITECTURE_STATE.md, OPS_CHANGELOG (F2 entry), NEXT_ACTIONS.md, and TASK_BOARD.md updated to describe the actual contract.

**Why it matters**: Review → save flow now works against the deployed backend; no backend change required.

---

## 2025-03 — Task E1: Backend-path review UI for extraction results

**System area**: Frontend (Upload page, My Records, extraction API, hooks).

**Change**: (1) **Contracts**: `src/lib/extractionContract.js` documents C1/D1 — extraction artifact shape (`soil_tests` with zone_name, test_date, lab_info, soil_data) and normalized save payload shape. (2) **Extraction API**: `src/api/extraction.js` — `getExtraction(uploadId)` stub returns mock candidates until backend implements `GET /records/{id}/extraction`; frontend tries real GET first, falls back to stub. (3) **Hook**: `useUploadAndParse` exposes `loadExtractionForReview(uploadId, contextData, filename)` to map extraction to review candidates (field_name, tempId) and set `extractedTests`. (4) **Upload page**: After backend upload complete, "Continue to Review" calls `loadExtractionForReview` and goes to step 4 (MultiTestReview). Opening from My Records with `state: { backendReviewUploadId, backendReviewFilename }` loads extraction and shows step 4; loading and empty states shown. Finalize uses existing `saveNormalizedRecords(uploadId, shapedTests)` → `POST /records/{uploadId}/save`. (5) **My Records**: Backend upload records table has "Review" action; navigates to Upload with backendReviewUploadId state.

**Why it matters**: Authenticated users can open extraction output (stub or real) and review/edit it; review flow is tied to backend upload path, not sessionStorage/demo. No fake /soil-tests; reuse MultiTestReview and soilTestValidation.

**Follow-up**: Replace `getExtraction` stub with real `GET /records/{id}/extraction` when backend exposes it.

---

## 2025-03 — Task H1: Auth callback and SPA route resilience

**System area**: Frontend routing, auth callback, hosting docs.

**Change**: (1) **createPageUrl** (`src/utils/index.ts`) now returns PascalCase paths matching React Router (e.g. `/Dashboard`, `/Upload`), so in-app links and direct navigation align; added `AUTH_RETURN_DEFAULT` for the post-login redirect path. (2) **AuthCallback** (`src/pages/AuthCallback.jsx`) uses `AUTH_RETURN_DEFAULT` and **sanitizes** `returnTo` query param (allows only same-origin relative paths; rejects `//`, `\`, and absolute URLs) to avoid open redirect. (3) **Hosting**: Added `docs/HOSTING.md` describing SPA rewrite requirement (200 rewrite `/<*>` → `/index.html`); `amplify-spa-rewrite.json` holds the rule; `amplify.yml` comment updated. (4) **ARCHITECTURE_STATE.md**: Documented SPA routing constraint and path convention.

**Why it matters**: Auth return path is robust; direct routes like `/Dashboard` work when hosting serves `index.html` for all paths; direct-route behavior is documented.

**Manual hosting step**: If Amplify does not apply `amplify-spa-rewrite.json` automatically, add in Console → Hosting → Rewrites and redirects: Rewrite `/<*>` → `/index.html` (200). See docs/HOSTING.md.

---

## 2025-03 — Amplify, Cognito, API Gateway (production setup)

**System area**: Amplify Hosting, Cognito User Pool, API Gateway HTTP API.

**Exact values**:
- **Amplify**: Custom domain `app.blomso.com`; app URL `https://app.blomso.com`. Environment variables set in Amplify console: `VITE_APP_URL`, `VITE_API_URL`, `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID`, `VITE_MAPBOX_TOKEN`.
- **Cognito**: Domain `https://blomso-auth.auth.us-east-2.amazoncognito.com`. **Managed login** (not classic Hosted UI); branding customized in console. App client callback URLs: `https://app.blomso.com/auth/callback`, Amplify main branch URL, `http://localhost:5173/auth/callback`. Sign-out URLs: same origins (app base, Amplify, localhost).
- **API Gateway**: CORS updated in console to allow origins: `https://app.blomso.com`, Amplify main URL, `http://localhost:5173`. Headers: `Authorization`, `Content-Type`. Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.

**Why it matters**: Production app and CORS work; auth and branding match current UX.

**Mirror to IaC/code?**: Yes — add `https://app.blomso.com/auth/callback` (and production sign-out origin) to backend CDK User Pool Client callback/logout URLs (e.g. via context or config) so future CDK deploys do not overwrite. Ensure API Gateway CORS in repo (CDK/OpenAPI) matches console or document manual step after deploy. See NEXT_ACTIONS.md.

---

## 2025-03 — Cognito self-service sign-up (out-of-band then codified)

**System area**: Cognito User Pool.

**Change**: Self-service sign-up was enabled in the User Pool (console). Managed Login now shows the Create account flow. Backend CDK was updated so future deploys do not revert to admin-only: in `BlomsoOsBackendStack`, the User Pool now sets `selfSignUpEnabled: true` (CDK default is effectively admin-only).

**Why it matters**: Users can create accounts from the login page; redeploys no longer overwrite this setting.

**Mirror to IaC/code?**: Done — `lib/blomso-os-backend-stack.ts` includes `selfSignUpEnabled: true` on the User Pool.

---

## 2025-03 — Upload / extraction / normalized record contracts (C1)

**System area**: Backend docs and schema; world model.

**Change**: Added contract and schema so extraction/review/persistence agents build against one agreed model. Backend repo: `docs/RECORD_CONTRACTS.md` (identifiers, linkage, status lifecycle, storage recommendation, API surface), `docs/schemas/record-types.json` (JSON Schema for soil_upload, extraction_candidate, normalized_soil_test). Single-table design with type discriminator; status lifecycle: uploaded | extracting | needs_review | reviewed | saved | failed. No code or IaC changes; deployed DynamoDB still only has soil_upload items with status uploaded.

**Why it matters**: Later agents have a single source of truth for upload, extraction artifact, review state, and normalized soil-test record.

**Mirror to IaC/code?**: N/A — documentation only. Pipeline implementation (extraction storage, review, normalized save) is follow-up.

---

## 2025-03 — Task F2: Connect review flow to normalized record save

**System area**: Frontend (Upload page, MultiTestReview, My Records, records API).

**Change**: (1) **Save endpoint**: `saveNormalizedRecords(uploadId, tests)` in `src/api/records.js` calls `POST /records/normalized` once per test with body `{ sourceUploadId, zone_name, test_date, soil_data, field_name, field_id, crop_type, soil_type }` (F1: one record per request). (2) **Upload page**: On “Save All Records”, full mode uses `saveNormalizedRecords(backendReviewUploadId || result.uploadId, finalizedTests)`; loading state (`isSaving`), success toast and navigate to My Records with `refreshData`, failure toast and inline `saveError`. Demo path unchanged (navigate with in-memory tests). (3) **MultiTestReview**: Accepts `isSaving`; Save button shows “Saving…” and is disabled while saving. (4) **My Records**: `loadTests` for signed-in users filters `GET /records` to `type === 'normalized_soil_test'` and maps to display shape (id, field_name, zone_name, test_date, soil_data, crop_type, updated_date, etc.) so saved records appear after refresh.

**Why it matters**: User can review extracted data, save it via F1 endpoint, and see the result in My Records. Demo/full separation preserved.

**Mirror to IaC/code?**: Backend exposes `POST /records/normalized` and returns `normalized_soil_test` from `GET /records` (F1). Frontend was updated (checker fix) to call `/records/normalized` per test instead of non-existent `/records/{uploadId}/save`.

---

## 2025-03 — Task A1: Codify Cognito URLs and API CORS in backend CDK

**System area**: Backend IaC (Blomso-OS-Backend).

**Change**: Manual console settings for auth and CORS were mirrored into the repo so future `cdk deploy` does not revert working behavior.

**Codified**:
- **Cognito User Pool Client**: Default callback URLs now include `https://app.blomso.com/auth/callback`, `https://main.d3mhj4kebxuhe4.amplifyapp.com/auth/callback`, `http://localhost:5173/auth/callback`. Default logout URLs: `https://app.blomso.com`, `https://main.d3mhj4kebxuhe4.amplifyapp.com`, `http://localhost:5173`. (Context overrides still supported.)
- **API Gateway HTTP API**: `corsPreflight` added to `HttpApi` with allowOrigins (app.blomso.com, Amplify URL, localhost:5173), allowHeaders (Authorization, Content-Type), allowMethods (GET, POST, PUT, PATCH, DELETE, OPTIONS).

**Not codified**: Cognito Managed Login branding and styling remain console-only. Custom domain app.blomso.com is Amplify/hosting.

**Why it matters**: Redeploys preserve production auth and CORS; no manual re-apply of callback/logout URLs or CORS after deploy.

---

## 2025-03 — Task D1: Extraction pipeline skeleton (backend)

**System area**: Backend (Blomso-OS-Backend). Upload → extraction stage.

**Change**: After `POST /functions/upload/complete`, the backend asynchronously invokes an extraction Lambda. The extraction Lambda: reads the PDF from S3 (verifies object exists), writes a placeholder extraction artifact to S3 at `extractions/{userSub}/{uploadId}/artifact.json`, and updates the DynamoDB record with extraction status (`extracting` → `extracted` or `extraction_failed`), artifact key, timestamps, and error message on failure. Explicit trigger: `POST /records/{id}/extract` (authenticated; record must belong to user) starts extraction for that record (replay/debug). GET /records includes extraction fields: extractionStatus, extractionArtifactKey, extractionCompletedAt, extractionError.

**Artifact shape (placeholder)**: artifactVersion, parserVersion, uploadId, userSub, s3Key, status, startedAt, finishedAt, extractedAt, pages, rawText, fields, errors. Parser output is placeholder (no real soil parsing yet).

**Why it matters**: A real upload transitions into a durable extraction stage; extraction is replayable and debuggable; status and failure details are stored.

**Mirror to IaC/code?**: Done — extraction Lambda, upload-complete invoke, POST /records/{id}/extract, and GET /records extraction fields are in backend CDK.

---

## 2025-03 — Task B1: Backend GET /records endpoint (user upload list)

**System area**: Backend API (Blomso-OS-Backend).

**Change**: New authenticated route `GET /records` returns the signed-in user’s upload records from DynamoDB. Lambda `blomso-os-records-list` Scans the records table with `FilterExpression: userSub = :sub` (JWT `sub`). Response: `{ ok: true, records: [{ id, type, filename, contentType, key, status, createdAt }, ...] }` (newest first). No parsing or normalized records.

**Deploy**: `cdk deploy` in backend repo; no manual API Gateway or console steps. CORS already allows GET; existing authorizer used.

**Why it matters**: My Records / upload list can be implemented in the frontend against this endpoint.

---

## 2025-03 — Task B2: Wire My Records Soil Tests tab to backend GET /records

**System area**: Frontend (Blomso-OS-Frontend), Backend (Blomso-OS-Backend).

**Change**:
- **Frontend**: My Records Soil Tests tab for signed-in users now calls `GET /records` via `src/api/records.js` instead of `SoilTest.filter` / `Field.list` (which do not exist in the backend). Displays upload records as table: Filename, Created, Status, Type (contentType). Demo/guest mode unchanged (sessionStorage, location.state). List/grid toggle and Export CSV hidden when showing backend records.
- **Backend**: Records list Lambda fixed to unmarshall DynamoDB Items correctly (map each Item with `fromDynamo` per attribute so response has plain `id`, `filename`, etc., not nested `{ S: '...' }`).

**Why it matters**: Signed-in My Records no longer 404s; users see real upload placeholders. Extraction/review/normalized save and Practices tab backend are follow-up.

---

## 2025-03 — Task F1: Backend endpoint to save reviewed normalized soil-test records

**System area**: Backend (Blomso-OS-Backend).

**Change** (per C1 contract and `docs/schemas/record-types.json`):
- **POST /records/normalized** (auth): Body `sourceUploadId` (required), optional `extractionArtifactKey`, `zone_name`, `test_date`, `soil_data`, `field_name`, `field_id`, `crop_type`, `soil_type`. Validates upload exists and belongs to user; creates `normalized_soil_test` item (new UUID, type, userSub, sourceUploadId, linkage + payload). Returns 201 `{ ok, record }` or 400/403/404.
- **GET /records/{id}** (auth): Returns single record by id; 404 if not found or not owner. Supports both soil_upload and normalized_soil_test.
- **GET /records**: List handler now returns both upload and normalized items; normalized items include full payload (zone_name, test_date, soil_data, etc.). Same table, same Scan by userSub.

**Storage**: Single DynamoDB table; normalized_soil_test items use PK `id` (UUID), attributes type, userSub, sourceUploadId, extractionArtifactKey (optional), zone_name, test_date, soil_data (JSON string), field_name, field_id, crop_type, soil_type, createdAt, updatedAt.

**Why it matters**: Reviewed canonical soil-test data can be saved durably and listed/retrieved; linkage to upload and optional extraction artifact preserves traceability.

---

## 2025-03 — Task D2: Parser strategy v1 for soil PDF extraction

**System area**: Frontend docs and world model.

**Change**: Added `docs/PARSER_STRATEGY_V1.md` with: survey of legacy/demo parser usage (uploadService, integrations, vertexAISchemaBuilder, BatchUploadModal); current infra (S3 key pattern, DynamoDB upload record, no parser in backend); comparison of LLM vision vs Textract vs hybrid; recommended first path (LLM vision on PDF via Bedrock, one Lambda); fallback (Textract + LLM normalization); expected artifact shape `{ soil_tests: [ ... ] }` for review; dependencies (Bedrock, new Lambda + route, IAM). ARCHITECTURE_STATE and TASK_BOARD updated to reference the strategy so D1/E1/F1 can build against it.

**Why it matters**: Team has a clear recommended extraction approach for v1; no code or IaC changes in this task.

---

## 2025-03 — Task D1: Extraction pipeline skeleton (backend)

**System area**: Backend (Blomso-OS-Backend). Lambda, S3, DynamoDB.

**Change**: Added minimal extraction pipeline so an upload can transition into a durable extraction stage with a placeholder artifact.

**Codified**:
- **Extraction Lambda** (`blomso-os-extraction`): Triggered by upload-complete (async) or by `POST /records/{id}/extract`. Reads PDF from S3 (validates presence), writes placeholder artifact JSON to S3 at `extractions/{userSub}/{uploadId}/artifact.json`, updates record with extraction status/artifact key/error.
- **Trigger mechanism**: (1) Upload-complete invokes extraction Lambda asynchronously (`InvocationType: Event`) with `{ uploadId, key, userSub }`. (2) Explicit `POST /records/{id}/extract` (auth + ownership) returns 202 and invokes extraction Lambda with `{ uploadId }` for replay/debug.
- **Artifact shape**: `{ version, uploadId, userSub, s3Key, status: 'placeholder', extractedAt, pages: 0, rawText: '', fields: {}, errors: [] }`. Stored in S3; record holds `extractionArtifactKey`, `extractionStatus`, `extractionCompletedAt`, `extractionError` (on failure).
- **Status transitions**: (none) → extracting → extracted | failed. GET /records now returns extraction fields.

**Why it matters**: A real upload flows into an extraction artifact; pipeline is replayable and debuggable; full soil parsing not yet implemented.

**Mirror to IaC/code?**: Done — all in `lib/blomso-os-backend-stack.ts`. Deploy with `cdk deploy` to create extraction Lambda and new route.
