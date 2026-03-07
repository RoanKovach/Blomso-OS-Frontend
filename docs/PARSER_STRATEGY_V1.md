# Parser strategy v1: soil-test PDF extraction (Task D2)

**Goal**: Recommend the first practical extraction engine for rebuilding the PDF → extracted data → review → saved record workflow, grounded in current Blomso architecture.

---

## 1. Files inspected

| Location | File | Purpose |
|----------|------|--------|
| Frontend | `src/components/services/uploadService.jsx` | Legacy `UploadService.processFile`: calls `UploadFile` (→ `/integrations/upload`), then `InvokeLLM` (→ `/integrations/llm`) with `prompt`, `response_json_schema`, `file_urls`; expects JSON with `soil_tests` array. Current backend path uses only `uploadFileToBackend` (init → S3 PUT → complete), no extraction. |
| Frontend | `src/api/integrations.js` | `UploadFile` → POST `/integrations/upload`; `InvokeLLM` → POST `/integrations/llm` with prompt/schema/file_urls. Backend does not implement these routes. |
| Frontend | `src/components/utils/vertexAISchemaBuilder.jsx` | `buildSafeExtractionSchema()` and `buildExtractionPrompt(contextData)`. Defines expected LLM output shape: `{ soil_tests: [ { zone_name, test_date, soil_data: { ph, organic_matter, nitrogen, ... }, sampling_depth, field_notes } ] }`. |
| Frontend | `src/components/upload/BatchUploadModal.jsx` | Batch flow uses same pattern: UploadFile, then extract (extractSoilTests / LLM), parse `soil_tests`, apply metadata. |
| Backend | `lib/blomso-os-backend-stack.ts` | S3 bucket; upload init (presigned PUT, key `raw/<sub>/<uploadId>/<filename>`); upload complete (DynamoDB item: id, type=soil_upload, userSub, filename, key, status, createdAt); GET /records (list by userSub). No parser, no /integrations/upload, no /integrations/llm. |
| Repo | `ARCHITECTURE_STATE.md` | Confirms upload spine and GET /records; no extraction layer. |

---

## 2. Current infrastructure assumptions

- **PDF location**: After upload, PDF lives in S3 at `raw/<sub>/<uploadId>/<filename>`. Upload record in DynamoDB has `id` (= uploadId), `key`, `userSub`, `filename`, etc.
- **Backend**: Lambda (Node 20), S3, DynamoDB, API Gateway HTTP API, Cognito JWT. No Bedrock, no Textract, no external LLM in repo.
- **Frontend expectation**: Extraction returns a single JSON object `{ soil_tests: [ ... ] }` where each item has zone_name, test_date, soil_data (nutrients), sampling_depth, field_notes. Frontend then merges in context (field_name, crop, etc.) and would send to a “save” API (e.g. bulk create); that save path is not implemented in the current backend.

---

## 3. Options compared (v1 scope)

| Option | Pros | Cons | Fit for Blomso |
|--------|------|------|----------------|
| **LLM vision on PDF/image** | Single step; handles varied layouts and mixed content; output can be forced to JSON schema; aligns with legacy `InvokeLLM(file_urls, prompt, schema)`. | Cost per page; requires vision-capable model and S3/URL or bytes access from Lambda. | **Strong**: Frontend already expects prompt + schema + file; PDF already in S3; one Lambda can read S3, call Bedrock (or similar), return `soil_tests`. |
| **Textract only** | AWS-native; good for forms/tables; no LLM for OCR. | Output is raw text/blocks, not `soil_tests`; soil reports often have non-form layout; would need a second step (rules or LLM) to normalize. | **Weaker for v1**: Two-phase build (OCR then normalization); schema mapping is non-trivial. |
| **Hybrid OCR + LLM** | Textract (or PDF text) for text extraction; LLM only for “text → structured soil_tests.” | Two steps; more moving parts; still need to get text out of PDF (Textract or a PDF lib). | **Good fallback**: Use when vision is too expensive or PDFs are form-heavy and Textract gives clean text. |

---

## 4. Recommended first parser path: LLM vision on PDF

**Recommendation**: Implement the first extraction path as **one Lambda that reads the PDF from S3 and calls a vision-capable LLM** (e.g. AWS Bedrock with a model that supports document/image input, or a single call that accepts PDF/URL). The Lambda receives an upload identifier (or S3 key), loads the object, sends it to the LLM with a fixed prompt and the existing extraction schema, and returns `{ soil_tests: [ ... ] }` in the shape already defined by `vertexAISchemaBuilder`.

**Reasons**:
- PDFs are already in S3 with a known key pattern; no new storage.
- Frontend and legacy code already assume “one black box that takes file/prompt/schema and returns soil_tests”; this matches that contract.
- Single backend step keeps v1 simple: one new route (e.g. POST `/functions/upload/extract` or POST `/integrations/extract`) and one Lambda.
- Soil lab PDFs vary widely (tables, text, layout); vision LLMs handle that better than form-only OCR for v1.

**Fallback path**: **Textract + LLM normalization**. Use when (a) cost of vision is prohibitive, or (b) you discover most PDFs are form-like and Textract gives reliable text. Flow: Lambda gets PDF from S3 → Textract (or PDF-to-text) → LLM with “convert this text into soil_tests JSON” + schema → return `{ soil_tests }`. Same output shape; different extraction path.

---

## 5. Expected artifact shape (feeding into review)

The parser output must match what the frontend and review UI expect. From `vertexAISchemaBuilder.jsx` and `uploadService.jsx`:

```json
{
  "soil_tests": [
    {
      "zone_name": "string",
      "test_date": "string (normalized to yyyy-MM-dd for save)",
      "soil_data": {
        "ph": "number or null",
        "organic_matter": "number or null",
        "nitrogen": "number or null",
        "phosphorus": "number or null",
        "potassium": "number or null",
        "calcium": "number or null",
        "magnesium": "number or null",
        "sulfur": "number or null",
        "cec": "number or null",
        "base_saturation": "number or null",
        "iron": "number or null",
        "zinc": "number or null",
        "manganese": "number or null",
        "copper": "number or null",
        "boron": "number or null"
      },
      "sampling_depth": "string or null",
      "field_notes": "string or null"
    }
  ]
}
```

The review step (and any save API) can then merge in context (field_name, intended_crop, etc.) and persist. Storing the raw extraction JSON (e.g. in S3 or as an attribute on the upload record) supports replay and debug.

---

## 6. Dependencies / AWS services to add

For **recommended path (LLM vision)**:

- **AWS Bedrock**: Use a model that supports document or image input (e.g. Claude with document support, or a model that accepts image bytes). Enable the model in the Bedrock console for the account/region.
- **Lambda**: New Lambda (e.g. `BlomsoExtractHandler`) that:
  - Is invoked with auth (Cognito JWT) and body containing `uploadId` and/or `key` (S3 key for the PDF).
  - Reads the PDF from the existing Blomso S3 bucket (same bucket as uploads; key from DynamoDB or request).
  - Calls Bedrock (or chosen provider) with the PDF (or PDF rendered to images if the API requires images), plus a system/user prompt that includes the extraction instructions from `buildExtractionPrompt` and the schema.
  - Returns `{ ok: true, soil_tests: [ ... ] }` (and optionally stores extraction JSON in S3 under e.g. `extracted/<sub>/<uploadId>/extraction.json`).
- **IAM**: Lambda execution role needs `s3:GetObject` on the uploads bucket (and optionally `s3:PutObject` for extraction artifact). Lambda must have permission to call Bedrock (e.g. `bedrock:InvokeModel`).
- **API**: New route, e.g. `POST /functions/upload/extract` or `POST /integrations/extract`, body `{ uploadId, key }` (key can be derived from upload record if needed). Response: extraction JSON.

No change to frontend for v1 beyond wiring the new endpoint (replace or complement the current stub that calls `/integrations/llm` with a call to the new extract endpoint that takes uploadId/key and returns `soil_tests`).

For **fallback path (Textract + LLM)**:

- **Textract**: Lambda uses AWS Textract (e.g. `DetectDocumentText` or `AnalyzeDocument`) to get text from the PDF. Textract accepts S3 object reference; no need to stream PDF into Lambda.
- **Lambda**: Same Lambda or a second one: (1) Textract on S3 PDF → raw text, (2) invoke Bedrock (or another LLM) with “convert the following text into JSON matching this schema” + schema → `soil_tests`.
- **IAM**: Add `textract:DetectDocumentText` (and/or `AnalyzeDocument`) for the Lambda role.

---

## 7. Summary

| Item | Recommendation |
|------|----------------|
| **First parser path** | LLM vision on PDF: one Lambda, read PDF from S3, call Bedrock (or equivalent) with prompt + schema, return `{ soil_tests }`. |
| **Fallback path** | Textract for OCR + LLM for text → structured `soil_tests` (same output shape). |
| **Artifact shape** | As above; matches `vertexAISchemaBuilder` and existing frontend review/save expectations. |
| **New dependencies** | Bedrock (and optionally Textract for fallback); new Lambda + route; IAM for S3 read and Bedrock (and Textract if used). |
| **World-model** | TASK_BOARD and ARCHITECTURE_STATE updated to reference this strategy so D1/E1/F1 can build against it. |

---

*Task D2 deliverable. Inspected repo state as of task date; no code changes in this document.*
