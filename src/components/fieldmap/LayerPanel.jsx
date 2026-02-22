import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Layers, HeartPulse, Sprout, Droplets, FlaskConical } from "lucide-react";

export default function LayerPanel({ 
  layers, 
  activeLayers, 
  onLayerToggle, 
  activeDataLayer, 
  onDataLayerChange 
}) {
  const dataLayerOptions = [
    { value: "zone_health_score", label: "Health Score", icon: HeartPulse },
    { value: "ndvi.mean", label: "NDVI", icon: Sprout },
    { value: "et.total_season_mm", label: "ET", icon: Droplets },
    { value: "soil.ph_mean", label: "Soil pH", icon: FlaskConical },
  ];

  // Get the data legend based on selected layer
  const getDataLegend = () => {
    switch (activeDataLayer) {
      case 'et.total_season_mm':
        return {
          title: "💧 Evapotranspiration (ET)",
          items: [
            { color: '#0066CC', label: '0-200mm (Low water use)' },
            { color: '#00AAFF', label: '200-400mm (Moderate)' },
            { color: '#66CCFF', label: '400-500mm (Normal)' },
            { color: '#FFCC00', label: '500-650mm (High)' },
            { color: '#FF6600', label: '650-750mm (Very High)' },
            { color: '#CC0000', label: '750+mm (Excessive)' }
          ],
          guide: [
            '• Blue zones: May need supplemental irrigation',
            '• Yellow/Orange: Monitor soil moisture closely', 
            '• Red zones: Check for over-irrigation or drainage issues'
          ]
        };
      case 'ndvi.mean':
        return {
          title: "🌱 NDVI (Vegetation Health)",
          items: [
            { color: '#8B4513', label: '-1 to 0.2 (Bare soil/Stressed)' },
            { color: '#FFFF00', label: '0.2-0.5 (Moderate vegetation)' },
            { color: '#00FF00', label: '0.5-1.0 (Healthy/Dense vegetation)' }
          ],
          guide: [
            '• Brown areas: Check for crop stress, pests, or nutrient deficiency',
            '• Green areas: Healthy crop growth'
          ]
        };
      case 'soil.ph_mean':
        return {
          title: "🧪 Soil pH",
          items: [
            { color: '#FF0000', label: '4.0-5.5 (Very acidic)' },
            { color: '#FFAA00', label: '5.5-6.0 (Acidic)' },
            { color: '#FFFF00', label: '6.0-7.0 (Optimal)' },
            { color: '#AAFF00', label: '7.0-8.0 (Alkaline)' },
            { color: '#00FF00', label: '8.0+ (Very alkaline)' }
          ],
          guide: [
            '• Red areas: Consider lime application',
            '• Yellow areas: Optimal for most crops',
            '• Green areas: May need sulfur to lower pH'
          ]
        };
      case 'zone_health_score':
      default:
        return {
          title: "❤️ Zone Health Score",
          items: [
            { color: '#ff4444', label: '0-40 (Poor health)' },
            { color: '#ffaa00', label: '40-70 (Fair health)' },
            { color: '#44ff44', label: '70-100 (Excellent health)' }
          ],
          guide: [
            '• Red zones: Need immediate attention',
            '• Yellow zones: Monitor closely',
            '• Green zones: Performing well'
          ]
        };
    }
  };

  const legend = getDataLegend();

  return (
    <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900">
          <Layers className="w-5 h-5" />
          Map Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Field Data Visualization */}
        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-3 block">
            Color Fields By:
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {dataLayerOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onDataLayerChange(opt.value)}
                className={`flex flex-col items-center justify-center p-3 text-center rounded-lg border-2 transition-all duration-200 h-24 ${
                  activeDataLayer === opt.value
                    ? 'bg-green-100 border-green-500 text-green-800 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <opt.icon className="w-7 h-7 mb-2" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data Legend - Contextual based on selected layer */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">
            {legend.title}
          </h4>
          <div className="space-y-2 text-sm mb-3">
            {legend.items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
          </div>
          {legend.guide && (
            <div className="pt-3 border-t text-xs text-gray-600">
              <p className="font-medium mb-1">Management Guide:</p>
              {legend.guide.map((tip, index) => (
                <p key={index}>{tip}</p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}