
import React, { useState, useEffect } from "react";
import { SoilTest } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp, 
  Activity, 
  Target, 
  DollarSign,
  MapPin,
  Calendar,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Bot
} from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

import SoilHealthScore from "../components/recommendations/SoilHealthScore";
import AIRecommendations from "../components/recommendations/AIRecommendations";
import SoilDataDisplay from "../components/recommendations/SoilDataDisplay";
import FieldInformation from "../components/recommendations/FieldInformation";
import CASHScoreBreakdown from "../components/recommendations/CASHScoreBreakdown";
import RecommendationPathways from "../components/recommendations/RecommendationPathways";
import AskTillyInterface from "../components/tilly/AskTillyInterface";

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const [soilTest, setSoilTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTillySection, setShowTillySection] = useState(false);
  const [allUserTests, setAllUserTests] = useState([]);

  useEffect(() => {
    loadPageData();
  }, [window.location.search]);

  const loadPageData = async () => {
    setIsLoading(true);
    setError(null);
    setSoilTest(null);
    
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('test_id');

    try {
      let user = null;
      try {
        user = await User.me();
      } catch (userError) {
        console.log("User not logged in, showing public view");
      }

      if (!testId) {
        // No specific test selected - show general Ask Tilly page
        if (user) {
          const userTests = await SoilTest.filter({ created_by: user.email, analysis_status: 'complete' });
          setAllUserTests(userTests);
        }
        setShowTillySection(true);
        setIsLoading(false);
        return;
      }

      // Specific test selected - load the full report
      const tests = await SoilTest.list();
      let test = null;
      
      if (user) {
        test = tests.find(t => t.id === testId && t.created_by === user.email);
      } else {
        // Public access - find test by ID only
        test = tests.find(t => t.id === testId);
      }
      
      if (!test) {
        setError("Soil test not found or you do not have permission to view it.");
      } else if (test.analysis_status === 'pending') {
        setError("This report has not been fully analyzed yet. Please complete the analysis process.");
        // Optional: Redirect to the analysis page
        navigate(createPageUrl(`SoilAnalysisReport?test_ids=${test.id}`));
      } else {
        setSoilTest(test);
        if (user) {
          const userTests = await SoilTest.filter({ created_by: user.email, analysis_status: 'complete' });
          setAllUserTests(userTests);
        }
      }
    } catch (error) {
      setError("Error loading data. Please try again.");
      console.error("Error loading page data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTillyContext = (specificTest = null) => {
    let context = '';
    
    if (allUserTests.length > 0) {
      const numTests = allUserTests.length;
      const fieldNames = [...new Set(allUserTests.map(t => t.field_name))].filter(Boolean).join(', ');
      const avgShi = allUserTests.reduce((sum, t) => sum + (t.soil_health_index || 0), 0) / numTests;
      
      context += `
Historical Context: This user has ${numTests} soil test report(s) for field(s): ${fieldNames}.
Average soil health index: ${avgShi.toFixed(1)}.
      `;
    }

    if (specificTest) {
      context += `
Current Report Context:
- Field: ${specificTest.field_name}
- Test Date: ${specificTest.test_date ? format(new Date(specificTest.test_date), "MMMM d, yyyy") : 'N/A'}
- Crop: ${specificTest.crop_type || "Not specified"}
- Soil Health Index: ${specificTest.soil_health_index || 'N/A'}
- AI Summary: ${specificTest.summary || "No summary available."}
- Soil Data: ${JSON.stringify(specificTest.soil_data, null, 2)}
      `;
    }

    return context || "No specific soil test data available. Provide general agricultural advice.";
  };

  const downloadReport = () => {
    if (!soilTest) return;

    const reportContent = `
SOIL HEALTH REPORT
==================

Field: ${soilTest.field_name} (${soilTest.field_size_acres || 'N/A'} acres)
Zone: ${soilTest.zone_name || 'Main'}
Test Date: ${format(new Date(soilTest.test_date), "MMMM d, yyyy")}
Crop: ${soilTest.crop_type || "Not specified"}

--- EXECUTIVE SUMMARY ---
${soilTest.summary || "No summary available."}

--- SOIL HEALTH SCORES ---
Soil Health Index: ${soilTest.soil_health_index || 'N/A'}/100
Biological Score: ${soilTest.biological_score || 'N/A'}/100

--- NUTRIENT STATUS ---
${Object.entries(soilTest.nutrient_status || {}).map(([key, value]) =>
      `${key.toUpperCase()}: ${value.status} (${value.level}) - ${value.recommendation}`
    ).join('\n')}

--- TOP PRODUCT RECOMMENDATIONS ---
${(soilTest.product_recommendations || []).map((rec, i) =>
      `${i + 1}. ${rec.product_name}
     - Rate: ${rec.rate_per_acre} ${rec.unit}/acre
     - Timing: ${rec.timing}
     - Cost: $${rec.cost_per_acre}/acre
     - Purpose: ${rec.purpose}`
    ).join('\n\n')}

--- SCENARIO: INDUSTRY STANDARD ---
Cost: $${soilTest.recommendation_pathways?.industry_standard?.cost_per_acre || 'N/A'}/acre
Practices: ${(soilTest.recommendation_pathways?.industry_standard?.practices || []).join(', ')}

Generated by Blomso - AI Soil Intelligence Platform
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `soil-report-${soilTest.field_name}-${soilTest.test_date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-10 h-10" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // General Ask Tilly page (no specific test selected) - IMPROVED MOBILE LAYOUT
  if (showTillySection && !soilTest) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-white">
        {/* Left Sidebar - responsive */}
        <div className="w-full md:w-1/4 md:max-w-xs h-auto md:h-full bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold text-gray-800">Blomso AI</h1>
            </div>
            <div className="p-4">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Bot className="w-4 h-4 mr-2" /> New Chat
                </Button>
            </div>
            {/* Using a div with max-height instead of ScrollArea directly to control mobile height */}
            <div className="flex-1 p-4 max-h-48 md:max-h-none overflow-y-auto"> 
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Reports</h2>
                    {allUserTests.length > 0 ? (
                        allUserTests.slice(0, 5).map(test => (
                            <a 
                                key={test.id} 
                                href={createPageUrl(`Recommendations?test_id=${test.id}`)}
                                className="block p-3 rounded-lg hover:bg-gray-200 cursor-pointer text-sm"
                            >
                                <div className="font-medium text-gray-800 truncate">{test.field_name}</div>
                                <div className="text-xs text-gray-500">
                                    {test.test_date ? format(new Date(test.test_date), "MMM d, yyyy") : 'N/A'}
                                </div>
                            </a>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 p-3">No recent reports found.</p>
                    )}
                </div>
            </div>
             <div className="p-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(createPageUrl("Dashboard"))}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
            </div>
        </div>

        {/* Right Main Chat Area - responsive */}
        <div className="flex-1 h-screen md:h-full flex flex-col">
            <AskTillyInterface
                title="Ask Tilly"
                description="Use the tools below to analyze your data based on established methodologies."
                contextPrompt={generateTillyContext()}
            />
        </div>
      </div>
    );
  }

  if (error || !soilTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-900 mb-2">Error Loading Report</h1>
          <p className="text-green-700 mb-6">{error || "Please select a report from the dashboard to view its details."}</p>
          <Button 
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="bg-green-600 hover:bg-green-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Full AI Recommendations Report with Ask Tilly as add-on - IMPROVED MOBILE LAYOUT
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      {/* Mobile-first responsive padding */}
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header - mobile responsive */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="border-green-200 hover:bg-green-100 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-3xl font-bold text-green-900 truncate">
                  AI Soil Analysis Report
                </h1>
                <p className="text-green-700 mt-1 text-sm md:text-base">
                  Analysis for {soilTest?.field_name}
                </p>
              </div>
            </div>
            
            {/* Action buttons - mobile responsive */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTillySection(!showTillySection)}
                className="border-green-200 hover:bg-green-100 text-xs md:text-sm"
              >
                <Bot className="w-4 h-4 mr-2" />
                {showTillySection ? "Hide" : "Ask"} Tilly
              </Button>
              <Button
                variant="outline"
                onClick={downloadReport}
                className="border-green-200 hover:bg-green-100 text-xs md:text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              {soilTest?.raw_file_url && (
                <a href={soilTest.raw_file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-green-200 hover:bg-green-100 text-xs md:text-sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Original
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Content grid - mobile responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main AI Recommendations Content */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <FieldInformation soilTest={soilTest} />
              <SoilHealthScore soilTest={soilTest} />
              <AIRecommendations soilTest={soilTest} />
              <CASHScoreBreakdown soilTest={soilTest} />
              <RecommendationPathways soilTest={soilTest} />
              <SoilDataDisplay soilTest={soilTest} />
              
              {/* Ask Tilly Add-on Section - mobile responsive */}
              {showTillySection && (
                <div className="mt-8">
                  <AskTillyInterface 
                    title="Ask Tilly About This Report"
                    description="Get additional insights or ask specific questions about this soil test analysis."
                    contextPrompt={generateTillyContext(soilTest)}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 md:space-y-8">
              <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900">
                    <Target className="w-5 h-5 text-green-600" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Field Size</span>
                    <span className="text-green-900 font-bold">{soilTest?.field_size_acres || 0} acres</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-medium">Test Date</span>
                    <span className="text-blue-900 font-bold">
                      {soilTest?.test_date ? format(new Date(soilTest.test_date), "MMM d, yyyy") : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="text-amber-700 font-medium">Crop Type</span>
                    <span className="text-amber-900 font-bold">{soilTest?.crop_type || "Not specified"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-700 font-medium">Est. Cost/Acre</span>
                    <span className="text-purple-900 font-bold">
                      ${soilTest?.product_recommendations?.[0]?.cost_per_acre || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => navigate(createPageUrl("MyRecords"))}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Log Recommended Practices
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-200 hover:bg-green-100"
                    onClick={() => navigate(createPageUrl("FieldMap"))}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View Field Map
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-200 hover:bg-green-100"
                    onClick={() => navigate(createPageUrl("Upload"))}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Upload Another Test
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
