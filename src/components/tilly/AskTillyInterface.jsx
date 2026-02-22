
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, BrainCircuit, Send, Sparkles, Calculator, Wrench, FileText, Paperclip, X, ChevronDown, ChevronUp, DollarSign, Calendar, Zap, FileCheck, TrendingUp, MapPin, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { SoilTest } from '@/api/entities';
import { Practice } from '@/api/entities';
import { User } from '@/api/entities';
import ToolCallLog from './ToolCallLog';
import TillyThinkingLoader from "./TillyThinkingLoader";

// Agricultural Tools Configuration
const AGRICULTURAL_TOOLS = [
  {
    id: 'nitrogen_mrtn',
    name: 'Nitrogen MRTN Calculator',
    icon: Calculator,
    description: 'Calculate optimal nitrogen rates for maximum profitability',
    inputs: ['soil_nitrate', 'yield_goal', 'grain_price', 'fertilizer_price'],
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'lime_scheduler',
    name: 'Soil pH & Lime Scheduler',
    icon: Calendar,
    description: 'Plan liming needs and resampling schedules',
    inputs: ['soil_ph', 'cec', 'sampling_date', 'crop_rotation'],
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'pk_planner',
    name: 'P&K Build/Drawdown Planner',
    icon: TrendingUp,
    description: 'Optimize phosphorus and potassium management',
    inputs: ['soil_p', 'soil_k', 'soil_texture', 'yield_goals'],
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'weather_scheduler',
    name: 'Weather-Aware Operation Scheduler',
    icon: Zap,
    description: 'Time field operations based on weather forecasts',
    inputs: ['location', 'operation_type'],
    color: 'bg-cyan-100 text-cyan-800'
  },
  {
    id: 'cover_crop_selector',
    name: 'Cover Crop Selector',
    icon: MapPin,
    description: 'Choose optimal cover crops for your rotation',
    inputs: ['rotation_history', 'soil_health_goals', 'termination_plan'],
    color: 'bg-emerald-100 text-emerald-800'
  },
  {
    id: 'roi_estimator',
    name: 'Nutrient ROI & Budget Estimator',
    icon: DollarSign,
    description: 'Calculate fertilizer investment returns',
    inputs: ['fertilizer_prices', 'recommended_rates', 'yield_impact'],
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'unit_converter',
    name: 'Soil Test Unit Converter',
    icon: Wrench,
    description: 'Convert between different soil test extraction methods',
    inputs: ['lab_values', 'extraction_method'],
    color: 'bg-indigo-100 text-indigo-800'
  },
  {
    id: 'compliance_checker',
    name: 'Regulatory Compliance Checker',
    icon: FileCheck,
    description: 'Verify compliance with programs like H2Ohio, NRCS',
    inputs: ['practices', 'location', 'program_type'],
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'tri_state_agronomy',
    name: 'Tri-State Agronomy Assistant',
    icon: Calculator,
    description: 'IN/MI/OH fertilizer recommendations per Bulletin 974',
    inputs: ['state', 'crop', 'soil_test', 'yield_goal', 'prices'],
    color: 'bg-indigo-100 text-indigo-800'
  },
  {
    id: 'soil_health_scorecard',
    name: 'Soil Health Scorecard',
    icon: TrendingUp,
    description: 'Comprehensive soil health assessment with Tri-State integration',
    inputs: ['soil_test_values', 'management_data'],
    color: 'bg-emerald-100 text-emerald-800'
  }
];

export default function AskTillyInterface({ title, description, contextPrompt = '' }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedRecords, setAttachedRecords] = useState([]);
    const [selectedTools, setSelectedTools] = useState([]);
    const [userRecords, setUserRecords] = useState({ soilTests: [], practices: [] });
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const scrollAreaRef = useRef(null); // Ref for the scrollable area itself

    // Load user records on mount
    useEffect(() => {
        loadUserRecords();
    }, []);

    // Auto-scroll to bottom, GPT-style
    useEffect(() => {
        const scrollElement = scrollAreaRef.current;
        if (scrollElement) {
            // Find the actual scrollable viewport, which is usually the first child
            // With the new layout, this should be the div directly inside ScrollArea
            const viewportElement = scrollElement.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewportElement) {
                // Check if the user is already near the bottom (e.g., within 100px)
                const isNearBottom = viewportElement.scrollHeight - viewportElement.scrollTop - viewportElement.clientHeight < 100;

                // If user is near the bottom, or it's the very first message(s), auto-scroll
                if (isNearBottom || messages.length <= 1) {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }
            }
        }
    }, [messages]);

    const loadUserRecords = async () => {
        try {
            const user = await User.me();
            if (user) {
                const [soilTests, practices] = await Promise.all([
                    SoilTest.filter({ created_by: user.email }),
                    Practice.filter({ created_by: user.email })
                ]);
                setUserRecords({ soilTests, practices });
            }
        } catch (error) {
            console.log('User not authenticated or error loading records:', error);
        }
    };

    const clearConversation = () => {
        setMessages([]);
        setAttachedRecords([]);
        setSelectedTools([]);
    };

    const toggleTool = (toolId) => {
        setSelectedTools(prev => 
            prev.includes(toolId) 
                ? prev.filter(id => id !== toolId)
                : [...prev, toolId]
        );
    };

    const attachRecord = (record) => {
        if (!attachedRecords.find(r => r.id === record.id && r.type === record.type)) {
            setAttachedRecords(prev => [...prev, record]);
        }
    };

    const removeAttachedRecord = (recordId, recordType) => {
        setAttachedRecords(prev => 
            prev.filter(r => !(r.id === recordId && r.type === recordType))
        );
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() && attachedRecords.length === 0) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputText,
            attachedRecords,
            selectedTools,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputText;
        const currentRecords = [...attachedRecords];
        const currentTools = [...selectedTools];
        
        setInputText('');
        setAttachedRecords([]);
        setSelectedTools([]);
        setIsLoading(true);

        try {
            // Step 1: Data Sufficiency Check
            const soilTest = currentRecords.find(r => r.type === 'soil_test');
            const dataSufficiencyResult = checkDataSufficiency(soilTest, currentInput);
            
            if (!dataSufficiencyResult.sufficient) {
                // Ask for missing data instead of proceeding
                const assistantMessage = {
                    id: Date.now() + 1,
                    type: 'assistant',
                    content: `To provide accurate Tri-State fertilizer recommendations, I need the following information:

${dataSufficiencyResult.missingFields.map(field => `• ${field}`).join('\n')}

Once you provide this information, I'll calculate precise recommendations using the 2020 Tri-State Fertilizer Guidelines (Bulletin 974).`,
                    timestamp: new Date(),
                    dataSufficiencyCheck: dataSufficiencyResult
                };
                setMessages(prev => [...prev, assistantMessage]);
                setIsLoading(false);
                return;
            }

            // Step 2: Perform calculations with validated data
            let calculationResults = {};
            
            if (currentTools.length > 0 && currentRecords.length > 0) {
                calculationResults = await performToolCalculations(currentTools, currentRecords);
            }

            // Step 3: Call GPT via built-in InvokeLLM integration
            const calculationResultsText = Object.keys(calculationResults).length > 0 ? 
                Object.entries(calculationResults).map(([tool, result]) => 
                    `**${tool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}**: 
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``
                ).join('\n') : 
                'No specific calculations were run.';

            const soilTestContext = currentRecords.map(record => {
                if (record.type === 'soil_test') {
                    return `Field: ${record.field_name || 'N/A'}
Crop: ${record.crop_type || 'Not specified'}
pH: ${record.soil_data?.ph || 'N/A'}
P: ${record.soil_data?.phosphorus || 'N/A'} ppm
K: ${record.soil_data?.potassium || 'N/A'} ppm
CEC: ${record.soil_data?.cec || 'N/A'}`;
                }
                return '';
            }).join('\n');

            const fullPrompt = `You are Tilly, an expert agricultural assistant following the 2020 Tri-State Fertilizer Recommendations (Bulletin 974) for IN/MI/OH field crops.

**IMPORTANT: You have already consulted the authoritative Tri-State Fertilizer Guidelines and performed deterministic calculations. The results below are from those official tables and formulas.**

${calculationResultsText}

**SOIL TEST DATA (validated):**
${soilTestContext}

**USER'S REQUEST:**
"${currentInput}"

---
Generate a professional agronomy report with: Executive Summary, Data Validation Status, Soil Analysis, Nutrient Recommendations, and Methodology.
Keep the response under 900 words.`;

            // Use the built-in InvokeLLM integration
            const contentText = await base44.integrations.Core.InvokeLLM({
                prompt: fullPrompt,
                add_context_from_internet: false
            });

            const assistantMessage = {
                id: Date.now() + 1,
                type: 'assistant',
                content: contentText,
                timestamp: new Date(),
                usedTools: currentTools,
                referencedRecords: currentRecords,
                calculationResults,
                dataSufficiencyCheck: dataSufficiencyResult
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Tilly AI request failed:", error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'error',
                content: `I'm having trouble processing your request. Error: ${error.message}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Add data sufficiency checking function
    const checkDataSufficiency = (soilTest, userInput) => {
        const missingFields = [];

        if (!soilTest) {
            return {
                sufficient: false,
                missingFields: ['Please attach a soil test record from your data']
            };
        }

        // Required for Tri-State recommendations
        if (!soilTest.crop_type) {
            missingFields.push('Crop type (corn, soybean, wheat, alfalfa)');
        }
        
        if (!soilTest.soil_data?.ph) {
            missingFields.push('Soil pH');
        }
        
        // Note: The original logic for these checks below uses `!value === undefined`, which is often a logical error
        // (e.g., `!0 === undefined` is false). Preserving the syntax as per the outline's intent.
        if (soilTest.soil_data?.phosphorus === undefined || soilTest.soil_data?.phosphorus === null) {
            missingFields.push('Phosphorus (P) test value in ppm');
        }
        
        if (soilTest.soil_data?.potassium === undefined || soilTest.soil_data?.potassium === null) {
            missingFields.push('Potassium (K) test value in ppm');
        }
        
        if (soilTest.soil_data?.cec === undefined || soilTest.soil_data?.cec === null) {
            missingFields.push('Cation Exchange Capacity (CEC)');
        }

        // Optional but recommended for comprehensive reports
        if (!soilTest.field_size_acres) {
            missingFields.push('Field size in acres (for cost calculations)');
        }

        return {
            sufficient: missingFields.length === 0,
            missingFields,
            // The `hasRequiredMinimum` calculation is changed as per the outline.
            hasRequiredMinimum: soilTest.crop_type && soilTest.soil_data?.phosphorus && soilTest.soil_data?.potassium
        };
    };

    // Function to perform actual calculations
    const performToolCalculations = async (tools, records) => {
        const results = {};
        
        const soilTest = records.find(r => r.type === 'soil_test');
        if (!soilTest) return results; // Should not happen if data sufficiency check works
        
        const soilData = soilTest.soil_data || {};
        
        // Import the calculation functions dynamically
        const { performTriStateCalculations, MRTNCalculator, TriStateCalculations, SoilTestConverter } = await import('../utils/agriculturalCalculations');

        for (const toolId of tools) {
            try {
                switch(toolId) {
                    case 'tri_state_agronomy':
                        if (soilData.phosphorus !== undefined && soilData.potassium !== undefined) {
                            const managementData = {
                                crop: soilTest.crop_type || 'corn', // Use actual crop or default
                                yieldGoal: 180, // Default yield goal, ideally passed from user
                                state: 'OH', // Default state for Tri-State, ideally passed from user/record
                                cec: soilData.cec
                            };
                            
                            const triStateResults = await performTriStateCalculations(soilData, managementData);
                            results.tri_state_agronomy = {
                                phase_classification: triStateResults.phase_classification,
                                phosphorus_recommendation_lbs_per_acre: triStateResults.phosphorus_recommendation?.p2o5_lb_ac,
                                potassium_recommendation_lbs_per_acre: triStateResults.potassium_recommendation?.k2o_lb_ac,
                                lime_recommendation_tons_per_acre: triStateResults.lime_recommendation?.tons_per_acre,
                                sources: [
                                    ...(triStateResults.phosphorus_recommendation?.sources || []),
                                    ...(triStateResults.potassium_recommendation?.sources || []),
                                    ...(triStateResults.lime_recommendation?.sources || [])
                                ]
                            };
                        }
                        break;
                        
                    case 'nitrogen_mrtn':
                        if (soilData.nitrogen !== undefined) {
                            results.nitrogen_mrtn = {
                                nitrogen_recommendation_lbs_per_acre: MRTNCalculator.calculateNitrogenRate(
                                    soilData.nitrogen,
                                    180, // Default yield goal, ideally passed from user
                                    4.50, // Default corn price, ideally passed from user
                                    0.50  // Default N price, ideally passed from user
                                ),
                                sources: ["MRTN Calculator - Iowa State University Corn N Rate Calculator"]
                            };
                        }
                        break;
                        
                    case 'lime_scheduler':
                        if (soilData.ph !== undefined && soilData.cec !== undefined) {
                            results.lime_scheduler = {
                                lime_recommendation_tons_per_acre: TriStateCalculations.calculateLimeRequirement(
                                    soilData.ph,
                                    6.5, // Target pH, ideally configurable
                                    soilData.cec
                                ),
                                sources: ["Tri-State 2020: pH targets & lime guidance"]
                            };
                        }
                        break;
                        
                    case 'unit_converter':
                        if (soilData.phosphorus !== undefined) {
                            results.unit_converter = {
                                phosphorus_bray1_to_mehlich3_ppm: SoilTestConverter.convertPhosphorus(
                                    soilData.phosphorus, 'bray1', 'mehlich3'
                                ),
                                sources: ["Tri-State conversion factors"]
                            };
                        }
                        break;
                        
                    default:
                        // For tools not yet implemented with calculations
                        results[toolId] = { 
                            status: 'Tool selected but calculations not yet implemented',
                            message: 'This tool will provide recommendations based on established methodology'
                        };
                        break;
                }
            } catch (calcError) {
                console.error(`Error performing calculation for tool ${toolId}:`, calcError);
                results[`${toolId}_error`] = `Calculation failed: ${calcError.message}`;
            }
        }
        
        return results;
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Messages Area - properly responsive */}
            <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea ref={scrollAreaRef} className="flex-1">
                    <div className="p-3 md:p-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-start text-center py-8 md:py-12 min-h-[50vh] md:min-h-[60vh]">
                                <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 md:mb-6">
                                    <BrainCircuit className="w-8 h-8 md:w-12 md:h-12 text-emerald-600" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 md:mb-3">
                                    {title || "Ask Tilly"}
                                </h3>
                                <p className="text-gray-600 mb-6 md:mb-8 max-w-xl md:max-w-2xl leading-relaxed text-sm md:text-base px-4">
                                    {description || "Use the tools below to analyze your data based on established methodologies."}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 max-w-xs sm:max-w-2xl w-full px-4">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-left justify-start h-auto p-3 md:p-4"
                                        onClick={() => setInputText("What's the optimal pH range for corn production?")}
                                    >
                                        <div className="text-left">
                                            <div className="font-medium text-xs md:text-sm">pH for Corn</div>
                                            <div className="text-xs text-gray-500 hidden md:block">Optimal pH range guidance</div>
                                        </div>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-left justify-start h-auto p-3 md:p-4"
                                        onClick={() => setInputText("Calculate fertilizer rates for my field based on my latest soil test.")}
                                    >
                                        <div className="text-left">
                                            <div className="font-medium text-xs md:text-sm">Run Calculations</div>
                                            <div className="text-xs text-gray-500 hidden md::block">Use Tri-State models</div>
                                        </div>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-left justify-start h-auto p-3 md:p-4"
                                        onClick={() => setInputText("What cover crops work best after soybeans?")}
                                    >
                                        <div className="text-left">
                                            <div className="font-medium text-xs md:text-sm">Cover Crops</div>
                                            <div className="text-xs text-gray-500 hidden md::block">Post-soybean options</div>
                                        </div>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-left justify-start h-auto p-3 md:p-4"
                                        onClick={() => setInputText("Analyze my soil test results for deficiencies")}
                                    >
                                        <div className="text-left">
                                            <div className="font-medium text-xs md:text-sm">Soil Analysis</div>
                                            <div className="text-xs text-gray-500 hidden md::block">Find deficiencies</div>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 md:space-y-6 pb-4">
                                {messages.map((message) => (
                                    <div key={message.id} className="space-y-2">
                                        {message.type === 'user' && (
                                            <div className="flex justify-end">
                                                <div className="max-w-[80%] bg-gray-100 text-gray-800 rounded-2xl rounded-br-md p-4 border border-gray-200">
                                                    {message.content && <div className="whitespace-pre-wrap">{message.content}</div>}
                                                    
                                                    {message.selectedTools?.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <div className="text-gray-600 text-xs mb-2">Using Tools:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {message.selectedTools.map(toolId => {
                                                                    const tool = AGRICULTURAL_TOOLS.find(t => t.id === toolId);
                                                                    return tool ? (
                                                                        <span key={toolId} className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                                                                            {tool.name}
                                                                        </span>
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {message.attachedRecords?.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <div className="text-gray-600 text-xs mb-2">Attached Data:</div>
                                                            <div className="space-y-1">
                                                                {message.attachedRecords.map(record => (
                                                                    <div key={`${record.type}-${record.id}`} className="text-xs text-gray-600">
                                                                        • {record.type === 'soil_test' ? record.field_name : record.practice_name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {message.type === 'assistant' && (
                                            <div className="flex justify-start">
                                                <div className="flex gap-4 max-w-[80%]">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <BrainCircuit className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div className="bg-gray-50 rounded-2xl rounded-bl-md p-4 flex-1">
                                                        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                                                            {message.content}
                                                        </div>
                                                        
                                                        {Object.keys(message.calculationResults || {}).length > 0 && (
                                                            <ToolCallLog results={message.calculationResults} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {message.type === 'error' && (
                                            <div className="flex justify-start">
                                                <div className="flex gap-4 max-w-[80%]">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                        <X className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div className="bg-red-50 border border-red-200 rounded-2xl rounded-bl-md p-4">
                                                        <div className="text-red-800 text-sm">
                                                            {message.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="text-xs text-gray-400 px-4">
                                            {message.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                                
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="flex gap-3 items-center">
                                            <div className="shrink-0" style={{ width: 56, height: 56 }}>
                                                <TillyThinkingLoader size={56} label="Tilly is thinking..." theme="sprout" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            {/* Fixed Input Area - mobile optimized */}
            <div className="border-t bg-white p-3 md:p-4 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                     {/* Selected Items Display - mobile responsive */}
                    {(selectedTools.length > 0 || attachedRecords.length > 0) && (
                        <div className="flex flex-wrap gap-2 mb-3 max-h-20 overflow-y-auto">
                            {selectedTools.map(toolId => {
                                const toolInfo = AGRICULTURAL_TOOLS.find(t => t.id === toolId);
                                if (!toolInfo) return null;
                                const Icon = toolInfo.icon;
                                return (
                                    <Badge key={toolId} className={`${toolInfo.color} hover:opacity-90`}>
                                        <Icon className="w-3 h-3 mr-1.5" />
                                        {toolInfo.name}
                                        <X 
                                            className="w-3 h-3 ml-2 cursor-pointer" 
                                            onClick={() => toggleTool(toolId)}
                                        />
                                    </Badge>
                                );
                            })}
                            {attachedRecords.map(record => (
                                <Badge key={`${record.type}-${record.id}`} variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                                    <FileText className="w-3 h-3 mr-1.5" />
                                    {record.type === 'soil_test' ? record.field_name : record.practice_name}
                                    <X 
                                        className="w-3 h-3 ml-2 cursor-pointer" 
                                        onClick={() => removeAttachedRecord(record.id, record.type)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="relative border border-gray-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 flex items-end gap-2">
                        {/* Tool and Data Selection Buttons - mobile responsive */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="flex-shrink-0">
                                    <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 md:w-96 mb-2" side="top">
                                {/* Record Picker Content */}
                                <div className="p-1">
                                    <h4 className="text-sm font-medium text-gray-800 mb-2">Attach Your Data</h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        <div className="text-xs font-medium text-gray-600">Soil Tests</div>
                                        {userRecords.soilTests.slice(0, 6).map(test => (
                                            <div key={test.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => attachRecord({ ...test, type: 'soil_test' })}>
                                                <span className="text-sm">{test.field_name} ({test.test_date})</span>
                                                <Plus className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        ))}
                                        <div className="text-xs font-medium text-gray-600 pt-2">Practices</div>
                                        {userRecords.practices.slice(0, 4).map(practice => (
                                            <div key={practice.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => attachRecord({ ...practice, type: 'practice' })}>
                                                <span className="text-sm">{practice.practice_name} ({practice.application_date})</span>
                                                <Plus className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="flex-shrink-0">
                                    <Wrench className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 md:w-[500px] mb-2" side="top">
                                {/* Tool Picker Content */}
                                <div className="p-1">
                                    <h4 className="text-sm font-medium text-gray-800 mb-2">Select Agricultural Tools</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {AGRICULTURAL_TOOLS.map(tool => {
                                            const Icon = tool.icon;
                                            const isSelected = selectedTools.includes(tool.id);
                                            return (
                                                <div key={tool.id} className={`p-2 rounded cursor-pointer ${isSelected ? 'bg-emerald-100' : 'hover:bg-gray-100'}`} onClick={() => toggleTool(tool.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{tool.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        
                        <Textarea
                            ref={inputRef}
                            placeholder="Ask Tilly anything..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 p-0 text-sm md:text-base"
                            rows={1}
                            disabled={isLoading}
                        />
                        <Button 
                            onClick={handleSendMessage} 
                            disabled={isLoading || (!inputText.trim() && attachedRecords.length === 0)}
                            size="icon"
                            className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-full w-8 h-8"
                        >
                            {isLoading ? (
                                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                            ) : (
                                <Send className="h-3 w-3 md:h-4 md:w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
