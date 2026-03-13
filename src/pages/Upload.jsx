import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import YieldTicketReview from "../components/upload/YieldTicketReview";
import BatchUploadModal from "../components/upload/BatchUploadModal";
import AsyncUploadFlow from "../components/upload/AsyncUploadFlow";
import { useUploadAndParse, normalizeSoilDataKeys } from "../components/hooks/useUploadAndParse";
import { useTracking } from '@/components/analytics/useTracking';
import { saveNormalizedRecords, getRecord } from "@/api/records";
import { getExtraction } from "@/api/extraction";
import { DOCUMENT_FAMILY_SOIL_TEST, DOCUMENT_FAMILY_YIELD_TICKET, getUploadCopy, getStepLabels, isSoilDocument, isYieldTicketDocument } from "@/lib/documentFamilies";

export default function UploadPage() {
    const navigate = useNavigate();
    const { refreshAuth, clearAuth } = useAuth();
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [contextualData, setContextualData] = useState(null);
    /** Selected document family for this upload (frontend-only; backend remains soil-only for now). */
    const [documentFamily, setDocumentFamily] = useState(DOCUMENT_FAMILY_SOIL_TEST);
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
        canRetry,
        backendUploadOnly,
    } = useUploadAndParse();

    /** When in backend-path review: upload record id and the record itself (for extractionStatus, extractionArtifactKey, documentFamily). */
    const [backendReviewUploadId, setBackendReviewUploadId] = useState(null);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [isLoadingExtraction, setIsLoadingExtraction] = useState(false);
    const [extractionLoadError, setExtractionLoadError] = useState(null);
    /** Which document family is being reviewed in step 4 (soil_test, yield_scale_ticket, etc.). */
    const [reviewFamily, setReviewFamily] = useState(DOCUMENT_FAMILY_SOIL_TEST);
    /** Structured yield tickets for review when reviewFamily is yield. */
    const [yieldTickets, setYieldTickets] = useState([]);

    const effectiveDocumentFamily =
        reviewFamily || documentFamily || DOCUMENT_FAMILY_SOIL_TEST;

    const pickFirstDefined = (...values) => {
        for (const v of values) {
            if (v !== undefined && v !== null) return v;
        }
        return undefined;
    };

    const normalizeExtractionArtifact = (raw) => {
        if (!raw) return {};
        if (raw.soil_tests || raw.yield_tickets) return raw;

        let candidate = raw;

        if (raw.payload) {
            let payload = raw.payload;
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch {
                    payload = null;
                }
            }
            if (payload && (payload.soil_tests || payload.yield_tickets)) {
                candidate = payload;
            }
        } else if (raw.artifact) {
            candidate = raw.artifact;
        } else if (raw.data) {
            candidate = raw.data;
        }

        return candidate || raw || {};
    };

    const normalizeYieldTicket = (ticket, defaults = {}) => {
        const {
            cropFallback = null,
            fieldLabel: defaultFieldLabel = null,
        } = defaults;

        const ticketNumber = pickFirstDefined(
            ticket.ticketNumber,
            ticket.ticket_number,
            ticket.number,
        );
        const ticketDate = pickFirstDefined(
            ticket.ticketDate,
            ticket.ticket_date,
            ticket.date,
        );
        const crop = pickFirstDefined(
            ticket.crop,
            ticket.crop_type,
            cropFallback,
        );
        const fieldLabel = pickFirstDefined(
            ticket.fieldLabel,
            defaultFieldLabel,
        );
        const truckId = pickFirstDefined(
            ticket.truckId,
            ticket.vehicleId,
            ticket.truck_id,
            ticket.vehicle_id,
        );
        const grossWeight = pickFirstDefined(
            ticket.grossWeight,
            ticket.gross_weight,
            ticket.gross_weight_lb,
        );
        const tareWeight = pickFirstDefined(
            ticket.tareWeight,
            ticket.tare_weight,
            ticket.tare_weight_lb,
        );
        const netWeight = pickFirstDefined(
            ticket.netWeight,
            ticket.net_weight,
            ticket.net_weight_lb,
        );
        const grossBushels = pickFirstDefined(
            ticket.grossBushels,
            ticket.gross_bushels,
        );
        const shrink = pickFirstDefined(
            ticket.shrink,
            ticket.shrink_bushels,
        );
        const netBushels = pickFirstDefined(
            ticket.netBushels,
            ticket.net_bushels,
        );
        const quantityBushels = pickFirstDefined(
            ticket.quantityBushels,
            ticket.quantity_bushels,
        );
        const moisture = pickFirstDefined(
            ticket.moisture,
            ticket.moisture_pct,
        );
        const testWeight = pickFirstDefined(
            ticket.testWeight,
            ticket.test_weight,
            ticket.test_weight_lb_bu,
        );
        const pricePerBushel = pickFirstDefined(
            ticket.pricePerBushel,
            ticket.price_per_bushel,
            ticket.price_per_bu,
            ticket.price,
        );

        return {
            ...ticket,
            ticketNumber,
            ticketDate,
            crop,
            fieldLabel,
            truckId,
            grossWeight,
            tareWeight,
            netWeight,
            grossBushels,
            shrink,
            netBushels,
            quantityBushels,
            moisture,
            testWeight,
            pricePerBushel,
        };
    };

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

    // Open backend-path review from My Records: fetch record first, then show status-driven UI (no stub)
    const location = useLocation();
    useEffect(() => {
        const uploadId = location.state?.backendReviewUploadId;
        const filename = location.state?.backendReviewFilename || '';
        if (!uploadId || isAnonymousUser) return;
        let cancelled = false;
        setBackendReviewUploadId(uploadId);
        setCurrentStep(4);
        setIsLoadingExtraction(true);
        setExtractionLoadError(null);
        setCurrentRecord(null);
        setExtractedTests([]);
        window.history.replaceState({}, document.title, window.location.pathname);

        (async () => {
            try {
                const { ok, record } = await getRecord(uploadId);
                if (cancelled) return;
                if (!ok || !record) {
                    setExtractionLoadError('Record not found.');
                    setIsLoadingExtraction(false);
                    return;
                }
                setCurrentRecord(record);
                const hintedFamily = location.state?.backendReviewDocumentFamily || null;
                const family = record.documentFamily || hintedFamily || DOCUMENT_FAMILY_SOIL_TEST;
                setReviewFamily(family);
                setDocumentFamily(family);
                setExtractedTests([]);
                setYieldTickets([]);
                const status = record.extractionStatus || record.status;
                if (status === 'extracting') {
                    setIsLoadingExtraction(false);
                    return;
                }
                if (status === 'extraction_failed' || status === 'failed') {
                    setExtractionLoadError(record.extractionError || record.errorMessage || 'Extraction failed.');
                    setIsLoadingExtraction(false);
                    return;
                }
                if (status === 'extracted' || status === 'needs_review' || record.extractionArtifactKey) {
                    const raw = await getExtraction(uploadId);
                    const artifact = normalizeExtractionArtifact(raw);
                    if (cancelled) return;
                    const rawCtx = record.contextSnapshot;
                    let ctx = null;
                    if (rawCtx) {
                        if (typeof rawCtx === 'string') {
                            try {
                                ctx = JSON.parse(rawCtx);
                            } catch {
                                ctx = null;
                            }
                        } else {
                            ctx = rawCtx;
                        }
                    }
                    const fieldLabel =
                        record.enteredFieldLabel ||
                        ctx?.field_name ||
                        record.filename ||
                        filename ||
                        'Upload';
                    const cropFallback = ctx?.intended_crop || null;
                    const soilTypeFallback = ctx?.soil_type || null;

                    if (isSoilDocument(family)) {
                        const candidates = (artifact.soil_tests || []).map((test, index) => ({
                            ...test,
                            field_name: test.field_name || fieldLabel,
                            zone_name: test.zone_name || `Zone ${index + 1}`,
                            soil_data: normalizeSoilDataKeys(test.soil_data || {}),
                            lab_info: test.lab_info || {},
                            crop_type: test.crop_type || cropFallback || null,
                            soil_type: test.soil_type || soilTypeFallback || null,
                            tempId: `backend_${uploadId}_${index}`,
                            source_file_name: filename || undefined,
                        }));
                        setExtractedTests(candidates);
                    } else if (isYieldTicketDocument(family)) {
                        const rawTickets =
                            artifact.yield_tickets ||
                            artifact.yieldTickets ||
                            artifact.tickets ||
                            [];
                        console.log('[yield-review] raw extraction response (MyRecords)', raw);
                        console.log('[yield-review] normalized artifact (MyRecords)', artifact);
                        console.log('[yield-review] rawTickets length (MyRecords)', rawTickets?.length ?? 0);
                        const mapped = rawTickets.map((ticket, index) => {
                            const defaults = {
                                cropFallback,
                                fieldLabel:
                                    ticket.fieldLabel ||
                                    record.enteredFieldLabel ||
                                    ctx?.field_name ||
                                    record.filename ||
                                    filename ||
                                    'Upload',
                            };
                            const normalized = normalizeYieldTicket(ticket, defaults);
                            return {
                                ...normalized,
                                tempId: `yield_${uploadId}_${index}`,
                            };
                        });
                        setYieldTickets(mapped);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setExtractionLoadError(e?.message || 'Failed to load record or extraction.');
                }
            }
            if (!cancelled) setIsLoadingExtraction(false);
        })();
        return () => { cancelled = true; };
    }, [location.state?.backendReviewUploadId, location.state?.backendReviewFilename, isAnonymousUser]);

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
        const payload = { ...data, documentFamily };
        setContextualData(payload);
        setCurrentStep(3);
        // Start the async processing using the new hook
        startProcessing(file, payload, isDemoUser || isAnonymousUser);
    };

    const handleRetryUpload = () => {
        if (file && contextualData) {
            retryProcessing(file, contextualData, isDemoUser || isAnonymousUser);
        }
    };

    const handleContinueToReview = async () => {
        const uploadId = result?.uploadId;
        if (!uploadId) {
            setCurrentStep(4);
            return;
        }
        if (isLoadingExtraction) return;
        setIsLoadingExtraction(true);
        setExtractionLoadError(null);
        setCurrentRecord(null);
        setExtractedTests([]);
        setYieldTickets([]);
        try {
            const { ok, record } = await getRecord(uploadId);
            if (!ok || !record) {
                setExtractionLoadError('Record not found.');
                setIsLoadingExtraction(false);
                return;
            }
            setBackendReviewUploadId(uploadId);
            setCurrentRecord(record);
            const family =
                record.documentFamily ||
                contextualData?.documentFamily ||
                DOCUMENT_FAMILY_SOIL_TEST;
            setReviewFamily(family);
            setDocumentFamily(family);
            setCurrentStep(4);
            const status = record.extractionStatus || record.status;
            if (status === 'extracting') {
                setIsLoadingExtraction(false);
                return;
            }
            if (status === 'extraction_failed' || status === 'failed') {
                setExtractionLoadError(record.extractionError || record.errorMessage || 'Extraction failed.');
                setIsLoadingExtraction(false);
                return;
            }
            if (status === 'extracted' || record.extractionArtifactKey) {
                const raw = await getExtraction(uploadId);
                const artifact = normalizeExtractionArtifact(raw);
                const rawCtx = record.contextSnapshot;
                let ctx = null;
                if (rawCtx) {
                    if (typeof rawCtx === 'string') {
                        try {
                            ctx = JSON.parse(rawCtx);
                        } catch {
                            ctx = null;
                        }
                    } else {
                        ctx = rawCtx;
                    }
                }
                const fieldLabel =
                    contextualData?.enteredFieldLabel ||
                    contextualData?.field_name ||
                    record.enteredFieldLabel ||
                    ctx?.field_name ||
                    record.filename ||
                    file?.name ||
                    'Upload';
                const cropFallback =
                    contextualData?.intended_crop ||
                    ctx?.intended_crop ||
                    null;
                const soilTypeFallback =
                    contextualData?.soil_type ||
                    ctx?.soil_type ||
                    null;

                if (isSoilDocument(family)) {
                    const candidates = (artifact.soil_tests || []).map((test, index) => ({
                        ...test,
                        field_name: test.field_name || fieldLabel,
                        zone_name: test.zone_name || `Zone ${index + 1}`,
                        soil_data: normalizeSoilDataKeys(test.soil_data || {}),
                        lab_info: test.lab_info || {},
                        crop_type: test.crop_type || cropFallback || null,
                        soil_type: test.soil_type || soilTypeFallback || null,
                        tempId: `backend_${uploadId}_${index}`,
                        source_file_name: file?.name || undefined,
                    }));
                    setExtractedTests(candidates);
                } else if (isYieldTicketDocument(family)) {
                    const rawTickets =
                        artifact.yield_tickets ||
                        artifact.yieldTickets ||
                        artifact.tickets ||
                        [];
                    console.log('[yield-review] raw extraction response (upload flow)', raw);
                    console.log('[yield-review] normalized artifact (upload flow)', artifact);
                    console.log('[yield-review] rawTickets length (upload flow)', rawTickets?.length ?? 0);
                    const mapped = rawTickets.map((ticket, index) => {
                        const defaults = {
                            cropFallback,
                            fieldLabel:
                                ticket.fieldLabel ||
                                contextualData?.enteredFieldLabel ||
                                contextualData?.field_name ||
                                record.enteredFieldLabel ||
                                ctx?.field_name ||
                                record.filename ||
                                file?.name ||
                                'Upload',
                        };
                        const normalized = normalizeYieldTicket(ticket, defaults);
                        return {
                            ...normalized,
                            tempId: `yield_${uploadId}_${index}`,
                        };
                    });
                    setYieldTickets(mapped);
                }
            }
        } catch (e) {
            setExtractionLoadError(e?.message || 'Failed to load record or extraction.');
        }
        setIsLoadingExtraction(false);
    };

    const handleFinalizeAndAnalyze = async (finalizedTests) => {
        const fullMode = !isAnonymousUser && isApiConfigured();
        const uploadId = backendReviewUploadId || result?.uploadId;

        if (
            fullMode &&
            uploadId &&
            Array.isArray(finalizedTests) &&
            finalizedTests.length > 0 &&
            isSoilDocument(reviewFamily)
        ) {
            setIsSaving(true);
            setSaveError(null);
            try {
                const options = currentRecord?.extractionArtifactKey
                    ? { extractionArtifactKey: currentRecord.extractionArtifactKey }
                    : {};
                const res = await saveNormalizedRecords(uploadId, finalizedTests, options);
                const count = res?.count ?? res?.saved?.length ?? finalizedTests.length;
                toast.success(`Successfully saved ${count} record${count !== 1 ? 's' : ''}!`);
                navigate(createPageUrl("MyRecords"), {
                    state: {
                        refreshData: true,
                        successMessage: `Successfully saved ${count} record${count !== 1 ? 's' : ''}!`
                    }
                });
                setBackendReviewUploadId(null);
                setCurrentRecord(null);
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

        if (fullMode && uploadId && isYieldTicketDocument(reviewFamily)) {
            toast.success(
                "Yield ticket data reviewed. Upload and extraction are saved. Normalized yield records will be supported in a future backend update."
            );
            navigate(createPageUrl("MyRecords"), {
                state: {
                    refreshData: true,
                    successMessage:
                        "Yield ticket data reviewed. Upload and extraction are saved. Normalized yield records will be supported later.",
                },
            });
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
                        successMessage: `Successfully saved ${result?.count || finalizedTests?.length || 0} record(s)!`
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
        const labels = getStepLabels(effectiveDocumentFamily);
        const steps = labels.map((title, idx) => ({
            id: idx + 1,
            title,
            active: currentStep === idx + 1,
            completed: currentStep > idx + 1,
        }));

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

    const uploadCopy = getUploadCopy(effectiveDocumentFamily);

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
                        <h1 className="text-2xl md:text-3xl font-bold text-green-900">{uploadCopy.heroTitle}</h1>
                        <p className="text-green-700 mt-1">
                            {uploadCopy.heroSubtitle}
                        </p>
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

                {/* Step 1: File Upload */}
                {currentStep === 1 && (
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
                                <UploadIcon className="w-6 h-6" />
                                {uploadCopy.step1Title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
              <div className="px-6 pt-4 pb-2 space-y-3">
                <Label className="text-sm font-medium text-green-900">Document type</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={documentFamily === 'soil_test' ? 'default' : 'outline'}
                    className={documentFamily === 'soil_test' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setDocumentFamily(DOCUMENT_FAMILY_SOIL_TEST)}
                    disabled={isProcessing}
                  >
                    Soil Test
                  </Button>
                  <Button
                    type="button"
                    variant={documentFamily === 'yield_scale_ticket' ? 'default' : 'outline'}
                    className={documentFamily === 'yield_scale_ticket' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setDocumentFamily(DOCUMENT_FAMILY_YIELD_TICKET)}
                    disabled={isProcessing}
                  >
                    Yield Scale Ticket
                  </Button>
                </div>
              </div>
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
                                    title={uploadCopy.dropTitle}
                                    subtitle={uploadCopy.dropSubtitle}
                                />
                            </div>
                            {file && (
                                <div className="p-6 border-t border-green-100">
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 shadow-lg"
                                        onClick={() => setCurrentStep(2)}
                                    >
                                        {uploadCopy.contextCta}
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
                        backendUploadOnly={backendUploadOnly}
                    />
                )}

                {/* Step 4: Review Extracted Data — only when backend says extraction is ready and artifact has data */}
                {currentStep === 4 && (
                    <>
                        {isLoadingExtraction ? (
                            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                <CardContent className="py-12 text-center">
                                    <p className="text-green-700">Loading record and extraction status…</p>
                                </CardContent>
                            </Card>
                        ) : extractionLoadError ? (
                            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                <CardContent className="py-12 text-center space-y-4">
                                    <Alert variant="destructive">
                                        <AlertDescription>{extractionLoadError}</AlertDescription>
                                    </Alert>
                                    <Button variant="outline" onClick={() => navigate(createPageUrl("MyRecords"))}>
                                        Back to My Records
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : currentRecord?.extractionStatus === 'extracting' ? (
                            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                <CardContent className="py-12 text-center space-y-4">
                                    <p className="text-green-700">Extraction in progress. This usually takes a moment.</p>
                                    <Button variant="outline" onClick={async () => {
                                        setExtractionLoadError(null);
                                        setIsLoadingExtraction(true);
                                        try {
                                            const { ok, record } = await getRecord(backendReviewUploadId);
                                            setCurrentRecord(record || null);
                                            if (ok && record && (record.extractionStatus === 'extracted' || record.extractionArtifactKey)) {
                                                const family =
                                                    record.documentFamily ||
                                                    reviewFamily ||
                                                    DOCUMENT_FAMILY_SOIL_TEST;
                                                setReviewFamily(family);
                                                setDocumentFamily(family);
                                                const raw = await getExtraction(backendReviewUploadId);
                                                const artifact = normalizeExtractionArtifact(raw);
                                                const filename = record.filename || '';
                                                const rawCtx = record.contextSnapshot;
                                                let ctx = null;
                                                if (rawCtx) {
                                                    if (typeof rawCtx === 'string') {
                                                        try {
                                                            ctx = JSON.parse(rawCtx);
                                                        } catch {
                                                            ctx = null;
                                                        }
                                                    } else {
                                                        ctx = rawCtx;
                                                    }
                                                }
                                                const fieldLabel =
                                                    record.enteredFieldLabel ||
                                                    ctx?.field_name ||
                                                    record.filename ||
                                                    filename ||
                                                    'Upload';
                                                const cropFallback = ctx?.intended_crop || null;
                                                const soilTypeFallback = ctx?.soil_type || null;

                                                if (isSoilDocument(family)) {
                                                    const candidates = (artifact.soil_tests || []).map((test, index) => ({
                                                        ...test,
                                                        field_name: test.field_name || fieldLabel,
                                                        zone_name: test.zone_name || `Zone ${index + 1}`,
                                                        soil_data: normalizeSoilDataKeys(test.soil_data || {}),
                                                        lab_info: test.lab_info || {},
                                                        crop_type: test.crop_type || cropFallback || null,
                                                        soil_type: test.soil_type || soilTypeFallback || null,
                                                        tempId: `backend_${backendReviewUploadId}_${index}`,
                                                        source_file_name: filename || undefined,
                                                    }));
                                                    setExtractedTests(candidates);
                                                    setYieldTickets([]);
                                                } else if (isYieldTicketDocument(family)) {
                                                    const rawTickets =
                                                        artifact.yield_tickets ||
                                                        artifact.yieldTickets ||
                                                        artifact.tickets ||
                                                        [];
                                                    console.log('[yield-review] raw extraction response (check-again)', raw);
                                                    console.log('[yield-review] normalized artifact (check-again)', artifact);
                                                    console.log('[yield-review] rawTickets length (check-again)', rawTickets?.length ?? 0);
                                                    const mapped = rawTickets.map((ticket, index) => {
                                                        const defaults = {
                                                            cropFallback,
                                                            fieldLabel:
                                                                ticket.fieldLabel ||
                                                                record.enteredFieldLabel ||
                                                                ctx?.field_name ||
                                                                record.filename ||
                                                                filename ||
                                                                'Upload',
                                                        };
                                                        const normalized = normalizeYieldTicket(ticket, defaults);
                                                        return {
                                                            ...normalized,
                                                            tempId: `yield_${backendReviewUploadId}_${index}`,
                                                        };
                                                    });
                                                    setYieldTickets(mapped);
                                                    setExtractedTests([]);
                                                }
                                            }
                                        } finally {
                                            setIsLoadingExtraction(false);
                                        }
                                    }}>
                                        Check again
                                    </Button>
                                    <Button variant="ghost" onClick={() => navigate(createPageUrl("MyRecords"))}>Back to My Records</Button>
                                </CardContent>
                            </Card>
                        ) : (currentRecord?.extractionStatus === 'extraction_failed' || currentRecord?.status === 'failed') ? (
                            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                <CardContent className="py-12 text-center space-y-4">
                                    <Alert variant="destructive">
                                        <AlertDescription>{currentRecord.extractionError || currentRecord.errorMessage || 'Extraction failed.'}</AlertDescription>
                                    </Alert>
                                    <Button variant="outline" onClick={() => navigate(createPageUrl("MyRecords"))}>Back to My Records</Button>
                                </CardContent>
                            </Card>
                        ) : (isYieldTicketDocument(reviewFamily) && yieldTickets.length > 0) ? (
                            <>
                                {saveError && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertDescription>{saveError}</AlertDescription>
                                    </Alert>
                                )}
                                <YieldTicketReview
                                    tickets={yieldTickets}
                                    onUpdateTicket={(updatedTicket) => {
                                        setYieldTickets(prev =>
                                            prev.map(t => t.tempId === updatedTicket.tempId ? updatedTicket : t)
                                        );
                                    }}
                                    onFinalize={handleFinalizeAndAnalyze}
                                    onCancel={() => { setBackendReviewUploadId(null); setCurrentRecord(null); resetUpload(); }}
                                    isSaving={isSaving}
                                />
                            </>
                        ) : (isSoilDocument(reviewFamily) && extractedTests.length > 0) ? (
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
                                    onCancel={() => { setBackendReviewUploadId(null); setCurrentRecord(null); resetUpload(); }}
                                    isSaving={isSaving}
                                />
                            </>
                        ) : (
                            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                <CardContent className="py-12 text-center space-y-4">
                                    <p className="text-gray-600">
                                        {(currentRecord?.extractionStatus === 'extracted' || currentRecord?.status === 'needs_review' || currentRecord?.extractionArtifactKey)
                                            ? 'Extraction completed but no structured data was extracted yet for this document. You can still open this upload from My Records when richer parsing is available.'
                                            : 'Extraction has not completed yet. Check again in a moment or open this upload from My Records when it shows as ready.'}
                                    </p>
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