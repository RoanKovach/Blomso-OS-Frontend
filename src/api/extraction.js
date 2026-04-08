/**
 * Extraction API for backend upload path.
 * Uses GET /documents/{id}/extraction (documents domain); behavior matches prior getExtraction consumers.
 */

import { apiPost, isApiConfigured } from './client.js';
import { getDocumentExtraction } from './documents.js';

/**
 * Fetch extraction artifact for an upload/document (artifact may have soil_tests or payload.soil_tests).
 * When API is configured: on failure or missing soil_tests returns { soil_tests: [] } so UI shows real state.
 * @param {string} uploadId - Document / record id from GET /records or upload complete
 * @returns {Promise<{ soil_tests: Array, uploadId?: string, parserVersion?: string }>}
 */
export async function getExtraction(uploadId) {
  if (!uploadId) {
    return { soil_tests: [] };
  }
  if (isApiConfigured()) {
    try {
      const res = await getDocumentExtraction(uploadId);
      if (res && res.ok !== false) {
        const soil_tests = Array.isArray(res.soil_tests)
          ? res.soil_tests
          : Array.isArray(res.payload?.soil_tests)
            ? res.payload.soil_tests
            : [];
        if (soil_tests.length === 0 && typeof console?.debug === 'function') {
          console.debug('[extraction] Artifact loaded but no soil_tests (placeholder or empty)', { uploadId, parserVersion: res.parserVersion });
        }
        return {
          ...res,
          soil_tests,
          uploadId,
          parserVersion: res.parserVersion,
        };
      }
    } catch (_) {
      /* endpoint missing or failed — empty state */
    }
    return { soil_tests: [], uploadId };
  }
  return { soil_tests: [], uploadId };
}

/**
 * Send normalized save payload for an upload (legacy single-call shape).
 * Prefer saveNormalizedRecords in api/records.js which calls POST /records/normalized once per test (backend contract).
 * @param {string} uploadId
 * @param {Array} shapedTests - Output of shapeSoilTestPayload() per test
 * @returns {Promise<{ ok: boolean, saved?: number }>}
 */
export async function saveNormalized(uploadId, shapedTests) {
  if (!uploadId || !Array.isArray(shapedTests)) {
    return { ok: false };
  }
  if (isApiConfigured()) {
    try {
      const res = await apiPost(`/records/${uploadId}/normalized`, { uploadId, soil_tests: shapedTests });
      if (res && res.ok) {
        return { ok: true, saved: res.saved ?? shapedTests.length };
      }
    } catch (_) {
      // Backend may expect per-test POST /records/normalized; caller should use saveNormalizedRecords
    }
  }
  return { ok: false };
}
