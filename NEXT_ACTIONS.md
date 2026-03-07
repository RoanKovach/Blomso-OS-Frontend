# Next actions

Checklist of drift-to-code and follow-up items.

**Reminder**: Whenever we change what exists (code, IaC, or out-of-band config), update ARCHITECTURE_STATE.md, OPS_CHANGELOG.md, and this file as needed so the repo world model stays accurate.

---

- [x] **Backend CDK (Task A1)**: app.blomso.com (and Amplify, localhost) are now default callback and logout URLs in User Pool Client. Future deploys do not overwrite.

- [x] **API Gateway CORS (Task A1)**: CORS codified in backend CDK on HttpApi (origins, Authorization/Content-Type headers, GET/POST/PUT/PATCH/DELETE/OPTIONS). No manual CORS step after deploy.

- [ ] **Cognito branding**: Managed login and custom styling are console-only. Document in runbooks or leave as-is unless codified in CloudFormation/CDK.

- [ ] **Extraction pipeline (Task D1)**: Deploy backend (cdk deploy) so extraction Lambda and POST /records/{id}/extract are live. Then verify: upload a PDF, confirm record gets extractionStatus/artifact; optionally call POST /records/{id}/extract to re-run extraction.

- [ ] **Extraction pipeline (Task D1)**: After deploy, verify extraction runs after upload and that `POST /records/{id}/extract` works for replay. Replace placeholder parser with real soil PDF parsing when ready.

- [ ] **Backend (optional)**: If records table grows large, add a GSI on `userSub` (partition) and `createdAt` (sort) so listing user records uses Query instead of Scan.

- [x] **My Records Soil Tests tab (B2)**: Wired to GET /records for signed-in users; F2 shows normalized_soil_test only (filter + map to display shape).
- [x] **Review → save (F2)**: Frontend calls POST /records/normalized once per test (F1 contract) from MultiTestReview; loading/success/error; navigate to My Records with refreshData.
- [x] **Backend F1**: POST /records/normalized and GET /records returning normalized_soil_test exist; F2 flow persists. Practices tab still needs backend or placeholder.

- [ ] **Parser v1 (D1)**: Implement first extraction path per `docs/PARSER_STRATEGY_V1.md` (Lambda + Bedrock vision on S3 PDF → `{ soil_tests }`; new route e.g. POST `/functions/upload/extract`). Fallback: Textract + LLM when needed.

- [ ] **E1 follow-up**: When backend implements `GET /records/{id}/extraction`, remove stub in `src/api/extraction.js` so `getExtraction(uploadId)` uses the real endpoint (fallback already in place).

- [ ] **Hosting (Task H1)**: If direct routes (e.g. /Dashboard) 404 in production, add SPA rewrite in Amplify Console: Rewrite `/<*>` → `/index.html` (200). See docs/HOSTING.md and amplify-spa-rewrite.json.
