import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Database, FileDown, Sprout, Loader2, AlertCircle } from "lucide-react";
import FieldStoryBlocks, { FieldStoryCountsBadges } from "./FieldStoryBlocks";

function formatLatestSoil(latest) {
    if (!latest || typeof latest !== "object") return null;
    const st = latest.soil_test ?? latest.soilTest ?? latest.soil_tests?.[0];
    if (st == null) return null;
    if (typeof st === "string") return st;
    const date = st.test_date ? new Date(st.test_date).toLocaleDateString() : null;
    return `${date || "Saved"} · ${st.zone_name || st.field_name || "Soil test"}`;
}

function formatLatestYield(latest) {
    if (!latest || typeof latest !== "object") return null;
    const y = latest.yield_ticket ?? latest.yieldTicket ?? latest.yield_tickets?.[0];
    if (y == null) return null;
    if (typeof y === "string") return y;
    const td = y.ticket_date ?? y.ticketDate;
    const dateStr =
        td && !Number.isNaN(new Date(td).getTime()) ? new Date(td).toLocaleDateString() : null;
    return `${dateStr || "Saved"} · ${y.ticket_number ?? y.ticketNumber ?? "Yield"}`;
}

/**
 * Field workbench header + Field Story blocks (timeline-backed when story props are provided).
 */
export default function FieldWorkbenchPanel({ field, story }) {
    if (!field) return null;

    const name = field.field_name ?? field.name ?? "Field";
    const acres = field.acres ?? field.field_size_acres;
    const crop = field.current_crop ?? field.crop_type ?? field.intended_crop;

    const uploadHref = `${createPageUrl("Upload")}?fieldId=${encodeURIComponent(field.id)}`;

    const loading = Boolean(story?.loading);
    const err = story?.error;
    const summary = story?.summary;
    const latest = story?.latest ?? {};
    const timeline = story?.timeline;
    const events = story?.events ?? [];
    const counts = story?.counts ?? {};

    const soilLine = loading ? "…" : formatLatestSoil(latest) || "None yet";
    const yieldLine = loading ? "…" : formatLatestYield(latest) || "None yet";

    return (
        <div className="shrink-0 border-b border-slate-200/80 bg-white">
            <div className="px-3 py-2 md:px-4">
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
                            {loading && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-label="Loading field story" />
                            )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Latest evidence — soil: {soilLine} · yield: {yieldLine}
                        </p>
                        {timeline && (
                            <div className="mt-2">
                                <FieldStoryCountsBadges counts={counts} />
                            </div>
                        )}
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
                {err && (
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 flex-1">Could not load field story: {err}</span>
                        {typeof story?.refetch === "function" && (
                            <Button type="button" variant="outline" size="sm" className="h-7 shrink-0 text-[10px]" onClick={() => story.refetch()}>
                                Retry
                            </Button>
                        )}
                    </div>
                )}
            </div>
            {timeline && (
                <div className="max-h-[min(50vh,440px)] overflow-y-auto border-t border-slate-100 bg-slate-50/40 px-3 py-2 md:px-4">
                    <FieldStoryBlocks summary={summary} timeline={timeline} events={events} />
                </div>
            )}
        </div>
    );
}
