# Architecture state

**What the system is**: Blomso OS frontend (Vite + React) and backend (AWS CDK: API Gateway HTTP API, Cognito User Pool, S3, DynamoDB). Auth via Cognito Hosted UI / Managed Login. Upload spine: init → presigned S3 PUT → complete.

**Repo memory**: Update this file (and OPS_CHANGELOG.md, NEXT_ACTIONS.md, TASK_BOARD.md) whenever we change what exists—code, IaC, or out-of-band config—so the world model stays accurate.

**Major flows**:
- **Auth**: Sign in → redirect to Cognito (login URL from `VITE_COGNITO_DOMAIN` + `/login` with client_id, response_type=token, scope=openid email, redirect_uri=app + `/auth/callback`). User signs in at Cognito; callback returns to app with `id_token` in URL fragment. Callback parses fragment, calls `setAuthToken(id_token)`, then full-page redirect to app. `User.me()` calls `GET /me` with Bearer token; backend returns identity from JWT claims.
- **Logout**: Clear token from storage, redirect to Cognito `/logout` with logout_uri = app base.
- **Upload**: Authenticated user calls `POST /functions/upload/init` (filename, contentType) → backend returns presigned PUT URL and key; client PUTs file to S3; then `POST /functions/upload/complete` (uploadId, key, filename, contentType) → backend writes placeholder record to DynamoDB keyed by user `sub`, then asynchronously invokes the extraction Lambda.
- **Records list**: Authenticated user calls `GET /records` with Bearer token → backend returns that user’s records (Scan filtered by `userSub`): both `soil_upload` (id, type, filename, contentType, key, status, createdAt, extraction fields) and `normalized_soil_test` (id, type, userSub, sourceUploadId, extractionArtifactKey?, zone_name, test_date, soil_data, field_name, field_id, crop_type, soil_type, createdAt, updatedAt) (newest first).
- **Extraction pipeline**: After upload complete, extraction Lambda runs (async): reads PDF from S3, writes placeholder artifact to S3 at `extractions/{userSub}/{uploadId}/artifact.json`, updates record with extractionStatus (extracting → extracted | extraction_failed), extractionArtifactKey, extractionCompletedAt, extractionError. Explicit trigger: `POST /records/{id}/extract` returns 202. Full soil parsing not yet implemented; see `docs/PARSER_STRATEGY_V1.md` for v1 path.
- **Demo vs full mode**: Guest (not signed in) = demo mode (sessionStorage, no backend persistence for records). Signed in = full mode.

**Deployed domains** (from out-of-band / production):
- Production app: `https://app.blomso.com`
- API: from Amplify env (e.g. `https://…execute-api.us-east-2.amazonaws.com`)
- Cognito: `https://blomso-auth.auth.us-east-2.amazoncognito.com` (Managed login; branding customized in console). User Pool has **self-sign-up enabled** (codified in backend CDK `selfSignUpEnabled: true`); Managed Login shows Create account flow.

**Environment variables** (frontend): `VITE_APP_URL`, `VITE_API_URL`, `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID`, `VITE_MAPBOX_TOKEN`. See README and `.env.example`.

**Key dependencies**:
- Frontend: `User.me()` → `apiGet('/me')`; auth in `src/api/auth.js` and `src/api/client.js` (token from localStorage/sessionStorage, sent as `Authorization: Bearer <token>`).
- Backend (from repo): `GET /me` returns `{ ok, sub, username, email, authProvider: 'cognito' }` from JWT claims. `GET /records` (auth) returns `{ ok, records }` (uploads and normalized_soil_test; type-specific fields). `GET /records/{id}` (auth) returns `{ ok, record }` for one record (owner check). `POST /records/normalized` (auth) body: `sourceUploadId` (required), optional `extractionArtifactKey`, `zone_name`, `test_date`, `soil_data`, `field_name`, `field_id`, `crop_type`, `soil_type` → 201 `{ ok, record }`. `POST /records/{id}/extract` triggers extraction (202).

**Constraints / invariants**:
- Callback path must match Cognito app client callback URLs (`/auth/callback`).
- Token is returned in fragment (implicit flow).
- **SPA routing**: Hosting must serve `index.html` for all paths (e.g. `/Dashboard`, `/auth/callback`) so direct URLs and auth return work. See `docs/HOSTING.md` and `amplify-spa-rewrite.json`. App routes use PascalCase; `createPageUrl` and auth default return use `/Dashboard` (from `AUTH_RETURN_DEFAULT` in `@/utils`).
- Current `/me` does not return `full_name`; with email sign-in, Cognito `username` may be the raw `sub` (UUID).

**Codified in backend CDK** (as of Task A1): Callback and logout URLs for app.blomso.com, Amplify, and localhost are default values in the User Pool Client. API Gateway HTTP API CORS is set in CDK (same origins, headers Authorization/Content-Type, methods GET/POST/PUT/PATCH/DELETE/OPTIONS). Self-sign-up is enabled. Future deploys will not overwrite these.

**Not codified (console-only)**: Cognito Managed Login branding and custom styling. Custom domain (app.blomso.com) is Amplify/hosting config. See OPS_CHANGELOG.md and NEXT_ACTIONS.md.

**Record model (upload / extraction / normalized)**: Source of truth is Backend `docs/RECORD_CONTRACTS.md` and `docs/schemas/record-types.json`. Single DynamoDB table: `soil_upload`, `extraction_candidate` (proposed), `normalized_soil_test` (implemented). Upload has extraction stage (extractionStatus, extractionArtifactKey, etc.). **Normalized soil test**: Backend exposes `POST /records/normalized` (F1): one record per request; body `sourceUploadId` (required), optional zone_name, test_date, soil_data, field_name, field_id, crop_type, soil_type. **F2 (frontend)**: Review UI calls `saveNormalizedRecords(uploadId, tests)` which calls `POST /records/normalized` once per test; loading/success/error; on success navigate to My Records with refreshData. **My Records**: Signed-in users get `GET /records`; Soil Tests tab shows only `type === 'normalized_soil_test'` mapped to display shape. Demo/guest unchanged. Practices tab still uses entity APIs (not in backend).

**Backend-path review (E1)**: Review flow is tied to backend upload path, not sessionStorage/demo. **C1/D1**: Frontend contract in `src/lib/extractionContract.js` (extraction artifact shape: `soil_tests` array of candidates with zone_name, test_date, lab_info, soil_data). **Data in**: `getExtraction(uploadId)` in `src/api/extraction.js` — stub returns mock candidates until backend implements `GET /records/{id}/extraction`. **Data out**: `saveNormalizedRecords(uploadId, shapedTests)` in `src/api/records.js` → one `POST /records/normalized` per test (body: sourceUploadId, zone_name, test_date, soil_data, field_name, field_id, crop_type, soil_type); each test shaped by `shapeSoilTestPayload()` (soilTestValidation). **Entry points**: (1) Upload page: after backend upload complete, "Continue to Review" loads extraction via `loadExtractionForReview(uploadId, contextData)` and shows step 4 (MultiTestReview). (2) My Records: for upload records (backendRecordsMode), "Review" navigates to Upload with `state: { backendReviewUploadId, backendReviewFilename }`; Upload loads extraction and shows step 4. Reuse: MultiTestReview, soilTestValidation, EditSoilTestModal patterns; no rewrite of review UI.
