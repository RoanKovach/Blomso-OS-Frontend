import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, RotateCcw, AlertTriangle, CheckCircle2, MapPin, Calendar, Ruler } from "lucide-react";

export default function ZoneReviewItem({ test, index, onEdit, onReset, hasErrors }) {
  const soilData = test.soil_data || {};
  const criticalNutrients = ['ph', 'organic_matter', 'nitrogen', 'phosphorus', 'potassium'];
  const availableNutrients = Object.keys(soilData).filter(key => soilData[key] !== null && soilData[key] !== undefined);
  const missingCritical = criticalNutrients.filter(nutrient => !soilData[nutrient]);

  const getStatusColor = () => {
    if (hasErrors) return 'border-red-200 bg-red-50';
    if (missingCritical.length === 0) return 'border-green-200 bg-green-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  const getStatusIcon = () => {
    if (hasErrors) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (missingCritical.length === 0) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <Card className={`border-2 ${getStatusColor()} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg font-bold text-green-900">
                {test.zone_name || `Zone ${index + 1}`}
              </CardTitle>
              <div className="flex items-center gap-4 mt-1 text-sm text-green-700">
                {test.sampling_depth && (
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    {test.sampling_depth}
                  </span>
                )}
                {test.test_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(test.test_date).toLocaleDateString()}
                  </span>
                )}
                {test.field_size_acres && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {test.field_size_acres} acres
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Summary */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {availableNutrients.length} nutrients
              </Badge>
              {missingCritical.length > 0 && (
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  {missingCritical.length} missing
                </Badge>
              )}
            </div>
          </div>

          {/* Nutrient Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {criticalNutrients.map(nutrient => {
              const value = soilData[nutrient];
              const hasValue = value !== null && value !== undefined;
              
              return (
                <div
                  key={nutrient}
                  className={`p-2 rounded-lg text-center ${
                    hasValue 
                      ? 'bg-green-100 border border-green-200' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-700 uppercase">
                    {nutrient.replace('_', ' ')}
                  </div>
                  <div className={`text-sm font-bold ${hasValue ? 'text-green-800' : 'text-gray-500'}`}>
                    {hasValue ? value : 'N/A'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Data */}
          {availableNutrients.length > criticalNutrients.length && (
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-600 mb-2">Additional Nutrients:</div>
              <div className="flex flex-wrap gap-2">
                {availableNutrients
                  .filter(nutrient => !criticalNutrients.includes(nutrient))
                  .map(nutrient => (
                    <Badge key={nutrient} variant="outline" className="text-xs">
                      {nutrient.replace('_', ' ')}: {soilData[nutrient]}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Field Notes */}
          {test.field_notes && (
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-600 mb-1">Field Notes:</div>
              <p className="text-sm text-gray-700">{test.field_notes}</p>
            </div>
          )}

          {/* Lab Methods */}
          {test.lab_methods && Object.keys(test.lab_methods).length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-gray-600 mb-1">Lab Methods:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(test.lab_methods).map(([method, value]) => (
                  <Badge key={method} variant="outline" className="text-xs">
                    {method}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}