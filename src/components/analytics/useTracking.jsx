
import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

const OFFLINE_EVENTS_KEY = 'blomso_offline_analytics';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

export const useTracking = (options = {}) => {
    const { eventPrefix = 'blomso_', batchingEnabled = true } = options;
    const [pendingEvents, setPendingEvents] = useState([]);
    const { isOnline } = useConnectionStatus();
    const [isTrackingAvailable, setIsTrackingAvailable] = useState(true); // New state for tracking availability

    // Load pending events from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(OFFLINE_EVENTS_KEY);
            if (stored) {
                const events = JSON.parse(stored);
                setPendingEvents(events);
            }
        } catch (error) {
            console.warn('Failed to load offline analytics events:', error);
        }
    }, []);

    // Save pending events to localStorage whenever they change
    useEffect(() => {
        if (!isTrackingAvailable) return; // Don't save if tracking is disabled
        
        try {
            localStorage.setItem(OFFLINE_EVENTS_KEY, JSON.stringify(pendingEvents));
        } catch (error) {
            console.warn('Failed to save offline analytics events:', error);
        }
    }, [pendingEvents, isTrackingAvailable]);

    // Flush events when online and when batch size is reached
    useEffect(() => {
        // Only attempt to flush if tracking is available
        if (isTrackingAvailable && isOnline && pendingEvents.length > 0) {
            if (!batchingEnabled || pendingEvents.length >= BATCH_SIZE) {
                flushEvents();
            }
        }
    }, [isOnline, pendingEvents.length, batchingEnabled, isTrackingAvailable]); // Added isTrackingAvailable to deps

    // Auto-flush events periodically
    useEffect(() => {
        if (!batchingEnabled || !isTrackingAvailable) return; // Added isTrackingAvailable check

        const interval = setInterval(() => {
            if (isOnline && pendingEvents.length > 0) {
                flushEvents();
            }
        }, FLUSH_INTERVAL);

        return () => clearInterval(interval);
    }, [isOnline, pendingEvents.length, batchingEnabled, isTrackingAvailable]); // Added isTrackingAvailable to deps

    const flushEvents = useCallback(async () => {
        if (!isTrackingAvailable || pendingEvents.length === 0) return; // Skip flush if tracking is not available or no events

        const eventsToAttempt = [...pendingEvents];
        setPendingEvents([]); // Clear immediately, will re-add only failed non-blocking events later.

        const failedNonBlockingEvents = [];
        let blockingErrorDetected = false;

        await Promise.all(
            eventsToAttempt.map(async (eventData) => {
                // If a blocking error has already been detected, don't attempt to send further events in this batch
                if (blockingErrorDetected) {
                    // However, ensure events that weren't sent due to this early exit are handled.
                    // For simplicity, if blockingErrorDetected is true, all subsequent events in this batch are effectively dropped.
                    // The assumption is that if one event causes a block, all will.
                    return; 
                }

                try {
                    await base44.functions.invoke('trackEvent', eventData); // Changed to base44 client
                } catch (error) {
                    const errorMessage = error?.message || error?.detail || '';
                    if (errorMessage.includes('subscription tier') || errorMessage.includes('blocked') || errorMessage.includes('Functions are blocked')) {
                        console.warn('Analytics tracking disabled due to subscription tier during flush.');
                        blockingErrorDetected = true; // Mark as detected
                        setIsTrackingAvailable(false); // Update state to disable tracking
                    } else {
                        console.warn('Failed to send individual analytics event during flush (will retry):', error);
                        failedNonBlockingEvents.push(eventData);
                    }
                }
            })
        );

        if (blockingErrorDetected) {
            // If a blocking error was detected, all events that were part of this flush are effectively abandoned.
            // No need to re-add.
            console.warn('Analytics disabled. Dropping unsent pending events.');
            setPendingEvents([]); // Ensure pending events are fully cleared if tracking is disabled
        } else if (failedNonBlockingEvents.length > 0) {
            // If no blocking error, but some events failed for other reasons, re-add them.
            setPendingEvents(prev => [...prev, ...failedNonBlockingEvents]);
        }
    }, [pendingEvents, isTrackingAvailable]); // Removed setIsTrackingAvailable from deps as it's a stable setter

    const track = useCallback(async (eventName, properties = {}) => {
        // Silently skip if tracking is not available
        if (!isTrackingAvailable) {
          return;
        }

        const eventData = {
            event: `${eventPrefix}${eventName}`,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer
            }
        };

        if (batchingEnabled) {
            setPendingEvents(prev => [...prev, eventData]);
        } else {
            try {
                await base44.functions.invoke('trackEvent', eventData); // Changed to base44 client
            } catch (error) {
                // Check if it's a subscription tier or blocking error
                const errorMessage = error?.message || error?.detail || '';
                if (errorMessage.includes('subscription tier') || errorMessage.includes('blocked') || errorMessage.includes('Functions are blocked')) {
                    console.warn('Analytics tracking disabled due to subscription tier or blocked request.');
                    setIsTrackingAvailable(false); // Disable tracking permanently for this session
                    return; // Stop tracking this event and future ones
                }
                console.warn('Analytics tracking failed:', error);
                // Add to pending events as fallback for non-blocking errors
                setPendingEvents(prev => [...prev, eventData]);
            }
        }
    }, [eventPrefix, batchingEnabled, isTrackingAvailable]); // Removed setIsTrackingAvailable from deps as it's a stable setter

    // Enhanced tracking methods with more context
    const trackPageView = useCallback((pageName, additionalProperties = {}) => {
        track('page_view', {
            page: pageName,
            page_title: document.title,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            ...additionalProperties
        });
    }, [track]);

    const trackUserAction = useCallback((action, context = {}) => {
        track('user_action', {
            action: action,
            timestamp: Date.now(),
            session_duration: performance.now(),
            ...context
        });
    }, [track]);

    const trackFileUpload = useCallback((fileType, fileSize, success = true, additionalContext = {}) => {
        track('file_upload', {
            file_type: fileType,
            file_size_mb: (fileSize / 1024 / 1024).toFixed(2),
            success: success,
            upload_method: additionalContext.method || 'single',
            processing_time: additionalContext.processingTime,
            ...additionalContext
        });
    }, [track]);

    const trackFieldCreation = useCallback((method, acres = null, additionalContext = {}) => {
        track('field_created', {
            creation_method: method,
            field_size_acres: acres,
            geometry_complexity: additionalContext.pointCount,
            data_source: additionalContext.dataSource || 'user_drawn',
            ...additionalContext
        });
    }, [track]);

    const trackSoilTestAnalysis = useCallback((testCount, processingTime = null, additionalContext = {}) => {
        track('soil_test_analyzed', {
            test_count: testCount,
            processing_time_seconds: processingTime,
            ai_model_used: additionalContext.model || 'default',
            zones_detected: additionalContext.zonesDetected,
            extraction_method: additionalContext.method || 'single',
            ...additionalContext
        });
    }, [track]);

    // New tracking methods for comprehensive coverage
    const trackRecommendationView = useCallback((testId, recommendationType, additionalContext = {}) => {
        track('recommendation_viewed', {
            test_id: testId,
            recommendation_type: recommendationType,
            soil_health_index: additionalContext.soilHealthIndex,
            crop_type: additionalContext.cropType,
            ...additionalContext
        });
    }, [track]);

    const trackSearchAction = useCallback((searchTerm, resultCount, searchType = 'field', additionalContext = {}) => {
        track('search_performed', {
            search_term: searchTerm ? searchTerm.length : 0, // Store length, not actual term for privacy
            result_count: resultCount,
            search_type: searchType,
            has_filters: additionalContext.hasFilters || false,
            ...additionalContext
        });
    }, [track]);

    const trackDataExport = useCallback((exportType, recordCount, additionalContext = {}) => {
        track('data_exported', {
            export_type: exportType,
            record_count: recordCount,
            file_format: additionalContext.format || 'csv',
            ...additionalContext
        });
    }, [track]);

    const trackError = useCallback((errorType, errorMessage, additionalContext = {}) => {
        track('error_occurred', {
            error_type: errorType,
            error_message: errorMessage ? errorMessage.substring(0, 100) : null, // Truncate for privacy
            page: window.location.pathname,
            ...additionalContext
        });
    }, [track]);

    return {
        track,
        trackPageView,
        trackUserAction,
        trackFileUpload,
        trackFieldCreation,
        trackSoilTestAnalysis,
        trackRecommendationView,
        trackSearchAction,
        trackDataExport,
        trackError,
        flushEvents,
        pendingEventsCount: pendingEvents.length,
        isOnline,
        isTrackingAvailable // Return the new state
    };
};

export default useTracking;
