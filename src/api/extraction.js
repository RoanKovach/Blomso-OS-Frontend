/**
 * Extraction and normalized-save API for backend upload path.
 * C1: get extraction artifact for an upload (stub until backend implements).
 * Normalized save: prepare payload and call stub (no persistence until backend implements).
 */

import { apiGet, apiPost, isApiConfigured } from './client.js';

/**
 * Fetch extraction artifact for an upload (D1 shape).
 * Stub: returns mock soil_tests so review UI can be exercised. Replace with real GET when backend has extraction.
 * @param {string} uploadId - Record id from GET /records or upload complete
 * @returns {Promise<{ soil_tests: Array, uploadId?: string }>}
 */
export async function getExtraction(uploadId) {
  if (!uploadId) {
    return { soil_tests: [] };
  }
  if (isApiConfigured()) {
    try {
      const res = await apiGet(`/records/${uploadId}/extraction`);
      if (res && Array.isArray(res.soil_tests)) {
        return { soil_tests: res.soil_tests, uploadId };
      }
    } catch (_) {
      // Backend endpoint not implemented; fall through to stub
    }
  }
  return getExtractionStub(uploadId);
}

/**
 * Stub extraction for development and E1 review flow.
 * Returns one mock candidate so user can open review and edit.
 */
function getExtractionStub(uploadId) {
  return {
    uploadId,
    soil_tests: [
      {
        zone_name: 'Zone 1',
        test_date: new Date().toISOString().slice(0, 10),
        lab_info: { lab_name: '' },
        soil_data: {
          ph: null,
          organic_matter: null,
          nitrogen: null,
          phosphorus: null,
          potassium: null,
          calcium: null,
          magnesium: null,
          sulfur: null,
          cec: null,
          base_saturation: null,
          iron: null,
          zinc: null,
          manganese: null,
          copper: null,
          boron: null,
        },
      },
    ],
  };
}

/**
 * Send normalized save payload for an upload.
 * Stub: no backend persistence yet; logs payload and returns success. Replace with real POST when backend implements.
 * @param {string} uploadId
 * @param {Array} shapedTests - Output of shapeSoilTestPayload() per test
 * @returns {Promise<{ ok: boolean, saved?: number }>}
 */
export async function saveNormalized(uploadId, shapedTests) {
  if (!uploadId || !Array.isArray(shapedTests)) {
    return { ok: false };
  }
  const payload = { uploadId, soil_tests: shapedTests };
  if (isApiConfigured()) {
    try {
      const res = await apiPost(`/records/${uploadId}/normalized`, payload);
      if (res && res.ok) {
        return { ok: true, saved: res.saved ?? shapedTests.length };
      }
    } catch (_) {
      // Backend not implemented; fall through to stub
    }
  }
  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[extraction] saveNormalized stub', { uploadId, count: shapedTests.length, payload });
  }
  return { ok: true, saved: shapedTests.length };
}
