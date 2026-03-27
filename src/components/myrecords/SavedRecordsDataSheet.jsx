import React, { useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Eye } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { formatDateOnlySafe } from "./dateUtils";
import { downloadCsv } from "./csvExport";
import { toast } from "sonner";

/** Full registry (sortKey aligns with row keys on dataSheetRows) */
const COLUMN_REGISTRY = [
    { key: "family", label: "Family", sortKey: "family" },
    { key: "fieldName", label: "Field", sortKey: "fieldName" },
    { key: "crop", label: "Crop", sortKey: "crop" },
    { key: "recordDateRaw", label: "Record Date", sortKey: "recordDateRaw" },
    { key: "lastUpdatedRaw", label: "Last Updated", sortKey: "lastUpdatedRaw" },
    { key: "status", label: "Status", sortKey: "status" },
    { key: "ph", label: "pH", sortKey: "ph" },
    { key: "organicMatter", label: "OM %", sortKey: "organicMatter" },
    { key: "phosphorus", label: "P (ppm)", sortKey: "phosphorus" },
    { key: "potassium", label: "K (ppm)", sortKey: "potassium" },
    { key: "ticketNumber", label: "Ticket #", sortKey: "ticketNumber" },
    { key: "netBushels", label: "Net Bu", sortKey: "netBushels" },
    { key: "pricePerBu", label: "Price/Bu", sortKey: "pricePerBu" },
];

const COL_BY_KEY = Object.fromEntries(COLUMN_REGISTRY.map((c) => [c.key, c]));

/** Default v2.1: 11 columns — no Status, no OM */
const PRESET_MODELING_KEYS = [
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
];

const PRESET_SOIL_KEYS = [
    "family",
    "fieldName",
    "crop",
    "recordDateRaw",
    "lastUpdatedRaw",
    "ph",
    "organicMatter",
    "phosphorus",
    "potassium",
];

const PRESET_YIELD_KEYS = [
    "family",
    "fieldName",
    "crop",
    "recordDateRaw",
    "lastUpdatedRaw",
    "ticketNumber",
    "netBushels",
    "pricePerBu",
];

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
        case "phosphorus":
        case "potassium":
        case "netBushels":
        case "pricePerBu":
            return row[key] === null || row[key] === undefined ? "" : String(row[key]);
        case "ticketNumber":
            return row.ticketNumber === null || row.ticketNumber === undefined ? "" : String(row.ticketNumber);
        case "status":
            return row.status == null ? "" : String(row.status);
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
        case "phosphorus":
        case "potassium":
        case "netBushels":
        case "pricePerBu":
            return displayNum(row[key]);
        case "ticketNumber":
            return row.ticketNumber != null && row.ticketNumber !== "" ? String(row.ticketNumber) : "—";
        case "status":
            return row.status ?? "—";
        default:
            return row[key] == null || row[key] === "" ? "—" : String(row[key]);
    }
}

const SavedRecordsDataSheet = forwardRef(function SavedRecordsDataSheet({ rows = [], onViewRecord }, ref) {
    const [preset, setPreset] = useState("modeling");
    const [sortKey, setSortKey] = useState("recordDateRaw");
    const [sortDir, setSortDir] = useState("desc");

    const visibleColumns = useMemo(() => {
        if (preset === "soil") return keysToColumns(PRESET_SOIL_KEYS);
        if (preset === "yield") return keysToColumns(PRESET_YIELD_KEYS);
        return keysToColumns(PRESET_MODELING_KEYS);
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
                downloadCsv(`saved-records-datasheet-${stamp}.csv`, headers, dataRows);
                toast.success("Export complete – downloading file…");
            },
        }),
        [sortedRows, visibleColumns]
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
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">Column preset</span>
                <Select value={preset} onValueChange={setPreset}>
                    <SelectTrigger className="h-9 w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="modeling">Modeling Basic</SelectItem>
                        <SelectItem value="soil">Soil Only</SelectItem>
                        <SelectItem value="yield">Yield Only</SelectItem>
                    </SelectContent>
                </Select>
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
