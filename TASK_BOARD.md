# Task board

High-level tasks and references. Update when architecture or contracts change.

---

## Done

- **C1** — Define upload, extraction, review, and normalized record contracts. See Backend `docs/RECORD_CONTRACTS.md` and `docs/schemas/record-types.json`.
- **D2** — Recommend first parser for soil-test PDFs. See `docs/PARSER_STRATEGY_V1.md`: primary path LLM vision on PDF (Bedrock); fallback Textract + LLM. Artifact shape and dependencies documented; D1/E1/F1 can build with this.
- **B2** — Wire My Records Soil Tests tab to backend GET /records. Signed-in users see upload records (filename, createdAt, status, contentType); demo mode unchanged. No dependency on /soil-tests or /fields for signed-in path.
- **F1** — Backend endpoint to save reviewed normalized soil-test records. POST /records/normalized, GET /records/{id}; GET /records returns normalized_soil_test items. Linkage: sourceUploadId, optional extractionArtifactKey.
- **F2** — Connect review flow to normalized record save. Frontend calls POST /records/normalized once per test (F1); loading/success/error; My Records shows normalized_soil_test from GET /records.
- **D1** — Extraction pipeline skeleton. Backend: extraction Lambda (placeholder artifact to S3, status on record); trigger from upload-complete (async) and `POST /records/{id}/extract`; GET /records returns extraction fields. No full soil parsing yet.
- **H1** — Auth callback and SPA route resilience. createPageUrl returns PascalCase paths; AuthCallback sanitizes returnTo and uses AUTH_RETURN_DEFAULT; docs/HOSTING.md and amplify-spa-rewrite.json document SPA rewrite requirement.
- **IaC drift codification** — S3 uploads bucket CORS codified in backend CDK (BlomsoUploadsBucket); drift report in Backend `docs/DRIFT_REPORT.md`. API Gateway CORS and Cognito URLs already in code. Future deploy will not overwrite working CORS/auth.
- **E1 status-driven Upload → Review** — Upload step 3 shows truthful copy (no fake "Processing Complete!" for backend upload). Step 4 is record-first: GET /records/{id} → extractionStatus; Review Zones only when artifact has soil_tests; explicit messages for extracting, extraction_failed, empty artifact. No stub when API configured. My Records shows uploads with extractionStatus and Re-run extraction; save passes extractionArtifactKey when available.

---

## Backlog

- Replace placeholder extraction with real parser (per PARSER_STRATEGY_V1); extraction_candidate storage and API (per RECORD_CONTRACTS).
- Implement review state (status transitions, optional reviewEdits on extraction).
- Practices tab backend or placeholder.
