import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Upload as UploadIcon, FileArchive } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { isUnauthenticatedError } from "@/api/auth";
import { isApiConfigured, setAuthToken } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from 'sonner';

// Updated imports using new service layer
import FileUploadZone from "../components/upload/FileUploadZone";
import ContextualForm from "../components/upload/ContextualForm";
import MultiTestReview from "../components/upload/MultiTestReview";
import BatchUploadModal from "../components/upload/BatchUploadModal";
import AsyncUploadFlow from "../components/upload/AsyncUploadFlow";
import { useUploadAndParse } from "../components/hooks/useUploadAndParse";
import { useTracking } from '@/components/analytics/useTracking';
import { saveNormalizedRecords } from "@/api/records";

export default function UploadPage() {
    const navigate = useNavigate();
    const { refreshAuth, clearAuth } = useAuth();
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [contextualData, setContextualData] = useState(null);
    const [isDemoUser, setIsDemoUser] = useState(false);
    const [showBatchUpload, setShowBatchUpload] = useState(false);
    const [isAnonymousUser, setIsAnonymousUser] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [tokenInput, setTokenInput] = useState('');

    const { trackFileUpload } = useTracking();

    // Use the new upload hook
    const {
        isProcessing,
        progress,
        currentStep: processingStep,
        result,
        error: uploadError,
        extractedTests,
        setExtractedTests,
        startProcessing,
        retryProcessing,
        loadExtractionForReview,
        resetState,
        cleanup,
        isComplete,
        hasError,
        canRetry
    } = useUploadAndParse();

    /** When in backend-path review, the upload record id for extraction/save. Set when entering step 4 from upload complete or from My Records. */
    const [backendReviewUploadId, setBackendReviewUploadId] = useState(null);
    const [isLoadingExtraction, setIsLoadingExtraction] = useState(false);

    // Check user status on mount
    useEffect(() => {
        const checkUser = async () => {
            try {
                const user = await User.me();
                if (user?.email?.includes('demo')) {
                    setIsDemoUser(true);
                }
                setIsAnonymousUser(false);
            } catch (e) {
                if (isUnauthenticatedError(e)) {
                    setIsAnonymousUser(true);
                    setIsDemoUser(true);
                } else {
                    console.error('Unexpected auth error on Upload', e);
                }
            }
        };
        checkUser();

        // Cleanup on unmount
        return cleanup;
    }, [cleanup]);

    // Open backend-path review from My Records (e.g. "Review" on an upload record)
    const location = useLocation();
    useEffect(() => {
        const uploadId = location.state?.backendReviewUploadId;
        const filename = location.state?.backendReviewFilename || '';
        if (!uploadId || isAnonymousUser) return;
        let cancelled = false;
        setBackendReviewUploadId(uploadId);
        setCurrentStep(4);
        setIsLoadingExtraction(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        loadExtractionForReview(uploadId, { field_name: filename || 'Upload' }, filename)
            .then(({ success, count }) => {
                if (cancelled) return;
                setIsLoadingExtraction(false);
                if (!success || count === 0) {
                    setExtractedTests([]);
                }
            })
            .catch(() => setIsLoadingExtraction(false));
        return () => { cancelled = true; };
    }, [location.state?.backendReviewUploadId, location.state?.backendReviewFilename, isAnonymousUser, loadExtractionForReview]);

    // Handle drag and drop
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

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === "application/pdf") {
            setFile(droppedFile);
            setError(null);
            trackFileUpload(droppedFile.type, droppedFile.size, true);
        } else {
            setError("Please upload PDF files only");
        }
    }, [trackFileUpload]);

    const handleFileInput = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setError(null);
            trackFileUpload(selectedFile.type, selectedFile.size, true);
        } else {
            setError("Please upload PDF files only");
        }
    };

    const handleContextualSubmit = (data) => {
        setContextualData(data);
        setCurrentStep(3);
        // Start the async processing using the new hook
        startProcessing(file, data, isDemoUser || isAnonymousUser);
    };

    const handleRetryUpload = () => {
        if (file && contextualData) {
            retryProcessing(file, contextualData, isDemoUser || isAnonymousUser);
        }
    };

    const handleContinueToReview = async () => {
        const uploadId = result?.uploadId;
        if (uploadId) {
            if (isLoadingExtraction) return;
            setIsLoadingExtraction(true);
            try {
                const { success, count } = await loadExtractionForReview(uploadId, contextualData || {}, file?.name || '');
                if (success && count > 0) {
                    setBackendReviewUploadId(uploadId);
                    setCurrentStep(4);
                } else {
                    toast.info('No extraction data yet. You can review from My Records when ready.');
                }
            } finally {
                setIsLoadingExtraction(false);
            }
        } else {
            setCurrentStep(4);
        }
    };

    const handleFinalizeAndAnalyze = async (finalizedTests) => {
        const fullMode = !isAnonymousUser && isApiConfigured();
        const uploadId = backendReviewUploadId || result?.uploadId;

        if (fullMode && uploadId && Array.isArray(finalizedTests) && finalizedTests.length > 0) {
            setIsSaving(true);
            setSaveError(null);
            try {
                const res = await saveNormalizedRecords(uploadId, finalizedTests);
                const count = res?.count ?? res?.saved?.length ?? finalizedTests.length;
                toast.success(`Successfully saved ${count} soil test record(s)!`);
                navigate(createPageUrl("MyRecords"), {
                    state: {
                        refreshData: true,
                        successMessage: `Successfully saved ${count} soil test record(s)!`
                    }
                });
                setBackendReviewUploadId(null);
            } catch (err) {
                console.error("Save normalized records failed:", err);
                const message = err?.message || (err?.response ? `Save failed: ${err.response.status}` : "Failed to save records.");
                setSaveError(message);
                toast.error(message);
            } finally {
                setIsSaving(false);
            }
            return;
        }

        // Demo or missing uploadId: navigate with in-memory state (no backend save)
        setTimeout(() => {
            if (isAnonymousUser) {
                navigate(createPageUrl("MyRecords"), {
                    state: {
                        isAnonymousUpload: true,
                        tests: result?.saved || extractedTests,
                        successMessage: "Demo data processed! Sign up to save your records permanently."
                    }
                });
            } else {
                navigate(createPageUrl("MyRecords"), {
                    state: {
                        refreshData: true,
                        successMessage: `Successfully saved ${result?.count || finalizedTests?.length || 0} soil test record(s)!`
                    }
                });
            }
        }, 1500);
    };

    const resetUpload = () => {
        setFile(null);
        setContextualData(null);
        setError(null);
        setCurrentStep(1);
        resetState();
    };

    const handleBatchUploadComplete = (results) => {
        setShowBatchUpload(false);
        
        if (results.processed > 0) {
            const successMessage = results.failed > 0
                ? `Successfully processed ${results.processed} records! ${results.failed} files had issues.`
                : `Successfully processed all ${results.processed} records!`;

            toast.success(successMessage, { duration: 4000 });

            setTimeout(() => {
                navigate(createPageUrl("MyRecords"), {
                    state: {
                        refreshData: !results.isAnonymousUser,
                        successMessage,
                        batchUploadResults: results,
                        isAnonymousUpload: results.isAnonymousUser
                    }
                });
            }, results.isAnonymousUser ? 500 : 1500);
        }
    };

    // Step indicator component
    const renderStepIndicator = () => {
        const steps = [
            { id: 1, title: "Upload File", active: currentStep === 1, completed: currentStep > 1 },
            { id: 2, title: "Field Context", active: currentStep === 2, completed: currentStep > 2 },
            { id: 3, title: "AI Processing", active: currentStep === 3, completed: currentStep > 3 },
            { id: 4, title: "Review Zones", active: currentStep === 4, completed: currentStep > 4 }
        ];

        return (
            <div className="flex justify-center mb-8">
                <div className="flex items-center space-x-4">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                                step.completed ? 'bg-green-600 border-green-600 text-white' :
                                step.active ? 'bg-blue-600 border-blue-600 text-white' :
                                'border-gray-300 text-gray-400'
                            }`}>
                                {step.completed ? '✓' : step.id}
                            </div>
                            <span className={`text-sm font-medium transition-all duration-300 ${
                                step.completed ? 'text-green-600' :
                                step.active ? 'text-blue-600' :
                                'text-gray-400'
                            }`}>
                                {step.title}
                            </span>
                            {index < steps.length - 1 && (
                                <div className={`w-12 h-0.5 transition-all duration-300 ${
                                    step.completed ? 'bg-green-600' : 'bg-gray-300'
                                }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            if (currentStep > 1 && !isProcessing) {
                                setCurrentStep(currentStep - 1);
                                setError(null);
                            } else if (isProcessing) {
                                setError("Please wait for processing to complete or cancel the upload.");
                            } else {
                                navigate(createPageUrl("Dashboard"));
                            }
                        }}
                        className="border-green-200 hover:bg-green-100"
                        disabled={isProcessing}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-green-900">Upload Soil Test</h1>
                        <p className="text-green-700 mt-1">Advanced soil analysis with zone detection and AI recommendations</p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setShowBatchUpload(true)}
                        className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
                        disabled={isProcessing}
                    >
                        <FileArchive className="w-4 h-4 mr-2" />
                        Batch Upload
                    </Button>
                </div>

                {renderStepIndicator()}

                {(error || uploadError) && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error || uploadError}</AlertDescription>
                    </Alert>
                )}

                {/* Temporary: set Cognito IdToken for testing when backend is configured. Production uses Hosted UI login. */}
                {isApiConfigured() && (
                    <Card className="mb-6 border-dashed border-green-300 bg-green-50/50">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-sm text-green-900 mb-2">Backend configured. For testing: paste Cognito IdToken and click Set token.</p>
                            <div className="flex gap-2 flex-wrap">
                                <input
                                    type="password"
                                    placeholder="IdToken (JWT)"
                                    value={tokenInput}
                                    onChange={(e) => setTokenInput(e.target.value)}
                                    className="flex-1 min-w-[200px] rounded border border-green-200 px-3 py-2 text-sm"
                                />
                                <Button type="button" variant="secondary" size="sm" onClick={() => { setAuthToken(tokenInput); setTokenInput(''); refreshAuth(); toast.success('Token set'); }}>
                                    Set token
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setAuthToken(''); clearAuth(); toast.info('Token cleared'); }}>
                                    Clear token
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 1: File Upload */}
                {currentStep === 1 && (
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
                                <UploadIcon className="w-6 h-6" />
                                Step 1: Upload Your Soil Test Report
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <FileUploadZone
                                    onFileSelect={handleFileInput}
                                    dragActive={dragActive}
                                    selectedFile={file}
                                />
                            </div>
                            {file && (
                                <div className="p-6 border-t border-green-100">
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 shadow-lg"
                                        onClick={() => setCurrentStep(2)}
                                    >
                                        Continue to Field Context
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Contextual Information */}
                {currentStep === 2 && (
                    <ContextualForm
                        onSubmit={handleContextualSubmit}
                        onBack={() => setCurrentStep(1)}
                    />
                )}

                {/* Step 3: Async Processing */}
                {currentStep === 3 && (
                    <AsyncUploadFlow
                        isProcessing={isProcessing}
                        progress={progress}
                        currentStep={processingStep}
                        result={result}
                        error={uploadError}
                        onRetry={handleRetryUpload}
                        onContinue={isComplete ? handleContinueToReview : null}
                        canRetry={canRetry}
                    />
                )}

                {/* Step 4: Review Extracted Data (backend path or demo path) */}
                {currentStep === 4 && (
                    <>
                        {isLoadingExtraction ? (
                            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                <CardContent className="py-12 text-center">
                                    <p className="text-green-700">Loading extraction data…</p>
                                </CardContent>
                            </Card>
                        ) : extractedTests.length > 0 ? (
                            <>
                                {saveError && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertDescription>{saveError}</AlertDescription>
                                    </Alert>
                                )}
                                <MultiTestReview
                                    tests={extractedTests}
                                    onUpdateTest={(updatedTest) => {
                                        setExtractedTests(prev => prev.map(t => t.tempId === updatedTest.tempId ? updatedTest : t));
                                    }}
                                    onResetTest={() => {}}
                                    onFinalize={handleFinalizeAndAnalyze}
                                    onCancel={() => { setBackendReviewUploadId(null); resetUpload(); }}
                                    isSaving={isSaving}
                                />
                            </>
                        ) : (
                            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                <CardContent className="py-12 text-center space-y-4">
                                    <p className="text-gray-600">No extraction data available for this upload yet.</p>
                                    <Button variant="outline" onClick={() => navigate(createPageUrl("MyRecords"))}>
                                        Back to My Records
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>

            {/* Batch Upload Modal */}
            <BatchUploadModal
                isOpen={showBatchUpload}
                onClose={() => setShowBatchUpload(false)}
                onComplete={handleBatchUploadComplete}
            />
        </div>
    );
}