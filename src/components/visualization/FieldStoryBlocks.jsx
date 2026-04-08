import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateOnlySafe } from "@/components/myrecords/dateUtils";
import { Cloud, Radio, FileOutput, History, Sprout, Wheat } from "lucide-react";

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
                    <p className="mt-1 text-sm leading-snug text-slate-700">{typeof sub === "string" ? sub : JSON.stringify(sub)}</p>
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

export function FieldStorySoilHistory({ items }) {
    const list = Array.isArray(items) ? items : [];
    return (
        <SectionCard title="Soil test history" icon={Sprout}>
            {list.length === 0 ? (
                <p className="text-xs text-slate-500">No soil tests linked to this field in the timeline yet.</p>
            ) : (
                <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs text-slate-800">
                    {list.map((row, i) => {
                        const id = row?.id ?? row?.record_id ?? i;
                        const date = formatDateOnlySafe(row?.test_date) || "—";
                        const zone = row?.zone_name || row?.field_name || "Soil test";
                        return (
                            <li key={id} className="flex justify-between gap-2 border-b border-slate-100 pb-1 last:border-0">
                                <span className="truncate font-medium">{zone}</span>
                                <span className="shrink-0 text-slate-500">{date}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </SectionCard>
    );
}

export function FieldStoryYieldHistory({ items }) {
    const list = Array.isArray(items) ? items : [];
    return (
        <SectionCard title="Yield ticket history" icon={Wheat}>
            {list.length === 0 ? (
                <p className="text-xs text-slate-500">No yield tickets linked to this field in the timeline yet.</p>
            ) : (
                <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs text-slate-800">
                    {list.map((row, i) => {
                        const id = row?.id ?? row?.record_id ?? i;
                        const td = row?.ticket_date ?? row?.ticketDate;
                        const date = td ? formatDateOnlySafe(td) || "—" : "—";
                        const label = row?.ticket_number ?? row?.ticketNumber ?? "Yield";
                        return (
                            <li key={id} className="flex justify-between gap-2 border-b border-slate-100 pb-1 last:border-0">
                                <span className="truncate font-medium">{label}</span>
                                <span className="shrink-0 text-slate-500">{date}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </SectionCard>
    );
}

export function FieldStoryEventsFeed({ events }) {
    const list = Array.isArray(events) ? events : [];
    return (
        <SectionCard title="Timeline" icon={History}>
            {list.length === 0 ? (
                <p className="text-xs text-slate-500">No timeline events returned for this field yet.</p>
            ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                    {list.map((ev, i) => (
                        <li key={i} className="border-b border-slate-100 pb-2 last:border-0">
                            <div className="font-medium text-slate-900">{eventPrimaryLine(ev)}</div>
                            {eventWhen(ev) && <div className="text-slate-500">{eventWhen(ev)}</div>}
                        </li>
                    ))}
                </ul>
            )}
        </SectionCard>
    );
}

export function FieldStoryWeatherPlaceholder({ items }) {
    const n = Array.isArray(items) ? items.length : 0;
    return (
        <SectionCard title="Weather" icon={Cloud}>
            {n > 0 ? (
                <p className="text-xs text-slate-600">
                    {n} weather snapshot{n === 1 ? "" : "s"} in timeline — detailed weather UI is not wired yet.
                </p>
            ) : (
                <p className="text-xs text-slate-500">No weather blocks in the field timeline yet.</p>
            )}
        </SectionCard>
    );
}

export function FieldStorySignalsPlaceholder({ items }) {
    const n = Array.isArray(items) ? items.length : 0;
    return (
        <SectionCard title="Signals" icon={Radio}>
            {n > 0 ? (
                <p className="text-xs text-slate-600">
                    {n} signal{n === 1 ? "" : "s"} present — interpretation UI coming later.
                </p>
            ) : (
                <p className="text-xs text-slate-500">No signals in the field timeline yet.</p>
            )}
        </SectionCard>
    );
}

export function FieldStoryOutputsPlaceholder({ items }) {
    const n = Array.isArray(items) ? items.length : 0;
    return (
        <SectionCard title="Outputs" icon={FileOutput}>
            {n > 0 ? (
                <p className="text-xs text-slate-600">
                    {n} output{n === 1 ? "" : "s"} in timeline — dedicated outputs UI coming later.
                </p>
            ) : (
                <p className="text-xs text-slate-500">No outputs in the field timeline yet.</p>
            )}
        </SectionCard>
    );
}

export default function FieldStoryBlocks({ summary, timeline, events }) {
    if (!timeline) return null;
    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
                <FieldStorySummaryBlock summary={summary} />
            </div>
            <FieldStorySoilHistory items={timeline.soil_tests} />
            <FieldStoryYieldHistory items={timeline.yield_tickets} />
            <FieldStoryEventsFeed events={events} />
            <FieldStoryWeatherPlaceholder items={timeline.weather} />
            <FieldStorySignalsPlaceholder items={timeline.signals} />
            <FieldStoryOutputsPlaceholder items={timeline.outputs} />
        </div>
    );
}
