/**
 * Shared helpers for entity CRUD over REST.
 * When VITE_API_URL is not set, list/filter return [], get/create/update/delete throw.
 */

import { apiGet, apiPost, apiPut, apiDelete, isApiConfigured } from './client.js';

function qs(params) {
  if (!params || typeof params !== 'object') return '';
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export function entityList(resource, order, limit) {
  if (!isApiConfigured()) return Promise.resolve([]);
  const query = [];
  if (order) query.push(`order=${encodeURIComponent(order)}`);
  if (limit != null) query.push(`limit=${Number(limit)}`);
  const suffix = query.length ? '?' + query.join('&') : '';
  return apiGet(`/${resource}${suffix}`);
}

export function entityFilter(resource, filter, order, limit) {
  if (!isApiConfigured()) return Promise.resolve([]);
  const query = { ...(typeof filter === 'object' && filter !== null ? filter : {}) };
  if (order) query.order = order;
  if (limit != null) query.limit = Number(limit);
  return apiGet(`/${resource}${qs(query)}`);
}

export function entityGet(resource, id) {
  if (!isApiConfigured()) throw new Error('API not configured');
  return apiGet(`/${resource}/${id}`);
}

export function entityCreate(resource, body) {
  if (!isApiConfigured()) throw new Error('API not configured');
  return apiPost(`/${resource}`, body);
}

export function entityUpdate(resource, id, body) {
  if (!isApiConfigured()) throw new Error('API not configured');
  return apiPut(`/${resource}/${id}`, body);
}

export function entityDelete(resource, id) {
  if (!isApiConfigured()) throw new Error('API not configured');
  return apiDelete(`/${resource}/${id}`);
}

export function entityBulkCreate(resource, records) {
  if (!isApiConfigured()) throw new Error('API not configured');
  return apiPost(`/${resource}/bulk`, records);
}
