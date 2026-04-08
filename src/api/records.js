/**
 * Backend records API (upload placeholders and normalized soil tests from DynamoDB).
 * GET /records returns { ok: true, records: [...] } (items may be type soil_upload or normalized_soil_test).
 * GET /records/{id} returns { ok: true, record } (owner check).
 * POST /records/normalized saves one normalized record per request (soil_test or yield_scale_ticket); frontend loops for batch.
 * Body may include field linkage and lineage: linkedFieldId, linkedFieldName, enteredFieldLabel, field_id, field_name,
 * extractionArtifactKey, reviewedArtifactKey, normalizedArtifactKey.
 * Auth required.
 */

import { apiGet, apiPost, apiPatch, apiDelete, isApiConfigured } from './client.js';
import { reextractDocument } from './documents.js';

export async function listRecords() {
  if (!isApiConfigured()) {
    return { ok: true, records: [] };
  }
  const res = await apiGet('/records');
  return res && res.records ? res : { ok: true, records: [] };
}

/**
 * Fetch a single record by id (GET /records/{id}). Used to read extractionStatus and extractionArtifactKey.
 * @param {string} id - Record id (e.g. uploadId)
 * @returns {Promise<{ ok: boolean, record?: object }>}
 */
export async function getRecord(id) {
  if (!isApiConfigured() || !id) {
    return { ok: false };
  }
  const res = await apiGet(`/records/${id}`);
  return res && res.ok ? res : { ok: false };
}

/**
 * Update a saved record by id.
 * For normalized soil tests, backend enforces ownership and type === normalized_soil_test.
 * @param {string} id
 * @param {object} body - Partial fields to update
 */
export async function updateRecord(id, body) {
  if (!isApiConfigured() || !id) {
    return { ok: false };
  }
  const res = await apiPatch(`/records/${id}`, body ?? {});
  return res && res.ok ? res : { ok: false };
}

/**
 * Delete a saved record by id (DELETE /records/{id}).
 * Only normalized_soil_test records owned by the user will be deleted.
 * @param {string} id
 */
export async function deleteRecord(id) {
  if (!isApiConfigured() || !id) {
    return { ok: false };
  }
  const res = await apiDelete(`/records/${id}`);
  return res && res.ok ? res : { ok: false };
}

/**
 * Trigger re-extraction for a document (POST /documents/{id}/reextract).
 * @param {string} id - Document / upload record id
 * @returns {Promise<{ ok: boolean, id?: string, message?: string }>}
 */
export async function triggerExtraction(id) {
  if (!isApiConfigured() || !id) {
    return { ok: false };
  }
  return reextractDocument(id);
}

/**
 * Save reviewed extraction as normalized records (soil tests or yield tickets).
 * Backend exposes POST /records/normalized (one record per request); we call it once per record.
 * @param {string} uploadId - Upload record id (sourceUploadId)
 * @param {Array<object>} records - Shaped records (soil or yield, depending on documentFamily)
 * @param {{
 *   extractionArtifactKey?: string,
 *   reviewedArtifactKey?: string,
 *   normalizedArtifactKey?: string,
 *   linkedFieldId?: string|null,
 *   linkedFieldName?: string|null,
 *   enteredFieldLabel?: string|null,
 *   field_id?: string|null,
 *   field_name?: string|null,
 *   documentFamily?: string
 * }} [options]
 * @returns {Promise<{ ok: boolean, saved?: Array<{ id: string, ... }>, count?: number, error?: string }>}
 */
function assignIfPresent(target, key, value) {
  if (value === undefined || value === null || value === '') return;
  target[key] = value;
}

function mergeFieldLinkage(body, record, options) {
  const linkedFieldId = record.linkedFieldId ?? options.linkedFieldId;
  const linkedFieldName = record.linkedFieldName ?? options.linkedFieldName;
  const enteredFieldLabel = record.enteredFieldLabel ?? options.enteredFieldLabel;
  const field_id = record.field_id ?? options.field_id ?? linkedFieldId;
  const field_name = record.field_name ?? options.field_name ?? linkedFieldName;

  assignIfPresent(body, 'linkedFieldId', linkedFieldId);
  assignIfPresent(body, 'linkedFieldName', linkedFieldName);
  assignIfPresent(body, 'enteredFieldLabel', enteredFieldLabel);
  assignIfPresent(body, 'field_id', field_id);
  assignIfPresent(body, 'field_name', field_name);

  const reviewed =
    record.reviewedArtifactKey ?? options.reviewedArtifactKey;
  const normalizedKey =
    record.normalizedArtifactKey ?? options.normalizedArtifactKey;
  if (reviewed) body.reviewedArtifactKey = reviewed;
  if (normalizedKey) body.normalizedArtifactKey = normalizedKey;
}

export async function saveNormalizedRecords(uploadId, records, options = {}) {
  if (!isApiConfigured()) {
    throw new Error('API not configured. Set VITE_API_URL to save records.');
  }
  if (!uploadId || !Array.isArray(records) || records.length === 0) {
    throw new Error('uploadId and at least one record are required.');
  }

  const {
    extractionArtifactKey,
    documentFamily = 'soil_test',
  } = options;

  const saved = [];

  for (const r of records) {
    let body;

    if (documentFamily === 'yield_scale_ticket') {
      body = {
        sourceUploadId: uploadId,
        documentFamily: 'yield_scale_ticket',
        ticket_number: r.ticket_number ?? r.ticketNumber ?? null,
        ticket_date: r.ticket_date ?? r.ticketDate ?? null,
        field_name: r.field_name ?? r.fieldLabel ?? null,
        field_id: r.field_id ?? null,
        crop: r.crop ?? r.crop_type ?? null,
        truck_id: r.truck_id ?? r.truckId ?? r.vehicleId ?? null,
        gross_weight_lb: r.gross_weight_lb ?? r.grossWeight ?? null,
        tare_weight_lb: r.tare_weight_lb ?? r.tareWeight ?? null,
        net_weight_lb: r.net_weight_lb ?? r.netWeight ?? null,
        gross_bushels: r.gross_bushels ?? r.grossBushels ?? null,
        shrink_bushels: r.shrink_bushels ?? r.shrink ?? null,
        net_bushels: r.net_bushels ?? r.netBushels ?? null,
        quantity_bushels: r.quantity_bushels ?? r.quantityBushels ?? null,
        moisture_pct: r.moisture_pct ?? r.moisture ?? null,
        test_weight_lb_bu: r.test_weight_lb_bu ?? r.testWeight ?? null,
        price_per_bu:
          r.price_per_bu ?? r.price_per_bushel ?? r.pricePerBushel ?? r.price ?? null,
      };
    } else {
      body = {
        sourceUploadId: uploadId,
        documentFamily: 'soil_test',
        zone_name: r.zone_name ?? null,
        test_date: r.test_date ?? null,
        soil_data: r.soil_data ?? null,
        field_name: r.field_name ?? null,
        field_id: r.field_id ?? null,
        crop_type: r.crop_type ?? null,
        soil_type: r.soil_type ?? null,
      };
    }

    mergeFieldLinkage(body, r, options);

    if (extractionArtifactKey) body.extractionArtifactKey = extractionArtifactKey;

    const res = await apiPost('/records/normalized', body);
    if (res && res.record) saved.push(res.record);
  }

  return { ok: true, saved, count: saved.length };
}
