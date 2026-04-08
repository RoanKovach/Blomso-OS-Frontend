/**
 * Extraction and normalized-save contracts (C1 / D1).
 * Used by backend-path review UI: extraction output -> review/edit -> normalized save payload.
 *
 * C1 (extraction API contract):
 * - GET /documents/:id/extraction returns ExtractionArtifact. getExtraction(uploadId) uses getDocumentExtraction(); on failure or empty returns { soil_tests: [] } so UI shows real state.
 *
 * D1 (extraction artifact shape):
 * - Backend extraction returns { soil_tests: SoilTestCandidate[], uploadId?, ... }.
 * - Each SoilTestCandidate is the raw extracted candidate (before user review).
 *
 * Normalized save payload:
 * - After review, frontend shapes each test with shapeSoilTestPayload() and sends
 *   POST /records/normalized (one request per test; body: sourceUploadId, zone_name, test_date, soil_data, field_name, field_id, crop_type, soil_type). Frontend saveNormalizedRecords loops and calls it per test.
 * - ShapedSoilTest shape is defined by shapeSoilTestPayload in soilTestValidation.jsx.
 */

/**
 * Expected shape of one candidate from extraction (D1 artifact item).
 * Maps to MultiTestReview row: zone_name, test_date, lab_info.lab_name, soil_data.*.
 */
export const EXTRACTION_CANDIDATE_SHAPE = {
  zone_name: 'string',
  test_date: 'string (YYYY-MM-DD)',
  lab_info: { lab_name: 'string' },
  soil_data: {
    ph: 'number',
    organic_matter: 'number',
    nitrogen: 'number',
    phosphorus: 'number',
    potassium: 'number',
    calcium: 'number',
    magnesium: 'number',
    sulfur: 'number',
    cec: 'number',
    base_saturation: 'number',
    iron: 'number',
    zinc: 'number',
    manganese: 'number',
    copper: 'number',
    boron: 'number',
  },
};

/**
 * Extraction artifact (D1): what the backend extraction endpoint returns.
 */
export const EXTRACTION_ARTIFACT_SHAPE = {
  soil_tests: 'Array of candidates matching EXTRACTION_CANDIDATE_SHAPE',
  uploadId: 'optional string',
};

/**
 * Normalized save payload: what we send to the backend save endpoint.
 * Each item is the output of shapeSoilTestPayload() (field_name, test_date, zone_name, soil_data, etc.).
 */
export const NORMALIZED_SAVE_PAYLOAD_SHAPE = {
  soil_tests: 'Array of shaped soil tests (see soilTestValidation.shapeSoilTestPayload)',
  uploadId: 'string (for backend to associate saved records with upload)',
};
