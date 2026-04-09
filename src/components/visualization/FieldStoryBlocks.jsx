import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateOnlySafe } from "@/components/myrecords/dateUtils";
import { Cloud, Radio, FileOutput, History, Sprout, Wheat, FileText, Trash2, Loader2 } from "lucide-react";

function SectionCard({ icon: Icon, title, children, className = "" }) {
    return (
        <section
            className={`rounded-lg border border-slate-200/90 bg-white/90 px-3 py-2.5 shadow-sm ${className}`}
        >
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {Icon && <Icon className="h-3.5 w-3.5 text-emerald-700" aria-hidden />}
                {title}
            </div>
            {children}
        </section>
    );
}

function eventPrimaryLine(ev) {
    if (ev == null) return "Event";
    if (typeof ev === "string") return ev;
    return (
        ev.message ||
        ev.title ||
        ev.label ||
        ev.type ||
        ev.kind ||
        (ev.id != null ? String(ev.id) : "Event")
    );
}

function eventWhen(ev) {
    if (ev == null || typeof ev === "string") return null;
    const t = ev.at || ev.timestamp || ev.time || ev.createdAt || ev.date;
    if (!t) return null;
    const d = formatDateOnlySafe(t);
    return d || String(t);
}

function rowId(row) {
    if (!row || typeof row !== "object") return null;
    return row.id ?? row.record_id ?? row.document_id ?? row.upload_id ?? null;
}

function DeleteRowButton({ busy, disabled, onClick, ariaLabel }) {
    if (typeof onClick !== "function") return null;
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-600"
            disabled={disabled || busy}
            aria-label={ariaLabel || "Delete"}
            onClick={onClick}
        >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}

export function FieldStorySummaryBlock({ summary }) {
    if (summary == null) return null;
    if (typeof summary === "string") {
        const s = summary.trim();
        if (!s) return null;
        return (
            <SectionCard title="Field summary" icon={History}>
                <p className="text-sm leading-snug text-slate-800">{s}</p>
            </SectionCard>
        );
    }
    if (typeof summary === "object") {
        const headline = summary.headline || summary.title || summary.summary;
        const sub = summary.subtitle || summary.detail || summary.body;
        if (!headline && !sub) return null;
        return (
            <SectionCard title="Field summary" icon={History}>
                {headline ? <p className="text-sm font-medium text-slate-900">{headline}</p> : null}
                {sub ? (
                    <p className="mt-1 text-sm leading-snug text-slate-700">
                        {typeof sub === "string" ? sub : JSON.stringify(sub)}
                    </p>
                ) : null}
            </SectionCard>
        );
    }
    return null;
}

export function FieldStoryCountsBadges({ counts }) {
    if (!counts || typeof counts !== "object") return null;
    const entries = Object.entries(counts).filter(([, v]) => v != null && v !== "");
    if (entries.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {entries.map(([k, v]) => (
                <Badge key={k} variant="secondary" className="font-normal text-[10px]">
                    {k.replace(/_/g, " ")}: {String(v)}
                </Badge>
            ))}
        </div>
    );
}

export function FieldStoryDocuments({ items, onRequestDelete, deleteBusyId }) {
    const list = Array.isArray(items) ? items : [];
    if (list.length === 0) return null;
    return (
        <SectionCard title="Incoming documents" icon={FileText}>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs text-slate-800">
                {list.map((row, i) => {
                    const id = rowId(row) ?? `doc-${i}`;
                    const rid = rowId(row);
                    const name =
                        row?.filename ||
                        row?.file_name ||
                        row?.name ||
                        row?.title ||
                        (rid ? `Document ${String(rid).slice(0, 8)}…` : "Document");
                    const status = row?.status || row?.extractionStatus || row?.state || null;
                    return (
                        <li
                            key={rid ?? id}
                            className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 last:border-0"
                        >
                            <div className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{name}</span>
                                {status && <span className="text-slate-500">{status}</span>}
                            </div>
                            {rid ? (
                                <DeleteRowButton
                                    busy={deleteBusyId === rid}
                                    onClick={() => onRequestDelete?.("document", rid, name)}
                                    ariaLabel={`Delete document ${name}`}
                                />
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </SectionCard>
    );
}

export function FieldStorySoilHistory({ items, onRequestDelete, deleteBusyId }) {
    const list = Array.isArray(items) ? items : [];
    if (list.length === 0) return null;
    return (
        <SectionCard title="Soil test history" icon={Sprout}>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs text-slate-800">
                {list.map((row, i) => {
                    const rid = rowId(row);
                    const date = formatDateOnlySafe(row?.test_date) || "—";
                    const zone = row?.zone_name || row?.field_name || "Soil test";
                    return (
                        <li
                            key={rid ?? i}
                            className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 last:border-0"
                        >
                            <div className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{zone}</span>
                                <span className="text-slate-500">{date}</span>
                            </div>
                            {rid ? (
                                <DeleteRowButton
                                    busy={deleteBusyId === rid}
                                    onClick={() => onRequestDelete?.("soil", rid, zone)}
                                    ariaLabel={`Delete soil test ${zone}`}
                                />
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </SectionCard>
    );
}

export function FieldStoryYieldHistory({ items, onRequestDelete, deleteBusyId }) {
    const list = Array.isArray(items) ? items : [];
    if (list.length === 0) return null;
    return (
        <SectionCard title="Yield ticket history" icon={Wheat}>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs text-slate-800">
                {list.map((row, i) => {
                    const rid = rowId(row);
                    const td = row?.ticket_date ?? row?.ticketDate;
                    const date = td ? formatDateOnlySafe(td) || "—" : "—";
                    const label = row?.ticket_number ?? row?.ticketNumber ?? "Yield";
                    return (
                        <li
                            key={rid ?? i}
                            className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 last:border-0"
                        >
                            <div className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{label}</span>
                                <span className="text-slate-500">{date}</span>
                            </div>
                            {rid ? (
                                <DeleteRowButton
                                    busy={deleteBusyId === rid}
                                    onClick={() => onRequestDelete?.("yield", rid, String(label))}
                                    ariaLabel={`Delete yield ticket ${label}`}
                                />
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </SectionCard>
    );
}

export function FieldStoryEventsFeed({ events }) {
    const list = Array.isArray(events) ? events : [];
    if (list.length === 0) return null;
    return (
        <SectionCard title="Timeline" icon={History}>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                {list.map((ev, i) => (
                    <li key={i} className="border-b border-slate-100 pb-2 last:border-0">
                        <div className="font-medium text-slate-900">{eventPrimaryLine(ev)}</div>
                        {eventWhen(ev) && <div className="text-slate-500">{eventWhen(ev)}</div>}
                    </li>
                ))}
            </ul>
        </SectionCard>
    );
}

export function FieldStoryWeatherPlaceholder({ items }) {
    const n = Array.isArray(items) ? items.length : 0;
    if (n === 0) return null;
    return (
        <SectionCard title="Weather" icon={Cloud}>
            <p className="text-xs text-slate-600">
                {n} weather snapshot{n === 1 ? "" : "s"} in timeline — detailed weather UI is not wired yet.
            </p>
        </SectionCard>
    );
}

export function FieldStorySignalsPlaceholder({ items }) {
    const n = Array.isArray(items) ? items.length : 0;
    if (n === 0) return null;
    return (
        <SectionCard title="Signals" icon={Radio}>
            <p className="text-xs text-slate-600">
                {n} signal{n === 1 ? "" : "s"} present — interpretation UI coming later.
            </p>
        </SectionCard>
    );
}

export function FieldStoryOutputsPlaceholder({ items }) {
    const n = Array.isArray(items) ? items.length : 0;
    if (n === 0) return null;
    return (
        <SectionCard title="Outputs" icon={FileOutput}>
            <p className="text-xs text-slate-600">
                {n} output{n === 1 ? "" : "s"} in timeline — dedicated outputs UI coming later.
            </p>
        </SectionCard>
    );
}

function summaryIsPresent(summary) {
    if (summary == null) return false;
    if (typeof summary === "string") return summary.trim().length > 0;
    if (typeof summary === "object") {
        const headline = summary.headline || summary.title || summary.summary;
        const sub = summary.subtitle || summary.detail || summary.body;
        return Boolean(headline || sub);
    }
    return false;
}

export default function FieldStoryBlocks({ summary, timeline, events, onRequestDelete, deleteBusyId }) {
    if (!timeline) return null;
    const docs = timeline.documents;
    const soil = timeline.soil_tests;
    const yields = timeline.yield_tickets;
    const weather = timeline.weather;
    const signals = timeline.signals;
    const outputs = timeline.outputs;
    const ev = Array.isArray(events) ? events : [];

    const hasAny =
        summaryIsPresent(summary) ||
        (Array.isArray(docs) && docs.length > 0) ||
        (Array.isArray(soil) && soil.length > 0) ||
        (Array.isArray(yields) && yields.length > 0) ||
        ev.length > 0 ||
        (Array.isArray(weather) && weather.length > 0) ||
        (Array.isArray(signals) && signals.length > 0) ||
        (Array.isArray(outputs) && outputs.length > 0);

    if (!hasAny) {
        return (
            <p className="px-1 py-2 text-xs text-slate-500">
                No timeline rows to show yet. Upload documents or save tests from the Add data flow.
            </p>
        );
    }

    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
                <FieldStorySummaryBlock summary={summary} />
            </div>
            <FieldStoryDocuments
                items={docs}
                onRequestDelete={onRequestDelete}
                deleteBusyId={deleteBusyId}
            />
            <FieldStorySoilHistory
                items={soil}
                onRequestDelete={onRequestDelete}
                deleteBusyId={deleteBusyId}
            />
            <FieldStoryYieldHistory
                items={yields}
                onRequestDelete={onRequestDelete}
                deleteBusyId={deleteBusyId}
            />
            <FieldStoryEventsFeed events={ev} />
            <FieldStoryWeatherPlaceholder items={weather} />
            <FieldStorySignalsPlaceholder items={signals} />
            <FieldStoryOutputsPlaceholder items={outputs} />
        </div>
    );
}
