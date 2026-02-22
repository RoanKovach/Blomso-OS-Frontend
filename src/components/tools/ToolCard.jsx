import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit } from 'lucide-react';

export default function ToolCard({
    id,
    title,
    icon: Icon,
    description,
    comingSoon = false,
    implemented = false,
    tillyIntegrated = false,
    onLaunch
}) {
    const getToolDescription = () => {
        switch(id) {
            case 'soil_health_scorecard':
                return 'Uses Cornell CASH framework for comprehensive soil assessment.';
            case 'roi_estimator':
                return 'Based on the latest Tri-State fertilizer recommendations.';
            case 'yield_predictor':
                return 'Uses soil data and climate trends for zone-based predictions.';
            case 'carbon_checker':
                return 'Based on NRCS and voluntary carbon market standards.';
            case 'drought_risk':
                return 'Uses soil texture and organic matter for risk assessment.';
            default:
                return 'Uses established agricultural models for analysis.';
        }
    };

    return (
        <Card
            className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-transparent hover:border-emerald-200 group focus-within:shadow-xl flex flex-col"
            onClick={!comingSoon ? onLaunch : undefined}
            tabIndex={comingSoon ? -1 : 0}
        >
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                    <Icon className="w-6 h-6 text-emerald-700" />
                </div>
                <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-800">{title}</CardTitle>
                    {tillyIntegrated && (
                        <Badge className="mt-1 bg-emerald-100 text-emerald-800 text-xs">
                            <BrainCircuit className="w-3 h-3 mr-1" />
                            Tilly Integrated
                        </Badge>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className={`flex-grow overflow-hidden transition-all duration-300 ease-in-out ${
                comingSoon ? 'max-h-0 p-0' : 'max-h-0 group-hover:max-h-40 group-focus-within:max-h-40 p-0 group-hover:px-6 group-hover:pb-4 group-focus-within:px-6 group-focus-within:pb-4'
            }`}>
                {!comingSoon && (
                    <>
                        <p className="text-gray-600 pt-2 border-t border-gray-100 text-sm leading-relaxed mb-3">
                            {description}
                        </p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                            <p className="text-gray-700 text-xs">
                                {getToolDescription()}
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
            
            <div className="px-6 pb-6 mt-auto">
                <Button 
                    className={`w-full transition-all duration-300 ${
                        comingSoon ? 'bg-gray-400 cursor-not-allowed' :
                        tillyIntegrated ? 'bg-emerald-600 hover:bg-emerald-700' : 
                        'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                    onClick={!comingSoon ? onLaunch : undefined}
                    disabled={comingSoon}
                >
                    {tillyIntegrated && <BrainCircuit className="w-4 h-4 mr-2" />}
                    {comingSoon ? 'Coming Soon' : tillyIntegrated ? 'Ask Tilly' : 'Launch Tool'}
                </Button>
            </div>
        </Card>
    );
}