import { useState, useCallback, useRef } from 'react';
import { UploadService, uploadFileToBackend } from '../services/uploadService';
import { isApiConfigured } from '@/api/client';
import { toast } from 'sonner';

/**
 * Custom hook for handling file upload and soil test extraction
 * When authenticated and API configured, uses backend upload spine only (init -> S3 PUT -> complete).
 * Otherwise uses full parse flow (when available).
 */
export const useUploadAndParse = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [extractedTests, setExtractedTests] = useState([]);
  
  const isMountedRef = useRef(true);

  const resetState = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setIsProcessing(false);
    setProgress(0);
    setCurrentStep('');
    setResult(null);
    setError(null);
    setExtractedTests([]);
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
    startProcessing,
    retryProcessing,
    resetState,
    cleanup,
    isComplete: !isProcessing && result !== null,
    hasError: error !== null,
    canRetry: !isProcessing && error !== null
  };
};

export default useUploadAndParse;