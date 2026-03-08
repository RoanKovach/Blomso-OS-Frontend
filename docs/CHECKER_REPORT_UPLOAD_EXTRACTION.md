# Checker Report: Upload/Extraction Coherence (Frontend + Backend)

**Date**: 2025-03  
**Scope**: Backend trace/classification, parser contract + statuses, frontend status-driven flow, infra codification.  
**Goal**: Verify coherence across repos and deploy-safety for an honest end-to-end Workbench loop.

---

## Verdict: **FAIL**

The pipeline is partially coherent but has **blocking issues** that prevent an honest end-to-end loop: My Records signed-in view is broken (wrong data + wrong Review target), extraction artifact is never loaded from backend (stub only), and one dead/wrong API path in the frontend. Merge/deploy order and fixes below.

---

## Top 5 Issues by Severity

### 1. [HIGH] My Records Soil Tests tab shows wrong view and breaks Review (frontend)

**What**: For signed-in users, `SoilTestsTab` loads `GET /records`, filters to **normalized only**, maps to `displayTests`, then sets `backendRecordsMode = true` and `tests = displayTests`. The UI then renders the **Upload Records** table (columns: Filename, Created, Status, Type, Actions) with a **Review** button.

**Problem**: The rows are **normalized_soil_test** items (no `filename`, `contentType`, `status`). So Filename/Status/Type show "—" or wrong values. The **Review** button passes `rec.id` (normalized record id) as `backendReviewUploadId`, but the review flow needs the **upload** id to call `getExtraction(uploadId)`. So Review opens with the wrong id and either 404s or loads nothing useful. Additionally, **uploads are hidden**: if the user has only uploads (no normalized yet), `tests` is empty and they see "No Uploads Yet" even though uploads exist.

**Files**: `Blomso-OS-Frontend/src/components/myrecords/SoilTestsTab.jsx` (load: lines 128–147; table: 462–499).

**Fix**: Decide on one of: (A) Show **uploads** when `backendRecordsMode` (table: filename, status, extractionStatus, Review with `rec.id` = upload id); show **normalized** in a separate list or tab with soil-test columns (field_name, test_date, etc.) and no Review, or (B) Single list with record type discriminator: uploads get Review (with upload id), normalized get view/edit only. Ensure Review always receives **upload** id and that uploads are visible when user has no normalized records yet.

---

### 2. [HIGH] Extraction artifact not served by backend — review always uses stub

**What**: Frontend `getExtraction(uploadId)` calls `GET /records/${uploadId}/extraction`. The backend does **not** implement this route; it only has `POST /records/{id}/extract` (trigger). So the call 404s and the frontend always falls back to `getExtractionStub(uploadId)` (mock data).

**Problem**: No provenance: user never sees real extraction output from S3 artifact. Review UI is not driven by backend state; traceability is broken.

**Files**:  
- Frontend: `Blomso-OS-Frontend/src/api/extraction.js` (`getExtraction`, lines 15–29).  
- Backend: no `GET /records/{id}/extraction` in `lib/blomso-os-backend-stack.ts` (only POST …/extract).

**Fix**: Add backend route `GET /records/{id}/extraction` (auth + ownership): read upload record, then stream or return S3 artifact at `extractionArtifactKey` (or 404 if no artifact). Update frontend to use this when available and keep stub only as dev fallback.

---

### 3. [MEDIUM] Contract mismatch: frontend `saveNormalized` uses wrong path and body

**What**: `extraction.js` defines `saveNormalized(uploadId, shapedTests)` which calls `apiPost(\`/records/${uploadId}/normalized\`, { uploadId, soil_tests: shapedTests })`. The backend implements `POST /records/normalized` (no path param) with body `{ sourceUploadId, zone_name, test_date, soil_data, ... }` (one record per request).

**Problem**: Wrong path (`/records/:id/normalized` vs `/records/normalized`) and wrong body (batch `soil_tests` vs single-record fields). This code path would 404 or fail if ever used. The **actual** save flow uses `records.js` → `saveNormalizedRecords` → `POST /records/normalized` with correct body — so this is **dead/wrong** code, not the active path.

**Files**: `Blomso-OS-Frontend/src/api/extraction.js` (`saveNormalized`, lines 73–91).

**Fix**: Remove or refactor `saveNormalized` so it either calls `saveNormalizedRecords` from `records.js` or uses `POST /records/normalized` with one record per request (sourceUploadId + per-test fields). Prefer delegating to `saveNormalizedRecords` to avoid duplication.

---

### 4. [MEDIUM] Upload `status` never transitions to `needs_review` (backend vs C1)

**What**: C1 contract (RECORD_CONTRACTS.md §3) says: when extraction is done, upload **status** should be `needs_review`. Backend only sets `extractionStatus` (extracting → extracted | extraction_failed) on the upload item; the main `status` field stays `uploaded`.

**Problem**: Any frontend or automation that keys off `record.status` for "ready for review" will not see the transition. Today the frontend uses a stub for extraction and does not rely on upload status for gating; once real extraction and GET extraction exist, status-driven UI will be inconsistent unless backend or contract is aligned.

**Files**: Backend `lib/blomso-os-backend-stack.ts` (extraction Lambda: sets extractionStatus only, ~293, 333, 347; upload-complete: status `uploaded` only, ~402). Contract: `docs/RECORD_CONTRACTS.md` §3, §5.

**Fix**: Either (A) have extraction Lambda set upload `status` to `needs_review` when extraction succeeds (and optionally `failed` on extraction_failed), or (B) formally document that "ready for review" is indicated by `extractionStatus === 'extracted'` and that `status` remains upload-lifecycle only. Prefer (A) for a single source of truth.

---

### 5. [LOW] RECORD_CONTRACTS.md §10 (Frontend alignment) is stale

**What**: Section 10 says "My Records: SoilTestsTab.jsx currently uses SoilTest.filter() (entity API `/soil-tests`) which is not implemented in this backend; backend has GET /records (upload placeholders only)."

**Problem**: B2/F2 already wired My Records to `GET /records` and normalized save; the tab now uses `listRecords()` and shows normalized (with the bugs in issue #1). The doc is outdated and misleading.

**Files**: `Blomso-OS-Backend/docs/RECORD_CONTRACTS.md` (§10, ~line 169).

**Fix**: Update §10 to state that Soil Tests tab uses `GET /records` (uploads + normalized), that review entry is via Upload page with `backendReviewUploadId` (upload id), and that normalized save uses `POST /records/normalized` per test via `saveNormalizedRecords`. Note known gap: GET extraction not implemented, so review uses stub.

---

## Other Checks (summary)

| Check | Result | Note |
|-------|--------|------|
| **Canonical rows saved before review** | OK | Normalized save only in `handleFinalizeAndAnalyze` after MultiTestReview `onFinalize`; no save before review. |
| **Fake UI completion** | FAIL (see #1) | Table shows "Upload Records" with normalized data and wrong Review id; empty state hides uploads. |
| **Provenance/artifact persistence** | FAIL (see #2) | Artifact written to S3 by extraction Lambda but no GET endpoint; frontend always stub. |
| **Infra / drift risk** | OK | A1 codified callback URLs and CORS in CDK; NEXT_ACTIONS and ARCHITECTURE_STATE list Cognito branding and SPA rewrite as console-only / doc. |
| **World-model updates** | PARTIAL | ARCHITECTURE_STATE and NEXT_ACTIONS reflect GET /records, POST /records/normalized, F2; RECORD_CONTRACTS §10 not updated. |

---

## Exact Files / Routes Involved

| Repo | File / route | Issue |
|------|----------------|------|
| Frontend | `src/components/myrecords/SoilTestsTab.jsx` | #1 — load shows only normalized; table + Review use wrong shape/id. |
| Frontend | `src/api/extraction.js` | #2 — getExtraction tries GET …/extraction (404), stub used; #3 — saveNormalized wrong path/body. |
| Frontend | `src/api/records.js` | Correct save path; used by Upload.jsx. |
| Backend | `lib/blomso-os-backend-stack.ts` | #2 — no GET /records/{id}/extraction; #4 — no status → needs_review. |
| Backend | `docs/RECORD_CONTRACTS.md` | #4 — status lifecycle; #5 — §10 stale. |

---

## Merge / Deploy Order Recommendation

1. **Backend first (no dependency on broken frontend)**  
   - Deploy backend as-is so that `POST /records/normalized`, `GET /records`, `GET /records/{id}`, and extraction trigger/artifact write are live.  
   - Optionally add `GET /records/{id}/extraction` in the same release to unblock real review data (then frontend can stop using stub once updated).

2. **Frontend after SoilTestsTab fix**  
   - Do **not** merge the current My Records behavior (normalized-only + upload table + wrong Review id).  
   - Merge only after: (A) uploads are visible (e.g. show uploads when no normalized, or show both with clear type); (B) Review button passes **upload** id; (C) table for uploads shows upload fields (filename, status/extractionStatus); table for normalized shows soil-test fields.

3. **Then**  
   - Fix or remove `extraction.js` `saveNormalized` (#3).  
   - Update RECORD_CONTRACTS §10 (#5).  
   - Decide and implement upload `status` vs `extractionStatus` alignment (#4).

---

## Minimal Manual Validation Checklist

After deploying backend and merging frontend fixes:

- [ ] **Upload → complete**: Upload a PDF; confirm record in DynamoDB with `status: uploaded`, then extractionStatus moves to `extracted` (or extraction_failed) and S3 has artifact at `extractions/{userSub}/{uploadId}/artifact.json`.
- [ ] **GET /records**: As that user, call GET /records; response includes the upload item with extractionStatus (and no normalized yet).
- [ ] **My Records**: Signed-in user sees **uploads** (filename, status/extractionStatus) and a **Review** action that opens Upload page with the **upload** id in state.
- [ ] **Review**: On Upload page with backendReviewUploadId = upload id, "Review" step loads extraction (stub or real GET …/extraction); user edits and clicks Save; `saveNormalizedRecords` runs and POST /records/normalized returns 201 per test.
- [ ] **My Records after save**: After save, GET /records includes normalized_soil_test items; My Records shows them in a **soil test** table (field_name, test_date, etc.), not in the upload table.
- [ ] **No save before review**: Confirm normalized rows appear only after completing the review step and clicking Save (no automatic save on upload or extraction).

---

*Report generated for merge/deploy decisions and to unblock an honest end-to-end Workbench loop.*
