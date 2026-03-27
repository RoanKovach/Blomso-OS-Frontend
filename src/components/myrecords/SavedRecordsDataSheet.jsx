import React, { useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Eye } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { formatDateOnlySafe } from "./dateUtils";
import { downloadCsv } from "./csvExport";
import { toast } from "sonner";
import {
    ROW_MODEL_RECORD_LEDGER,
    ROW_MODEL_SOIL_TESTS,
    ROW_MODEL_YIELD_TICKETS,
    ROW_MODEL_FIELD_SUMMARY,
    ROW_MODEL_FIELD_SEASON,
    COLUMN_PRESET_FARMER,
    COLUMN_PRESET_MODELING,
    COLUMN_PRESET_AGRONOMIST_SOIL,
    COLUMN_PRESET_AGRONOMIST_YIELD,
    DEFAULT_COLUMN_PRESET,
    PRESET_COLUMN_KEYS,
} from "./dataSheetConfig";

/** Full registry (sortKey aligns with row keys on dataSheetRows) */
const COLUMN_REGISTRY = [
    { key: "id", label: "Record id", sortKey: "id" },
    { key: "family", label: "Family", sortKey: "family" },
    { key: "fieldName", label: "Field", sortKey: "fieldName" },
    { key: "crop", label: "Crop", sortKey: "crop" },
    { key: "recordDateRaw", label: "Record Date", sortKey: "recordDateRaw" },
    { key: "lastUpdatedRaw", label: "Last Updated", sortKey: "lastUpdatedRaw" },
    { key: "status", label: "Status", sortKey: "status" },
    { key: "sourceUploadDisplay", label: "Source Upload", sortKey: "sourceUploadDisplay" },
    { key: "shi", label: "SHI", sortKey: "shi" },
    { key: "ph", label: "pH", sortKey: "ph" },
    { key: "organicMatter", label: "OM %", sortKey: "organicMatter" },
    { key: "nitrogen", label: "N", sortKey: "nitrogen" },
    { key: "phosphorus", label: "P (ppm)", sortKey: "phosphorus" },
    { key: "potassium", label: "K (ppm)", sortKey: "potassium" },
    { key: "ticketNumber", label: "Ticket #", sortKey: "ticketNumber" },
    { key: "netBushels", label: "Net Bu", sortKey: "netBushels" },
    { key: "pricePerBu", label: "Price/Bu", sortKey: "pricePerBu" },
];

const COL_BY_KEY = Object.fromEntries(COLUMN_REGISTRY.map((c) => [c.key, c]));

function keysToColumns(keys) {
    return keys.map((k) => COL_BY_KEY[k]).filter(Boolean);
}

function displayRecordDate(raw) {
    if (raw == null || raw === "") return "—";
    return formatDateOnlySafe(raw, "MMM d, yyyy") || "—";
}

function displayLastUpdated(raw) {
    if (raw == null || raw === "") return "—";
    try {
        const d = typeof raw === "string" ? parseISO(raw) : new Date(raw);
        if (!isValid(d)) return "—";
        return format(d, "MMM d, yyyy HH:mm");
    } catch {
        return "—";
    }
}

function displayNum(v) {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    return Number.isFinite(n) ? String(n) : "—";
}

function sortValue(row, key) {
    const v = row[key];
    if (key === "recordDateRaw" || key === "lastUpdatedRaw") {
        if (v == null || v === "") return null;
        try {
            const d = typeof v === "string" ? parseISO(v) : new Date(v);
            return isValid(d) ? d.getTime() : null;
        } catch {
            return null;
        }
    }
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return v;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
    return String(v);
}

function compareSort(a, b, key) {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av).localeCompare(String(bv), undefined, { numeric: true });
}

function cellForExport(row, key) {
    switch (key) {
        case "recordDateRaw":
            return displayRecordDate(row.recordDateRaw) === "—" ? "" : displayRecordDate(row.recordDateRaw);
        case "lastUpdatedRaw":
            return displayLastUpdated(row.lastUpdatedRaw) === "—" ? "" : displayLastUpdated(row.lastUpdatedRaw);
        case "ph":
        case "organicMatter":
        case "nitrogen":
        case "phosphorus":
        case "potassium":
        case "netBushels":
        case "pricePerBu":
        case "shi":
            return row[key] === null || row[key] === undefined ? "" : String(row[key]);
        case "ticketNumber":
            return row.ticketNumber === null || row.ticketNumber === undefined ? "" : String(row.ticketNumber);
        case "status":
            return row.status == null ? "" : String(row.status);
        case "id":
            return row.id == null ? "" : String(row.id);
        case "sourceUploadDisplay":
            return row.sourceUploadDisplay == null ? "" : String(row.sourceUploadDisplay);
        default:
            return row[key] === null || row[key] === undefined ? "" : String(row[key]);
    }
}

function renderCell(row, key) {
    switch (key) {
        case "recordDateRaw":
            return displayRecordDate(row.recordDateRaw);
        case "lastUpdatedRaw":
            return displayLastUpdated(row.lastUpdatedRaw);
        case "ph":
        case "organicMatter":
        case "nitrogen":
        case "phosphorus":
        case "potassium":
        case "netBushels":
        case "pricePerBu":
        case "shi":
            return displayNum(row[key]);
        case "ticketNumber":
            return row.ticketNumber != null && row.ticketNumber !== "" ? String(row.ticketNumber) : "—";
        case "status":
            return row.status ?? "—";
        case "id":
            return row.id != null && row.id !== "" ? String(row.id) : "—";
        case "sourceUploadDisplay":
            return row.sourceUploadDisplay != null && row.sourceUploadDisplay !== ""
                ? String(row.sourceUploadDisplay)
                : "—";
        default:
            return row[key] == null || row[key] === "" ? "—" : String(row[key]);
    }
}

const SavedRecordsDataSheet = forwardRef(function SavedRecordsDataSheet(
    { rows = [], onViewRecord, rowModel = ROW_MODEL_RECORD_LEDGER, onRowModelChange },
    ref
) {
    const [preset, setPreset] = useState(DEFAULT_COLUMN_PRESET);
    const [sortKey, setSortKey] = useState("recordDateRaw");
    const [sortDir, setSortDir] = useState("desc");

    const visibleColumns = useMemo(() => {
        const keys = PRESET_COLUMN_KEYS[preset] ?? PRESET_COLUMN_KEYS[DEFAULT_COLUMN_PRESET];
        return keysToColumns(keys);
    }, [preset]);

    useEffect(() => {
        const allowed = new Set(visibleColumns.map((c) => c.sortKey));
        if (!allowed.has(sortKey)) {
            setSortKey("recordDateRaw");
            setSortDir("desc");
        }
    }, [visibleColumns, sortKey]);

    const sortedRows = useMemo(() => {
        const copy = [...rows];
        copy.sort((a, b) => {
            const c = compareSort(a, b, sortKey);
            return sortDir === "asc" ? c : -c;
        });
        return copy;
    }, [rows, sortKey, sortDir]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    useImperativeHandle(
        ref,
        () => ({
            exportCsv: () => {
                if (!sortedRows.length) {
                    toast.error("No rows to export.");
                    return;
                }
                const headers = visibleColumns.map((c) => c.label);
                const keys = visibleColumns.map((c) => c.key);
                const dataRows = sortedRows.map((row) => keys.map((k) => cellForExport(row, k)));
                const stamp = new Date().toISOString().split("T")[0];
                const safeModel = String(rowModel || ROW_MODEL_RECORD_LEDGER).replace(/[^a-z0-9_-]/gi, "_");
                const safePreset = String(preset || DEFAULT_COLUMN_PRESET).replace(/[^a-z0-9_-]/gi, "_");
                downloadCsv(`saved-records-${safeModel}-${safePreset}-${stamp}.csv`, headers, dataRows);
                toast.success("Export complete – downloading file…");
            },
        }),
        [sortedRows, visibleColumns, rowModel, preset]
    );

    if (!rows.length) {
        return (
            <div className="rounded-lg border bg-white p-8 text-center text-gray-600">
                No saved records match the current filters.
            </div>
        );
    }

    return (
        <div className="hidden md:block space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Row model</span>
                    <Select value={rowModel} onValueChange={(v) => onRowModelChange?.(v)}>
                        <SelectTrigger className="h-9 w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ROW_MODEL_RECORD_LEDGER}>Record Ledger</SelectItem>
                            <SelectItem value={ROW_MODEL_SOIL_TESTS}>Soil Tests</SelectItem>
                            <SelectItem value={ROW_MODEL_YIELD_TICKETS}>Yield Tickets</SelectItem>
                            <SelectItem value={ROW_MODEL_FIELD_SUMMARY} disabled>
                                Field Summary (coming soon)
                            </SelectItem>
                            <SelectItem value={ROW_MODEL_FIELD_SEASON} disabled>
                                Field-Season (coming soon)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Column preset</span>
                    <Select value={preset} onValueChange={setPreset}>
                        <SelectTrigger className="h-9 w-[220px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={COLUMN_PRESET_FARMER}>Farmer Summary</SelectItem>
                            <SelectItem value={COLUMN_PRESET_MODELING}>Modeling Basic</SelectItem>
                            <SelectItem value={COLUMN_PRESET_AGRONOMIST_SOIL}>Agronomist Soil</SelectItem>
                            <SelectItem value={COLUMN_PRESET_AGRONOMIST_YIELD}>Agronomist Yield</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                <Table className="text-sm">
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            {onViewRecord && (
                                <TableHead className="sticky left-0 z-10 w-12 whitespace-nowrap bg-gray-50 font-semibold text-gray-800">
                                    View
                                </TableHead>
                            )}
                            {visibleColumns.map((col) => (
                                <TableHead
                                    key={col.key}
                                    className="whitespace-nowrap font-semibold text-gray-800"
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="-ml-2 h-8 px-2 font-semibold text-gray-800 hover:bg-gray-100"
                                        onClick={() => toggleSort(col.sortKey)}
                                    >
                                        {col.label}
                                        <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-60" />
                                    </Button>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedRows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-green-50/40">
                                {onViewRecord && (
                                    <TableCell className="sticky left-0 z-10 bg-white p-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onViewRecord(row)}
                                            aria-label="View record details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                )}
                                {visibleColumns.map((col) => (
                                    <TableCell key={col.key}>{renderCell(row, col.key)}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
});

SavedRecordsDataSheet.displayName = "SavedRecordsDataSheet";

export default SavedRecordsDataSheet;
