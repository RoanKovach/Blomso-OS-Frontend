import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link2, Calendar, MapPin } from 'lucide-react';
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

        if (data.summary.successful > 0) {
          if (onLinked) onLinked();
        }
        await loadSuggestions();
        setSelectedTests(new Set());
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
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 shadow-sm">
      <div className="mb-2 flex items-start gap-2">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">Unlinked soil tests for this field</h3>
          <p className="text-xs text-slate-600">
            Attach evidence that matches <span className="font-medium text-slate-800">{selectedField.field_name}</span>.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Looking for matches…</span>
        </div>
      ) : suggestions.length === 0 ? (
        <Alert className="border-slate-200 bg-white py-2">
          <AlertDescription className="text-xs text-slate-600">
            No unlinked soil tests match this field right now. Add PDFs under My Records, then check back.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {matchSummary && (
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span>High: {matchSummary.high_confidence}</span>
              <span>Med: {matchSummary.medium_confidence}</span>
              <span>Low: {matchSummary.low_confidence}</span>
            </div>
          )}

          <div className="max-h-48 space-y-2 overflow-y-auto pr-0.5">
            {suggestions.map((suggestion) => {
              const details = suggestion.soil_test_details || {};
              const loc = details.location;
              return (
                <div key={suggestion.soil_test_id} className="rounded-md border border-slate-200/80 bg-white p-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedTests.has(suggestion.soil_test_id)}
                      onCheckedChange={(checked) => handleTestSelection(suggestion.soil_test_id, checked)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-slate-900">{suggestion.soil_test_name}</span>
                        {getConfidenceBadge(suggestion.confidence_score)}
                      </div>
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                        {suggestion.test_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{new Date(suggestion.test_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {loc && (loc.address || (loc.latitude != null && loc.longitude != null)) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {loc.address ||
                                `${loc.latitude?.toFixed?.(4) ?? loc.latitude}, ${loc.longitude?.toFixed?.(4) ?? loc.longitude}`}
                            </span>
                          </div>
                        )}
                        {suggestion.match_reasons?.length > 0 && (
                          <div className="text-slate-600">{suggestion.match_reasons.join(' · ')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 border-t border-slate-200/80 pt-2">
            <Button
              size="sm"
              onClick={handleLinkSelected}
              disabled={selectedTests.size === 0 || isLinking}
              className="flex-1"
            >
              {isLinking && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Attach selected ({selectedTests.size})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedTests(new Set())}
              disabled={selectedTests.size === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
