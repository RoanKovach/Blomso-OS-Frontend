import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Edit, CheckCircle } from "lucide-react";

export default function TestReviewItem({ test, onEdit }) {
  const keyMetrics = ['ph', 'organic_matter', 'nitrogen', 'phosphorus', 'potassium', 'cec'];

  const getFlagForValue = (key, value) => {
    if (value === undefined || value === null) return null;

    const ranges = {
      ph: { low: 6.0, high: 7.5 },
      organic_matter: { low: 2.0, high: 10.0 },
      nitrogen: { low: 10, high: 100 },
      phosphorus: { low: 15, high: 100 },
      potassium: { low: 100, high: 400 },
      cec: { low: 8, high: 25 },
    };

    const range = ranges[key];
    if (!range) return null;

    if (value < range.low || value > range.high) {
      return (
        <div className="flex items-center gap-1 text-yellow-600">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-xs">Review</span>
        </div>
      );
    }
    return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="w-3 h-3" />
           <span className="text-xs">Looks Good</span>
        </div>
    )
  };

  return (
    <Card className="border border-green-100 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-green-900">{test.field_name || `Unnamed Test ${test.tempId + 1}`}</CardTitle>
        <Button variant="outline" size="sm" onClick={onEdit} className="border-green-200 hover:bg-green-100">
          <Edit className="w-4 h-4 mr-2" />
          Review & Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {keyMetrics.map(key => (
            <div key={key} className="p-3 bg-green-50/50 rounded-lg text-center">
              <p className="text-xs font-medium text-green-700 uppercase tracking-wider">{key.replace('_', ' ')}</p>
              <p className="text-xl font-bold text-green-900 mt-1">{test.soil_data?.[key] ?? 'N/A'}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex items-center gap-2">
            <p className="text-sm text-green-700">Additional Data:</p>
            {Object.keys(test.soil_data || {}).filter(k => !keyMetrics.includes(k)).map(key => (
                 <Badge key={key} variant="secondary">{key.replace('_', ' ')}: {test.soil_data[key]}</Badge>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
}