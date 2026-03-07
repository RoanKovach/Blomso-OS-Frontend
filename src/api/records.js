/**
 * Backend records API (upload placeholders and normalized soil tests from DynamoDB).
 * GET /records returns { ok: true, records: [...] } (items may be type soil_upload or normalized_soil_test).
 * POST /records/normalized (F1) saves one normalized_soil_test per request; frontend loops for batch.
 * Auth required.
 */

import { apiGet, apiPost, isApiConfigured } from './client.js';

export async function listRecords() {
  if (!isApiConfigured()) {
    return { ok: true, records: [] };
  }
  const res = await apiGet('/records');
  return res && res.records ? res : { ok: true, records: [] };
}

/**
 * Save reviewed extraction as normalized_soil_test records (F1 contract).
 * Backend exposes POST /records/normalized (one record per request); we call it once per test.
 * @param {string} uploadId - Upload record id (sourceUploadId)
 * @param {Array<object>} tests - Shaped zone records (zone_name, test_date, soil_data, field_name?, crop_type?, soil_type?, ...)
 * @returns {Promise<{ ok: boolean, saved?: Array<{ id: string, ... }>, count?: number, error?: string }>}
 */
export async function saveNormalizedRecords(uploadId, tests) {
  if (!isApiConfigured()) {
    throw new Error('API not configured. Set VITE_API_URL to save records.');
  }
  if (!uploadId || !Array.isArray(tests) || tests.length === 0) {
    throw new Error('uploadId and at least one test are required.');
  }
  const saved = [];
  for (const t of tests) {
    const body = {
      sourceUploadId: uploadId,
      zone_name: t.zone_name ?? null,
      test_date: t.test_date ?? null,
      soil_data: t.soil_data ?? null,
      field_name: t.field_name ?? null,
      field_id: t.field_id ?? null,
      crop_type: t.crop_type ?? null,
      soil_type: t.soil_type ?? null,
    };
    const res = await apiPost('/records/normalized', body);
    if (res && res.record) saved.push(res.record);
  }
  return { ok: true, saved, count: saved.length };
}
