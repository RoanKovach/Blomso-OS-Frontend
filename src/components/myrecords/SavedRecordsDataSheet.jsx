import React, { useMemo, useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Eye, Columns3 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { formatDateOnlySafe } from "./dateUtils";
import { downloadCsv } from "./csvExport";
import { toast } from "sonner";
import {
    SHEET_SOIL,
    SHEET_YIELD,
    SHEET_FIELDS,
    DEFAULT_SHEET_TYPE,
    getColumnsForSheet,
    getDefaultVisibleKeys,
} from "./dataSheetConfig";

/** Sort/export/render as numeric when present */
const NUMERIC_ROW_KEYS = new Set([
    "ph",
    "organicMatter",
    "nitrogen",
    "phosphorus",
    "potassium",
    "calcium",
    "magnesium",
    "sulfur",
    "cec",
    "zinc",
    "copper",
    "iron",
    "acres",
    "shi",
    "grossWeight",
    "tareWeight",
    "netWeight",
    "moisture",
    "testWeight",
    "grossBushels",
    "shrink",
    "netBushels",
    "pricePerBu",
    "latestPh",
    "latestP",
    "latestK",
    "totalNetBushels",
]);

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
    if (
        key === "recordDateRaw" ||
        key === "lastUpdatedRaw" ||
        key === "latestSoilDate" ||
        key === "latestYieldDate"
    ) {
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
        case "latestSoilDate":
            return displayRecordDate(row.latestSoilDate) === "—" ? "" : displayRecordDate(row.latestSoilDate);
        case "latestYieldDate":
            return displayRecordDate(row.latestYieldDate) === "—" ? "" : displayRecordDate(row.latestYieldDate);
        case "ticketNumber":
            return row.ticketNumber === null || row.ticketNumber === undefined ? "" : String(row.ticketNumber);
        case "id":
            return row.id == null ? "" : String(row.id);
        default:
            if (NUMERIC_ROW_KEYS.has(key)) {
                return row[key] === null || row[key] === undefined ? "" : String(row[key]);
            }
            if (key === "soilTestCount" || key === "yieldTicketCount") {
                return row[key] === null || row[key] === undefined ? "" : String(row[key]);
            }
            return row[key] === null || row[key] === undefined ? "" : String(row[key]);
    }
}

function renderCell(row, key) {
    switch (key) {
        case "recordDateRaw":
            return displayRecordDate(row.recordDateRaw);
        case "lastUpdatedRaw":
            return displayLastUpdated(row.lastUpdatedRaw);
        case "latestSoilDate":
            return displayRecordDate(row.latestSoilDate);
        case "latestYieldDate":
            return displayRecordDate(row.latestYieldDate);
        case "ticketNumber":
            return row.ticketNumber != null && row.ticketNumber !== "" ? String(row.ticketNumber) : "—";
        case "id":
            return row.id != null && row.id !== "" ? String(row.id) : "—";
        default:
            if (NUMERIC_ROW_KEYS.has(key)) {
                return displayNum(row[key]);
            }
            if (key === "soilTestCount" || key === "yieldTicketCount") {
                return row[key] != null ? String(row[key]) : "—";
            }
            return row[key] == null || row[key] === "" ? "—" : String(row[key]);
    }
}

const SavedRecordsDataSheet = forwardRef(function SavedRecordsDataSheet(
    { rows = [], sheetType = DEFAULT_SHEET_TYPE, onSheetTypeChange, onViewRecord },
    ref
) {
    const allColumns = useMemo(() => getColumnsForSheet(sheetType), [sheetType]);
    const [visibleKeys, setVisibleKeys] = useState(() => new Set(getDefaultVisibleKeys(sheetType)));
    const [sortKey, setSortKey] = useState("recordDateRaw");
    const [sortDir, setSortDir] = useState("desc");

    useEffect(() => {
        setVisibleKeys(new Set(getDefaultVisibleKeys(sheetType)));
        if (sheetType === SHEET_FIELDS) {
            setSortKey("fieldName");
            setSortDir("asc");
        } else {
            setSortKey("recordDateRaw");
            setSortDir("desc");
        }
    }, [sheetType]);

    const visibleColumns = useMemo(() => {
        return allColumns.filter((c) => visibleKeys.has(c.key));
    }, [allColumns, visibleKeys]);

    useEffect(() => {
        const allowed = new Set(visibleColumns.map((c) => c.sortKey));
        if (!allowed.has(sortKey)) {
            const first = visibleColumns[0];
            if (first) {
                setSortKey(first.sortKey);
                setSortDir("asc");
            }
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

    const toggleColumn = (key, checked) => {
        setVisibleKeys((prev) => {
            const next = new Set(prev);
            if (checked) next.add(key);
            else next.delete(key);
            if (next.size === 0) {
                toast.info("Keep at least one column visible.");
                return prev;
            }
            return next;
        });
    };

    useImperativeHandle(
        ref,
        () => ({
            exportCsv: () => {
                if (!sortedRows.length) {
                    toast.error("No rows to export.");
                    return;
                }
                if (!visibleColumns.length) {
                    toast.error("Select at least one column to export.");
                    return;
                }
                const headers = visibleColumns.map((c) => c.label);
                const keys = visibleColumns.map((c) => c.key);
                const dataRows = sortedRows.map((row) => keys.map((k) => cellForExport(row, k)));
                const stamp = new Date().toISOString().split("T")[0];
                const safeType = String(sheetType).replace(/[^a-z0-9_-]/gi, "_");
                downloadCsv(`saved-records-${safeType}-${stamp}.csv`, headers, dataRows);
                toast.success("Export complete – downloading file…");
            },
        }),
        [sortedRows, visibleColumns, sheetType]
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
                    <span className="text-sm text-gray-600">Sheet type</span>
                    <Select value={sheetType} onValueChange={(v) => onSheetTypeChange?.(v)}>
                        <SelectTrigger className="h-9 w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={SHEET_SOIL}>Soil Tests</SelectItem>
                            <SelectItem value={SHEET_YIELD}>Yield Tickets</SelectItem>
                            <SelectItem value={SHEET_FIELDS}>Fields</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-9 gap-2">
                            <Columns3 className="h-4 w-4" />
                            Columns
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                        <p className="mb-2 text-xs font-medium text-gray-600">Show or hide columns</p>
                        <div className="max-h-64 space-y-2 overflow-y-auto">
                            {allColumns.map((col) => (
                                <label
                                    key={col.key}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={visibleKeys.has(col.key)}
                                        onCheckedChange={(c) => toggleColumn(col.key, !!c)}
                                    />
                                    <span>{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
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
