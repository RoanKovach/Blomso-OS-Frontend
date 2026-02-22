import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { SpatialData } from '@/api/entities';

export default function DataQualityDashboard() {
    const [qualityMetrics, setQualityMetrics] = useState({
        totalDataPoints: 0,
        highQualityPoints: 0,
        mediumQualityPoints: 0,
        lowQualityPoints: 0,
        averageQuality: 0,
        lastUpdateTime: null,
        dataGaps: []
    });

    useEffect(() => {
        loadQualityMetrics();
    }, []);

    const loadQualityMetrics = async () => {
        try {
            const spatialData = await SpatialData.list();
            
            const totalPoints = spatialData.length;
            const highQuality = spatialData.filter(d => (d.quality_score || 0) >= 0.8).length;
            const mediumQuality = spatialData.filter(d => (d.quality_score || 0) >= 0.5 && (d.quality_score || 0) < 0.8).length;
            const lowQuality = spatialData.filter(d => (d.quality_score || 0) < 0.5).length;
            
            const avgQuality = totalPoints > 0 
                ? spatialData.reduce((sum, d) => sum + (d.quality_score || 0), 0) / totalPoints 
                : 0;

            setQualityMetrics({
                totalDataPoints: totalPoints,
                highQualityPoints: highQuality,
                mediumQualityPoints: mediumQuality,
                lowQualityPoints: lowQuality,
                averageQuality: avgQuality,
                lastUpdateTime: new Date().toISOString(),
                dataGaps: [] // TODO: Implement gap detection logic
            });
        } catch (error) {
            console.error("Error loading quality metrics:", error);
        }
    };

    const qualityPercentage = Math.round(qualityMetrics.averageQuality * 100);

    return (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
                    <TrendingUp className="w-6 h-6" />
                    Data Quality Dashboard
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overall Quality Score */}
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Data Quality</span>
                                <span className="text-2xl font-bold text-green-900">{qualityPercentage}%</span>
                            </div>
                            <Progress value={qualityPercentage} className="h-3" />
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            Last updated: {qualityMetrics.lastUpdateTime ? 'Just now' : 'Never'}
                        </div>
                    </div>

                    {/* Quality Breakdown */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Quality Breakdown</h4>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm">High Quality</span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                                {qualityMetrics.highQualityPoints}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm">Medium Quality</span>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">
                                {qualityMetrics.mediumQualityPoints}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="text-sm">Low Quality</span>
                            </div>
                            <Badge className="bg-red-100 text-red-800">
                                {qualityMetrics.lowQualityPoints}
                            </Badge>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Recommendations</h4>
                        
                        {qualityMetrics.lowQualityPoints > 0 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">
                                    {qualityMetrics.lowQualityPoints} data points have low quality scores. 
                                    Consider checking data source connections.
                                </p>
                            </div>
                        )}

                        {qualityMetrics.totalDataPoints === 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    No data points collected yet. Add and activate data sources to begin collection.
                                </p>
                            </div>
                        )}

                        {qualityPercentage >= 80 && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    Excellent data quality! Your pipeline is running smoothly.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}