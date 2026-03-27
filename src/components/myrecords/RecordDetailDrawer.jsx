import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { FileText, Sprout, Ticket } from "lucide-react";
import { format } from "date-fns";
import ExpandableRow from "./ExpandableRow";
import { formatDateOnlySafe } from "./dateUtils";

function YieldDetailBody({ rec, upload, formatLastUpdated }) {
    const ticketNumber = rec.ticket_number ?? rec.ticketNumber ?? "—";
    const fieldName = upload?.linkedFieldName || rec.field_name || upload?.enteredFieldLabel || "—";
    const cropRaw = rec.crop ?? rec.crop_type ?? "—";
    const crop =
        cropRaw && cropRaw !== "—"
            ? cropRaw.charAt(0).toUpperCase() + cropRaw.slice(1).toLowerCase()
            : cropRaw;
    const ticketDateRaw = rec.ticket_date ?? rec.ticketDate ?? null;
    const ticketDate = ticketDateRaw
        ? formatDateOnlySafe(ticketDateRaw) || format(new Date(ticketDateRaw), "MMM d, yyyy")
        : "—";
    const net =
        rec.net_bushels ?? rec.netBushels ?? rec.quantity_bushels ?? rec.quantityBushels ?? null;
    const price =
        rec.price_per_bu ?? rec.pricePerBushel ?? rec.price_per_bushel ?? null;
    const lastUpdated = formatLastUpdated(rec.updatedAt ?? rec.createdAt);
    const uploadLabel = upload?.filename || upload?.originalFilename || rec.sourceUploadId || "—";

    const rows = [
        { label: "Ticket #", value: ticketNumber },
        { label: "Field", value: fieldName },
        { label: "Crop", value: crop },
        { label: "Ticket date", value: ticketDate },
        { label: "Net bushels", value: net != null && net !== "" ? String(net) : "—" },
        { label: "Price / bu", value: price != null && price !== "" ? String(price) : "—" },
        { label: "Last updated", value: lastUpdated },
        { label: "Source upload", value: uploadLabel },
    ];

    if (rec.notes) {
        rows.push({ label: "Notes", value: String(rec.notes) });
    }

    return (
        <div className="space-y-6 pt-2">
            <div className="rounded-lg border bg-amber-50/50 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                    <Ticket className="h-5 w-5 text-amber-700" />
                    Yield ticket
                </h4>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {rows.map(({ label, value }) => (
                        <div key={label} className="rounded-md border bg-white p-3">
                            <dt className="text-xs font-medium text-gray-500">{label}</dt>
                            <dd className="mt-1 text-sm font-semibold text-gray-900 break-words">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {{ kind: 'soil' | 'yield', record: object } | null} props.detail
 * @param {Map<string, string>} props.fieldsMap
 * @param {Map<string, object>} props.sourceUploadMap
 * @param {(test: object) => { displayFieldName: string, displayCrop: string, displayAcres: number|null }} props.getSavedSoilDisplay
 * @param {(date: string|Date) => string} props.formatLastUpdated
 */
export default function RecordDetailDrawer({
    open,
    onOpenChange,
    detail,
    fieldsMap,
    sourceUploadMap,
    getSavedSoilDisplay,
    formatLastUpdated,
}) {
    if (!detail) return null;

    const { kind, record } = detail;
    const upload = record?.sourceUploadId ? sourceUploadMap.get(record.sourceUploadId) : null;
    const linkedFieldName = record?.field_id ? fieldsMap.get(record.field_id) : null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                <SheetHeader className="space-y-3 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="secondary"
                            className={
                                kind === "soil"
                                    ? "bg-green-100 text-green-900"
                                    : "bg-amber-100 text-amber-900"
                            }
                        >
                            {kind === "soil" ? "Soil test" : "Yield ticket"}
                        </Badge>
                        {upload?.filename && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <FileText className="h-3.5 w-3.5" />
                                {upload.filename}
                            </span>
                        )}
                    </div>
                    <SheetTitle className="pr-8 text-xl">
                        {kind === "soil"
                            ? getSavedSoilDisplay(record).displayFieldName
                            : upload?.linkedFieldName ||
                              record.field_name ||
                              upload?.enteredFieldLabel ||
                              "Yield record"}
                    </SheetTitle>
                    <SheetDescription className="space-y-1 text-left text-sm text-gray-600">
                        {kind === "soil" ? (
                            <>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="inline-flex items-center gap-1">
                                        <Sprout className="h-4 w-4 text-amber-600" />
                                        Crop: {getSavedSoilDisplay(record).displayCrop ?? "—"}
                                    </span>
                                    <span>
                                        Test date:{" "}
                                        {formatDateOnlySafe(record.test_date) || "—"}
                                    </span>
                                    <span>Updated: {formatLastUpdated(record.updated_date)}</span>
                                </div>
                                {linkedFieldName && (
                                    <div>
                                        Linked field:{" "}
                                        <Badge variant="outline">{linkedFieldName}</Badge>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <span>
                                    Ticket date:{" "}
                                    {record.ticket_date || record.ticketDate
                                        ? formatDateOnlySafe(record.ticket_date ?? record.ticketDate) ||
                                          "—"
                                        : "—"}
                                </span>
                                <span>Updated: {formatLastUpdated(record.updatedAt ?? record.createdAt)}</span>
                            </div>
                        )}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 border-t pt-4">
                    {kind === "soil" ? (
                        <ExpandableRow
                            test={record}
                            displayFieldName={getSavedSoilDisplay(record).displayFieldName}
                            displayCrop={getSavedSoilDisplay(record).displayCrop}
                            displayAcres={getSavedSoilDisplay(record).displayAcres}
                        />
                    ) : (
                        <YieldDetailBody
                            rec={record}
                            upload={upload}
                            formatLastUpdated={formatLastUpdated}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
