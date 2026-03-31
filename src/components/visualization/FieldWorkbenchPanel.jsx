import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listRecords } from "@/api/records";
import { isApiConfigured } from "@/api/client";
import { Upload, Database, FileDown, Sprout } from "lucide-react";

function pickLatest(records, dateKeys) {
    if (!records?.length) return null;
    const scored = records.map((r) => {
        let t = 0;
        for (const k of dateKeys) {
            const v = r[k];
            if (v) {
                const d = new Date(v);
                if (!Number.isNaN(d.getTime())) t = Math.max(t, d.getTime());
            }
        }
        return { r, t };
    });
    scored.sort((a, b) => b.t - a.t);
    return scored[0]?.r ?? null;
}

/**
 * Field story strip above the map: latest evidence + links to add data, unified records, export.
 */
export default function FieldWorkbenchPanel({ field, evidenceKey = 0 }) {
    const [loading, setLoading] = useState(false);
    const [soilLatest, setSoilLatest] = useState(null);
    const [yieldLatest, setYieldLatest] = useState(null);

    const fieldId = field?.id;

    const load = useCallback(async () => {
        if (!fieldId || !isApiConfigured()) {
            setSoilLatest(null);
            setYieldLatest(null);
            return;
        }
        setLoading(true);
        try {
            const res = await listRecords();
            const records = res?.records || [];
            const soilRows = records.filter(
                (r) => r.type === "normalized_soil_test" && r.field_id === fieldId
            );
            const yieldRows = records.filter(
                (r) => r.type === "normalized_yield_ticket" && r.field_id === fieldId
            );
            setSoilLatest(pickLatest(soilRows, ["test_date", "updatedAt", "createdAt"]));
            setYieldLatest(pickLatest(yieldRows, ["ticket_date", "updatedAt", "createdAt"]));
        } catch {
            setSoilLatest(null);
            setYieldLatest(null);
        } finally {
            setLoading(false);
        }
    }, [fieldId]);

    useEffect(() => {
        load();
    }, [load, evidenceKey]);

    if (!field) return null;

    const name = field.field_name ?? field.name ?? "Field";
    const acres = field.acres ?? field.field_size_acres;
    const crop = field.current_crop ?? field.crop_type ?? field.intended_crop;

    const uploadHref = `${createPageUrl("Upload")}?fieldId=${encodeURIComponent(field.id)}`;

    return (
        <div className="shrink-0 border-b border-slate-200/90 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm md:px-5">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-900">{name}</h2>
                        {acres != null && acres !== "" && (
                            <Badge variant="secondary" className="font-normal">
                                {typeof acres === "number" ? `${acres.toFixed(1)} ac` : `${acres} ac`}
                            </Badge>
                        )}
                        {crop && (
                            <span className="text-sm text-slate-600">
                                <Sprout className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                                {crop}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500">
                        Evidence for this field — map below for location context.
                    </p>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Latest soil evidence
                            </div>
                            {loading ? (
                                <p className="text-slate-400">Loading…</p>
                            ) : soilLatest ? (
                                <p className="truncate">
                                    {soilLatest.test_date
                                        ? new Date(soilLatest.test_date).toLocaleDateString()
                                        : "Saved"}{" "}
                                    · {soilLatest.zone_name || "Soil test"}
                                </p>
                            ) : (
                                <p className="text-slate-500">None yet — add a soil test PDF.</p>
                            )}
                        </div>
                        <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                Latest yield evidence
                            </div>
                            {loading ? (
                                <p className="text-slate-400">Loading…</p>
                            ) : yieldLatest ? (
                                <p className="truncate">
                                    {(yieldLatest.ticket_date || yieldLatest.ticketDate) &&
                                    !Number.isNaN(
                                        new Date(
                                            yieldLatest.ticket_date || yieldLatest.ticketDate
                                        ).getTime()
                                    )
                                        ? new Date(
                                              yieldLatest.ticket_date || yieldLatest.ticketDate
                                          ).toLocaleDateString()
                                        : "Saved"}{" "}
                                    · Yield ticket
                                </p>
                            ) : (
                                <p className="text-slate-500">None yet — add yield evidence from Add Data.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2 md:justify-end">
                    <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800">
                        <Link to={uploadHref}>
                            <Upload className="mr-1.5 h-4 w-4" />
                            Add data
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link to={createPageUrl("MyRecords")}>
                            <Database className="mr-1.5 h-4 w-4" />
                            All records
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="text-slate-700">
                        <Link to={`${createPageUrl("MyRecords")}#export`}>
                            <FileDown className="mr-1.5 h-4 w-4" />
                            Export
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="text-slate-600">
                        <Link to={createPageUrl("Recommendations")}>Insights</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
