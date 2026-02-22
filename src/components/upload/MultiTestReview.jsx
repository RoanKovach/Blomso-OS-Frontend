
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Brain, XCircle, RotateCcw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-hot-toast"; // Assuming react-hot-toast for toasts

// Import validation utilities
import { validateSoilTest, shapeSoilTestPayload, parse422Errors } from "../utils/soilTestValidation";

// Helper component for editable fields with validation
const EditableField = ({ id, label, value, onChange, error, isBlank, type = "number", placeholder, required = false }) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="text-xs font-medium text-gray-600">
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
            id={id}
            type={type}
            value={value ?? ''} 
            onChange={onChange}
            placeholder={placeholder || "Enter value"}
            className={`h-9 ${isBlank && required ? 'bg-yellow-100 border-yellow-400 focus:bg-yellow-50' : 'bg-white'} ${error ? 'border-red-500' : ''}`}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
);

export default function MultiTestReview({ tests, onUpdateTest, onResetTest, onFinalize, onCancel, apiErrors = {} }) {
    const [validationErrors, setValidationErrors] = useState({});
    
    // All soil data fields that should be displayed
    const soilDataFields = [
        { key: 'ph', label: 'pH', type: 'number', required: false },
        { key: 'organic_matter', label: 'Organic Matter (%)', type: 'number', required: false },
        { key: 'nitrogen', label: 'Nitrogen (ppm)', type: 'number', required: false },
        { key: 'phosphorus', label: 'Phosphorus (ppm)', type: 'number', required: false },
        { key: 'potassium', label: 'Potassium (ppm)', type: 'number', required: false },
        { key: 'calcium', label: 'Calcium (ppm)', type: 'number', required: false },
        { key: 'magnesium', label: 'Magnesium (ppm)', type: 'number', required: false },
        { key: 'sulfur', label: 'Sulfur (ppm)', type: 'number', required: false },
        { key: 'cec', label: 'CEC (meq/100g)', type: 'number', required: false },
        { key: 'base_saturation', label: 'Base Saturation (%)', type: 'number', required: false },
        { key: 'iron', label: 'Iron (ppm)', type: 'number', required: false },
        { key: 'zinc', label: 'Zinc (ppm)', type: 'number', required: false },
        { key: 'manganese', label: 'Manganese (ppm)', type: 'number', required: false },
        { key: 'copper', label: 'Copper (ppm)', type: 'number', required: false },
        { key: 'boron', label: 'Boron (ppm)', type: 'number', required: false }
    ];

    // Validate all tests whenever tests change
    useEffect(() => {
        const newValidationErrors = {};
        
        tests.forEach(test => {
            const shaped = shapeSoilTestPayload(test);
            const validation = validateSoilTest(shaped);
            
            if (!validation.isValid) {
                newValidationErrors[test.tempId] = validation.errors;
            }
        });
        
        setValidationErrors(newValidationErrors);
    }, [tests]);

    // Check if there are any validation errors (client-side or server-side API errors)
    const hasValidationErrors = Object.keys(validationErrors).length > 0 || Object.keys(apiErrors).length > 0;

    const handleFieldChange = (test, fieldName, value) => {
        const isNumeric = soilDataFields.some(field => field.key === fieldName && field.type === 'number');
        let parsedValue = value;

        if (isNumeric) {
            parsedValue = value === '' ? null : parseFloat(value);
            if (isNaN(parsedValue)) parsedValue = null;
        }

        const updatedTest = { ...test };
        if (fieldName === 'zone_name' || fieldName === 'test_date') {
            updatedTest[fieldName] = parsedValue;
        } else if (fieldName === 'lab_name') {
            updatedTest.lab_info = { ...updatedTest.lab_info, lab_name: parsedValue };
        }
        else {
            updatedTest.soil_data = { ...updatedTest.soil_data, [fieldName]: parsedValue };
        }
        onUpdateTest(updatedTest);
    };

    const getFieldError = (testId, fieldPath) => {
        const testApiErrors = apiErrors[testId] || {};
        const testValidationErrors = validationErrors[testId] || {};
        
        // Prioritize API errors if they exist for the field, otherwise use client validation errors
        return testApiErrors[fieldPath] || 
               (testValidationErrors[fieldPath] && testValidationErrors[fieldPath][0]) ||
               null;
    };

    const handleFinalize = () => {
        // Perform final validation before submitting
        let hasFinalErrors = false;
        const finalValidationErrors = {};
        
        tests.forEach(test => {
            const shaped = shapeSoilTestPayload(test);
            const validation = validateSoilTest(shaped);
            
            if (!validation.isValid) {
                hasFinalErrors = true;
                finalValidationErrors[test.tempId] = validation.errors;
            }
        });
        
        if (hasFinalErrors) {
            setValidationErrors(finalValidationErrors);
            toast.error("Please fix validation errors before saving.");
            return;
        }
        
        // Shape all payloads before sending
        const shapedTests = tests.map(shapeSoilTestPayload);
        onFinalize(shapedTests);
    };

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold text-green-900 mb-2 flex items-center gap-3">
                                <FileText className="w-7 h-7" />
                                Review Extracted Data
                            </CardTitle>
                            <p className="text-green-700">
                                The AI found {tests.length} soil test record(s). Review and edit all fields below before saving.
                            </p>
                            {hasValidationErrors && (
                                <p className="text-amber-700 text-sm mt-2">
                                    <AlertTriangle className="inline w-4 h-4 mr-1" />
                                    Please fix validation errors before proceeding.
                                </p>
                            )}
                        </div>
                        <Badge variant="secondary" className="text-lg">
                            {tests.length} Record{tests.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {(Object.keys(apiErrors).length > 0 || Object.keys(validationErrors).length > 0) && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold">Please fix the validation errors below.</p>
                                <ul className="mt-2 text-sm list-disc list-inside">
                                    {/* Display API errors first */}
                                    {Object.entries(apiErrors).flatMap(([tempId, errors]) => 
                                        Object.entries(errors).map(([field, fieldError]) => (
                                            <li key={`api-${tempId}-${field}`}>
                                                Record {parseInt(tempId, 10) + 1} - {field.split('.').pop()}: {Array.isArray(fieldError) ? fieldError.join(', ') : fieldError}
                                            </li>
                                        ))
                                    )}
                                    {/* Display client-side validation errors */}
                                    {Object.entries(validationErrors).flatMap(([tempId, errors]) => 
                                        Object.entries(errors).map(([field, fieldErrors]) => (
                                            <li key={`val-${tempId}-${field}`}>
                                                Record {parseInt(tempId, 10) + 1} - {field.split('.').pop()}: {fieldErrors[0]}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-6">
                        {tests.map((test, index) => { // Added index to map for clearer error messages
                            const isZoneNameBlank = !test.zone_name || test.zone_name.trim() === '';

                            return (
                                <Card key={test.tempId} className="bg-white/60 border-gray-200">
                                    <CardHeader className="flex flex-row justify-between items-center p-4">
                                        <div className="w-2/5">
                                            <EditableField
                                                id={`zone_name_${test.tempId}`}
                                                label="Zone/Field Name"
                                                type="text"
                                                value={test.zone_name}
                                                onChange={(e) => handleFieldChange(test, 'zone_name', e.target.value)}
                                                error={getFieldError(test.tempId, 'zone_name')}
                                                isBlank={isZoneNameBlank}
                                                placeholder="e.g., Field 44"
                                                required={true}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onResetTest(test.tempId)}
                                            className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                                        >
                                            <RotateCcw className="w-4 h-4" /> Reset All
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        {/* Basic Test Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <EditableField
                                                id={`test_date_${test.tempId}`}
                                                label="Test Date"
                                                type="date"
                                                value={test.test_date}
                                                onChange={(e) => handleFieldChange(test, 'test_date', e.target.value)}
                                                error={getFieldError(test.tempId, 'test_date')}
                                                isBlank={!test.test_date}
                                                required={true}
                                            />
                                            <EditableField
                                                id={`lab_name_${test.tempId}`}
                                                label="Lab Name"
                                                type="text"
                                                value={test.lab_info?.lab_name || ''}
                                                onChange={(e) => handleFieldChange(test, 'lab_name', e.target.value)}
                                                error={getFieldError(test.tempId, 'lab_name')}
                                                placeholder="e.g., Penn State"
                                            />
                                        </div>

                                        {/* All Soil Data Fields */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Soil Analysis Data</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {soilDataFields.map(field => {
                                                    const value = test.soil_data?.[field.key];
                                                    const isBlank = value == null;
                                                    return (
                                                        <EditableField
                                                            key={field.key}
                                                            id={`${field.key}_${test.tempId}`}
                                                            label={field.label}
                                                            type={field.type}
                                                            value={value}
                                                            onChange={(e) => handleFieldChange(test, field.key, e.target.value)}
                                                            error={getFieldError(test.tempId, `soil_data.${field.key}`)}
                                                            isBlank={isBlank}
                                                            placeholder={isBlank ? "Not found" : ""}
                                                            required={field.required}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Source File Info */}
                                        {test.source_file_name && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-600">
                                                    <strong>Source:</strong> {test.source_file_name}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                <CardFooter className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6">
                    <div className="text-sm text-green-700">
                        <p className="font-semibold">✅ All records will be validated and saved to your account.</p>
                        <p>Required fields: Zone name and Test date. Other fields are optional.</p>
                        {hasValidationErrors && (
                            <p className="text-amber-700 font-medium mt-1">
                                ⚠️ Please fix validation errors above before saving.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="flex items-center gap-2 border-red-200 hover:bg-red-50"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel Upload
                        </Button>
                        <Button
                            onClick={handleFinalize}
                            disabled={hasValidationErrors}
                            className={`flex items-center gap-2 ${
                                hasValidationErrors
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                            title={hasValidationErrors ? "Please fix validation errors first" : "Save all records"}
                        >
                            <Brain className="w-4 h-4" />
                            Save All Records
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
