import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, TrendingUp, Calendar, HeartPulse, Sprout, Droplets, FlaskConical } from "lucide-react";

export default function DataInfoPanel({ activeDataLayer }) {
  const getDataInfo = () => {
    switch (activeDataLayer) {
      case 'et.total_season_mm':
        return {
          title: "💧 Water Usage Data",
          icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
          info: [
            "Data Source: OpenET Satellite Platform",
            "Update Frequency: Daily",
            "Season Coverage: April - October", 
            "Spatial Resolution: 30m pixels"
          ],
          tips: [
            "ET values help optimize irrigation timing.",
            "Compare with local weather data.",
            "High ET zones may indicate dense vegetation or over-watering."
          ]
        };
      case 'ndvi.mean':
        return {
          title: "🌱 Vegetation Data", 
          icon: <Sprout className="w-4 h-4 text-green-600" />,
          info: [
            "Data Source: Sentinel-2 Satellite",
            "Update Frequency: Every 5 days",
            "Season Coverage: Growing season",
            "Spatial Resolution: 10m pixels"
          ],
          tips: [
            "NDVI shows crop vigor and stress.",
            "Compare across fields to identify issues.",
            "Low values may indicate pest or disease problems."
          ]
        };
      case 'soil.ph_mean':
        return {
          title: "🧪 Soil Chemistry",
          icon: <FlaskConical className="w-4 h-4 text-yellow-600" />,
          info: [
            "Data Source: SSURGO Soil Survey",
            "Update Frequency: Annual updates",
            "Coverage: USDA soil survey data",
            "Spatial Resolution: Soil mapping units"
          ],
          tips: [
            "pH affects nutrient availability.",
            "Most crops prefer pH 6.0-7.0.",
            "Test your soil annually for accuracy."
          ]
        };
      case 'zone_health_score':
      default:
        return {
          title: "❤️ Field Health Analytics",
          icon: <HeartPulse className="w-4 h-4 text-red-600" />,
          info: [
            "Combines NDVI, soil, and ET data.",
            "AI-calculated composite score.",
            "Updated when new data arrives.",
            "Scale: 0-100 (higher is better)."
          ],
          tips: [
            "Health score integrates multiple factors.",
            "Use as a starting point for field inspection.",
            "Low scores warrant immediate attention."
          ]
        };
    }
  };

  const dataInfo = getDataInfo();

  return (
    <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900">
          {dataInfo.icon}
          Data Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">
            {dataInfo.title}
          </h4>
          <div className="space-y-1">
            {dataInfo.info.map((item, index) => (
              <p key={index} className="text-xs text-gray-600">• {item}</p>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm flex items-center gap-1">
            <Info className="w-3 h-3" />
            Usage Tips
          </h4>
          <div className="space-y-1">
            {dataInfo.tips.map((tip, index) => (
              <p key={index} className="text-xs text-gray-600">• {tip}</p>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-md p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">
            <Calendar className="w-3 h-3 inline mr-1" />
            Current Season: 2025 Growing Season
          </p>
          <p>Data shown reflects the most recent available measurements for your selected layer.</p>
        </div>
      </CardContent>
    </Card>
  );
}