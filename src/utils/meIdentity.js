/**
 * Map GET /me JSON to display fields. Supports current API (sub, username, email, …) and
 * optional Cognito-style claims when the backend adds them (given_name, family_name, name).
 */

function trimStr(v) {
    if (v == null) return null;
    const s = String(v).trim();
    return s || null;
}

/**
 * @param {Record<string, unknown> | null | undefined} me - Raw /me response body
 * @returns {{
 *   firstName: string | null,
 *   lastName: string | null,
 *   fullName: string | null,
 *   email: string | null,
 *   userId: string | null,
 *   username: string | null,
 * } | null}
 */
export function pickMeIdentity(me) {
    if (!me || typeof me !== "object") return null;

    const first = trimStr(me.first_name ?? me.given_name);
    const last = trimStr(me.last_name ?? me.family_name);
    let full = trimStr(me.full_name ?? me.name);
    if (!full && (first || last)) {
        full = [first, last].filter(Boolean).join(" ").trim() || null;
    }

    return {
        firstName: first,
        lastName: last,
        fullName: full,
        email: trimStr(me.email),
        userId: trimStr(me.sub ?? me.id),
        username: trimStr(me.username),
    };
}
