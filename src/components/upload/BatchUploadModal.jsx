
import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileArchive, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  X,
  FileText,
  AlertTriangle,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ContextualForm from "./ContextualForm";
import { buildSafeExtractionSchema, buildExtractionPrompt } from "../utils/vertexAISchemaBuilder";
import { format, parse, isValid } from 'date-fns';
import { base44 } from '@/api/base44Client'; // Updated import for pre-initialized base44 client

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_FILES = 20; // Reasonable limit for batch processing

/**
 * Parses a date string from various formats and returns it in YYYY-MM-DD format.
 */
const normalizeDate = (dateString) => {
  if (!dateString) return format(new Date(), 'yyyy-MM-dd');
  
  const formats = ['MM/dd/yyyy', 'yyyy-MM-dd', 'M/d/yyyy', 'MM-dd-yyyy', 'yyyy/MM/dd', 'dd MMMM yyyy', 'MMMM d, yyyy'];
  
  for (const fmt of formats) {
    const parsedDate = parse(dateString, fmt, new Date());
    if (isValid(parsedDate)) return format(parsedDate, 'yyyy-MM-dd');
  }

  const nativeParsedDate = new Date(dateString);
  if (isValid(nativeParsedDate) && !isNaN(nativeParsedDate.getTime())) return format(nativeParsedDate, 'yyyy-MM-dd');
  
  console.warn(`Could not parse date: "${dateString}". Falling back to today's date.`);
  return format(new Date(), 'yyyy-MM-dd');
};

export default function BatchUploadModal({ isOpen, onClose, onComplete }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, metadata_review, processing, completed, error
  const [batchMetadata, setBatchMetadata] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({ 
    processed: 0, 
    failed: 0, 
    total: 0,
    currentFile: '',
    currentStep: '',
    details: {
      successfulFiles: [],
      failedFiles: []
    }
  });
  const [error, setError] = useState(null);
  const [isAnonymousUser, setIsAnonymousUser] = useState(false);
  
  const fileInputRef = useRef(null);

  // Check user status when modal opens
  React.useEffect(() => {
    if (isOpen) {
      checkUserStatus();
    }
  }, [isOpen]);

  const checkUserStatus = async () => {
    try {
      await base44.entities.User.me(); // Updated to use base44 client
      setIsAnonymousUser(false);
    } catch (error) {
      console.log('User not authenticated - treating as anonymous');
      setIsAnonymousUser(true);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  }, []);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndSetFiles(selectedFiles);
  };

  const validateAndSetFiles = (selectedFiles) => {
    if (selectedFiles.length === 0) return;
    
    if (selectedFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed per batch.`);
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension !== 'pdf' || file.type !== 'application/pdf') {
        invalidFiles.push(file.name);
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (too large)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid files: ${invalidFiles.join(', ')}. Please upload PDF files only.`);
      return;
    }

    setFiles(validFiles);
    setError(null);
  };

  const handleMetadataSubmit = (metadata) => {
    setBatchMetadata({
      ...metadata,
      isDemoUser: isAnonymousUser
    });
    setUploadState('processing');
    startBatchProcessing({
      ...metadata,
      isDemoUser: isAnonymousUser
    });
  };

  const startBatchProcessing = async (metadata) => {
    console.log('Starting batch processing for anonymous user:', isAnonymousUser);
    setError(null);
    setProcessingStatus({ 
      processed: 0, 
      failed: 0, 
      total: files.length,
      currentFile: '',
      currentStep: 'Starting batch processing...',
      details: {
        successfulFiles: [],
        failedFiles: []
      }
    });

    const successfulFiles = [];
    const failedFiles = [];
    let allProcessedRecords = []; // Track all records for session storage

    try {
      // Process each file individually
      for (const file of files) {
        try {
          setProcessingStatus(prev => ({
            ...prev,
            currentFile: file.name,
            currentStep: `Processing ${file.name}...`
          }));

          // Step 1: Upload file
          const { file_url } = await base44.integrations.Core.UploadFile({ file }); // Updated to use base44 client

          // Step 2: Extract data using simplified schema
          const extractionPrompt = buildExtractionPrompt(metadata);
          const responseSchema = buildSafeExtractionSchema();

          console.log("Batch processing with schema (gpt-4o):", JSON.stringify(responseSchema, null, 2));

          const { data: extractionResponse } = await base44.functions.invoke('extractSoilTests', { // Updated to use base44 client
            file_url,
            prompt: extractionPrompt,
            response_json_schema: responseSchema,
            model: "gpt-4o",
            temperature: 0.1,
            max_tokens: 3000,
            // Require 75%+ self-assessed confidence, otherwise null
            confidence_threshold: 0.75
          });

          const extractResult = (typeof extractionResponse?.output === 'string')
            ? (() => { try { return JSON.parse(extractionResponse.output); } catch { return {}; } })()
            : (extractionResponse?.output || {});

          if (!extractResult || !extractResult.soil_tests || extractResult.soil_tests.length === 0) {
            throw new Error("No soil test data could be extracted from this document.");
          }

          // Step 3: Apply batch metadata to extracted data
          const recordsForThisFile = extractResult.soil_tests.map((test, index) => ({
            ...test,
            // Ensure soil_data exists
            soil_data: test.soil_data || {},
            // Apply batch metadata
            field_name: metadata.field_name || file.name.split('.').slice(0, -1).join('.'),
            field_size_acres: metadata.field_size_acres,
            crop_type: metadata.intended_crop,
            farming_method: metadata.farming_method,
            previous_crop_history: metadata.previous_crop_history,
            soil_type: metadata.soil_type,
            irrigation_type: metadata.irrigation_type,
            location: metadata.location,
            raw_file_url: file_url,
            test_date: normalizeDate(test.test_date),
            zone_name: test.zone_name || `${file.name} - Zone ${index + 1}`,
            source_file_name: file.name,
            tempId: `${file.name}_${index}`,
            // Add unique ID for session storage (only for demo user, removed for real save)
            id: `guest_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
          }));

          // Step 4: Save records (or simulate for anonymous users)
          let savedRecords = [];
          
          if (isAnonymousUser) {
            // For anonymous users, simulate saving but actually just prepare for session storage
            console.log('Simulating save for anonymous user - preparing records for session storage');
            savedRecords = recordsForThisFile.map(record => ({
              ...record,
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
              created_by: 'anonymous@demo.blomso.com',
              is_demo_data: true,
              analysis_status: 'complete'
            }));
            
            // Add to our tracking array
            allProcessedRecords.push(...savedRecords);
            
          } else {
            // For authenticated users, save directly to database
            try {
                const recordsToCreate = recordsForThisFile.map((test) => {
                    const now = new Date();
                    const timestamp = now.toISOString();
                    
                    const dataToSave = {
                        ...test,
                        analysis_status: 'complete',
                        created_date: timestamp,
                        updated_date: timestamp
                    };

                    delete dataToSave.tempId;
                    delete dataToSave.id; // Ensure temporary ID used for anonymous mode is not sent to DB

                    // Remove null/undefined/empty string values
                    Object.keys(dataToSave).forEach(key => {
                        if (dataToSave[key] === null || dataToSave[key] === undefined || dataToSave[key] === '') {
                            delete dataToSave[key];
                        }
                    });

                    return dataToSave;
                });
                
                savedRecords = await base44.entities.SoilTest.bulkCreate(recordsToCreate);

            } catch (saveError) {
                throw new Error(`Save failed: ${saveError.message}`);
            }
          }

          successfulFiles.push({
            fileName: file.name,
            recordsCreated: savedRecords.length,
            records: savedRecords
          });

        } catch (fileError) {
          console.error(`Error processing ${file.name}:`, fileError);
          
          let errorMessage = fileError.message || 'Unknown processing error';
          if (errorMessage.includes('VertexAI') || errorMessage.includes('INVALID_ARGUMENT') || errorMessage.includes('OpenAI')) {
            errorMessage = 'AI extraction failed - document may be unreadable.';
          } else if (errorMessage.includes('422')) {
            errorMessage = 'Data validation failed.';
          } else if (errorMessage.includes('401')) {
            errorMessage = 'Authentication error - please try again.';
          }
          
          failedFiles.push({
            fileName: file.name,
            error: errorMessage
          });
        }

        // Update progress
        setProcessingStatus(prev => ({
          ...prev,
          processed: successfulFiles.length,
          failed: failedFiles.length,
          currentStep: `Processed ${successfulFiles.length + failedFiles.length} of ${files.length} files`,
          details: {
            successfulFiles,
            failedFiles
          }
        }));
      }

      // For anonymous users, save all processed records to session storage
      if (isAnonymousUser && allProcessedRecords.length > 0) {
        console.log('Saving batch upload results to session storage:', allProcessedRecords.length, 'records');
        sessionStorage.setItem('guestSoilTests', JSON.stringify(allProcessedRecords));
      }

      // Complete processing
      setProcessingStatus({
        processed: successfulFiles.length,
        failed: failedFiles.length,
        total: files.length,
        currentFile: '',
        currentStep: 'Batch processing complete!',
        details: {
          successfulFiles,
          failedFiles
        }
      });

      setUploadState('completed');

      const successMessage = failedFiles.length > 0 
        ? `Processed ${successfulFiles.length} files successfully. ${failedFiles.length} files had issues.`
        : `Successfully processed all ${successfulFiles.length} files!`;
      
      toast.success(successMessage);

      // Auto-close and trigger completion after a delay
      setTimeout(() => {
        if (onComplete) {
          const totalRecordsCreated = isAnonymousUser 
            ? allProcessedRecords.length 
            : successfulFiles.reduce((sum, file) => sum + file.recordsCreated, 0);
            
          onComplete({
            processed: totalRecordsCreated,
            failed: failedFiles.length,
            totalFiles: files.length,
            details: { 
              successfulFiles: successfulFiles.map(file => ({
                ...file,
                records: isAnonymousUser ? allProcessedRecords.filter(r => r.source_file_name === file.fileName) : file.records
              })), 
              failedFiles 
            },
            isAnonymousUser,
            allRecords: isAnonymousUser ? allProcessedRecords : []
          });
        }
      }, isAnonymousUser ? 500 : 1500); // Changed timeout duration

    } catch (error) {
      console.error('Batch processing failed:', error);
      
      let errorMessage = 'Batch processing failed';
      if (error.message.includes('Schema')) {
        errorMessage = 'Internal configuration error - please try again or contact support.';
      } else if (error.message.includes('VertexAI') || error.message.includes('LLM') || error.message.includes('OpenAI')) {
        errorMessage = 'AI service temporarily unavailable - please try again later.';
      } else {
        errorMessage = `Batch processing failed: ${error.message}`;
      }
      
      setError(errorMessage);
      setUploadState('error');
    }
  };

  const resetModal = () => {
    setFiles([]);
    setUploadState('idle');
    setBatchMetadata(null);
    setProcessingStatus({ 
      processed: 0, 
      failed: 0, 
      total: 0,
      currentFile: '',
      currentStep: '',
      details: {
        successfulFiles: [],
        failedFiles: []
      }
    });
    setError(null);
    setDragActive(false);
  };

  const handleClose = () => {
    if (uploadState === 'completed') {
      if (onComplete) {
        const totalRecordsCreated = processingStatus.details.successfulFiles.reduce((sum, file) => sum + file.recordsCreated, 0);
        onComplete({
            processed: totalRecordsCreated,
            failed: processingStatus.details.failedFiles.length,
            totalFiles: processingStatus.total,
            details: processingStatus.details,
            isAnonymousUser
        });
      }
    }
    resetModal();
    onClose();
  };

  const getProgressPercentage = () => {
    if (uploadState === 'processing') {
      if (processingStatus.total === 0) return 0;
      const completedFiles = processingStatus.processed + processingStatus.failed;
      return Math.floor((completedFiles / processingStatus.total) * 100);
    }
    if (uploadState === 'completed') return 100;
    return 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileArchive className="w-6 h-6 text-indigo-600" />
            Batch Upload Soil Tests
            {isAnonymousUser && (
              <Badge variant="outline" className="text-xs">
                Demo Mode
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: File Selection */}
          {uploadState === 'idle' && (
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive 
                    ? "border-indigo-400 bg-indigo-50" 
                    : "border-gray-300 hover:border-indigo-300"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FileArchive className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Multiple Soil Tests</h3>
                <p className="text-gray-600 mb-4">Select up to {MAX_FILES} PDF soil test files to process as a batch</p>
                {isAnonymousUser && (
                  <p className="text-amber-600 text-sm mb-4">
                    Demo mode: Data will be saved temporarily for this session only
                  </p>
                )}
                <Button onClick={() => fileInputRef.current?.click()} className="mb-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge variant="outline" className="border-indigo-200 text-indigo-700">PDF</Badge>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Selected Files ({files.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          className="h-6 w-6"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Metadata Review */}
          {uploadState === 'metadata_review' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Batch Metadata</h3>
                <p className="text-gray-600">
                  Provide field context that will be applied to all {files.length} files in this batch.
                </p>
                {isAnonymousUser && (
                  <p className="text-amber-600 text-sm mt-2">
                    Demo mode: This data will be saved temporarily for your current session
                  </p>
                )}
              </div>
              <ContextualForm
                onSubmit={handleMetadataSubmit}
                onBack={() => setUploadState('idle')}
                isBatchMode={true}
                fileCount={files.length}
              />
            </div>
          )}

          {/* Step 3: Processing */}
          {uploadState === 'processing' && (
            <div className="space-y-6">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing Batch Upload
                </h3>
                <p className="text-gray-600 mb-4">{processingStatus.currentStep}</p>
                
                {processingStatus.currentFile && (
                  <p className="text-sm text-gray-500">Current file: {processingStatus.currentFile}</p>
                )}

                {isAnonymousUser && (
                  <p className="text-amber-600 text-sm">
                    Demo mode: Records will be saved to your session temporarily
                  </p>
                )}
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Progress</span>
                    <span className="text-gray-900 font-semibold">{getProgressPercentage()}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-3" />
                  
                  <div className="flex justify-center gap-6 text-sm mt-4">
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {processingStatus.processed} successful
                    </span>
                    {processingStatus.failed > 0 && (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {processingStatus.failed} failed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {uploadState === 'completed' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">Batch Processing Complete!</h3>
                
                {isAnonymousUser && (
                  <p className="text-amber-700 text-sm mb-4">
                    Demo mode: Your data has been saved to this session and will be available in "My Records"
                  </p>
                )}
                
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{processingStatus.processed}</div>
                    <div className="text-green-700">Files Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {processingStatus.details.successfulFiles.reduce((sum, file) => sum + file.recordsCreated, 0)}
                    </div>
                    <div className="text-blue-700">Records Created</div>
                  </div>
                  {processingStatus.failed > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{processingStatus.failed}</div>
                      <div className="text-amber-700">Files Failed</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Results */}
              {(processingStatus.details.successfulFiles.length > 0 || processingStatus.details.failedFiles.length > 0) && (
                <div className="space-y-3">
                  <AnimatePresence>
                    {processingStatus.details.successfulFiles.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-green-50 rounded-lg p-4"
                      >
                        <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Successfully Processed ({processingStatus.details.successfulFiles.length})
                        </h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {processingStatus.details.successfulFiles.map((file, index) => (
                            <div key={index} className="text-sm text-green-700 flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              {file.fileName} ({file.recordsCreated} records)
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {processingStatus.details.failedFiles.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-amber-50 rounded-lg p-4"
                      >
                        <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Processing Issues ({processingStatus.details.failedFiles.length})
                        </h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {processingStatus.details.failedFiles.map((file, index) => (
                            <div key={index} className="text-sm">
                              <div className="text-amber-700 font-medium">{file.fileName}</div>
                              <div className="text-amber-600 text-xs ml-2">{file.error}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="text-center">
                <p className="text-green-600 font-medium">Redirecting you to view your new records...</p>
              </div>
            </motion.div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleClose}>
            {uploadState === 'completed' ? 'Close' : 'Cancel'}
          </Button>
          
          {uploadState === 'idle' && files.length > 0 && (
            <Button 
              onClick={() => setUploadState('metadata_review')} 
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Continue to Metadata
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
