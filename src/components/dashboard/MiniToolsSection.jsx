
import React, { useState } from 'react';
import { Wrench, HeartPulse, AreaChart, CircleDollarSign, Award, Thermometer } from "lucide-react";
import ToolCard from "../tools/ToolCard";
import WhatChangedWidget from "../tools/WhatChangedWidget";
import ToolRunnerModal from "../tools/ToolRunnerModal";

// Updated tools list with collapsed format
const toolsList = [
  {
    id: "soil_health_scorecard",
    title: "Soil Health Scorecard",
    icon: HeartPulse,
    description: "Get a quick score based on NPK, pH, and organic matter.",
    implemented: true,
    tillyIntegrated: true // Changed to true
  },
  {
    id: "yield_predictor",
    title: "Yield Zone Predictor",
    icon: AreaChart,
    description: "Estimate yield potential per zone based on soil data, microbiome, and climate trends.",
    comingSoon: true,
    tillyIntegrated: false
  },
  {
    id: "roi_estimator",
    title: "Nutrient ROI Estimator",
    icon: CircleDollarSign,
    description: "Calculate the cost-effectiveness of fertilizer applications based on Tri-State recommendations.",
    comingSoon: false,
    tillyIntegrated: true // Now integrated with Tilly
  },
  {
    id: "carbon_checker",
    title: "Carbon Credit Readiness",
    icon: Award,
    description: "Check if your practices meet the criteria for carbon credits.",
    comingSoon: true,
    tillyIntegrated: false
  },
  {
    id: "drought_risk",
    title: "Drought Risk Index",
    icon: Thermometer,
    description: "Assess drought risk based on soil texture and organic matter.",
    comingSoon: true,
    tillyIntegrated: false
  },
];

export default function MiniToolsSection() {
    const [activeToolId, setActiveToolId] = useState(null);
    const [modalTool, setModalTool] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleLaunchModalTool = (tool) => {
        if (tool.tillyIntegrated) {
            // Navigate to Recommendations page with pre-selected tool
            window.location.href = `/Recommendations?tool=${tool.id}`;
            return;
        }

        setModalTool(tool);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalTool(null);
    };

    return (
        <>
            <div className="mt-12">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
                        <Wrench className="w-8 h-8 text-emerald-600" />
                        Agricultural Tools
                    </h2>
                    <p className="text-gray-600 text-lg mt-2 max-w-3xl mx-auto">
                        Leverage your soil data with these powerful analysis tools. Advanced tools are integrated with Tilly for personalized reports.
                    </p>
                </div>

                {/* Conditionally render all tools OR the single active tool */}
                {!activeToolId ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <WhatChangedWidget
                            isSelected={false}
                            onSelect={() => setActiveToolId('what_changed')}
                        />
                        {toolsList.map(tool => (
                            <ToolCard
                                key={tool.id}
                                {...tool}
                                onLaunch={() => handleLaunchModalTool(tool)}
                                tillyIntegrated={tool.tillyIntegrated}
                            />
                        ))}
                    </div>
                ) : (
                    activeToolId === 'what_changed' && (
                        <div className="flex justify-center">
                            <WhatChangedWidget
                                isSelected={true}
                                onClose={() => setActiveToolId(null)}
                            />
                        </div>
                    )
                )}
            </div>

            {modalTool && !modalTool.tillyIntegrated && (
                <ToolRunnerModal
                    tool={modalTool}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
}
