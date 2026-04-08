/**
 * Canonical field identity for soil tests and yield tickets across My Records.
 *
 * - canonicalFieldId: linkedFieldId / field_id when present (same priority for both families)
 * - canonicalFieldName: catalog name from fieldsMap when id present
 * - sourceFieldLabel: document / extracted / entered label (secondary UI)
 * - displayFieldName: main table column — catalog name when linked, else sensible fallback
 * - groupKey: identical rule for soil and yield — fid:id else name:normalizedFallback
 */

export function normalizeGroupFallbackString(s) {
    const t = String(s ?? "").trim();
    return t || "Unnamed";
}

/**
 * @param {object} test - normalized soil test from My Records state
 * @param {Map<string, string>} fieldsMap - field id -> catalog name
 * @param {Map<string, object>} sourceUploadMap - upload id -> upload record
 * @param {(rec: object) => object|null} getContext - parse contextSnapshot
 */
export function getCanonicalFieldContextForSoilTest(test, fieldsMap, sourceUploadMap, getContext) {
    const upload = test.sourceUploadId ? sourceUploadMap.get(test.sourceUploadId) : null;
    const ctx = upload ? getContext(upload) : null;

    const canonicalFieldId = test.field_id ?? test.linkedFieldId ?? upload?.linkedFieldId ?? null;
    const catalogName = canonicalFieldId ? fieldsMap.get(canonicalFieldId) : null;

    const sourceFieldLabel =
        (test.zone_name && String(test.zone_name).trim()) ||
        (test.field_name && String(test.field_name).trim()) ||
        (upload?.enteredFieldLabel && String(upload.enteredFieldLabel).trim()) ||
        (ctx?.field_name && String(ctx.field_name).trim()) ||
        null;

    const displayFieldName =
        catalogName ||
        sourceFieldLabel ||
        upload?.linkedFieldName ||
        test.field_name ||
        upload?.enteredFieldLabel ||
        ctx?.field_name ||
        upload?.filename ||
        "Unnamed";

    const groupKey = canonicalFieldId
        ? `fid:${canonicalFieldId}`
        : `name:${normalizeGroupFallbackString(
              sourceFieldLabel || test.field_name || upload?.enteredFieldLabel || "Unnamed"
          )}`;

    return {
        canonicalFieldId,
        canonicalFieldName: catalogName ?? null,
        sourceFieldLabel,
        displayFieldName,
        groupKey,
    };
}

/**
 * @param {object} rec - normalized yield ticket from My Records state
 */
export function getCanonicalFieldContextForYieldRecord(rec, fieldsMap, sourceUploadMap, getContext) {
    const upload = rec.sourceUploadId ? sourceUploadMap.get(rec.sourceUploadId) : null;
    const ctx = upload ? getContext(upload) : null;

    const canonicalFieldId = rec.field_id ?? rec.linkedFieldId ?? upload?.linkedFieldId ?? null;
    const catalogName = canonicalFieldId ? fieldsMap.get(canonicalFieldId) : null;

    const sourceFieldLabel =
        (rec.field_name && String(rec.field_name).trim()) ||
        (upload?.enteredFieldLabel && String(upload.enteredFieldLabel).trim()) ||
        (ctx?.field_name && String(ctx.field_name).trim()) ||
        null;

    const displayFieldName =
        catalogName ||
        sourceFieldLabel ||
        upload?.linkedFieldName ||
        rec.field_name ||
        upload?.enteredFieldLabel ||
        "—";

    const groupKey = canonicalFieldId
        ? `fid:${canonicalFieldId}`
        : `name:${normalizeGroupFallbackString(
              sourceFieldLabel || rec.field_name || upload?.enteredFieldLabel || "Unnamed"
          )}`;

    return {
        canonicalFieldId,
        canonicalFieldName: catalogName ?? null,
        sourceFieldLabel,
        displayFieldName,
        groupKey,
    };
}
