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
 * Compact field header: name, light context, primary actions (Add data, All records, Export).
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

    let soilLine = "—";
    if (loading) soilLine = "…";
    else if (soilLatest) {
        soilLine = `${soilLatest.test_date ? new Date(soilLatest.test_date).toLocaleDateString() : "Saved"} · ${soilLatest.zone_name || "Soil test"}`;
    } else soilLine = "None yet";

    let yieldLine = "—";
    if (loading) yieldLine = "…";
    else if (yieldLatest) {
        const td = yieldLatest.ticket_date || yieldLatest.ticketDate;
        yieldLine = `${td && !Number.isNaN(new Date(td).getTime()) ? new Date(td).toLocaleDateString() : "Saved"} · Yield`;
    } else yieldLine = "None yet";

    return (
        <div className="shrink-0 border-b border-slate-200/80 bg-white px-3 py-2 md:px-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold tracking-tight text-slate-900">{name}</h2>
                        {acres != null && acres !== "" && (
                            <Badge variant="secondary" className="font-normal text-xs">
                                {typeof acres === "number" ? `${acres.toFixed(1)} ac` : `${acres} ac`}
                            </Badge>
                        )}
                        {crop && (
                            <span className="text-xs text-slate-600">
                                <Sprout className="mr-1 inline h-3 w-3 text-emerald-600" />
                                {crop}
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        Latest evidence — soil: {soilLine} · yield: {yieldLine}
                    </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                    <Button asChild size="sm" className="h-8 bg-emerald-700 px-3 text-xs hover:bg-emerald-800">
                        <Link to={uploadHref}>
                            <Upload className="mr-1 h-3.5 w-3.5" />
                            Add data
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs">
                        <Link to={createPageUrl("MyRecords")}>
                            <Database className="mr-1 h-3.5 w-3.5" />
                            All records
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs text-slate-700">
                        <Link to={`${createPageUrl("MyRecords")}#export`}>
                            <FileDown className="mr-1 h-3.5 w-3.5" />
                            Export
                        </Link>
                    </Button>
                    <Link
                        to={createPageUrl("Recommendations")}
                        className="px-2 text-[11px] text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
                    >
                        Insights
                    </Link>
                </div>
            </div>
        </div>
    );
}
