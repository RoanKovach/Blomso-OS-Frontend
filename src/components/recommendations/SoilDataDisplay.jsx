import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function SoilDataDisplay({ soilTest }) {
  const soilData = soilTest.soil_data || {};

  const getNutrientStatus = (nutrient, value) => {
    // Simplified nutrient level assessment
    const ranges = {
      ph: { low: 5.5, high: 7.5, optimal: [6.0, 7.0] },
      organic_matter: { low: 2.0, high: 8.0, optimal: [3.0, 6.0] },
      nitrogen: { low: 10, high: 50, optimal: [20, 40] },
      phosphorus: { low: 15, high: 80, optimal: [25, 50] },
      potassium: { low: 100, high: 400, optimal: [150, 300] },
      cec: { low: 8, high: 25, optimal: [12, 20] }
    };

    const range = ranges[nutrient];
    if (!range || value === undefined || value === null) {
      return { status: "unknown", color: "bg-gray-100 text-gray-800", icon: Minus };
    }

    if (value >= range.optimal[0] && value <= range.optimal[1]) {
      return { status: "optimal", color: "bg-green-100 text-green-800", icon: TrendingUp };
    } else if (value < range.low || value > range.high) {
      return { status: "needs attention", color: "bg-red-100 text-red-800", icon: TrendingDown };
    } else {
      return { status: "acceptable", color: "bg-yellow-100 text-yellow-800", icon: Minus };
    }
  };

  const nutrients = [
    { key: 'ph', label: 'pH Level', unit: '', description: 'Soil acidity/alkalinity' },
    { key: 'organic_matter', label: 'Organic Matter', unit: '%', description: 'Soil organic content' },
    { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'ppm', description: 'Available nitrogen' },
    { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'ppm', description: 'Available phosphorus' },
    { key: 'potassium', label: 'Potassium (K)', unit: 'ppm', description: 'Available potassium' },
    { key: 'calcium', label: 'Calcium (Ca)', unit: 'ppm', description: 'Available calcium' },
    { key: 'magnesium', label: 'Magnesium (Mg)', unit: 'ppm', description: 'Available magnesium' },
    { key: 'sulfur', label: 'Sulfur (S)', unit: 'ppm', description: 'Available sulfur' },
    { key: 'cec', label: 'CEC', unit: 'meq/100g', description: 'Cation exchange capacity' },
    { key: 'base_saturation', label: 'Base Saturation', unit: '%', description: 'Nutrient holding capacity' }
  ];

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          <Activity className="w-6 h-6 text-green-600" />
          Detailed Soil Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nutrients.map((nutrient) => {
            const value = soilData[nutrient.key];
            const status = getNutrientStatus(nutrient.key, value);
            const StatusIcon = status.icon;

            return (
              <div
                key={nutrient.key}
                className="p-4 border border-green-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-900">{nutrient.label}</h4>
                  <StatusIcon className="w-4 h-4 text-green-600" />
                </div>
                
                <div className="text-2xl font-bold text-green-900 mb-1">
                  {value !== undefined && value !== null ? value : 'N/A'}
                  {value !== undefined && value !== null && (
                    <span className="text-sm font-normal text-green-700 ml-1">
                      {nutrient.unit}
                    </span>
                  )}
                </div>

                <p className="text-xs text-green-600 mb-2">{nutrient.description}</p>

                <Badge className={`${status.color} border text-xs font-medium`}>
                  {status.status}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Key Insights */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Key Insights from Your Soil Data
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-900">pH Status:</span>
              <span className="text-blue-700 ml-2">
                {soilData.ph ? (
                  soilData.ph < 6.0 ? "Acidic - may need lime" :
                  soilData.ph > 7.5 ? "Alkaline - may limit nutrient uptake" :
                  "Well balanced for most crops"
                ) : "Not measured"}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Organic Matter:</span>
              <span className="text-blue-700 ml-2">
                {soilData.organic_matter ? (
                  soilData.organic_matter < 2.0 ? "Low - needs organic inputs" :
                  soilData.organic_matter > 5.0 ? "Excellent soil biology" :
                  "Moderate levels"
                ) : "Not measured"}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-900">CEC Level:</span>
              <span className="text-blue-700 ml-2">
                {soilData.cec ? (
                  soilData.cec < 10 ? "Low nutrient holding capacity" :
                  soilData.cec > 20 ? "Excellent nutrient retention" :
                  "Good nutrient holding capacity"
                ) : "Not measured"}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-900">NPK Balance:</span>
              <span className="text-blue-700 ml-2">
                {soilData.nitrogen && soilData.phosphorus && soilData.potassium ? 
                  "Complete nutrient profile available" : 
                  "Partial nutrient data available"
                }
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}