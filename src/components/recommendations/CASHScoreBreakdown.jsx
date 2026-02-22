import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function CASHScoreBreakdown({ soilTest }) {
  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm opacity-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Activity className="w-6 h-6 text-gray-600" />
          CASH Score (Coming Soon)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">
          Based on Cornell Comprehensive Assessment of Soil Health.
          Full breakdown will be available here soon.
        </p>
      </CardContent>
    </Card>
  );
}