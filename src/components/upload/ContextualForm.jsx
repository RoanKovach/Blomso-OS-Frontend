import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, ArrowRight, ArrowLeft, AlertCircle, Tractor, FileArchive, ChevronDown } from "lucide-react";
import { createPageUrl } from "@/utils";

const COMMON_CROPS = [
  "Corn", "Soybeans", "Wheat", "Cotton", "Rice", "Alfalfa", "Sorghum",
  "Sunflower", "Canola", "Oats", "Barley", "Potatoes", "Tomatoes", "Other",
];

const FARMING_METHODS = [
  "Conventional", "Organic", "No-Till", "Regenerative", "Strip-Till", "Minimum Till", "Other",
];

function fieldDisplayName(field) {
  return field?.field_name ?? field?.name ?? field?.fieldName ?? field?.id ?? "";
}

function registryAcresValue(field) {
  if (!field) return null;
  const raw = field.acres ?? field.field_size_acres ?? field.size ?? null;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function applyLinkedField(field, setLinkedFieldId, setLinkedFieldName, setBootstrap) {
  if (!field) return;
  setLinkedFieldId(field.id);
  setLinkedFieldName(fieldDisplayName(field));
  const acres = registryAcresValue(field);
  setBootstrap((prev) => ({
    ...prev,
    field_name: fieldDisplayName(field),
    field_size_acres: acres != null ? acres : prev.field_size_acres || "",
  }));
}

/** Minimal snapshot for upload/complete (single-file flows). No seasonal/profile at upload. */
function buildMinimalAttachPayload({
  isExisting,
  linkedFieldId,
  linkedFieldName,
  bootstrap,
  registryAcres,
  hasRegistryAcres,
  documentNote,
}) {
  const name = isExisting
    ? (linkedFieldName || bootstrap.field_name || "").trim()
    : bootstrap.field_name.trim();
  const acres = isExisting
    ? hasRegistryAcres
      ? registryAcres
      : Number(bootstrap.field_size_acres)
    : Number(bootstrap.field_size_acres);

  const note = (documentNote || "").trim();

  return {
    linkedFieldId: isExisting ? linkedFieldId : null,
    linkedFieldName: isExisting ? linkedFieldName : null,
    field_name: name,
    field_size_acres: acres,
    enteredFieldLabel: name || null,
    documentNote: note || null,
  };
}

export default function ContextualForm({
  onSubmit,
  onBack,
  isBatchMode = false,
  fileCount = 1,
  canonicalFields = [],
  initialFieldId = null,
}) {
  // Single-file paths: minimal state
  const [linkedFieldId, setLinkedFieldId] = useState(null);
  const [linkedFieldName, setLinkedFieldName] = useState(null);
  const [bootstrap, setBootstrap] = useState({ field_name: "", field_size_acres: "" });
  const [documentNote, setDocumentNote] = useState("");

  // Batch path: full metadata (unchanged product expectations)
  const [batchForm, setBatchForm] = useState({
    field_name: "",
    field_size_acres: "",
    intended_crop: "",
    farming_method: "",
    previous_crop_history: "",
    soil_type: "",
    irrigation_type: "",
    location: { address: "", latitude: null, longitude: null },
    field_notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const appliedInitialFieldRef = useRef(false);

  useEffect(() => {
    if (!initialFieldId || !canonicalFields.length || appliedInitialFieldRef.current || isBatchMode) return;
    const field = canonicalFields.find((f) => f.id === initialFieldId);
    if (field) {
      applyLinkedField(field, setLinkedFieldId, setLinkedFieldName, setBootstrap);
      appliedInitialFieldRef.current = true;
    }
  }, [initialFieldId, canonicalFields, isBatchMode]);

  const linkedFieldRecord = useMemo(
    () => (linkedFieldId ? canonicalFields.find((f) => f.id === linkedFieldId) ?? null : null),
    [linkedFieldId, canonicalFields]
  );

  const isExistingFieldLinked = Boolean(!isBatchMode && linkedFieldId);
  const isNewFieldBootstrap = !isBatchMode && !linkedFieldId;
  const registryAcres = useMemo(() => registryAcresValue(linkedFieldRecord), [linkedFieldRecord]);
  const hasRegistryAcres = registryAcres != null;

  const handleBatchChange = (field, value) => {
    if (field.startsWith("location.")) {
      const key = field.split(".")[1];
      setBatchForm((prev) => ({
        ...prev,
        location: { ...prev.location, [key]: value },
      }));
    } else {
      setBatchForm((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const validateBatch = () => {
    const newErrors = {};
    if (!batchForm.field_name.trim()) newErrors.field_name = "Field name is required";
    if (!batchForm.field_size_acres || batchForm.field_size_acres <= 0) {
      newErrors.field_size_acres = "Valid field size is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSingle = () => {
    const newErrors = {};
    if (isExistingFieldLinked) {
      if (!linkedFieldId) newErrors._link = "Select a field";
      const acreValue = hasRegistryAcres ? registryAcres : Number(bootstrap.field_size_acres);
      if (!Number.isFinite(acreValue) || acreValue <= 0) {
        newErrors.field_size_acres = "Enter a valid field size (acres) for this upload";
      }
    } else {
      if (!bootstrap.field_name.trim()) newErrors.field_name = "Field name is required";
      if (!bootstrap.field_size_acres || Number(bootstrap.field_size_acres) <= 0) {
        newErrors.field_size_acres = "Valid field size is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBatchMode) {
      if (!validateBatch()) return;
    } else {
      if (!validateSingle()) return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 300));

      if (isBatchMode) {
        onSubmit({
          ...batchForm,
          linkedFieldId: null,
          linkedFieldName: null,
          enteredFieldLabel: batchForm.field_name.trim() || null,
          documentNote: (batchForm.field_notes || "").trim() || null,
        });
        return;
      }

      const minimal = buildMinimalAttachPayload({
        isExisting: isExistingFieldLinked,
        linkedFieldId,
        linkedFieldName,
        bootstrap,
        registryAcres,
        hasRegistryAcres,
        documentNote,
      });
      onSubmit(minimal);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBatchForm((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
        }));
      },
      (err) => console.error(err)
    );
  };

  const isFormValid = (() => {
    if (isBatchMode) {
      return (
        batchForm.field_name.trim() &&
        batchForm.field_size_acres > 0 &&
        Object.keys(errors).length === 0
      );
    }
    if (isExistingFieldLinked) {
      const acresOk =
        hasRegistryAcres ||
        (Number(bootstrap.field_size_acres) > 0 &&
          Number.isFinite(Number(bootstrap.field_size_acres)));
      return Boolean(linkedFieldId && acresOk && Object.keys(errors).length === 0);
    }
    return (
      bootstrap.field_name.trim() &&
      bootstrap.field_size_acres > 0 &&
      Object.keys(errors).length === 0
    );
  })();

  const fromFieldDeepLink = Boolean(!isBatchMode && initialFieldId && linkedFieldId === initialFieldId);

  return (
    <Card className="border-none bg-white/80 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          {isBatchMode ? <FileArchive className="h-6 w-6" /> : <Tractor className="h-6 w-6" />}
          {isBatchMode ? `Batch metadata for ${fileCount} files` : "Step 2: Link file to a field"}
        </CardTitle>
        <p className="mt-2 text-green-800">
          {isBatchMode
            ? `This context applies to all ${fileCount} files in the batch.`
            : "Attach this upload to a saved field or bootstrap a new one. Crop, practice, and soil details wait until review."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please correct the errors below before continuing.</AlertDescription>
            </Alert>
          )}

          {!isBatchMode && fromFieldDeepLink && linkedFieldName && (
            <Alert className="border-emerald-200 bg-emerald-50/90 text-emerald-950">
              <AlertDescription>
                Opened from a field — this upload will attach to <strong>{linkedFieldName}</strong>.
              </AlertDescription>
            </Alert>
          )}

          {/* ——— Single-file: field picker ——— */}
          {!isBatchMode && canonicalFields.length > 0 && (
            <div className="rounded-xl border-2 border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm">
              <Label className="text-base font-semibold text-green-950">Which field is this file for?</Label>
              <p className="mb-3 text-sm text-green-800/90">
                Pick a saved field or choose “New field” to enter a name and acres. You will confirm extraction and add
                context on the next step.
              </p>
              <Select
                value={linkedFieldId || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setLinkedFieldId(null);
                    setLinkedFieldName(null);
                    setBootstrap({ field_name: "", field_size_acres: "" });
                    setErrors({});
                  } else {
                    const field = canonicalFields.find((f) => f.id === value);
                    if (field) {
                      applyLinkedField(field, setLinkedFieldId, setLinkedFieldName, setBootstrap);
                      setErrors({});
                    }
                  }
                }}
              >
                <SelectTrigger className="border-emerald-200 bg-white">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">New field — enter name and acres below</SelectItem>
                  {canonicalFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {fieldDisplayName(f)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-green-800/80">
                <Link to={createPageUrl("FieldVisualization")} className="font-medium underline underline-offset-2">
                  Open Fields
                </Link>{" "}
                to draw or edit boundaries.
              </p>
            </div>
          )}

          {!isBatchMode && canonicalFields.length === 0 && (
            <Alert>
              <AlertDescription className="text-sm">
                No saved fields yet — enter a name and acres below. After upload, you can enrich context when you review
                the extraction.
              </AlertDescription>
            </Alert>
          )}

          {!isBatchMode && isExistingFieldLinked && (
            <div className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-green-950">Linked field</h4>
              <p className="mt-1 text-sm text-green-900">
                <span className="font-medium">{linkedFieldName}</span>
                {hasRegistryAcres && <span className="text-green-800"> · {registryAcres} acres</span>}
              </p>
              {!hasRegistryAcres && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="field_size_acres_existing" className="text-sm font-medium text-green-900">
                    Field size (acres) <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-green-800/90">
                    No acreage on file — enter once so this upload can link correctly.
                  </p>
                  <Input
                    id="field_size_acres_existing"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g., 120.5"
                    value={bootstrap.field_size_acres ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") {
                        setBootstrap((p) => ({ ...p, field_size_acres: "" }));
                        return;
                      }
                      const n = parseFloat(v);
                      setBootstrap((p) => ({ ...p, field_size_acres: Number.isNaN(n) ? "" : n }));
                    }}
                    className={errors.field_size_acres ? "border-red-500" : ""}
                  />
                  {errors.field_size_acres && <p className="text-sm text-red-600">{errors.field_size_acres}</p>}
                </div>
              )}
            </div>
          )}

          {!isBatchMode && isNewFieldBootstrap && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="field_name" className="text-sm font-medium text-green-900">
                  Field name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="field_name"
                  placeholder="e.g., North Field"
                  value={bootstrap.field_name}
                  onChange={(e) => setBootstrap((p) => ({ ...p, field_name: e.target.value }))}
                  className={errors.field_name ? "border-red-500" : ""}
                />
                {errors.field_name && <p className="text-sm text-red-600">{errors.field_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="field_size_acres" className="text-sm font-medium text-green-900">
                  Field size (acres) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="field_size_acres"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g., 120.5"
                  value={bootstrap.field_size_acres ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setBootstrap((p) => ({ ...p, field_size_acres: "" }));
                      return;
                    }
                    const n = parseFloat(v);
                    setBootstrap((p) => ({ ...p, field_size_acres: Number.isNaN(n) ? "" : n }));
                  }}
                  className={errors.field_size_acres ? "border-red-500" : ""}
                />
                {errors.field_size_acres && <p className="text-sm text-red-600">{errors.field_size_acres}</p>}
              </div>
            </div>
          )}

          {!isBatchMode && (
            <div className="space-y-2">
              <Label htmlFor="document_note" className="text-sm font-medium text-green-900">
                Document note <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="document_note"
                rows={2}
                placeholder="Short note for this file only — lab, sampling event, load ID…"
                value={documentNote}
                onChange={(e) => setDocumentNote(e.target.value)}
                className="resize-y min-h-[4rem]"
              />
            </div>
          )}

          {/* ——— Batch: full metadata ——— */}
          {isBatchMode && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-900">
                    Batch field name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={batchForm.field_name}
                    onChange={(e) => handleBatchChange("field_name", e.target.value)}
                    className={errors.field_name ? "border-red-500" : ""}
                    placeholder="e.g., Johnson Farm Batch 2024"
                  />
                  {errors.field_name && <p className="text-sm text-red-600">{errors.field_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-900">
                    Total area (acres) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={batchForm.field_size_acres ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") return handleBatchChange("field_size_acres", "");
                      const n = parseFloat(v);
                      handleBatchChange("field_size_acres", Number.isNaN(n) ? "" : n);
                    }}
                    className={errors.field_size_acres ? "border-red-500" : ""}
                  />
                  {errors.field_size_acres && <p className="text-sm text-red-600">{errors.field_size_acres}</p>}
                </div>
              </div>

              <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between border-dashed border-green-200">
                    <span>Optional batch context (crop, practice, location, notes)</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${optionalOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Intended crop</Label>
                      <Select value={batchForm.intended_crop} onValueChange={(v) => handleBatchChange("intended_crop", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_CROPS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Farming method</Label>
                      <Select value={batchForm.farming_method} onValueChange={(v) => handleBatchChange("farming_method", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {FARMING_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Soil type</Label>
                      <Input
                        value={batchForm.soil_type}
                        onChange={(e) => handleBatchChange("soil_type", e.target.value)}
                        placeholder="e.g., Clay loam"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Irrigation</Label>
                      <Select value={batchForm.irrigation_type} onValueChange={(v) => handleBatchChange("irrigation_type", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dryland">Dryland</SelectItem>
                          <SelectItem value="pivot">Center Pivot</SelectItem>
                          <SelectItem value="flood">Flood</SelectItem>
                          <SelectItem value="drip">Drip</SelectItem>
                          <SelectItem value="sprinkler">Sprinkler</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>General location (optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={batchForm.location.address}
                          onChange={(e) => handleBatchChange("location.address", e.target.value)}
                          placeholder="County, state, or coordinates"
                        />
                        <Button type="button" variant="outline" size="icon" onClick={getCurrentLocation} title="Use current location">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Previous crop history</Label>
                    <Textarea
                      value={batchForm.previous_crop_history}
                      onChange={(e) => handleBatchChange("previous_crop_history", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch / document notes</Label>
                    <Textarea
                      value={batchForm.field_notes}
                      onChange={(e) => handleBatchChange("field_notes", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex items-center gap-2" disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4" />
              {isBatchMode ? "Back to files" : "Back"}
            </Button>
            <Button
              type="submit"
              className={`flex items-center gap-2 ${
                isFormValid && !isSubmitting ? "bg-green-600 shadow-lg hover:bg-green-700" : "cursor-not-allowed bg-gray-400"
              }`}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Processing…" : isBatchMode ? "Start batch processing" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="pt-2 text-center text-xs text-gray-500">
            {isBatchMode ? (
              <>
                <span className="text-red-500">*</span> Batch name and total acres are required.
                <span className="mt-1 block font-medium text-green-700">Applies to all {fileCount} files.</span>
              </>
            ) : isExistingFieldLinked ? (
              hasRegistryAcres
                ? "Field is linked from your registry. Add an optional note, then continue."
                : "Enter acres once if missing from the registry, then continue."
            ) : (
              <>
                <span className="text-red-500">*</span> New field needs a name and size. Other context is added at review.
              </>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
