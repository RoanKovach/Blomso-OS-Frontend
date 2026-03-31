import React, { useState, useEffect, useRef } from "react";
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

function applyLinkedField(field, setLinkedFieldId, setLinkedFieldName, setFormData) {
  if (!field) return;
  setLinkedFieldId(field.id);
  const name = field.field_name ?? field.name ?? field.fieldName ?? "";
  setLinkedFieldName(name);
  const acres = field.acres ?? field.field_size_acres ?? field.size ?? null;
  const numAcres = acres != null ? Number(acres) : null;
  setFormData((prev) => ({
    ...prev,
    field_name: name,
    ...(numAcres != null && !isNaN(numAcres) ? { field_size_acres: numAcres } : {}),
  }));
}

export default function ContextualForm({
  onSubmit,
  onBack,
  isBatchMode = false,
  fileCount = 1,
  canonicalFields = [],
  initialFieldId = null,
}) {
  const [formData, setFormData] = useState({
    field_name: "",
    field_size_acres: "",
    intended_crop: "",
    farming_method: "",
    previous_crop_history: "",
    soil_type: "",
    irrigation_type: "",
    location: {
      address: "",
      latitude: null,
      longitude: null,
    },
    field_notes: "",
  });

  const [linkedFieldId, setLinkedFieldId] = useState(null);
  const [linkedFieldName, setLinkedFieldName] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const appliedInitialFieldRef = useRef(false);

  useEffect(() => {
    if (!initialFieldId || !canonicalFields.length || appliedInitialFieldRef.current) return;
    const field = canonicalFields.find((f) => f.id === initialFieldId);
    if (field) {
      applyLinkedField(field, setLinkedFieldId, setLinkedFieldName, setFormData);
      appliedInitialFieldRef.current = true;
    }
  }, [initialFieldId, canonicalFields]);

  const handleInputChange = (field, value) => {
    if (field.startsWith("location.")) {
      const locationField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.field_name.trim()) {
      newErrors.field_name = "Field name is required";
    }

    if (!formData.field_size_acres || formData.field_size_acres <= 0) {
      newErrors.field_size_acres = "Valid field size is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSubmit({
        ...formData,
        linkedFieldId: linkedFieldId || null,
        linkedFieldName: linkedFieldName || null,
        enteredFieldLabel: formData.field_name.trim() || null,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const isFormValid =
    formData.field_name.trim() &&
    formData.field_size_acres > 0 &&
    Object.keys(errors).length === 0;

  const fromFieldDeepLink = Boolean(initialFieldId && linkedFieldId === initialFieldId);

  return (
    <Card className="border-none bg-white/80 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          {isBatchMode ? <FileArchive className="h-6 w-6" /> : <Tractor className="h-6 w-6" />}
          {isBatchMode ? `Batch metadata for ${fileCount} files` : "Step 2: Attach evidence to a field"}
        </CardTitle>
        <p className="mt-2 text-green-800">
          {isBatchMode
            ? `This context applies to all ${fileCount} files in the batch.`
            : "Choose the field this document belongs to, then confirm name and acres. Optional details stay out of the way until you need them."}
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

          {!isBatchMode && canonicalFields.length > 0 && (
            <div className="rounded-xl border-2 border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm">
              <Label className="text-base font-semibold text-green-950">Which field is this evidence for?</Label>
              <p className="mb-3 text-sm text-green-800/90">
                Select an existing field or enter a new one below. Linking keeps uploads organized with your field
                registry.
              </p>
              <Select
                value={linkedFieldId || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setLinkedFieldId(null);
                    setLinkedFieldName(null);
                  } else {
                    const field = canonicalFields.find((f) => f.id === value);
                    if (field) {
                      applyLinkedField(field, setLinkedFieldId, setLinkedFieldName, setFormData);
                    }
                  }
                }}
              >
                <SelectTrigger className="border-emerald-200 bg-white">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">New field — I will name it below</SelectItem>
                  {canonicalFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.field_name ?? f.name ?? f.fieldName ?? f.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-green-800/80">
                Need to draw or edit boundaries?{" "}
                <Link to={createPageUrl("FieldVisualization")} className="font-medium underline underline-offset-2">
                  Open Fields
                </Link>
                .
              </p>
            </div>
          )}

          {!isBatchMode && canonicalFields.length === 0 && (
            <Alert>
              <AlertDescription className="text-sm">
                No saved fields yet — enter the field name and size below. You can draw fields on the{" "}
                <Link to={createPageUrl("FieldVisualization")} className="font-medium underline">
                  Fields
                </Link>{" "}
                page and link future uploads.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="field_name" className="text-sm font-medium text-green-900">
                {isBatchMode ? "Batch field name" : "Field name"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="field_name"
                placeholder={isBatchMode ? "e.g., Johnson Farm Batch 2024" : "e.g., North Field"}
                value={formData.field_name}
                onChange={(e) => handleInputChange("field_name", e.target.value)}
                className={errors.field_name ? "border-red-500" : ""}
              />
              {errors.field_name && <p className="text-sm text-red-600">{errors.field_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_size_acres" className="text-sm font-medium text-green-900">
                {isBatchMode ? "Total area (acres)" : "Field size (acres)"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="field_size_acres"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g., 120.5"
                value={formData.field_size_acres ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || v === null) {
                    handleInputChange("field_size_acres", null);
                    return;
                  }
                  const n = parseFloat(v);
                  handleInputChange("field_size_acres", Number.isNaN(n) ? null : n);
                }}
                className={errors.field_size_acres ? "border-red-500" : ""}
              />
              {errors.field_size_acres && <p className="text-sm text-red-600">{errors.field_size_acres}</p>}
            </div>
          </div>

          <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between border-dashed border-green-200">
                <span>Optional field context (crop, practice, location, notes)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${optionalOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intended_crop" className="text-sm font-medium text-green-900">
                    Intended crop
                  </Label>
                  <Select value={formData.intended_crop} onValueChange={(value) => handleInputChange("intended_crop", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CROPS.map((crop) => (
                        <SelectItem key={crop} value={crop}>
                          {crop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farming_method" className="text-sm font-medium text-green-900">
                    Farming method
                  </Label>
                  <Select value={formData.farming_method} onValueChange={(value) => handleInputChange("farming_method", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {FARMING_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soil_type" className="text-sm font-medium text-green-900">
                    Soil type
                  </Label>
                  <Input
                    id="soil_type"
                    placeholder="e.g., Clay loam"
                    value={formData.soil_type}
                    onChange={(e) => handleInputChange("soil_type", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="irrigation_type" className="text-sm font-medium text-green-900">
                    Irrigation
                  </Label>
                  <Select value={formData.irrigation_type} onValueChange={(value) => handleInputChange("irrigation_type", value)}>
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
                  <Label htmlFor="location_address" className="text-sm font-medium text-green-900">
                    {isBatchMode ? "General location" : "Field location"} (optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="location_address"
                      placeholder="County, state, or coordinates"
                      value={formData.location.address}
                      onChange={(e) => handleInputChange("location.address", e.target.value)}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={getCurrentLocation} title="Use current location">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.location.latitude && formData.location.longitude && (
                    <p className="text-sm text-green-600">
                      Location set: {formData.location.latitude.toFixed(4)}, {formData.location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_crop_history" className="text-sm font-medium text-green-900">
                  Previous crop history
                </Label>
                <Textarea
                  id="previous_crop_history"
                  placeholder="e.g., Corn (2023), Soybeans (2022)"
                  value={formData.previous_crop_history}
                  onChange={(e) => handleInputChange("previous_crop_history", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_notes" className="text-sm font-medium text-green-900">
                  Field notes
                </Label>
                <Textarea
                  id="field_notes"
                  placeholder="Drainage, problem areas, treatments…"
                  value={formData.field_notes}
                  onChange={(e) => handleInputChange("field_notes", e.target.value)}
                  rows={3}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex items-center gap-2" disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4" />
              {isBatchMode ? "Back to files" : "Back"}
            </Button>
            <Button
              type="submit"
              className={`flex items-center gap-2 transition-all duration-200 ${
                isFormValid && !isSubmitting ? "bg-green-600 shadow-lg hover:bg-green-700" : "cursor-not-allowed bg-gray-400"
              }`}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Processing…" : isBatchMode ? "Start batch processing" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="pt-2 text-center text-xs text-gray-500">
            <span className="text-red-500">*</span> Field name and acres are required. Everything else is optional.
            {isBatchMode && <span className="mt-1 block font-medium text-green-700">Applies to all {fileCount} files.</span>}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
