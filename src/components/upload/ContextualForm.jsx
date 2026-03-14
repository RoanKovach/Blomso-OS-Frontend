import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, ArrowRight, ArrowLeft, AlertCircle, Tractor, FileArchive } from "lucide-react";

const COMMON_CROPS = [
  "Corn", "Soybeans", "Wheat", "Cotton", "Rice", "Alfalfa", "Sorghum", 
  "Sunflower", "Canola", "Oats", "Barley", "Potatoes", "Tomatoes", "Other"
];

const FARMING_METHODS = [
  "Conventional", "Organic", "No-Till", "Regenerative", "Strip-Till", "Minimum Till", "Other"
];

export default function ContextualForm({ onSubmit, onBack, isBatchMode = false, fileCount = 1, canonicalFields = [] }) {
  const [formData, setFormData] = useState({
    field_name: '',
    field_size_acres: '',
    intended_crop: '',
    farming_method: '',
    previous_crop_history: '',
    soil_type: '',
    irrigation_type: '',
    location: {
      address: '',
      latitude: null,
      longitude: null
    },
    field_notes: ''
  });

  /** Optional link to a canonical field from GET /fields (signed-in registry) */
  const [linkedFieldId, setLinkedFieldId] = useState(null);
  const [linkedFieldName, setLinkedFieldName] = useState(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
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

    if (!formData.intended_crop) {
      newErrors.intended_crop = "Please select an intended crop";
    }

    if (!formData.farming_method) {
      newErrors.farming_method = "Please select a farming method";
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
      await new Promise(resolve => setTimeout(resolve, 500));
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
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const isFormValid = formData.field_name.trim() && 
                     formData.field_size_acres > 0 && 
                     formData.intended_crop &&
                     formData.farming_method &&
                     Object.keys(errors).length === 0;

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          {isBatchMode ? <FileArchive className="w-6 h-6" /> : <Tractor className="w-6 h-6" />}
          {isBatchMode ? `Batch Metadata for ${fileCount} Files` : 'Step 2: Field Context & Farming Details'}
        </CardTitle>
        <p className="text-green-700 mt-2">
          {isBatchMode 
            ? `Provide field information that will be applied to all ${fileCount} files in this batch`
            : 'Provide detailed field information to enable accurate, context-aware analysis and recommendations'
          }
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please correct the errors below before continuing.
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Field Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isBatchMode && canonicalFields.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-green-900">
                  Link to field (optional)
                </Label>
                <Select
                  value={linkedFieldId || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setLinkedFieldId(null);
                      setLinkedFieldName(null);
                    } else {
                      const field = canonicalFields.find((f) => f.id === value);
                      if (field) {
                        setLinkedFieldId(field.id);
                        const name = field.field_name ?? field.name ?? field.fieldName ?? '';
                        setLinkedFieldName(name);
                        const acres = field.acres ?? field.field_size_acres ?? field.size ?? null;
                        const numAcres = acres != null ? Number(acres) : null;
                        setFormData((prev) => ({
                          ...prev,
                          field_name: name,
                          ...(numAcres != null && !isNaN(numAcres) ? { field_size_acres: numAcres } : {}),
                        }));
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None – use free text below" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None – use free text below</SelectItem>
                    {canonicalFields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.field_name ?? f.name ?? f.fieldName ?? f.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="field_name" className="text-sm font-medium text-green-900">
                {isBatchMode ? 'Batch Field Name' : 'Field Name or ID'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="field_name"
                placeholder={isBatchMode ? "e.g., Johnson Farm Batch 2024" : "e.g., North Field, Plot A-1"}
                value={formData.field_name}
                onChange={(e) => handleInputChange('field_name', e.target.value)}
                className={errors.field_name ? "border-red-500" : ""}
              />
              {errors.field_name && (
                <p className="text-sm text-red-600">{errors.field_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_size_acres" className="text-sm font-medium text-green-900">
                {isBatchMode ? 'Total Area (Acres)' : 'Field Size (Acres)'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="field_size_acres"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g., 120.5"
                value={formData.field_size_acres}
                onChange={(e) => handleInputChange('field_size_acres', parseFloat(e.target.value))}
                className={errors.field_size_acres ? "border-red-500" : ""}
              />
              {errors.field_size_acres && (
                <p className="text-sm text-red-600">{errors.field_size_acres}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="intended_crop" className="text-sm font-medium text-green-900">
                Intended Crop <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.intended_crop} 
                onValueChange={(value) => handleInputChange('intended_crop', value)}
              >
                <SelectTrigger className={errors.intended_crop ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select your intended crop" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CROPS.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.intended_crop && (
                <p className="text-sm text-red-600">{errors.intended_crop}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="farming_method" className="text-sm font-medium text-green-900">
                Farming Method <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.farming_method} 
                onValueChange={(value) => handleInputChange('farming_method', value)}
              >
                <SelectTrigger className={errors.farming_method ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select farming method" />
                </SelectTrigger>
                <SelectContent>
                  {FARMING_METHODS.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.farming_method && (
                <p className="text-sm text-red-600">{errors.farming_method}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="soil_type" className="text-sm font-medium text-green-900">
                Soil Type (Optional)
              </Label>
              <Input
                id="soil_type"
                placeholder="e.g., Clay loam, Sandy loam"
                value={formData.soil_type}
                onChange={(e) => handleInputChange('soil_type', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="irrigation_type" className="text-sm font-medium text-green-900">
                Irrigation Type (Optional)
              </Label>
              <Select 
                value={formData.irrigation_type} 
                onValueChange={(value) => handleInputChange('irrigation_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select irrigation type" />
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
                {isBatchMode ? 'General Location (Optional)' : 'Field Location (Optional)'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="location_address"
                  placeholder="e.g., County, State or GPS coordinates"
                  value={formData.location.address}
                  onChange={(e) => handleInputChange('location.address', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={getCurrentLocation}
                  title="Use current location"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
              {formData.location.latitude && formData.location.longitude && (
                <p className="text-sm text-green-600">
                  📍 Location set: {formData.location.latitude.toFixed(4)}, {formData.location.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="previous_crop_history" className="text-sm font-medium text-green-900">
                Previous Crop History (Optional)
              </Label>
              <Textarea
                id="previous_crop_history"
                placeholder="e.g., Corn (2023), Soybeans (2022), Wheat (2021)"
                value={formData.previous_crop_history}
                onChange={(e) => handleInputChange('previous_crop_history', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_notes" className="text-sm font-medium text-green-900">
                Additional Field Notes (Optional)
              </Label>
              <Textarea
                id="field_notes"
                placeholder="e.g., Known problem areas, drainage issues, previous treatments, etc."
                value={formData.field_notes}
                onChange={(e) => handleInputChange('field_notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack} 
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4" />
              {isBatchMode ? 'Back to Files' : 'Back to Upload'}
            </Button>
            <Button 
              type="submit" 
              className={`flex items-center gap-2 transition-all duration-200 ${
                isFormValid && !isSubmitting
                  ? "bg-green-600 hover:bg-green-700 shadow-lg" 
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "Processing..." : isBatchMode ? "Start Batch Processing" : "Continue to Analysis"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            Required fields are marked with <span className="text-red-500">*</span>
            {isBatchMode && (
              <div className="mt-1 text-green-600 font-medium">
                This metadata will be applied to all {fileCount} files in the batch
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}