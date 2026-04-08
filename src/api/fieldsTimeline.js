/**
 * Field Story / timeline API — GET /fields/{id}/timeline is the canonical payload for a field.
 */

import { apiGet, isApiConfigured } from './client.js';

const EMPTY_TIMELINE = {
  documents: [],
  soil_tests: [],
  yield_tickets: [],
  weather: [],
  signals: [],
  outputs: [],
};

/**
 * @param {string} fieldId
 * @returns {Promise<object|null>} Raw JSON, or null if API not configured / no id
 */
export async function getFieldTimeline(fieldId) {
  if (!isApiConfigured() || !fieldId) {
    return null;
  }
  return apiGet(`/fields/${encodeURIComponent(fieldId)}/timeline`);
}

/**
 * Normalize timeline response with safe defaults for missing arrays.
 * Unwraps common `{ data: ... }` envelope if present.
 *
 * @param {object|null|undefined} payload
 */
export function normalizeFieldTimelineResponse(payload) {
  if (payload == null || typeof payload !== 'object') {
    return {
      field: null,
      summary: null,
      latest: {},
      timeline: { ...EMPTY_TIMELINE },
      events: [],
      counts: {},
    };
  }

  const root = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const timeline = root.timeline && typeof root.timeline === 'object' ? root.timeline : {};

  const soil =
    timeline.soil_tests ??
    timeline.soilTests ??
    (Array.isArray(timeline.soil_test) ? timeline.soil_test : null);
  const yields =
    timeline.yield_tickets ??
    timeline.yieldTickets ??
    (Array.isArray(timeline.yield_ticket) ? timeline.yield_ticket : null);

  return {
    field: root.field ?? null,
    summary: root.summary ?? null,
    latest: root.latest && typeof root.latest === 'object' ? root.latest : {},
    timeline: {
      documents: Array.isArray(timeline.documents) ? timeline.documents : [],
      soil_tests: Array.isArray(soil) ? soil : [],
      yield_tickets: Array.isArray(yields) ? yields : [],
      weather: Array.isArray(timeline.weather) ? timeline.weather : [],
      signals: Array.isArray(timeline.signals) ? timeline.signals : [],
      outputs: Array.isArray(timeline.outputs) ? timeline.outputs : [],
    },
    events: Array.isArray(root.events) ? root.events : [],
    counts: root.counts && typeof root.counts === 'object' ? root.counts : {},
  };
}
