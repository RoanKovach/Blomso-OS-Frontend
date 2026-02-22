import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Info } from "lucide-react";
import { format } from "date-fns";

export default function SoilHealthOverview({ soilTests, isLoading }) {
  const chartData = soilTests
    .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
    .map(test => ({
      name: format(new Date(test.test_date), "MMM yy"),
      "Soil Health": test.soil_health_index || 0,
      "Biological Score": test.biological_score || 0,
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-sm p-3 border border-green-200 rounded-lg shadow-lg">
          <p className="font-semibold text-green-900">{label}</p>
          <p className="text-sm text-green-700">Soil Health: {payload[0].value}</p>
          <p className="text-sm text-blue-700">Biological Score: {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-green-100">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Soil Health Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : soilTests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Info className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">No Soil Data Available</h3>
            <p className="text-green-700">Upload a soil test or use sample data to see your health overview.</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7e0" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={12} />
                <YAxis stroke="#4b5563" fontSize={12} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Soil Health" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Biological Score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}