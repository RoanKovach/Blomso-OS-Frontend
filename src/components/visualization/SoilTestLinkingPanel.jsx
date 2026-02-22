import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link, MapPin, Calendar, Target } from 'lucide-react';
import { suggestSoilTestLinks } from '@/api/functions';
import { linkSoilTestsToField } from '@/api/functions';
import { useToasts } from '@/components/hooks/useToasts';

export default function SoilTestLinkingPanel({ selectedField, onLinked }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTests, setSelectedTests] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [matchSummary, setMatchSummary] = useState(null);
  const { toast } = useToasts();

  const loadSuggestions = async () => {
    if (!selectedField) return;
    
    setIsLoading(true);
    try {
      const { data } = await suggestSoilTestLinks({ field_id: selectedField.id });
      
      if (data.success) {
        setSuggestions(data.suggested_matches || []);
        setMatchSummary(data.match_summary);
        
        const highConfidenceIds = (data.suggested_matches || [])
          .filter(match => match.confidence_score >= 0.7)
          .map(match => match.soil_test_id);
        setSelectedTests(new Set(highConfidenceIds));
      } else {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error(`Could not load suggestions: ${error.message}`);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedField) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setSelectedTests(new Set());
      setMatchSummary(null);
    }
  }, [selectedField]);

  const handleTestSelection = (testId, checked) => {
    const newSelected = new Set(selectedTests);
    if (checked) {
      newSelected.add(testId);
    } else {
      newSelected.delete(testId);
    }
    setSelectedTests(newSelected);
  };

  const handleLinkSelected = async () => {
    if (selectedTests.size === 0) {
      toast.error('Please select at least one soil test to link');
      return;
    }

    setIsLinking(true);
    try {
      const { data } = await linkSoilTestsToField({
        field_id: selectedField.id,
        soil_test_ids: Array.from(selectedTests)
      });

      if (data.success && data.summary) {
        if (data.summary.successful > 0) {
          toast.success(`Successfully linked ${data.summary.successful} test(s) to ${selectedField.field_name}.`);
        }
        if (data.summary.already_linked > 0) {
          toast.info(`${data.summary.already_linked} test(s) were already linked.`);
        }
        if (data.summary.failed > 0) {
          toast.error(`${data.summary.failed} test(s) failed to link. See console for details.`);
          console.error("Linking failures:", data.results.filter(r => r.status === 'error'));
        }
        
        // Refresh suggestions and notify parent of the successful change
        if (data.summary.successful > 0) {
          if (onLinked) onLinked();
        }
        await loadSuggestions(); // Always reload suggestions
        setSelectedTests(new Set()); // Clear selection
      } else {
        throw new Error(data.error || 'Unknown error during linking');
      }
    } catch (error) {
      console.error('Error linking tests:', error);
      toast.error(`Failed to link soil tests: ${error.message}`);
    } finally {
      setIsLinking(false);
    }
  };

  const getConfidenceBadge = (score) => {
    if (score >= 0.7) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (score >= 0.5) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
  };

  if (!selectedField) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Select a field to see soil test suggestions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Smart Soil Test Linking
        </CardTitle>
        <p className="text-sm text-gray-600">
          Suggested unlinked soil tests for <strong>{selectedField.field_name}</strong>
        </p>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Finding matching soil tests...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <Alert>
            <AlertDescription>
              No unlinked soil tests found that match this field. Upload soil test reports in "My Records" to see suggestions here.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {matchSummary && (
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">High: {matchSummary.high_confidence}</span>
                <span className="text-yellow-600">Medium: {matchSummary.medium_confidence}</span>
                <span className="text-gray-600">Low: {matchSummary.low_confidence}</span>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div key={suggestion.soil_test_id} className="border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTests.has(suggestion.soil_test_id)}
                      onCheckedChange={(checked) => handleTestSelection(suggestion.soil_test_id, checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{suggestion.soil_test_name}</h4>
                        {getConfidenceBadge(suggestion.confidence_score)}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        {suggestion.test_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(suggestion.test_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {suggestion.soil_test_details.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {suggestion.soil_test_details.location.address || 
                               `${suggestion.soil_test_details.location.latitude?.toFixed(4)}, ${suggestion.soil_test_details.location.longitude?.toFixed(4)}`}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-blue-600">
                          Match: {suggestion.match_reasons.join(' • ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleLinkSelected}
                disabled={selectedTests.size === 0 || isLinking}
                className="flex-1"
              >
                {isLinking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Link Selected ({selectedTests.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedTests(new Set())}
                disabled={selectedTests.size === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}