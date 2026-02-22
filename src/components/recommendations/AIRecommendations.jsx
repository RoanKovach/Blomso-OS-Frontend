
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Sprout, Activity, DollarSign, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

export default function AIRecommendations({ soilTest }) {
  const summary = soilTest.summary;
  const productRecs = soilTest.product_recommendations || [];
  const nutrientStatus = soilTest.nutrient_status || {};

  const getStatusColor = (status) => {
    switch (status) {
      case 'Deficient': return 'bg-red-100 text-red-800 border-red-200';
      case 'Marginal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Sufficient': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!summary && productRecs.length === 0) {
    return (
      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
            <Brain className="w-6 h-6 text-green-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">No Recommendations Generated</h3>
            <p className="text-green-700">The AI analysis did not produce recommendations for this test.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          <Brain className="w-6 h-6 text-green-600" />
          AI-Generated Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* AI Summary */}
        {summary && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl">
            <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              Agronomist Summary
            </h3>
            <p className="text-green-800 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Product Recommendations */}
        {productRecs.length > 0 && (
          <div>
            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              Top Product Recommendations
            </h3>
            <div className="space-y-4">
              {productRecs.map((rec, index) => (
                <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-3">
                    <h4 className="text-lg font-bold text-green-900">{rec.product_name}</h4>
                    <div className="flex items-center gap-2 text-green-800">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-lg font-semibold">${rec.cost_per_acre}/acre</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 font-semibold">Rate</div>
                      <div className="text-gray-800">{rec.rate_per_acre} {rec.unit}/acre</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-semibold">Timing</div>
                      <div className="text-gray-800">{rec.timing}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-semibold">Purpose</div>
                      <div className="text-gray-800">{rec.purpose}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-semibold">Method</div>
                      <div className="text-gray-800">{rec.method}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nutrient Status Breakdown */}
        {Object.keys(nutrientStatus).length > 0 && (
          <div>
            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Nutrient Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(nutrientStatus).map(([nutrient, details]) => (
                <div key={nutrient} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-gray-800 capitalize">{nutrient.replace('_', ' ')}</h4>
                    <Badge className={getStatusColor(details.status)}>{details.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Level: {details.level}</p>
                  <p className="text-xs text-gray-500">{details.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
