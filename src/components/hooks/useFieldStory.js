import { useState, useEffect, useCallback, useMemo } from "react";
import { getFieldTimeline, normalizeFieldTimelineResponse } from "@/api/fieldsTimeline";
import { isApiConfigured } from "@/api/client";

/**
 * Field Story: fetches GET /fields/{id}/timeline and exposes normalized slices.
 *
 * @param {string|null|undefined} fieldId
 * @param {string|number} [refetchSignal] - bump (e.g. evidenceRefreshKey) to reload
 */
export function useFieldStory(fieldId, refetchSignal = 0) {
    const [raw, setRaw] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const normalized = useMemo(() => normalizeFieldTimelineResponse(raw), [raw]);

    const refetch = useCallback(async () => {
        if (!fieldId || !isApiConfigured()) {
            setRaw(null);
            setError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await getFieldTimeline(fieldId);
            setRaw(res);
        } catch (e) {
            setError(e?.message || String(e));
            setRaw(null);
        } finally {
            setLoading(false);
        }
    }, [fieldId]);

    useEffect(() => {
        refetch();
    }, [fieldId, refetchSignal, refetch]);

    return {
        data: raw,
        field: normalized.field,
        summary: normalized.summary,
        latest: normalized.latest,
        timeline: normalized.timeline,
        events: normalized.events,
        counts: normalized.counts,
        loading,
        error,
        refetch,
    };
}
