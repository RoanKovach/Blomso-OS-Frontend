/**
 * Normalize POST /functions/exportSoilTests response: apiPost returns parsed JSON or CSV text, not { status, data }.
 */

function tryDecodeBase64Csv(b64) {
    if (typeof b64 !== "string" || !b64.length) return null;
    try {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: "text/csv;charset=utf-8" });
    } catch {
        return null;
    }
}

/**
 * @param {unknown} body - Return value from exportSoilTests() / apiPost
 * @returns {Blob}
 */
export function blobFromExportSoilTestsResponse(body) {
    if (body == null) {
        throw new Error("Empty export response");
    }
    if (typeof body === "string") {
        return new Blob([body], { type: "text/csv;charset=utf-8" });
    }
    if (typeof body === "object") {
        const candidates = [
            body.csv,
            body.data,
            body.output,
            body.payload,
            body?.data?.output,
            body?.data?.csv,
            body?.data?.data,
        ];
        for (const c of candidates) {
            if (typeof c === "string" && c.length) {
                return new Blob([c], { type: "text/csv;charset=utf-8" });
            }
        }
        const fromB64 = tryDecodeBase64Csv(body.base64 ?? body.csvBase64);
        if (fromB64) return fromB64;
    }
    throw new Error("Could not parse export response — unexpected shape from server");
}
