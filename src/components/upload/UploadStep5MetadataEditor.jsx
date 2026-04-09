import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function normStr(v) {
    if (v == null) return "";
    return String(v).trim().toLowerCase();
}

function DiffHint({ show, label = "Differs from field memory" }) {
    if (!show) return null;
    return (
        <span className="ml-1 inline-block text-[10px] font-medium text-amber-700" title={label}>
            ●
        </span>
    );
}

function SnapshotRow({ label, value, draftValue, compareDraft }) {
    const differs =
        compareDraft &&
        draftValue != null &&
        String(draftValue).trim() !== "" &&
        normStr(draftValue) !== normStr(value);
    return (
        <div className="flex flex-wrap justify-between gap-1 border-b border-slate-100 py-1.5 text-xs last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[60%] text-right font-medium text-slate-800">
                {value ?? "—"}
                <DiffHint show={differs} />
            </span>
        </div>
    );
}

/**
 * Step 5: compact linkage + critical metadata editor (no analyte grid).
 * Parent owns `criticalMetadataDraft` / setters; this is presentational + field selects.
 *
 * @param {{
 *   mode: 'soil' | 'yield',
 *   criticalMetadataDraft: object,
 *   onDraftChange: (patch: Record<string, unknown>) => void,
 *   fieldMemorySnapshot: Record<string, unknown>,
 *   seasonalMemorySnapshot: Record<string, unknown>,
 *   canonicalFields: Array<{ id: string, field_name?: string, name?: string }>,
 *   sourceFileName: string | null,
 * }} props
 */
export default function UploadStep5MetadataEditor({
    mode,
    criticalMetadataDraft: d,
    onDraftChange,
    fieldMemorySnapshot,
    seasonalMemorySnapshot,
    canonicalFields = [],
}) {
    const patch = onDraftChange;

    const memCrop =
        fieldMemorySnapshot?.current_crop ??
        seasonalMemorySnapshot?.intended_crop ??
        null;

    return (
        <div className="space-y-4">
            <Card className="border border-slate-200/90 bg-white/90 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-green-950">Link &amp; source</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Linked field</Label>
                        <Select
                            value={d.linkedFieldId || "none"}
                            onValueChange={(v) => {
                                if (v === "none") {
                                    patch({ linkedFieldId: null, linkedFieldName: null });
                                    return;
                                }
                                const f = canonicalFields.find((x) => x.id === v);
                                const nm = f?.field_name ?? f?.name ?? f?.fieldName ?? v;
                                patch({ linkedFieldId: v, linkedFieldName: nm });
                            }}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Not linked</SelectItem>
                                {canonicalFields.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.field_name ?? f.name ?? f.fieldName ?? f.id}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">
                            {mode === "soil" ? "Extracted zone / field label" : "Extracted field label"}
                        </Label>
                        <Input
                            className="h-9"
                            value={d.enteredFieldLabel ?? ""}
                            onChange={(e) => patch({ enteredFieldLabel: e.target.value })}
                            placeholder="e.g. West 40"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Source file</Label>
                        <Input className="h-9 bg-slate-50" readOnly value={d.sourceFileName || "—"} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Document note</Label>
                        <Textarea
                            rows={2}
                            className="min-h-[60px] resize-y text-sm"
                            value={d.documentNote ?? ""}
                            onChange={(e) => patch({ documentNote: e.target.value })}
                            placeholder="Short note for this upload (saved with context when backend supports it)"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-slate-200/90 bg-white/90 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-green-950">Critical metadata</CardTitle>
                    <p className="text-xs font-normal text-slate-600">
                        Applies to {mode === "soil" ? "all reviewed soil rows" : "all reviewed tickets"} on save.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {mode === "soil" ? (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs flex items-center gap-1">
                                        Test date
                                        <DiffHint
                                            show={
                                                d.test_date &&
                                                fieldMemorySnapshot?.last_soil_test_date &&
                                                normStr(d.test_date) !==
                                                    normStr(fieldMemorySnapshot.last_soil_test_date)
                                            }
                                        />
                                    </Label>
                                    <Input
                                        type="date"
                                        className="h-9"
                                        value={d.test_date ?? ""}
                                        onChange={(e) => patch({ test_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Lab name</Label>
                                    <Input
                                        className="h-9"
                                        value={d.lab_name ?? ""}
                                        onChange={(e) => patch({ lab_name: e.target.value })}
                                        placeholder="e.g. A&L Great Lakes"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs flex items-center gap-1">
                                    Crop
                                    <DiffHint
                                        show={
                                            d.crop_type &&
                                            memCrop &&
                                            normStr(d.crop_type) !== normStr(memCrop)
                                        }
                                    />
                                </Label>
                                <Input
                                    className="h-9"
                                    value={d.crop_type ?? ""}
                                    onChange={(e) => patch({ crop_type: e.target.value })}
                                    placeholder="Crop for this test"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Seasonal / rotation note</Label>
                                <Textarea
                                    rows={2}
                                    className="min-h-[52px] resize-y text-sm"
                                    value={d.seasonalNote ?? ""}
                                    onChange={(e) => patch({ seasonalNote: e.target.value })}
                                    placeholder="Optional — for future profile / season sync"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Ticket date</Label>
                                    <Input
                                        type="date"
                                        className="h-9"
                                        value={d.ticket_date ?? ""}
                                        onChange={(e) => patch({ ticket_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs flex items-center gap-1">
                                        Crop
                                        <DiffHint
                                            show={
                                                d.crop &&
                                                memCrop &&
                                                normStr(d.crop) !== normStr(memCrop)
                                            }
                                        />
                                    </Label>
                                    <Input
                                        className="h-9"
                                        value={d.crop ?? ""}
                                        onChange={(e) => patch({ crop: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Note</Label>
                                <Textarea
                                    rows={2}
                                    className="min-h-[52px] resize-y text-sm"
                                    value={d.yieldNote ?? ""}
                                    onChange={(e) => patch({ yieldNote: e.target.value })}
                                    placeholder="Optional ticket context"
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className={cn("border border-slate-200/80 bg-slate-50/60 shadow-sm")}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-800">Field memory snapshot</CardTitle>
                    <p className="text-xs font-normal text-slate-600">Read-only reference from registry &amp; upload context.</p>
                </CardHeader>
                <CardContent>
                    <SnapshotRow
                        label="Field name"
                        value={fieldMemorySnapshot?.field_name}
                        draftValue={d.linkedFieldName}
                        compareDraft
                    />
                    <SnapshotRow label="Acres" value={fieldMemorySnapshot?.acres} />
                    <SnapshotRow label="Soil type" value={fieldMemorySnapshot?.soil_type} />
                    <SnapshotRow label="Location" value={fieldMemorySnapshot?.location} />
                    <SnapshotRow
                        label="Current crop"
                        value={fieldMemorySnapshot?.current_crop}
                        draftValue={mode === "soil" ? d.crop_type : d.crop}
                        compareDraft
                    />
                    <SnapshotRow
                        label="Farming method"
                        value={
                            fieldMemorySnapshot?.farming_method ??
                            seasonalMemorySnapshot?.farming_method ??
                            null
                        }
                    />
                    <SnapshotRow
                        label="Previous crop history"
                        value={
                            fieldMemorySnapshot?.previous_crop_history ??
                            seasonalMemorySnapshot?.previous_crop_history ??
                            null
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
}
