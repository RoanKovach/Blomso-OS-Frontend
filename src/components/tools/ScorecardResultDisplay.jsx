import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const getScoreAndColor = (value, optimalRange, isLowerBetter = false) => {
    let score = 0;
    if (value === null || value === undefined) return { score: 0, color: 'bg-gray-400', level: 'N/A' };
    
    const [min, max] = optimalRange;
    if (value >= min && value <= max) score = 100;
    else if (value < min) score = (value / min) * 80;
    else score = Math.max(0, 80 - ((value - max) / max) * 40);

    if (isLowerBetter) {
      score = 100 - score;
    }
    
    score = Math.round(Math.max(0, Math.min(100, score)));

    if (score >= 80) return { score, color: 'bg-green-500', level: 'Optimal' };
    if (score >= 60) return { score, color: 'bg-yellow-500', level: 'Sufficient' };
    if (score >= 40) return { score, color: 'bg-orange-500', level: 'Low' };
    return { score, color: 'bg-red-500', level: 'Deficient' };
};

export default function ScorecardResultDisplay({ data }) {
    const metrics = [
        { name: 'pH', value: data.ph, optimal: [6.0, 7.0] },
        { name: 'Organic Matter', value: data.organic_matter, optimal: [3.0, 6.0], unit: '%' },
        { name: 'Nitrogen (N)', value: data.nitrogen, optimal: [25, 50], unit: 'ppm' },
        { name: 'Phosphorus (P)', value: data.phosphorus, optimal: [30, 50], unit: 'ppm' },
        { name: 'Potassium (K)', value: data.potassium, optimal: [150, 250], unit: 'ppm' },
    ];

    const scores = metrics.map(m => getScoreAndColor(m.value, m.optimal).score);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const overallHealth = getScoreAndColor(overallScore, [80, 100]);
    
    return (
        <Card className="border-none shadow-none">
            <CardHeader className="p-0 mb-4">
                <div className="flex justify-between items-center p-4 rounded-lg" style={{backgroundColor: overallHealth.color.replace('bg-', 'var(--color-')}}>
                    <CardTitle className="text-white text-lg">Overall Soil Health Score</CardTitle>
                    <div className="text-right">
                        <p className="text-4xl font-bold text-white">{overallScore}</p>
                        <p className="text-white font-medium">{overallHealth.level}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                {metrics.map(metric => {
                    const { score, color, level } = getScoreAndColor(metric.value, metric.optimal);
                    return (
                        <div key={metric.name}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-gray-700">{metric.name}</span>
                                <span className="text-sm font-medium" style={{color: color.replace('bg-', 'var(--color-')}}>{level}</span>
                            </div>
                            <Progress value={score} className="h-3 [&>*]:bg-green-500" indicatorClassName={color} />
                            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                <span>Your value: {metric.value ?? 'N/A'} {metric.unit}</span>
                                <span>Optimal: {metric.optimal.join(' - ')} {metric.unit}</span>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
}