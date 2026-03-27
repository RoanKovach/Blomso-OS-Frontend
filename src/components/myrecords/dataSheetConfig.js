/**
 * Data Sheet v2.2 — row models and column preset key lists (frontend-only).
 */

export const ROW_MODEL_RECORD_LEDGER = "record_ledger";
export const ROW_MODEL_SOIL_TESTS = "soil_tests";
export const ROW_MODEL_YIELD_TICKETS = "yield_tickets";
export const ROW_MODEL_FIELD_SUMMARY = "field_summary";
export const ROW_MODEL_FIELD_SEASON = "field_season";

export const COLUMN_PRESET_FARMER = "farmer";
export const COLUMN_PRESET_MODELING = "modeling";
export const COLUMN_PRESET_AGRONOMIST_SOIL = "agronomist_soil";
export const COLUMN_PRESET_AGRONOMIST_YIELD = "agronomist_yield";

/** Default column preset when opening Data Sheet */
export const DEFAULT_COLUMN_PRESET = COLUMN_PRESET_MODELING;

/** @type {Record<string, string[]>} */
export const PRESET_COLUMN_KEYS = {
    [COLUMN_PRESET_FARMER]: [
        "fieldName",
        "crop",
        "recordDateRaw",
        "family",
        "ph",
        "ticketNumber",
        "netBushels",
        "pricePerBu",
        "sourceUploadDisplay",
    ],
    [COLUMN_PRESET_MODELING]: [
        "id",
        "family",
        "fieldName",
        "crop",
        "recordDateRaw",
        "lastUpdatedRaw",
        "ph",
        "phosphorus",
        "potassium",
        "ticketNumber",
        "netBushels",
        "pricePerBu",
    ],
    [COLUMN_PRESET_AGRONOMIST_SOIL]: [
        "fieldName",
        "crop",
        "recordDateRaw",
        "ph",
        "organicMatter",
        "phosphorus",
        "potassium",
    ],
    [COLUMN_PRESET_AGRONOMIST_YIELD]: [
        "fieldName",
        "crop",
        "recordDateRaw",
        "ticketNumber",
        "netBushels",
        "pricePerBu",
    ],
};
