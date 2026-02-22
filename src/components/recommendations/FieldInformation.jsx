import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sprout, Activity, Tractor, Droplets, RotateCw } from "lucide-react";
import { format } from "date-fns";

export default function FieldInformation({ soilTest }) {
  const infoItems = [
    { icon: MapPin, label: "Field Name", value: soilTest.field_name },
    { icon: Calendar, label: "Test Date", value: soilTest.test_date ? format(new Date(soilTest.test_date), "MMMM d, yyyy") : 'N/A' },
    { icon: Activity, label: "Zone", value: soilTest.zone_name || 'N/A' },
    { icon: Sprout, label: "Intended Crop", value: soilTest.crop_type || "Not specified" },
    { icon: Tractor, label: "Farming Method", value: soilTest.farming_method || "Not specified" },
    { icon: Droplets, label: "Irrigation", value: soilTest.irrigation_type || "Not specified" },
    { icon: RotateCw, label: "Previous Crop", value: soilTest.previous_crop_history || "Not specified" },
    { icon: MapPin, label: "Acres", value: `${soilTest.field_size_acres || 0} acres` },
  ];

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          <MapPin className="w-6 h-6 text-green-600" />
          Field & Management Context
        </CardTitle>
        <p className="text-sm text-gray-500">This analysis is based on the following information you provided.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {infoItems.map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 mt-1 bg-green-100 rounded-lg flex items-center justify-center">
                <item.icon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="font-semibold text-gray-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}