import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from 'lucide-react';

export default function AnalysisPanel() {
  return (
    <Card className="w-64 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          Analysis Layers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Data layer controls will appear here. This feature is coming soon!
        </p>
      </CardContent>
    </Card>
  );
}