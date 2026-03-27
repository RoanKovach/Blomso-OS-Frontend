import React, { useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { formatDateOnlySafe } from "./dateUtils";
import { downloadCsv } from "./csvExport";
import { toast } from "sonner";

/** v1 tight column set: modeling-prep surface, no extra noise */
const COLUMNS = [
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
        default:
            return row[key] === null || row[key] === undefined ? "" : String(row[key]);
    }
}

const SavedRecordsDataSheet = forwardRef(function SavedRecordsDataSheet({ rows = [] }, ref) {
    const [sortKey, setSortKey] = useState("recordDateRaw");
    const [sortDir, setSortDir] = useState("desc");

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
                const headers = COLUMNS.map((c) => c.label);
                const keys = COLUMNS.map((c) => c.key);
                const dataRows = sortedRows.map((row) => keys.map((k) => cellForExport(row, k)));
                const stamp = new Date().toISOString().split("T")[0];
                downloadCsv(`saved-records-datasheet-${stamp}.csv`, headers, dataRows);
                toast.success("Export complete – downloading file…");
            },
        }),
        [sortedRows]
    );

    if (!rows.length) {
        return (
            <div className="rounded-lg border bg-white p-8 text-center text-gray-600">
                No saved records match the current filters.
            </div>
        );
    }

    return (
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <Table className="text-sm">
                <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                        {COLUMNS.map((col) => (
                            <TableHead key={col.key} className="whitespace-nowrap font-semibold text-gray-800">
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
                            <TableCell>{row.family}</TableCell>
                            <TableCell className="font-medium">{row.fieldName}</TableCell>
                            <TableCell>{row.crop || "—"}</TableCell>
                            <TableCell>{displayRecordDate(row.recordDateRaw)}</TableCell>
                            <TableCell>{displayLastUpdated(row.lastUpdatedRaw)}</TableCell>
                            <TableCell>{row.status}</TableCell>
                            <TableCell>{displayNum(row.ph)}</TableCell>
                            <TableCell>{displayNum(row.organicMatter)}</TableCell>
                            <TableCell>{displayNum(row.phosphorus)}</TableCell>
                            <TableCell>{displayNum(row.potassium)}</TableCell>
                            <TableCell>{row.ticketNumber != null && row.ticketNumber !== "" ? String(row.ticketNumber) : "—"}</TableCell>
                            <TableCell>{displayNum(row.netBushels)}</TableCell>
                            <TableCell>{displayNum(row.pricePerBu)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
});

SavedRecordsDataSheet.displayName = "SavedRecordsDataSheet";

export default SavedRecordsDataSheet;
