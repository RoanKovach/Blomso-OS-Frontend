import { useState, useCallback, useRef } from 'react';
import { UploadService, uploadFileToBackend } from '../services/uploadService';
import { isApiConfigured } from '@/api/client';
import { getExtraction } from '@/api/extraction';
import { toast } from 'sonner';

const CANONICAL_TO_UI_SOIL_KEYS = {
  // Direct mappings
  ph: 'ph',

  // Backend worker ppm keys -> UI nutrient names
  p_ppm: 'phosphorus',
  k_ppm: 'potassium',
  mg_ppm: 'magnesium',
  ca_ppm: 'calcium',
  s_ppm: 'sulfur',
  zn_ppm: 'zinc',
  cu_ppm: 'copper',
  cec_meq_100g: 'cec',

  // Optional / future-compatible mappings
  organic_matter_pct: 'organic_matter',
  nitrogen_ppm: 'nitrogen',
  iron_ppm: 'iron',
  manganese_ppm: 'manganese',
  boron_ppm: 'boron',
  base_saturation_pct: 'base_saturation',
};

export function normalizeSoilDataKeys(rawSoilData = {}) {
  const result = { ...rawSoilData };
  Object.entries(CANONICAL_TO_UI_SOIL_KEYS).forEach(([backendKey, uiKey]) => {
    const value = rawSoilData[backendKey];
    if (value === null || value === undefined) return;
    if (result[uiKey] === undefined || result[uiKey] === null) {
      result[uiKey] = value;
    }
  });
  return result;
}

/**
 * Maps extraction artifact (D1) candidates to review format expected by MultiTestReview.
 * Adds field_name, tempId, and ensures soil_data/lab_info exist, normalizing soil_data keys.
 */
function mapExtractionToReviewCandidates(soil_tests, contextData = {}, uploadId = '', filename = '') {
  const fieldName = contextData?.field_name || filename || 'Upload';
  return (soil_tests || []).map((test, index) => ({
    ...test,
    field_name: fieldName,
    zone_name: test.zone_name || test.field_id || `${fieldName} - Zone ${index + 1}`,
    soil_data: normalizeSoilDataKeys(test.soil_data || {}),
    lab_info: test.lab_info || {},
    tempId: `backend_${uploadId}_${index}`,
    source_file_name: filename || undefined,
  }));
}

/**
 * Custom hook for handling file upload and soil test extraction
 * When authenticated and API configured, uses backend upload spine only (init -> S3 PUT -> complete).
 * Otherwise uses full parse flow (when available).
 * Backend path: after upload complete, use loadExtractionForReview(uploadId, contextData) to load extraction and show review.
 */
export const useUploadAndParse = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [extractedTests, setExtractedTests] = useState([]);
  /** True when last upload used backend spine only (no in-app AI); used for truthful step-3 copy */
  const [backendUploadOnly, setBackendUploadOnly] = useState(false);
  const isMountedRef = useRef(true);

  const resetState = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsProcessing(false);
    setProgress(0);
    setCurrentStep('');
    setResult(null);
    setError(null);
    setExtractedTests([]);
    setBackendUploadOnly(false);
  }, []);

  const startProcessing = useCallback(async (file, contextData, isDemoUser = false) => {
    if (!file) {
      const errorMsg = 'File is required';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const useBackendUploadOnly = !isDemoUser && isApiConfigured();
    if (useBackendUploadOnly && !contextData) {
      contextData = { field_name: file.name || 'Upload' };
    }
    if (!useBackendUploadOnly && !contextData) {
      const errorMsg = 'File and context data are required';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    resetState();
    if (isMountedRef.current) setBackendUploadOnly(useBackendUploadOnly);
    setIsProcessing(true);
    
    try {
      const generator = useBackendUploadOnly
        ? uploadFileToBackend(file)
        : UploadService.processFile(file, contextData, isDemoUser);

      for await (const update of generator) {
        if (!isMountedRef.current) break;

        setProgress(update.progress);
        setCurrentStep(update.currentStep || '');

        if (update.status === 'complete') {
          setResult(update.result);
          setExtractedTests(update.result?.tests ?? []);
          
          const count = update.result?.count ?? 1;
          const successMsg = useBackendUploadOnly
            ? `File uploaded successfully. Record saved (parsing not yet available).`
            : isDemoUser
              ? `Successfully processed ${count} demo record(s)!`
              : `Successfully processed ${count} soil test record(s)!`;
          toast.success(successMsg);
        } else if (update.status === 'failed') {
          throw new Error(update.error);
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Upload processing error:', err);
      const errorMessage = err.message || 'An unexpected error occurred during processing';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
        setCurrentStep('');
      }
    }
  }, [resetState]);

  const retryProcessing = useCallback((file, contextData, isDemoUser = false) => {
    startProcessing(file, contextData, isDemoUser);
  }, [startProcessing]);

  /**
   * Load extraction for an upload (backend path) and set extractedTests for review UI.
   * Call after backend upload complete or when opening review from My Records.
   * @param {string} uploadId - Record id from upload complete or GET /records
   * @param {Object} contextData - At least field_name; optional field_size_acres, crop_type, etc.
   * @param {string} filename - Optional display filename for source_file_name
   * @returns {Promise<{ success: boolean, count: number }>}
   */
  const loadExtractionForReview = useCallback(async (uploadId, contextData = {}, filename = '') => {
    if (!uploadId) return { success: false, count: 0 };
    try {
      const artifact = await getExtraction(uploadId);
      const candidates = mapExtractionToReviewCandidates(
        artifact.soil_tests || [],
        contextData,
        uploadId,
        filename
      );
      if (!isMountedRef.current) return { success: false, count: 0 };
      setExtractedTests(candidates);
      setError(null);
      return { success: true, count: candidates.length };
    } catch (err) {
      if (!isMountedRef.current) return { success: false, count: 0 };
      console.error('loadExtractionForReview error', err);
      setError(err.message || 'Failed to load extraction');
      setExtractedTests([]);
      return { success: false, count: 0 };
    }
  }, []);

  const cleanup = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  return {
    isProcessing,
    progress,
    currentStep,
    result,
    error,
    extractedTests,
    setExtractedTests,
    startProcessing,
    retryProcessing,
    loadExtractionForReview,
    resetState,
    cleanup,
    isComplete: !isProcessing && result !== null,
    hasError: error !== null,
    canRetry: !isProcessing && error !== null,
    backendUploadOnly,
  };
};

export default useUploadAndParse;