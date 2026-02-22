import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartPulse, Droplets, Leaf, FlaskConical, AlertTriangle, CheckCircle } from "lucide-react";

const Gauge = ({ value, maxValue, label, unit }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  let colorClass = 'text-green-500';
  if (percentage < 33) colorClass = 'text-red-500';
  else if (percentage < 66) colorClass = 'text-yellow-500';

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-200" />
          <circle
            cx="64" cy="64" r="40"
            stroke="currentColor" strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-500 ${colorClass}`}
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      </div>
      <p className="mt-2 font-semibold text-gray-700">{label}</p>
    </div>
  );
};

const ScoreTip = ({ status, tip, icon: Icon }) => {
  let colorClasses = '';
  switch (status) {
    case 'good': colorClasses = 'bg-green-50 border-green-200 text-green-800'; break;
    case 'fair': colorClasses = 'bg-yellow-50 border-yellow-200 text-yellow-800'; break;
    case 'poor': colorClasses = 'bg-red-50 border-red-200 text-red-800'; break;
    default: colorClasses = 'bg-gray-50 border-gray-200 text-gray-800';
  }
  return (
    <div className={`p-3 rounded-lg border flex items-start gap-3 ${colorClasses}`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p className="text-sm">{tip}</p>
    </div>
  );
};

export default function SoilHealthScorecard({ soilTests }) {
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [activeTest, setActiveTest] = useState(null);

  useEffect(() => {
    if (soilTests.length > 0) {
      const initialTestId = soilTests[0].id;
      setSelectedTestId(initialTestId);
      setActiveTest(soilTests[0]);
    }
  }, [soilTests]);

  const handleTestChange = (testId) => {
    setSelectedTestId(testId);
    setActiveTest(soilTests.find(t => t.id === testId));
  };

  if (soilTests.length === 0) {
    return <p>No soil tests available. Please upload a test to use this tool.</p>;
  }
  if (!activeTest) {
    return <p>Loading test data...</p>;
  }

  const { soil_data } = activeTest;
  const om = soil_data?.organic_matter || 0;
  const ph = soil_data?.ph || 0;
  const n = soil_data?.nitrogen || 0;
  const p = soil_data?.phosphorus || 0;
  const k = soil_data?.potassium || 0;
  
  const totalScore = Math.round(((om/5)*30 + (Math.min(n/50, 1))*20 + (Math.min(p/50, 1))*20 + (Math.min(k/250, 1))*20 + (1 - Math.abs(ph-6.5)/2)*10));

  const getTip = (key) => {
    if (!soil_data) return { status: 'fair', tip: 'Data missing for analysis.' };
    switch (key) {
      case 'om':
        if (om > 3) return { status: 'good', tip: 'Excellent organic matter. Continue practices that build soil carbon.', icon: CheckCircle };
        if (om > 2) return { status: 'fair', tip: 'Organic matter is fair. Consider cover crops or compost application.', icon: AlertTriangle };
        return { status: 'poor', tip: 'Organic matter is low. Prioritize adding carbon through manure, compost, or no-till with cover crops.', icon: AlertTriangle };
      case 'ph':
        if (ph > 6 && ph < 7) return { status: 'good', tip: 'Ideal pH for nutrient availability. Maintain current practices.', icon: CheckCircle };
        if (ph < 6) return { status: 'poor', tip: 'Soil is acidic, which may limit nutrient uptake. Consider lime application based on buffer pH.', icon: AlertTriangle };
        return { status: 'fair', tip: 'Soil is slightly alkaline. Monitor for micronutrient deficiencies.', icon: AlertTriangle };
      case 'npk':
        const balanced = n > 20 && p > 25 && k > 150;
        if(balanced) return { status: 'good', tip: 'NPK levels appear balanced for many crops. Verify against specific crop needs.', icon: CheckCircle };
        return { status: 'fair', tip: 'One or more primary nutrients are low. Develop a variable rate fertility plan.', icon: AlertTriangle };
    }
  };

  const omTip = getTip('om');
  const phTip = getTip('ph');
  const npkTip = getTip('npk');

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <HeartPulse className="w-6 h-6 text-emerald-600" />
            Soil Health Scorecard
          </CardTitle>
          <div className="w-64">
             <Select value={selectedTestId} onValueChange={handleTestChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a soil test..." />
              </SelectTrigger>
              <SelectContent>
                {soilTests.map(test => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.field_name} ({new Date(test.test_date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-6 bg-gray-50 rounded-xl mb-6 text-center">
            <h3 className="text-lg font-medium text-gray-600">Overall Soil Health Score</h3>
            <p className="text-6xl font-bold text-emerald-600 my-2">{totalScore}<span className="text-3xl text-gray-500">/100</span></p>
            <p className="text-gray-500">Based on key chemical and biological indicators.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-6">
            <Gauge value={om} maxValue={5} label="Organic Matter" unit="%" />
            <Gauge value={ph} maxValue={14} label="pH Level" unit="" />
            <Gauge value={n+p+k} maxValue={400} label="NPK Index" unit="" />
        </div>
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Actionable Tips</h3>
            <div className="space-y-3">
                <ScoreTip {...omTip} />
                <ScoreTip {...phTip} />
                <ScoreTip {...npkTip} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}