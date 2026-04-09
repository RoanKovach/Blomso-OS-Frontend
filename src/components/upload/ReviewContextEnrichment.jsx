import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function fieldLabel(f) {
  return f?.field_name ?? f?.name ?? f?.fieldName ?? f?.id ?? "—";
}

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

/**
 * Phase 1 scaffold: read-only layers + disabled save-mode radios (no PATCH yet).
 * Field profile from registry; seasonal from snapshot if legacy uploads had it; document note from upload.
 */
export default function ReviewContextEnrichment({
  registryField = null,
  contextSnapshot = null,
  documentNote = null,
  linkedFieldName = null,
}) {
  const snap = contextSnapshot && typeof contextSnapshot === "object" ? contextSnapshot : null;

  const seasonal = {
    intended_crop: snap?.intended_crop || null,
    farming_method: snap?.farming_method || null,
    previous_crop_history: snap?.previous_crop_history || null,
  };
  const hasSeasonal = Object.values(seasonal).some((v) => v != null && String(v).trim() !== "");

  return (
    <Card className="border border-emerald-200/60 bg-emerald-50/40 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-green-950">Context & field memory</CardTitle>
        <p className="text-sm font-normal text-green-900/80">
          Reconcile this document with what the field already knows. Full editing and saving to field profile arrives in a
          later release.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-900/70">Field profile (slow-changing)</h4>
          {registryField ? (
            <div className="rounded-md border border-white/80 bg-white/90 p-3">
              <Row label="Field" value={fieldLabel(registryField)} />
              <Row
                label="Acres"
                value={
                  registryField.acres ??
                  registryField.field_size_acres ??
                  registryField.size ??
                  null
                }
              />
              <Row label="Current crop" value={registryField.current_crop ?? null} />
              <Row label="Soil type (registry)" value={registryField.soil_type ?? null} />
            </div>
          ) : linkedFieldName ? (
            <p className="rounded-md border border-dashed border-green-200 bg-white/60 p-3 text-sm text-green-900">
              Linked to <strong>{linkedFieldName}</strong>. Open this upload from a session with your field list loaded to
              show full registry details here.
            </p>
          ) : (
            <p className="rounded-md border border-dashed border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-950">
              No saved field linked yet. After save, link this record to a field from My Records or upload again with a
              field selected.
            </p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-900/70">
            Seasonal & practice (medium-changing)
          </h4>
          {hasSeasonal ? (
            <div className="rounded-md border border-white/80 bg-white/90 p-3">
              <Row label="Intended / crop" value={seasonal.intended_crop} />
              <Row label="Farming method" value={seasonal.farming_method} />
              <Row label="Previous crop history" value={seasonal.previous_crop_history} />
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-green-200 bg-white/60 p-3 text-sm text-green-900/90">
              Nothing captured at upload for this document. You will be able to add rotation, practice, and season notes
              here after save.
            </p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-900/70">This document</h4>
          <div className="rounded-md border border-white/80 bg-white/90 p-3">
            <Row label="Upload note" value={documentNote || snap?.documentNote || null} />
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-slate-50/80 p-4 opacity-90">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">How to save context (coming next)</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-slate-300 bg-white" aria-hidden />
              <span>Document only — keep enrichment on this upload</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-slate-300 bg-white" aria-hidden />
              <span>Update field profile (slow memory)</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-slate-300 bg-white" aria-hidden />
              <span>Update seasonal context</span>
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">These options will connect to save flows in a future phase.</p>
        </section>
      </CardContent>
    </Card>
  );
}
