/**
 * Data Sheet — one sheet type = one row grain. Column lists per sheet; defaults for show/hide.
 */

export const SHEET_SOIL = "soil_tests";
export const SHEET_YIELD = "yield_tickets";
export const SHEET_FIELDS = "fields";

export const DEFAULT_SHEET_TYPE = SHEET_SOIL;

/** Full column defs per sheet: { key, label, sortKey } */
export const SOIL_COLUMNS = [
    { key: "fieldName", label: "Field", sortKey: "fieldName" },
    { key: "linkedFieldName", label: "Linked Field", sortKey: "linkedFieldName" },
    { key: "crop", label: "Crop", sortKey: "crop" },
    { key: "recordDateRaw", label: "Test Date", sortKey: "recordDateRaw" },
    { key: "ph", label: "pH", sortKey: "ph" },
    { key: "organicMatter", label: "OM %", sortKey: "organicMatter" },
    { key: "phosphorus", label: "P (ppm)", sortKey: "phosphorus" },
    { key: "potassium", label: "K (ppm)", sortKey: "potassium" },
    { key: "cec", label: "CEC", sortKey: "cec" },
    { key: "lastUpdatedRaw", label: "Last Updated", sortKey: "lastUpdatedRaw" },
];

export const YIELD_COLUMNS = [
    { key: "fieldName", label: "Field", sortKey: "fieldName" },
    { key: "crop", label: "Crop", sortKey: "crop" },
    { key: "recordDateRaw", label: "Ticket Date", sortKey: "recordDateRaw" },
    { key: "ticketNumber", label: "Ticket #", sortKey: "ticketNumber" },
    { key: "netBushels", label: "Net Bushels", sortKey: "netBushels" },
    { key: "pricePerBu", label: "Price/Bu", sortKey: "pricePerBu" },
    { key: "moisture", label: "Moisture", sortKey: "moisture" },
    { key: "testWeight", label: "Test Weight", sortKey: "testWeight" },
    { key: "lastUpdatedRaw", label: "Last Updated", sortKey: "lastUpdatedRaw" },
];

export const FIELD_COLUMNS = [
    { key: "fieldName", label: "Field", sortKey: "fieldName" },
    { key: "acres", label: "Acres", sortKey: "acres" },
    { key: "latestCrop", label: "Latest Crop", sortKey: "latestCrop" },
    { key: "soilTestCount", label: "Soil Test Count", sortKey: "soilTestCount" },
    { key: "yieldTicketCount", label: "Yield Ticket Count", sortKey: "yieldTicketCount" },
    { key: "latestSoilDate", label: "Latest Soil Date", sortKey: "latestSoilDate" },
    { key: "latestPh", label: "Latest pH", sortKey: "latestPh" },
    { key: "latestP", label: "Latest P", sortKey: "latestP" },
    { key: "latestK", label: "Latest K", sortKey: "latestK" },
    { key: "latestYieldDate", label: "Latest Yield Date", sortKey: "latestYieldDate" },
    { key: "totalNetBushels", label: "Total Net Bushels", sortKey: "totalNetBushels" },
    { key: "lastUpdatedRaw", label: "Last Updated", sortKey: "lastUpdatedRaw" },
];

/** Default visible column keys (View column is always separate in UI) */
export const DEFAULT_VISIBLE_SOIL = SOIL_COLUMNS.map((c) => c.key);
export const DEFAULT_VISIBLE_YIELD = YIELD_COLUMNS.map((c) => c.key);
export const DEFAULT_VISIBLE_FIELDS = FIELD_COLUMNS.map((c) => c.key);

export function getColumnsForSheet(sheetType) {
    if (sheetType === SHEET_YIELD) return YIELD_COLUMNS;
    if (sheetType === SHEET_FIELDS) return FIELD_COLUMNS;
    return SOIL_COLUMNS;
}

export function getDefaultVisibleKeys(sheetType) {
    if (sheetType === SHEET_YIELD) return [...DEFAULT_VISIBLE_YIELD];
    if (sheetType === SHEET_FIELDS) return [...DEFAULT_VISIBLE_FIELDS];
    return [...DEFAULT_VISIBLE_SOIL];
}
