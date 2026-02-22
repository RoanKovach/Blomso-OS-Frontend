import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SoilHealthScore({ soilTest }) {
  const getHealthStatus = (score) => {
    if (score >= 80) return { 
      label: "Excellent", 
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle2,
      iconColor: "text-green-600"
    };
    if (score >= 60) return { 
      label: "Good", 
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: TrendingUp,
      iconColor: "text-blue-600"
    };
    if (score >= 40) return { 
      label: "Fair", 
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: AlertTriangle,
      iconColor: "text-yellow-600"
    };
    return { 
      label: "Needs Attention", 
      color: "bg-red-100 text-red-800 border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-600"
    };
  };

  const soilHealthStatus = getHealthStatus(soilTest.soil_health_index || 0);
  const biologicalStatus = getHealthStatus(soilTest.biological_score || 0);

  const SoilHealthIcon = soilHealthStatus.icon;
  const BiologicalIcon = biologicalStatus.icon;

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Soil Health Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Soil Health Index */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <SoilHealthIcon className={`w-6 h-6 ${soilHealthStatus.iconColor}`} />
              <span className="text-lg font-bold text-green-900">Soil Health Index</span>
            </div>
            
            {/* Score Circle */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-green-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - (soilTest.soil_health_index || 0) / 100)}`}
                  className="text-green-600 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-900">{soilTest.soil_health_index || 0}</div>
                  <div className="text-sm text-green-700">out of 100</div>
                </div>
              </div>
            </div>
            
            <Badge className={`${soilHealthStatus.color} border font-semibold text-base px-4 py-2`}>
              {soilHealthStatus.label}
            </Badge>
          </div>

          {/* Biological Score */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BiologicalIcon className={`w-6 h-6 ${biologicalStatus.iconColor}`} />
              <span className="text-lg font-bold text-blue-900">Biological Activity</span>
            </div>
            
            {/* Score Circle */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-blue-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - (soilTest.biological_score || 0) / 100)}`}
                  className="text-blue-600 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-900">{soilTest.biological_score || 0}</div>
                  <div className="text-sm text-blue-700">out of 100</div>
                </div>
              </div>
            </div>
            
            <Badge className={`${biologicalStatus.color} border font-semibold text-base px-4 py-2`}>
              {biologicalStatus.label}
            </Badge>
          </div>
        </div>

        {/* Score Interpretation */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-semibold text-amber-900 mb-2">Score Interpretation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">80-100</div>
              <div className="text-green-700">Excellent</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">60-79</div>
              <div className="text-blue-700">Good</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">40-59</div>
              <div className="text-yellow-700">Fair</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">0-39</div>
              <div className="text-red-700">Poor</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}