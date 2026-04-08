import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, MapPin, Calendar, Sprout } from "lucide-react";
import { formatDateOnlySafe } from "./dateUtils";

function LineageReadOnly({ test }) {
    const pairs = [
        ["Linked field ID", test?.linkedFieldId],
        ["Linked field name", test?.linkedFieldName],
        ["Entered field label", test?.enteredFieldLabel],
        ["Extraction artifact", test?.extractionArtifactKey],
        ["Reviewed artifact", test?.reviewedArtifactKey],
        ["Normalized artifact", test?.normalizedArtifactKey],
    ].filter(([, v]) => v != null && v !== "");
    if (pairs.length === 0) return null;
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
            <h4 className="mb-3 font-semibold text-slate-900">Lineage</h4>
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {pairs.map(([label, value]) => (
                    <div key={label} className="rounded-md border bg-white p-3">
                        <dt className="text-xs font-medium text-gray-500">{label}</dt>
                        <dd className="mt-1 break-all font-mono text-xs text-gray-900">{String(value)}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function ExpandableRow({ test, displayFieldName, displayCrop, displayAcres }) {
    const soilData = test.soil_data || {};
    
    const nutrients = [
        { key: 'ph', label: 'pH Level', unit: '' },
        { key: 'organic_matter', label: 'Organic Matter', unit: '%' },
        { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'ppm' },
        { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'ppm' },
        { key: 'potassium', label: 'Potassium (K)', unit: 'ppm' },
        { key: 'calcium', label: 'Calcium (Ca)', unit: 'ppm' },
        { key: 'magnesium', label: 'Magnesium (Mg)', unit: 'ppm' },
        { key: 'sulfur', label: 'Sulfur (S)', unit: 'ppm' },
        { key: 'cec', label: 'CEC', unit: 'meq/100g' },
        { key: 'zinc', label: 'Zinc (Zn)', unit: 'ppm' },
        { key: 'copper', label: 'Copper (Cu)', unit: 'ppm' },
        { key: 'iron', label: 'Iron (Fe)', unit: 'ppm' }
    ];

    const getStatusColor = (value) => {
        if (value === null || value === undefined) return 'bg-gray-100 text-gray-600';
        // Simple color coding - can be enhanced with actual thresholds
        return 'bg-green-100 text-green-800';
    };

    return (
        <div className="p-6 space-y-6">
            {/* Test Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <div>
                        <p className="text-sm text-gray-500">Field / Zone</p>
                        <p className="font-semibold">{displayFieldName ?? test.field_name ?? test.zone_name ?? 'Main'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                        <p className="text-sm text-gray-500">Test Date</p>
                        <p className="font-semibold">
                            {formatDateOnlySafe(test.test_date) || 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Sprout className="w-5 h-5 text-amber-600" />
                    <div>
                        <p className="text-sm text-gray-500">Crop</p>
                        <p className="font-semibold">{displayCrop ?? test.crop_type ?? 'Not specified'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <div>
                        <p className="text-sm text-gray-500">Field Size</p>
                        <p className="font-semibold">{(displayAcres ?? test.field_size_acres) ?? 0} acres</p>
                    </div>
                </div>
            </div>

            {/* Soil Health Scores */}
            {(test.soil_health_index || test.biological_score) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {test.soil_health_index && (
                        <div className="text-center p-4 bg-green-50 rounded-lg border">
                            <p className="text-sm text-green-600 font-medium mb-1">Soil Health Index</p>
                            <p className="text-3xl font-bold text-green-900">{test.soil_health_index}/100</p>
                        </div>
                    )}
                    {test.biological_score && (
                        <div className="text-center p-4 bg-blue-50 rounded-lg border">
                            <p className="text-sm text-blue-600 font-medium mb-1">Biological Score</p>
                            <p className="text-3xl font-bold text-blue-900">{test.biological_score}/100</p>
                        </div>
                    )}
                </div>
            )}

            {/* Detailed Soil Data */}
            <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Soil Analysis Data
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {nutrients.map((nutrient) => {
                        const value = soilData[nutrient.key];
                        return (
                            <div key={nutrient.key} className="p-3 bg-white rounded-lg border">
                                <p className="text-xs text-gray-500 mb-1">{nutrient.label}</p>
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-900">
                                        {value !== null && value !== undefined ? value : 'N/A'}
                                        {value !== null && value !== undefined && (
                                            <span className="text-xs font-normal text-gray-500 ml-1">
                                                {nutrient.unit}
                                            </span>
                                        )}
                                    </p>
                                    <Badge className={`text-xs ${getStatusColor(value)}`}>
                                        {value !== null && value !== undefined ? 'OK' : 'N/A'}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <LineageReadOnly test={test} />

            {/* AI Summary */}
            {test.summary && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">AI Analysis Summary</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">{test.summary}</p>
                </div>
            )}
        </div>
    );
}