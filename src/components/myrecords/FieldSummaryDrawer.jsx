import React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Sprout, FileText } from "lucide-react";
import { formatDateOnlySafe } from "./dateUtils";

/**
 * Field-centric summary when viewing a Fields sheet row (not map-only).
 */
export default function FieldSummaryDrawer({
    open,
    onOpenChange,
    fieldName,
    fieldId,
    soilTests = [],
    yieldRecords = [],
    onOpenMap,
    formatLastUpdated,
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                <SheetHeader className="text-left">
                    <SheetTitle className="pr-8">Field summary</SheetTitle>
                    <SheetDescription className="space-y-2 text-left">
                        <div className="text-base font-semibold text-gray-900">{fieldName || "—"}</div>
                        {fieldId && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">Linked field</Badge>
                                <Button type="button" variant="outline" size="sm" className="h-8" onClick={onOpenMap}>
                                    <MapPin className="mr-1 h-4 w-4" />
                                    Open on map
                                </Button>
                            </div>
                        )}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 border-t pt-4 text-sm">
                    <section>
                        <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-900">
                            <Sprout className="h-4 w-4" />
                            Saved soil tests ({soilTests.length})
                        </h4>
                        {soilTests.length === 0 ? (
                            <p className="text-gray-500">None in current filters.</p>
                        ) : (
                            <ul className="space-y-2">
                                {soilTests.map((t) => (
                                    <li
                                        key={t.id}
                                        className="rounded-md border bg-white px-3 py-2 text-gray-800"
                                    >
                                        <span className="font-medium">
                                            {formatDateOnlySafe(t.test_date) || "—"}
                                        </span>
                                        {t.crop_type ? (
                                            <span className="text-gray-600"> · {t.crop_type}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section>
                        <h4 className="mb-2 flex items-center gap-2 font-semibold text-amber-900">
                            <FileText className="h-4 w-4" />
                            Saved yield tickets ({yieldRecords.length})
                        </h4>
                        {yieldRecords.length === 0 ? (
                            <p className="text-gray-500">None in current filters.</p>
                        ) : (
                            <ul className="space-y-2">
                                {yieldRecords.map((r) => (
                                    <li
                                        key={r.id}
                                        className="rounded-md border bg-white px-3 py-2 text-gray-800"
                                    >
                                        <span className="font-medium">
                                            {r.ticket_number ?? r.ticketNumber ?? "—"}
                                        </span>
                                        <span className="text-gray-600">
                                            {" "}
                                            ·{" "}
                                            {formatDateOnlySafe(r.ticket_date ?? r.ticketDate) ||
                                                "—"}
                                        </span>
                                        {formatLastUpdated && (
                                            <div className="text-xs text-gray-500">
                                                Updated {formatLastUpdated(r.updatedAt ?? r.createdAt)}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
