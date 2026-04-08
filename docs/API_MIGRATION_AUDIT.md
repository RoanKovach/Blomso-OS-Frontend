# Blomso-OS-Frontend — Backend API usage & migration map

Read-only audit of API call sites and call graph. Paths are as they appear in code today.

## A. High-level summary

- **API layer is split:** `src/api/*.js` (client, records, extraction, entities, functions, auth, integrations, entityHelpers) is the main abstraction, while some features still call `invoke('…')` or `apiPost('/functions/...')` directly from components (`BatchUploadModal`, `SoilTestLinkingPanel`, etc.).
- **Six core routes:**
  - **`POST /functions/upload/init`** and **`POST /functions/upload/complete`:** only `src/components/services/uploadService.jsx` (plus browser PUT to the presigned URL in the same generator).
  - **`GET /extractions/{id}`:** `src/api/extraction.js` (`getExtraction`), called from `useUploadAndParse.jsx` and `Upload.jsx`.
  - **`POST /extractions/{id}`** (trigger extraction): `src/api/records.js` (`triggerExtraction`), used by `SoilTestsTab.jsx`.
  - **`GET /records`:** `listRecords` in `records.js` → `FieldWorkbenchPanel.jsx`, `SoilTestsTab.jsx`, and indirectly `SoilTest.list` via `entities.js`.
  - **`GET/PATCH/DELETE /records/{id}`:** `getRecord`, `updateRecord`, `deleteRecord` in `records.js` → `Upload.jsx`, `SoilTestsTab.jsx`, `SoilTest.get/update/delete` in `entities.js`.
  - **`GET/POST/PUT/DELETE /fields` and `/fields/{id}`:** `entityHelpers.js` via `Field` in `entities.js` → `useFieldOperations.jsx`, `SoilTestsTab.jsx` (`Field.list()`), `fieldService.jsx` (full CRUD).
- **Extraction/review data** is fetched via `getExtraction` (`GET /extractions/{id}`) and `getRecord` (`GET /records/{id}`), and rendered mainly on `Upload.jsx` (review / `MultiTestReview`) and `useUploadAndParse` (maps artifact → review candidates). `SoilTestsTab` shows upload rows and polls `listRecords`; it does not call `getExtraction` directly (review is Upload-centric).
- **Other backend surfaces:** `GET /me`, `PUT /me`, `GET /map/layers`, `POST /integrations/*`, `POST /functions/{name}` for many lambdas, `POST /records/normalized`, legacy `POST /records/{uploadId}/normalized` in `extraction.js`.

## B. File-by-file route map

### `src/api/client.js`

- **Purpose:** `VITE_API_URL`, `apiGet` / `apiPost` / `apiPut` / `apiPatch` / `apiDelete` / `apiPostForm`, `authHeaders`, `isApiConfigured`.
- **Calls:** none by path string (implements transport).

### `src/api/records.js`

| Route | Method | Function | Purpose |
|-------|--------|----------|---------|
| `/records` | GET | `listRecords` | List all record rows for user |
| `/records/{id}` | GET | `getRecord` | Single record (upload status, keys, etc.) |
| `/records/{id}` | PATCH | `updateRecord` | Partial update (e.g. field link, edits) |
| `/records/{id}` | DELETE | `deleteRecord` | Delete normalized record |
| `/extractions/{id}` | POST | `triggerExtraction` | Re-run extraction |
| `/records/normalized` | POST | `saveNormalizedRecords` (loop) | Persist reviewed normalized soil/yield rows |

**Callers of these exports:**

- **`listRecords`:** `FieldWorkbenchPanel.jsx`, `SoilTestsTab.jsx`, `entities.js` (`SoilTest.list` implementation).
- **`getRecord`:** `Upload.jsx` only (direct import).
- **`saveNormalizedRecords`:** `Upload.jsx` only.
- **`triggerExtraction`:** `SoilTestsTab.jsx`.
- **`updateRecord`:** `SoilTestsTab.jsx` (field link control + `handleUpdateTest` / edit modal path), `entities.js` (`SoilTest.update`).
- **`deleteRecord`:** `SoilTestsTab.jsx`, `entities.js` (`SoilTest.delete`).

### `src/api/extraction.js`

| Route | Method | Function | Purpose |
|-------|--------|----------|---------|
| `/extractions/{uploadId}` | GET | `getExtraction` | Load extraction artifact (soil_tests, etc.) |
| `/records/{uploadId}/normalized` | POST | `saveNormalized` | Legacy batch save shape |

**Callers:** `getExtraction` → `useUploadAndParse.jsx`, `Upload.jsx`. `saveNormalized` appears unused by components (only defined in `extraction.js`).

### `src/components/services/uploadService.jsx`

| Route | Method | Function | Purpose |
|-------|--------|----------|---------|
| `/functions/upload/init` | POST | `uploadFileToBackend` (generator) | Get presigned URL + ids |
| *(presigned URL)* | PUT | same | Upload bytes |
| `/functions/upload/complete` | POST | same | Finalize upload + metadata |
| Also imports **integrations** | — | `UploadService.processFile` | Alternate path: `UploadFile` + `InvokeLLM` (not the `/functions/upload/*` spine) |

**Caller of `uploadFileToBackend`:** `useUploadAndParse.jsx` only.

### `src/api/entityHelpers.js` + `src/api/entities.js`

| Route pattern | Helpers | Entity |
|---------------|---------|--------|
| `GET/POST /fields`, `GET/PUT/DELETE /fields/{id}` | `entityList`, `entityGet`, `entityCreate`, `entityUpdate`, `entityDelete` | **Field** |
| Same for `practices`, `data-sources`, `spatial-data`, `ai-context-documents` | same | Practice, DataSource, SpatialData, AIContextDocument |

**Field usage:**

- **`useFieldOperations.jsx`:** `Field.list`, `Field.create`, `Field.delete` → `GET/POST/DELETE /fields` (create uses `POST /fields`).
- **`SoilTestsTab.jsx`:** `Field.list()` for canonical field pickers / maps.
- **`fieldService.jsx`:** `Field.list`, `create`, `update`, `delete` → full `/fields` + `/fields/{id}`.

**SoilTest:** implemented on top of `listRecords` / `getRecord` / `updateRecord` / `deleteRecord` (not `/soil-tests` REST).

### `src/api/auth.js`

- **`GET /me`** — `User.me()` — AuthContext, user flows, `SoilTestsTab`, `Upload`, `Profile`, `Recommendations`, many tools.
- **`PUT /me`** — `User.updateMyUserData` — `Profile.jsx`, `ProfilePanel.jsx`.

### `src/api/functions.js`

- **`POST /functions/{functionName}`** — `invoke(name, payload)` — used widely; named exports (e.g. `exportSoilTests`, `suggestSoilTestLinks`, `getSsurgoData`, `processShapefile`, `trackEvent`, …).

**Direct `invoke` usage:** `BatchUploadModal.jsx` (`extractSoilTests`).

### `src/api/integrations.js`

- `/integrations/upload`, `/integrations/llm`, `/integrations/email`, `/integrations/image`, `/integrations/extract`, `/integrations/signed-url`, `/integrations/upload-private` — used from `uploadService.jsx` (legacy/demo path), `AnalyticsService`, `AskTillyInterface`, `BatchUploadModal`, `UploadShapefileModal`, `validatedUploadService`, `WhatChangedWidget`, `ToolRunnerModal`, `SoilAnalysisReport`, etc.

### `src/pages/FieldVisualization.jsx`

- **`GET /map/layers`** — `apiGet("/map/layers")` — map style + tile config.

### Components importing `@/api/functions` (representative)

- `SoilTestLinkingPanel.jsx`: `suggestSoilTestLinks`, `linkSoilTestsToField`
- `SSURGOLayer.jsx`: `getSsurgoData`
- `SoilTestsTab.jsx`: `exportSoilTests`
- `useTracking.jsx`: `trackEvent`
- `BatchUploadModal.jsx`: `invoke('extractSoilTests', …)`
- `UploadShapefileModal.jsx`: `processShapefile`
- `validatedUploadService.jsx`: `processAndSaveSoilTests`
- `dataSourceHealthService.jsx`: `checkDataSourceStatus`
- `TillyChat.jsx`: `queryTilly`
- `ParcelDetailsPanel.jsx`: `manageParcelField`
- `FieldClaimingModal.jsx`: `claimOhioFields`

### Task 2 — Exact call sites (six routes)

| Endpoint | Files / symbols that call it |
|----------|------------------------------|
| `POST /functions/upload/init` | `uploadService.jsx` → `uploadFileToBackend` → `useUploadAndParse.jsx` → `Upload.jsx` (via hook) |
| `POST /functions/upload/complete` | Same chain |
| `GET /extractions/{id}` | `extraction.js` `getExtraction` → `useUploadAndParse.jsx` `loadExtractionForReview`, `Upload.jsx` (multiple `getExtraction` call sites) |
| `GET /records` | `records.js` `listRecords` → `FieldWorkbenchPanel.jsx`, `SoilTestsTab.jsx`, `entities.js` `listNormalizedSoilTests` |
| `GET/PATCH/DELETE /records/{id}` | `records.js` → `Upload.jsx` (`getRecord`), `SoilTestsTab.jsx` (`updateRecord`, `deleteRecord`), `entities.js` (`SoilTest.get/update/delete`) → Recommendations, SoilAnalysisReport, SoilTestRecordPicker, WhatChangedWidget, ToolRunnerModal, PracticesTab, etc. |
| `GET /fields` | `entityHelpers` via `Field.list` → `useFieldOperations.jsx`, `SoilTestsTab.jsx`, `fieldService.jsx` |
| `POST /fields` | `Field.create` → `useFieldOperations.jsx`, `fieldService.jsx` |
| `GET/PUT/DELETE /fields/{id}` | `Field.get/update/delete` → `fieldService.jsx` (primary); `FieldVisualization` uses list/create/delete via `useFieldOperations`, not necessarily get/update |

### Task 3 — Where document / extraction / review data is fetched and rendered

| Stage | Fetch | Render |
|-------|--------|--------|
| After upload | `getRecord(uploadId)` (`Upload.jsx`) for status/keys; `getExtraction(uploadId)` for artifact | `Upload.jsx` + `MultiTestReview.jsx` |
| Map artifact → review rows | `getExtraction` inside `loadExtractionForReview` | `useUploadAndParse.jsx` sets `extractedTests` for UI |
| Saved list / upload rows | `listRecords` | `SoilTestsTab.jsx` (tables, expandable rows, filters, polling) |
| Field context for display | `Field.list` + upload record fields | `fieldDisplayUtils.js` consumed by `SoilTestsTab` |

### Task 4 — Current flows (concise)

| Flow | Steps (code-level) |
|------|---------------------|
| **Upload** | `Upload.jsx` → `useUploadAndParse.startProcessing` → `uploadFileToBackend` (init → PUT → complete) **or** demo `UploadService.processFile` (integrations + entities stub). |
| **Review** | `Upload.jsx` polls / loads `getRecord` + `getExtraction` → `MultiTestReview` → `saveNormalizedRecords` → `POST /records/normalized` per row. |
| **Records** | `SoilTestsTab` `listRecords`; edits via `updateRecord`; delete `deleteRecord`; optional `triggerExtraction`; guest branch uses sessionStorage. |
| **Field** | `useFieldOperations` / `FieldVisualization` `Field.create`/`delete` + `GET /fields` list; `SoilTestsTab` `Field.list` for linking; `fieldService` for other CRUD if used by hooks. |

### Task 5 — Client layer vs scattered requests

- **Centralized:** `client.js`, `records.js`, `extraction.js`, `auth.js`, `entityHelpers.js`, `entities.js`, `functions.js` (`invoke`), `integrations.js`.
- **Scattered / direct path strings:** `uploadService.jsx` (`/functions/upload/*`), `FieldVisualization.jsx` (`/map/layers`), `BatchUploadModal.jsx` (`invoke('extractSoilTests')`), `MapAssistant.jsx` (uses `fetch('/functions/router/tilly/query'…)` — relative URL, not `VITE_API_URL`; migration risk).
- **Conclusion:** Most production workbench traffic goes through `api/` modules, but functions and integrations are invoked from many components by name.

## C. Migration table

**Recommended new route** is conceptual (map to the real contract). **Priority:** P0 = blocks everything; P1 = core workbench; P2 = secondary screens.

| Current route | Current file | Current function / hook / component | Current purpose | Recommended new route (conceptual) | Migration priority | Risk |
|---------------|--------------|--------------------------------------|-----------------|-----------------------------------|----------------------|------|
| `POST /functions/upload/init` | `uploadService.jsx` | `uploadFileToBackend` | Presign + metadata start | Upload session: `POST …/uploads` or `…/upload-sessions` | P1 | High — presign shape, IDs |
| `POST /functions/upload/complete` | `uploadService.jsx` | `uploadFileToBackend` | Finalize + linkedFieldId, contextSnapshot, documentFamily | Complete upload: `POST …/uploads/{id}/complete` | P1 | High |
| `GET /extractions/{id}` | `extraction.js` | `getExtraction` | Artifact for review | `GET …/extractions/{id}` or nested under upload | P1 | High — soil_tests vs payload.soil_tests |
| `POST /extractions/{id}` | `records.js` | `triggerExtraction` | Manual re-extract | `POST …/uploads/{id}/extract` or same | P2 | Medium |
| `GET /records` | `records.js` | `listRecords` | Unified inbox | `GET …/records` (or split documents vs evidence) | P0 | High — discriminated type union |
| `GET /records/{id}` | `records.js` | `getRecord` | Upload detail on review | `GET …/records/{id}` | P1 | Medium |
| `PATCH /records/{id}` | `records.js` | `updateRecord` | Edit + field reassignment | `PATCH …/records/{id}` | P1 | High — allowed fields |
| `DELETE /records/{id}` | `records.js` | `deleteRecord` | Delete saved row | `DELETE …/records/{id}` | P2 | Medium |
| `POST /records/normalized` | `records.js` | `saveNormalizedRecords` | Persist reviewed tests | `POST …/records` or `…/evidence` | P1 | High — body per family |
| `GET /fields` | `entityHelpers.js` | `Field.list` | Field catalog | `GET …/fields` | P1 | Medium |
| `POST /fields` | `entityHelpers.js` | `Field.create` | Drawn / service-created fields | `POST …/fields` | P1 | Medium — geometry schema |
| `GET/PUT/DELETE /fields/{id}` | `entityHelpers.js` | `Field.get/update/delete` | CRUD | `…/fields/{id}` | P2 | Medium |
| `GET /me` | `auth.js` | `User.me` | Session / user | `GET …/me` | P0 | Low–medium |
| `GET /map/layers` | `FieldVisualization.jsx` | useEffect loader | Map config | `GET …/map/layers` or config service | P2 | Medium |
| `POST /functions/*` | many | `functions.js` + call sites | SSURGO, export, link, shapefile, … | Split by domain (evidence, geo, analytics) | P2 | High — envelope (data wrapper in linking UI) |

## D. Response-shape assumptions

### Extraction (`GET /extractions/{id}`) — `extraction.js`

- Treat as success if `res.ok !== false`.
- **`soil_tests`:** top-level or `res.payload.soil_tests`.
- Spreads `...res` into return object; expects optional `parserVersion`.

### Upload complete (`POST /functions/upload/complete`) — `uploadService.jsx`

- Expects **`uploadUrl`**, **`uploadId`**, **`key`** from init.
- Uses **`completeRes?.id`**, **`completeRes?.status`** (optional).

### Records (`GET /records`, `GET/PATCH/DELETE /records/{id}`) — `records.js` / consumers

- **`listRecords`:** uses `res.records`; comment expects `{ ok, records }` style from backend.
- **`getRecord`:** expects `res.ok` and `res.record`.
- **`updateRecord` / `deleteRecord`:** expect `res.ok`; update may use `res.record` in `entities.js`.
- **`SoilTestsTab`:** splits types `soil_upload`, `document_upload`, `normalized_soil_test`, `normalized_yield_ticket`.

### Fields (`GET /fields` list) — `useFieldOperations` / `SoilTestsTab`

- List may be raw array or `raw.fields` / `items` / `data`.

### Function invoke (`POST /functions/suggestSoilTestLinks` etc.) — `SoilTestLinkingPanel.jsx`

- Assumes `const { data } = await suggestSoilTestLinks(...)` — nested `data` on the JSON body (while `invoke` returns the full `apiPost` JSON). **Envelope mismatch risk** if the new API returns a flat body.

### Export (`exportSoilTests`) — `exportSoilTestsResponse.js`

- Accepts string CSV or object with `csv`, `data`, `output`, `base64`, etc.

## E. Cleanest minimum frontend migration order

1. **`client.js`** — base URL, auth header, error handling (everything depends on this).
2. **`GET /me` + `AuthContext`** — gate all protected calls.
3. **`GET /records` + `listRecords` / `SoilTestsTab`** — single biggest consumer; defines type discrimination and polling.
4. **`PATCH /records/{id}` + `updateRecord` / `SoilFieldLinkControl` / `handleUpdateTest`** — field reassignment and edits.
5. **`POST /records/normalized` (or replacement) + `Upload.jsx` `saveNormalizedRecords`** — commit path from review.
6. **`GET /extractions/{id}` + `getExtraction` / `useUploadAndParse` / `Upload.jsx`** — review content.
7. **`POST` upload init/complete** (or replacement session API) + `uploadFileToBackend`.
8. **`GET/POST/DELETE /fields` + `useFieldOperations` + `SoilTestsTab` `Field.list`**.
9. **`POST /functions/*` ad hoc** (export, SSURGO, linking) — after core REST is stable.
10. **`integrations/*` and demo `UploadService.processFile`** — last or parallel track (non–S3 spine).

## F. Risks / likely breaking points

1. **Dual upload pipelines:** `uploadFileToBackend` (`/functions/upload/*`) vs `UploadService.processFile` (integrations + LLM). Migrating one without the other breaks demo vs production behavior.
2. **Legacy save path:** `saveNormalized` in `extraction.js` targets `POST /records/{uploadId}/normalized` — if anything still called it, it would diverge from `saveNormalizedRecords`; grep suggests components use `saveNormalizedRecords` only.
3. **`SoilTestLinkingPanel` `data` wrapper** vs raw `invoke` return — high chance of **silent failure** if the new API changes envelope.
4. **`Recommendations.jsx` / `AskTillyInterface`** use `SoilTest.filter({ created_by, analysis_status })` but `entities.js` mapper does not expose those fields from `/records` — fragile under any contract change.
5. **`MapAssistant.jsx` relative `fetch('/functions/router/tilly/query')`** — may not use `VITE_API_URL`; easy to break when base path changes.
6. **`exportSoilTests`** — many acceptable response shapes; new backend must either match one or update `blobFromExportSoilTestsResponse`.
7. **Guest `sessionStorage` paths** in `SoilTestsTab` — no backend; migration of “records” APIs does not affect demo until you explicitly align or remove guest mode.
