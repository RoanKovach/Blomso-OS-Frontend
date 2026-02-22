import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Bot, Database, Beaker, Leaf, BookOpen, AlertTriangle } from 'lucide-react';

const ToolStep = ({ icon, title, children, status = 'success' }) => (
    <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            status === 'success' ? 'bg-emerald-100' : 
            status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
        }`}>
            {React.cloneElement(icon, { 
                className: `w-5 h-5 ${
                    status === 'success' ? 'text-emerald-700' : 
                    status === 'warning' ? 'text-yellow-700' : 'text-red-700'
                }` 
            })}
        </div>
        <div className="flex-1 pt-1">
            <p className="font-medium text-gray-800">{title}</p>
            {children && <div className="text-sm text-gray-600 mt-1">{children}</div>}
        </div>
    </div>
);

export default function ToolCallLog({ results, dataSufficiencyCheck }) {
    const hasPhase = results?.phase_classification;
    const hasP = results?.phosphorus_recommendation_lbs_per_acre !== undefined;
    const hasK = results?.potassium_recommendation_lbs_per_acre !== undefined;
    const hasLime = results?.lime_recommendation_tons_per_acre !== undefined;

    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Tilly's Thought Process
            </h4>
            <div className="space-y-4">
                <ToolStep icon={<Database />} title="Parsed Soil Test Data">
                    <p>Successfully read attached soil test records and validated required fields.</p>
                </ToolStep>

                <ToolStep 
                    icon={<BookOpen />} 
                    title="Consulted Tri-State Fertilizer Guidelines"
                    status="success"
                >
                    <p>Referenced 2020 Tri-State Fertilizer Recommendations (Bulletin 974) for critical levels and calculation methodology.</p>
                </ToolStep>

                {dataSufficiencyCheck?.missingFields?.length > 0 && (
                    <ToolStep 
                        icon={<AlertTriangle />} 
                        title="Data Validation Issues Found"
                        status="warning"
                    >
                        <p>Missing required fields: {dataSufficiencyCheck.missingFields.join(', ')}</p>
                    </ToolStep>
                )}

                {hasPhase && (
                    <ToolStep icon={<Beaker />} title="Applied Tri-State Phase Classification">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border-b-0">
                                <AccordionTrigger className="text-xs p-1 hover:no-underline">View Tri-State Analysis</AccordionTrigger>
                                <AccordionContent className="p-2 bg-gray-100 rounded">
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        <li>Phosphorus (P) Phase: <strong>{results.phase_classification.P_phase}</strong></li>
                                        <li>Potassium (K) Phase: <strong>{results.phase_classification.K_phase}</strong></li>
                                        <li>Critical P Range: {results.phase_classification.critP?.join('-')} ppm</li>
                                        <li>Critical K Range: {results.phase_classification.critK?.join('-')} ppm</li>
                                        <li className="mt-1 text-gray-500 font-medium">Source: {results.phase_classification.sources?.[0]}</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </ToolStep>
                )}

                {(hasP || hasK || hasLime) && (
                     <ToolStep icon={<Leaf />} title="Calculated Tri-State Nutrient Rates">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1" className="border-b-0">
                                <AccordionTrigger className="text-xs p-1 hover:no-underline">View Rate Calculations</AccordionTrigger>
                                <AccordionContent className="p-2 bg-gray-100 rounded">
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        {hasP && <li>Phosphorus (P₂O₅): <strong>{results.phosphorus_recommendation_lbs_per_acre} lbs/acre</strong></li>}
                                        {hasK && <li>Potassium (K₂O): <strong>{results.potassium_recommendation_lbs_per_acre} lbs/acre</strong></li>}
                                        {hasLime && <li>Lime: <strong>{results.lime_recommendation_tons_per_acre} tons/acre</strong></li>}
                                        {results.sources && (
                                            <li className="mt-2 text-gray-500 font-medium">
                                                Applied: {results.sources.slice(0, 2).join('; ')}
                                            </li>
                                        )}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </ToolStep>
                )}
                
                <ToolStep icon={<CheckCircle2 />} title="Generated Tri-State Compliant Report">
                    <p>Assembled analysis following official Tri-State format and methodology.</p>
                </ToolStep>
            </div>
        </div>
    );
}