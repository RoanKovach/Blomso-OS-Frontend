import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function RecommendationPathways({ soilTest }) {
  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm opacity-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <TrendingUp className="w-6 h-6 text-gray-600" />
          Management Pathways (Coming Soon)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">
          Alternative strategies based on your goals (e.g., Regenerative, Organic, Budget-conscious) will be available here soon.
        </p>
      </CardContent>
    </Card>
  );
}