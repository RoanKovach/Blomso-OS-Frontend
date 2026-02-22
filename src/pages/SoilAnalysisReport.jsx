
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SoilTest } from "@/api/entities";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Brain, 
  FileText, 
  Sprout, 
  AlertTriangle, 
  Loader2 
} from "lucide-react";
import FieldInformation from "../components/recommendations/FieldInformation";
import SoilDataDisplay from "../components/recommendations/SoilDataDisplay";
import { InvokeLLM } from "@/api/integrations";

export default function SoilAnalysisReportPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    const loadPendingTests = async () => {
      setIsLoading(true);
      setError(null);
      const urlParams = new URLSearchParams(window.location.search);
      const testIdsParam = urlParams.get('test_ids');

      if (!testIdsParam) {
        setError("No soil tests specified for analysis.");
        setIsLoading(false);
        return;
      }

      const testIds = testIdsParam.split(',');
      
      try {
        const fetchedTests = await Promise.all(
          testIds.map(id => SoilTest.get(id))
        );
        const pendingTests = fetchedTests.filter(t => t && t.analysis_status === 'pending');
        
        if (pendingTests.length === 0) {
          setError("No pending analyses found for the specified tests. They may have already been processed.");
          // Optionally, redirect to the first completed report
          navigate(createPageUrl(`Recommendations?test_id=${testIds[0]}`));
        } else {
          setTests(pendingTests);
        }
      } catch (err) {
        setError("Failed to load soil test data. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingTests();
  }, [window.location.search, navigate]);

  const handleGenerateFullAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      try {
        const analysisPrompt = `
          Act as an expert agronomist. Analyze the provided soil test data for a field zone, referencing Cornell, NRCS, and other Land Grant University extension standards.

          **Full Field & Management Context (Use all this information for your analysis):**
          - Field Name: ${test.field_name}
          - Zone Name: ${test.zone_name}
          - Field Size: ${test.field_size_acres || 'N/A'} acres
          - Location: ${test.location?.address || 'Not specified'}
          - Intended Crop: ${test.crop_type}
          - Farming Method: ${test.farming_method}
          - Soil Type: ${test.soil_type || 'Not specified'}
          - Irrigation: ${test.irrigation_type || 'Not specified'}
          - Previous Crop History: ${test.previous_crop_history || 'Not specified'}
          - Raw Soil Data for this Zone: ${JSON.stringify(test.soil_data)}

          **Instructions:**
          1.  **Nutrient Status Assessment:** For each key nutrient (pH, OM, N, P, K, etc.), determine if it is "Deficient", "Marginal", or "Sufficient" for the intended crop. Provide the current level and a brief recommendation.
          2.  **Product Recommendations:** Based on deficiencies and farming method (e.g., organic vs conventional), recommend 2-3 specific products. Provide product name, application rate, unit, timing, estimated cost, purpose, and method.
          3.  **Scenario Pathways:** Generate four distinct recommendation pathways: Industry Standard, Regenerative, Organic Compliant, and Budget Conscious. For each, detail practices, costs, yield impact, ROI, and a timeline. For regenerative, estimate carbon potential.
          4.  **Scores & Summaries:** Calculate an overall Soil Health Index (SHI) and a Biological Score (0-100). Provide scores for CASH framework indicators. Estimate yield impact. Write a concise overall summary.

          Return a single, structured JSON object with the complete analysis based *only* on the provided context and soil data.
        `;

        const aiAnalysis = await InvokeLLM({
          prompt: analysisPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              nutrient_status: { type: "object" },
              product_recommendations: { type: "array", items: { type: "object" } },
              recommendation_pathways: { type: "object" },
              soil_health_index: { type: "number" },
              biological_score: { type: "number" },
              cash_indicators: { type: "object" },
              yield_impact: { type: "object" }
            }
          }
        });

        await SoilTest.update(test.id, {
          ...aiAnalysis,
          analysis_status: 'complete'
        });
        
        setAnalysisProgress(((i + 1) / tests.length) * 100);

      } catch (err) {
        setError(`An error occurred while analyzing Zone: ${test.zone_name}. Please try again.`);
        console.error(err);
        setIsAnalyzing(false);
        return;
      }
    }

    // After all analyses are complete, navigate to the first report
    navigate(createPageUrl(`Recommendations?test_id=${tests[0].id}`));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-lg w-full text-center p-8">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate(createPageUrl('Upload'))} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Upload
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Soil Analysis Report
          </h1>
          <p className="text-green-700 text-lg">
            Review the extracted data from your document. When you're ready, proceed to generate the full AI-powered analysis.
          </p>
        </div>

        <div className="space-y-8 mb-8">
          {tests.map(test => (
            <Card key={test.id} className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-green-900">
                  Zone: {test.zone_name || 'N/A'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FieldInformation soilTest={test} />
                <SoilDataDisplay soilTest={test} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="sticky bottom-4 border-none shadow-2xl bg-white/90 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-green-900">Ready for the Next Step?</h3>
                <p className="text-green-700">Generate in-depth recommendations, scenario simulations, and an ROI forecast.</p>
              </div>
              <Button
                onClick={handleGenerateFullAnalysis}
                disabled={isAnalyzing}
                size="lg"
                className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing... ({Math.round(analysisProgress)}%)
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Generate Full AI Recommendations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
