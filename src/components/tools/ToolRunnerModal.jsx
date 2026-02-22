import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SoilTest } from "@/api/entities";
import { InvokeLLM, UploadFile } from "@/api/integrations";
import { Upload, AlertCircle, Brain, Loader2, GitCompareArrows, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ToolRunnerModal({ tool, isOpen, onClose }) {
  const [step, setStep] = useState('select'); // 'select', 'upload', 'processing', 'results'
  const [soilTests, setSoilTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedTest2Id, setSelectedTest2Id] = useState(''); // For comparison tools
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      loadSoilTests();
      setStep('select');
      setError(null);
      setResults(null);
      setSelectedTestId('');
      setSelectedTest2Id('');
      setUploadedFile(null);
    }
  }, [isOpen]);

  const loadSoilTests = async () => {
    try {
      const tests = await SoilTest.list('-test_date');
      setSoilTests(tests);
      if (tests.length === 0) {
        setStep('upload');
      }
    } catch (error) {
      console.error('Error loading soil tests:', error);
      setError('Failed to load existing soil tests');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
    }
  };

  const processUploadedFile = async () => {
    if (!uploadedFile) return;

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      const { file_url } = await UploadFile({ file: uploadedFile });

      const extractionPrompt = getExtractionPrompt(tool.id);
      const schema = getToolSchema(tool.id);

      const result = await InvokeLLM({
        prompt: extractionPrompt,
        file_urls: [file_url],
        response_json_schema: schema
      });

      const toolResult = await runTool(tool.id, result);
      setResults(toolResult);
      setStep('results');

    } catch (error) {
      console.error('Tool analysis error:', error);
      setError(`Tool analysis error: ${error.message}`);
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };

  const processExistingTest = async () => {
    if (!selectedTestId) return;

    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      if (tool.id === 'what_changed') {
        // For comparison tool, need two tests
        if (!selectedTest2Id) {
          throw new Error('Please select two tests for comparison');
        }
        const test1 = soilTests.find(t => t.id === selectedTestId);
        const test2 = soilTests.find(t => t.id === selectedTest2Id);
        
        if (!test1 || !test2) throw new Error('Tests not found');

        const toolResult = await runComparisonTool(test1, test2);
        setResults(toolResult);
      } else {
        const test = soilTests.find(t => t.id === selectedTestId);
        if (!test) throw new Error('Test not found');

        const toolResult = await runTool(tool.id, test.soil_data || {});
        setResults(toolResult);
      }
      
      setStep('results');

    } catch (error) {
      console.error('Tool analysis error:', error);
      setError(`Tool analysis error: ${error.message}`);
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };

  const runComparisonTool = async (test1, test2) => {
    const metrics = [...new Set([...Object.keys(test1.soil_data || {}), ...Object.keys(test2.soil_data || {})])];
    
    const comparisonData = metrics.map(metric => {
      const val1 = test1.soil_data?.[metric] || 0;
      const val2 = test2.soil_data?.[metric] || 0;
      const diff = val2 - val1;
      const percentChange = val1 !== 0 ? ((diff / val1) * 100) : 0;
      
      let status = 'stable';
      let icon = Minus;
      if (Math.abs(diff) > 0.1) {
        status = diff > 0 ? 'improved' : 'declined';
        icon = diff > 0 ? ArrowUp : ArrowDown;
      }
      
      return { 
        metric, 
        val1: val1.toFixed(2), 
        val2: val2.toFixed(2), 
        diff: diff.toFixed(2), 
        percentChange: percentChange.toFixed(1),
        status,
        icon
      };
    });

    return {
      type: 'comparison',
      test1: test1.field_name,
      test2: test2.field_name,
      data: comparisonData
    };
  };

  const getExtractionPrompt = (toolId) => {
    switch (toolId) {
      case 'what_changed':
        return `Extract comprehensive soil test data for comparison analysis. Include all available nutrient values.`;
      default:
        return `Extract basic soil test data including pH, organic matter, nitrogen, phosphorus, and potassium levels.`;
    }
  };

  const getToolSchema = (toolId) => {
    return {
      type: "object",
      properties: {
        ph: { type: "number", description: "pH level" },
        organic_matter: { type: "number", description: "Organic Matter percentage" },
        nitrogen: { type: "number", description: "Nitrogen content" },
        phosphorus: { type: "number", description: "Phosphorus content" },
        potassium: { type: "number", description: "Potassium content" },
        calcium: { type: "number", description: "Calcium content" },
        magnesium: { type: "number", description: "Magnesium content" },
        sulfur: { type: "number", description: "Sulfur content" },
        cec: { type: "number", description: "Cation Exchange Capacity" }
      }
    };
  };

  const runTool = async (toolId, soilData) => {
    // Placeholder for other tools - will be implemented as needed
    return {
      type: 'analysis',
      message: `${tool.title} analysis completed with provided soil data.`,
      data: soilData
    };
  };

  const renderResults = () => {
    if (!results) return null;

    if (results.type === 'comparison') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-green-900">Comparison Results</h3>
            <p className="text-sm text-gray-600">
              {results.test1} vs {results.test2}
            </p>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.data.map(row => {
                const IconComponent = row.icon;
                const statusColor = {
                  improved: 'text-green-600',
                  declined: 'text-red-600',
                  stable: 'text-gray-500'
                }[row.status];

                return (
                  <TableRow key={row.metric}>
                    <TableCell className="font-semibold capitalize">
                      {row.metric.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>{row.val1}</TableCell>
                    <TableCell>{row.val2}</TableCell>
                    <TableCell className={statusColor}>
                      {row.diff > 0 ? '+' : ''}{row.diff}
                      {row.percentChange !== '0.0' && ` (${row.percentChange}%)`}
                    </TableCell>
                    <TableCell className={`flex items-center gap-2 ${statusColor}`}>
                      <IconComponent className="w-4 h-4" />
                      {row.status}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <Brain className="w-16 h-16 mx-auto mb-4 text-green-600" />
        <h3 className="text-lg font-bold text-green-900 mb-2">{tool.title}</h3>
        <p className="text-gray-600">{results.message}</p>
      </div>
    );
  };

  const canProceed = () => {
    if (step === 'upload') return uploadedFile;
    if (tool.id === 'what_changed') return selectedTestId && selectedTest2Id;
    return selectedTestId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <tool.icon className="w-6 h-6 text-emerald-600" />
            {tool.title}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'select' && (
          <div className="space-y-6">
            <p className="text-gray-600">{tool.description}</p>
            
            {soilTests.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Use Existing Soil Test Data</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">
                      {tool.id === 'what_changed' ? 'Select Baseline Test' : 'Select Soil Test'}
                    </label>
                    <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a soil test..." />
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

                  {tool.id === 'what_changed' && (
                    <div>
                      <label className="text-sm font-medium">Select Comparison Test</label>
                      <Select value={selectedTest2Id} onValueChange={setSelectedTest2Id}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose second test..." />
                        </SelectTrigger>
                        <SelectContent>
                          {soilTests.filter(test => test.id !== selectedTestId).map(test => (
                            <SelectItem key={test.id} value={test.id}>
                              {test.field_name} ({new Date(test.test_date).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={processExistingTest}
                    disabled={!canProceed() || isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Run Analysis
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep('upload')}
                  >
                    Upload New File Instead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">No existing soil test data found.</p>
                <Button onClick={() => setStep('upload')}>
                  Upload Soil Test File
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <h3 className="font-semibold">Upload Soil Test File</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <input
                type="file"
                accept=".pdf,.csv,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" as="span">
                  Choose File
                </Button>
              </label>
              <p className="mt-2 text-sm text-gray-600">
                PDF, Excel, CSV, and image files supported
              </p>
              {uploadedFile && (
                <p className="mt-2 text-sm font-medium text-green-600">
                  Selected: {uploadedFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={processUploadedFile}
                disabled={!uploadedFile || isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Process File
              </Button>
              {soilTests.length > 0 && (
                <Button variant="outline" onClick={() => setStep('select')}>
                  Use Existing Data Instead
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-emerald-600" />
            <h3 className="text-lg font-semibold mb-2">Processing...</h3>
            <p className="text-gray-600">Running {tool.title} analysis</p>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-6">
            {renderResults()}
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}