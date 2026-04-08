/**
 * Documents domain API (core API).
 * Upload session presign remains on POST /functions/upload/* (see uploadService.jsx).
 */

import { apiGet, apiPost, isApiConfigured } from './client.js';

/**
 * @returns {Promise<{ ok?: boolean, documents?: unknown[] } & Record<string, unknown>>}
 */
export async function listDocuments() {
  if (!isApiConfigured()) {
    return { ok: true, documents: [] };
  }
  const res = await apiGet('/documents');
  if (!res || typeof res !== 'object') {
    return { ok: true, documents: [] };
  }
  const documents =
    res.documents ?? res.items ?? (Array.isArray(res) ? res : undefined);
  if (documents !== undefined) {
    return { ...res, ok: res.ok !== false, documents: Array.isArray(documents) ? documents : [] };
  }
  return { ok: true, documents: [] };
}

/**
 * @param {string} id - Document id (same as upload / record id where applicable)
 * @returns {Promise<{ ok: boolean, document?: object }>}
 */
export async function getDocument(id) {
  if (!isApiConfigured() || !id) {
    return { ok: false };
  }
  const res = await apiGet(`/documents/${id}`);
  return res && res.ok ? res : { ok: false };
}

/**
 * Raw extraction artifact for a document.
 * @param {string} id - Document id
 * @returns {Promise<object|null>}
 */
export async function getDocumentExtraction(id) {
  if (!isApiConfigured() || !id) {
    return null;
  }
  return apiGet(`/documents/${id}/extraction`);
}

/**
 * Request re-extraction for a document.
 * @param {string} id - Document id
 * @returns {Promise<{ ok: boolean, id?: string, message?: string }>}
 */
export async function reextractDocument(id) {
  if (!isApiConfigured() || !id) {
    return { ok: false };
  }
  const res = await apiPost(`/documents/${id}/reextract`, {});
  return res && res.ok !== false ? { ok: true, ...res } : { ok: false };
}
