import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, MapPin, TrendingUp, Sun, Wind, Droplets, AlertTriangle } from "lucide-react";

export default function FieldDetails({ feature }) {
  if (!feature || !feature.properties) {
    return null;
  }
  
  const { properties } = feature;

  const getHealthBadge = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getETStatus = (etValue) => {
    if (!etValue) return { status: 'Unknown', color: 'gray', advice: 'No data available' };
    
    if (etValue < 200) return { 
      status: 'Low', 
      color: 'blue', 
      advice: 'Consider supplemental irrigation during dry periods'
    };
    if (etValue < 400) return { 
      status: 'Moderate', 
      color: 'green', 
      advice: 'Normal water usage - monitor soil moisture'
    };
    if (etValue < 650) return { 
      status: 'High', 
      color: 'yellow', 
      advice: 'High water usage - optimize irrigation timing'
    };
    return { 
      status: 'Very High', 
      color: 'red', 
      advice: 'Excessive water usage - check for over-irrigation or drainage issues'
    };
  };

  const getNDVIStatus = (ndviValue) => {
    if (!ndviValue) return { status: 'Unknown', color: 'gray', advice: 'No data available' };
    
    if (ndviValue < 0.2) return { 
      status: 'Stressed', 
      color: 'red', 
      advice: 'Check for crop stress, pests, or nutrient deficiency'
    };
    if (ndviValue < 0.5) return { 
      status: 'Moderate', 
      color: 'yellow', 
      advice: 'Monitor crop development and consider nutrition'
    };
    return { 
      status: 'Healthy', 
      color: 'green', 
      advice: 'Good vegetation health - maintain current practices'
    };
  };

  const etStatus = getETStatus(properties.et?.total_season_mm);
  const ndviStatus = getNDVIStatus(properties.ndvi?.mean);

  const statItems = [
    { 
      icon: TrendingUp, 
      label: "Health Score", 
      value: properties.zone_health_score?.toFixed(1) || 'N/A', 
      unit: "/100" 
    },
    { 
      icon: Sun, 
      label: "NDVI", 
      value: properties.ndvi?.mean?.toFixed(2) || 'N/A', 
      unit: "",
      status: ndviStatus
    },
    { 
      icon: Wind, 
      label: "Soil pH", 
      value: properties.soil?.ph_mean?.toFixed(2) || 'N/A', 
      unit: "" 
    },
    { 
      icon: Droplets, 
      label: "Seasonal ET", 
      value: properties.et?.total_season_mm?.toFixed(0) || 'N/A', 
      unit: "mm",
      status: etStatus
    },
  ];

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900">
          <Info className="w-5 h-5" />
          Zone Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-green-900 mb-2">{properties.zone_id}</h4>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>{properties.acres?.toFixed(2) || 0} acres</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-green-900 mb-3">Field Metrics</h4>
          <div className="space-y-3">
            {statItems.map(item => (
              <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">{item.label}</span>
                  {item.status && (
                    <Badge className={`text-xs px-2 py-1 bg-${item.status.color}-100 text-${item.status.color}-800`}>
                      {item.status.status}
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {item.value} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
                </p>
                {item.status && item.status.advice && (
                  <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {item.status.advice}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {properties.zone_health_score && (
          <div className="border-t pt-4 flex justify-center">
            <Badge className={`text-base px-4 py-2 ${getHealthBadge(properties.zone_health_score)}`}>
              Health: {properties.zone_health_score.toFixed(1)}/100
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}