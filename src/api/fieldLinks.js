import { apiPost, isApiConfigured } from "./client.js";

/**
 * Field link suggestion contract.
 * Canonical backend route: POST /fields/{id}/suggest-links
 *
 * Returns backend payload (no local envelope assumptions).
 */
export async function suggestFieldLinks(fieldId) {
    if (!isApiConfigured()) {
        throw new Error("API not configured. Set VITE_API_URL.");
    }
    if (!fieldId) {
        throw new Error("fieldId is required");
    }
    return apiPost(`/fields/${encodeURIComponent(fieldId)}/suggest-links`, {});
}

/**
 * Apply suggested links (or user-selected links) for a field.
 * Canonical backend route: POST /fields/{id}/apply-links
 *
 * @param {string} fieldId
 * @param {{ soil_test_ids: string[] }} body
 */
export async function applyFieldLinks(fieldId, body) {
    if (!isApiConfigured()) {
        throw new Error("API not configured. Set VITE_API_URL.");
    }
    if (!fieldId) {
        throw new Error("fieldId is required");
    }
    return apiPost(`/fields/${encodeURIComponent(fieldId)}/apply-links`, body ?? {});
}

