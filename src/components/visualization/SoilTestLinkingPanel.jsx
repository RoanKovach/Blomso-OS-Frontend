import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Link2, Calendar, MapPin } from 'lucide-react';
import { suggestFieldLinks } from '@/api/fieldLinks';
import { linkSoilTestsToField } from '@/api/functions';
import { useToasts } from '@/components/hooks/useToasts';

const CONFIDENCE_SHOW_MIN = 0.5;
const CONFIDENCE_STRONG = 0.7;

export default function SoilTestLinkingPanel({ selectedField, onLinked }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTests, setSelectedTests] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToasts();

  const visibleSuggestions = useMemo(
    () =>
      suggestions.filter((s) => (s.confidence_score ?? 0) >= CONFIDENCE_SHOW_MIN),
    [suggestions]
  );

  const hasStrongMatch = useMemo(
    () => visibleSuggestions.some((s) => (s.confidence_score ?? 0) >= CONFIDENCE_STRONG),
    [visibleSuggestions]
  );

  const loadSuggestions = async () => {
    if (!selectedField) return;

    setIsLoading(true);
    try {
      const res = await suggestFieldLinks(selectedField.id);
      const data = res?.data ?? res;

      // Support both { success, suggested_matches } and direct array payloads.
      const list =
        (data && data.suggested_matches) ||
        (Array.isArray(data) ? data : []) ||
        [];

      if (data?.success === false) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      setSuggestions(list);

        const highConfidenceIds = list
          .filter((match) => (match.confidence_score ?? 0) >= CONFIDENCE_STRONG)
          .map((match) => match.soil_test_id);
        setSelectedTests(new Set(highConfidenceIds));
    } catch (error) {
      // Wiped DB / no candidates can surface as 400 depending on backend implementation.
      // Treat as "no suggestions" instead of a scary error.
      const status = error?.status ?? error?.response?.status;
      const isEmptyState =
        status === 400 ||
        status === 404;
      if (!isEmptyState) {
        console.error('Error loading suggestions:', error);
        toast.error(`Could not load suggestions: ${error.message}`);
      }
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
          const fieldName =
            selectedField.field_name ?? selectedField.name ?? selectedField.normalizedName ?? 'field';
          toast.success(`Successfully linked ${data.summary.successful} test(s) to ${fieldName}.`);
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
    if (score >= CONFIDENCE_STRONG) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (score >= CONFIDENCE_SHOW_MIN) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
  };

  if (!selectedField) {
    return null;
  }

  if (!isLoading && suggestions.length > 0 && visibleSuggestions.length === 0) {
    return null;
  }

  const heading = hasStrongMatch ? 'Possible soil evidence' : 'Potential matches';
  const sub =
    'Suggested from your records — only attach tests you are confident belong to this field.';

  return (
    <div className="rounded-md border border-slate-100 bg-white/90 p-2.5">
      <div className="mb-2 flex items-start gap-2">
        <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold text-slate-700">{heading}</h3>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{sub}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Checking for matches…</span>
        </div>
      ) : suggestions.length === 0 ? (
        <p className="py-1 text-[11px] leading-snug text-slate-500">
          No suggested soil tests for this field right now. Add PDFs under My Records, then check back.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="max-h-40 space-y-1.5 overflow-y-auto pr-0.5">
            {visibleSuggestions.map((suggestion) => {
              const details = suggestion.soil_test_details || {};
              const loc = details.location;
              return (
                <div key={suggestion.soil_test_id} className="rounded border border-slate-100 bg-slate-50/80 p-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedTests.has(suggestion.soil_test_id)}
                      onCheckedChange={(checked) => handleTestSelection(suggestion.soil_test_id, checked)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-medium text-slate-800">{suggestion.soil_test_name}</span>
                        {getConfidenceBadge(suggestion.confidence_score)}
                      </div>
                      <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
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

          <div className="flex gap-2 border-t border-slate-100 pt-2">
            <Button
              size="sm"
              onClick={handleLinkSelected}
              disabled={selectedTests.size === 0 || isLinking}
              className="h-8 flex-1 text-xs"
            >
              {isLinking && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Attach selected ({selectedTests.size})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedTests(new Set())}
              disabled={selectedTests.size === 0}
              className="h-8 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
