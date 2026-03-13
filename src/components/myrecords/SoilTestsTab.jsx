
import React, { useState, useEffect, useCallback } from "react";
import { SoilTest } from "@/api/entities";
import { Field } from "@/api/entities"; // Import Field entity
import { User } from "@/api/entities";
import { isUnauthenticatedError } from "@/api/auth";
import { listRecords, triggerExtraction, updateRecord, deleteRecord } from "@/api/records";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit, Trash2, Download, AlertTriangle, List, Grid3X3, Info, MapPin } from "lucide-react";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ConfirmationModal from "./ConfirmationModal";
import { exportSoilTests } from "@/api/functions";
import { createPageUrl } from "@/utils";
import { createFieldDeepLink } from "../utils/createFieldDeepLink"; // Import the utility
import { useNavigate, useLocation } from "react-router-dom";
import EditSoilTestModal from "./EditSoilTestModal";
import GridView from "./GridView";
import ExpandableRow from "./ExpandableRow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SoilTestsTab() {
    const [tests, setTests] = useState([]);
    const [fieldsMap, setFieldsMap] = useState(new Map()); // State for Field ID -> Name mapping
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [testToDelete, setTestToDelete] = useState(null);
    const [testToEdit, setTestToEdit] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [user, setUser] = useState(null);
    const [isDemo, setIsDemo] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [loadError, setLoadError] = useState(null);
    const [isAnonymousUser, setIsAnonymousUser] = useState(false);
    /** True when signed-in and data came from GET /records (upload placeholders), not from /soil-tests */
    const [backendRecordsMode, setBackendRecordsMode] = useState(false);
    /** Upload records (soil_upload) for status-driven table; when backendRecordsMode we also have normalized in tests or separate list */
    const [uploadRecords, setUploadRecords] = useState([]);
    const [extractingId, setExtractingId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const loadTests = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        
        // Guest User Flow Priority 1: Check session storage for persisted guest data
        const guestData = sessionStorage.getItem('guestSoilTests');
        
        if (guestData) {
            try {
                const parsedData = JSON.parse(guestData);
                setTests(parsedData);
                setIsAnonymousUser(true);
                setIsDemo(true);
                setBackendRecordsMode(false);
            } catch (e) {
                console.error("Failed to parse guest data from session storage:", e);
                sessionStorage.removeItem('guestSoilTests'); // Clear corrupted data
            }
            setIsLoading(false);
            return;
        }

        // Guest User Flow Priority 2: Check for data passed from Upload page.
        if (location.state?.isAnonymousUpload && location.state?.tests) {
            const newTests = location.state.tests;
            setTests(newTests);
            sessionStorage.setItem('guestSoilTests', JSON.stringify(newTests)); // Persist it
            setIsAnonymousUser(true);
            setIsDemo(true);
            setBackendRecordsMode(false);
            setIsLoading(false);
            // Clear the state to prevent re-loading on refresh
            window.history.replaceState({}, document.title);
            return;
        }

        // Guest User Flow Priority 3: Check for batch upload results in location state
        if (location.state?.batchUploadResults?.isAnonymousUser && location.state?.batchUploadResults?.allRecords) {
            const batchRecords = location.state.batchUploadResults.allRecords;
            setTests(batchRecords);
            sessionStorage.setItem('guestSoilTests', JSON.stringify(batchRecords)); // Persist it
            setIsAnonymousUser(true);
            setIsDemo(true);
            setBackendRecordsMode(false);
            setIsLoading(false);
            // Clear the state to prevent re-loading on refresh
            window.history.replaceState({}, document.title);
            return;
        }

        try {
            let currentUser = null;
            let isAnonymous = false;
            
            // Authentication Check
            try {
                currentUser = await User.me();
                setUser(currentUser);
                setIsAnonymousUser(false);
                if (currentUser.email?.includes('demo')) setIsDemo(true);
            } catch (authError) {
                if (isUnauthenticatedError(authError)) {
                    isAnonymous = true;
                    setIsAnonymousUser(true);
                    setIsDemo(true);
                    setUser(null);
                } else {
                    console.error('Unexpected auth error on My Records', authError);
                    isAnonymous = true;
                    setLoadError(authError?.message || 'Failed to load');
                    setUser(null);
                }
            }
            
            // Data Loading Logic
            if (isAnonymous) {
                // For anonymous users who land here directly, show empty state.
                // Do NOT attempt to fetch from backend.
                setTests([]);
                setBackendRecordsMode(false);
            } else {
                // Authenticated user: GET /records (uploads + normalized records). Uploads for status table; normalized for saved tests.
                const { records } = await listRecords();
                // Support both legacy soil_upload and new document_upload types.
                const uploads = (records || []).filter(
                    (r) => r.type === 'soil_upload' || r.type === 'document_upload'
                );
                const normalized = (records || []).filter((r) => r.type === 'normalized_soil_test');
                const displayTests = normalized.map((r) => ({
                    id: r.id,
                    field_name: r.field_name ?? r.zone_name ?? 'Unnamed',
                    zone_name: r.zone_name,
                    test_date: r.test_date,
                    soil_data: r.soil_data ?? {},
                    crop_type: r.crop_type,
                    soil_type: r.soil_type,
                    field_id: r.field_id,
                    soil_health_index: r.soil_health_index,
                    updated_date: r.updatedAt ?? r.createdAt,
                    createdAt: r.createdAt,
                    sourceUploadId: r.sourceUploadId,
                }));
                setUploadRecords(uploads);
                setTests(displayTests);
                setBackendRecordsMode(true);
                setFieldsMap(new Map());
            }
        } catch (error) {
            console.error("Error in loadTests:", error);
            setLoadError(`Failed to load your soil tests: ${error.message || 'Unknown error'}`);
        }
        
        setIsLoading(false);
    }, [location.state]);

    useEffect(() => {
        loadTests();
    }, [loadTests]);

    // This effect handles refresh for AUTHENTICATED users only.
    useEffect(() => {
        if (location.state?.refreshData && !isAnonymousUser) {
            const refreshTimeout = setTimeout(() => {
                loadTests();
                
                if (location.state?.successMessage) {
                    toast.success(location.state.successMessage, {
                        duration: 5000
                    });
                }
            }, 500);
            
            window.history.replaceState({}, document.title);
            return () => clearTimeout(refreshTimeout);
        }
        
        // Show success message for anonymous users too
        if (location.state?.successMessage && isAnonymousUser) {
            toast.success(location.state.successMessage, {
                duration: 5000
            });
            window.history.replaceState({}, document.title);
        }
    }, [location.state, loadTests, isAnonymousUser]);

    const handleDeleteConfirm = async () => {
        if (!testToDelete) return;

        // For guests, delete from local state and session storage.
        if (isAnonymousUser) {
            const updatedTests = tests.filter(t => t.id !== testToDelete.id);
            setTests(updatedTests);
            sessionStorage.setItem('guestSoilTests', JSON.stringify(updatedTests));
            toast.success("Demo record removed.");
            setTestToDelete(null);
            return;
        }

        // For authenticated users, delete from backend (normalized_soil_test via /records/{id}).
        setIsDeleting(true);
        try {
            const res = await deleteRecord(testToDelete.id);
            if (!res.ok) {
                throw new Error(res.error || "Backend delete failed");
            }
            toast.success("Record deleted successfully.");
            setTests(tests.filter(t => t.id !== testToDelete.id));
        } catch (error) {
            console.error("Error deleting soil test:", error);
            toast.error("Failed to delete record.");
        }
        setIsDeleting(false);
        setTestToDelete(null);
    };

    const handleUpdateTest = async (testIdOrObject, updatedData) => {
        const testToUpdate = typeof testIdOrObject === 'object' ? testIdOrObject : tests.find(t => t.id === testIdOrObject);
        if (!testToUpdate) return;
        
        // Use consistent timestamp that accounts for timezone
        const now = new Date();
        const updatedTest = { 
            ...testToUpdate, 
            ...updatedData,
            updated_date: now.toISOString() // This will be consistent with server time
        };
        
        // For guests, update local state and session storage.
        if (isAnonymousUser) {
            const updatedTests = tests.map(t => (t.id === updatedTest.id ? updatedTest : t));
            setTests(updatedTests);
            sessionStorage.setItem('guestSoilTests', JSON.stringify(updatedTests));
            toast.success("Demo record updated.");
            if (testToEdit) setTestToEdit(null);
            return;
        }

        // For authenticated users, update backend (normalized_soil_test via /records/{id}).
        try {
            const res = await updateRecord(testToUpdate.id, {
                ...updatedData,
                // Backend stores updatedAt; we still send updated_date for UI consistency if needed downstream.
                updated_date: now.toISOString(),
            });
            if (!res.ok) {
                throw new Error(res.error || "Backend update failed");
            }
            if (testToEdit) setTestToEdit(null);
            await loadTests();
            toast.success("Record updated successfully.");
        } catch (error) {
            console.error("Error updating soil test:", error);
            toast.error("Failed to update soil test.");
            throw error;
        }
    };

    // Enhanced helper function to safely format dates with timezone handling
    const formatLastUpdated = useCallback((dateString) => {
        if (!dateString) return 'Unknown';
        
        try {
            let date;
            
            // Parse the date more carefully
            if (typeof dateString === 'string') {
                // Try parsing as ISO string first
                date = parseISO(dateString);
                if (!isValid(date)) {
                    // Fallback to new Date() parsing
                    date = new Date(dateString);
                }
            } else if (dateString instanceof Date) {
                date = dateString;
            } else {
                return 'Invalid date';
            }
            
            if (!isValid(date)) {
                return 'Invalid date';
            }
            
            // Ensure we're not showing future dates due to timezone issues
            const now = new Date();
            if (date > now) {
                // If the date appears to be in the future, it's likely a timezone issue.
                // Show the actual date instead of relative time.
                // Format to local time without seconds for brevity
                return `${format(date, 'MMM d, yyyy HH:mm')}`;
            }
            
            // For very recent updates (< 1 minute), show "just now"
            const diffMs = now.getTime() - date.getTime();
            if (diffMs < 60000) { // Less than 1 minute
                return 'Just now';
            }
            
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (error) {
            console.error('Date formatting error:', error, 'dateString:', dateString);
            return `Error formatting date: ${dateString}`;
        }
    }, []);

    const handleEdit = (test) => {
        setTestToEdit(test);
    };

    const getContext = (rec) => {
        const cs = rec?.contextSnapshot;
        if (!cs) return null;
        if (typeof cs === 'string') {
            try {
                return JSON.parse(cs);
            } catch {
                return null;
            }
        }
        return cs;
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await exportSoilTests();
            
            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `soiltests-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success("Export complete – downloading file...");
            } else {
                throw new Error(`Export failed with status ${response.status}`);
            }
        } catch (error) {
            console.error("Failed to export data:", error);
            toast.error(`Failed to export data: ${error.message || 'Unknown error'}`);
        }
        setIsExporting(false);
    };

    const toggleRowExpansion = (testId) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(testId)) {
                newSet.delete(testId);
            } else {
                newSet.add(testId);
            }
            return newSet;
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="w-full h-64" />
                <div className="text-center text-gray-500">
                    Loading your soil test records...
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <Card className="text-center p-8">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold text-gray-800">Unable to Load Data</h3>
                <p className="text-gray-600 mb-4">{loadError}</p>
                <Button 
                    onClick={loadTests} 
                    className="mt-4 bg-green-600 hover:bg-green-700"
                >
                    Try Again
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {(isDemo || isAnonymousUser) && (
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-4 w-4 !text-blue-800" />
                    <AlertTitle>
                        {isAnonymousUser ? "Guest Demo Mode" : "Demo Mode"}
                    </AlertTitle>
                    <AlertDescription>
                        {isAnonymousUser ? (
                            <>
                                You are viewing temporary records. This data is not saved.
                                <Button 
                                    variant="link" 
                                    className="p-0 h-auto text-blue-800 underline ml-1"
                                    onClick={() => User.login()}
                                >
                                    Sign up to save your data permanently!
                                </Button>
                            </>
                        ) : (
                            "You're in demo mode. Any records you create will be automatically deleted after 24 hours."
                        )}
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-green-900">
                        {backendRecordsMode ? "Upload Records" : "Soil Test Records"}
                    </h3>
                    {!backendRecordsMode && (
                        <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
                            <TabsList>
                                <TabsTrigger value="list" className="flex items-center gap-2">
                                    <List className="w-4 h-4" />
                                    List
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="grid" 
                                    className="flex items-center gap-2"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                    Grid
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </div>
                {!backendRecordsMode && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    onClick={handleExport} 
                                    disabled={isExporting}
                                    variant="default"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    {isExporting ? "Exporting..." : "Export CSV"}
                                </Button>
                            </TooltipTrigger>
                             {isDemo && (
                                <TooltipContent>
                                    <p>Exporting as CSV is a premium feature.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {!backendRecordsMode && tests.length === 0 ? (
                <Card className="text-center p-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800">No Soil Tests Found</h3>
                    <p className="text-gray-600">You haven't uploaded any soil tests yet.</p>
                    <Button onClick={() => navigate(createPageUrl("Upload"))} className="mt-4 bg-green-600 hover:bg-green-700">
                        Upload Your First Test
                    </Button>
                </Card>
            ) : backendRecordsMode ? (
                <>
                    {/* Upload records: backend status and extraction status drive UI */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-green-900">Uploads</h3>
                        {uploadRecords.length === 0 ? (
                            <Card className="text-center p-6">
                                <p className="text-gray-600">No uploads yet. Upload a PDF to see it here.</p>
                                <Button onClick={() => navigate(createPageUrl("Upload"))} className="mt-3 bg-green-600 hover:bg-green-700">Upload a File</Button>
                            </Card>
                        ) : (
                            <div className="overflow-x-auto border rounded-lg bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Filename</TableHead>
                                            <TableHead>Family</TableHead>
                                            <TableHead>Field</TableHead>
                                            <TableHead>Crop</TableHead>
                                            <TableHead>Acres</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {uploadRecords.map((rec) => {
                                            const ctx = getContext(rec);
                                            return (
                                                <TableRow key={rec.id} className="hover:bg-green-50/50">
                                                    <TableCell className="font-medium">{rec.filename || '—'}</TableCell>
                                                    <TableCell>
                                                        {rec.documentFamily === 'yield_scale_ticket'
                                                            ? 'Yield Ticket'
                                                            : 'Soil Test'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {rec.enteredFieldLabel || ctx?.field_name || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {ctx?.intended_crop || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {ctx?.field_size_acres != null
                                                            ? ctx.field_size_acres
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell>{rec.createdAt ? formatLastUpdated(rec.createdAt) : '—'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            <Badge variant="secondary">{rec.extractionStatus ?? rec.status ?? 'uploaded'}</Badge>
                                                            {(rec.extractionError || rec.errorMessage) && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p className="max-w-xs">{rec.extractionError || rec.errorMessage}</p></TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(createPageUrl("Upload"), {
                                                                state: { backendReviewUploadId: rec.id, backendReviewFilename: rec.filename || '' }
                                                            })}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Review
                                                        </Button>
                                                        {((rec.extractionStatus ?? rec.status) === 'extraction_failed' || (rec.extractionStatus ?? rec.status) === 'extracted' || (rec.extractionStatus ?? rec.status) === 'needs_review' || (rec.extractionStatus ?? rec.status) === 'failed') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={extractingId === rec.id}
                                                                onClick={async () => {
                                                                    setExtractingId(rec.id);
                                                                    try {
                                                                        const res = await triggerExtraction(rec.id);
                                                                        if (res?.ok) toast.success('Extraction started');
                                                                        else toast.error('Failed to start extraction');
                                                                    } catch (_) { toast.error('Failed to start extraction'); }
                                                                    setExtractingId(null);
                                                                }}
                                                            >
                                                                {extractingId === rec.id ? 'Starting…' : 'Re-run extraction'}
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                    {/* Saved soil tests (normalized) */}
                    {tests.length > 0 && (
                        <div className="space-y-4 mt-8">
                            <h3 className="text-lg font-semibold text-green-900">Saved soil tests</h3>
                            <div className="overflow-x-auto border rounded-lg bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Field</TableHead>
                                            <TableHead>Linked Field</TableHead>
                                            <TableHead>Test Date</TableHead>
                                            <TableHead>Crop</TableHead>
                                            <TableHead>SHI</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tests.map(test => {
                                            const linkedFieldName = fieldsMap.get(test.field_id);
                                            return (
                                                <React.Fragment key={test.id}>
                                                    <TableRow className="hover:bg-green-50/50 cursor-pointer">
                                                        <TableCell>
                                                            <Button variant="ghost" size="sm" onClick={() => toggleRowExpansion(test.id)} className="p-1 h-6 w-6">
                                                                {expandedRows.has(test.id) ? '−' : '+'}
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{test.field_name}</TableCell>
                                                        <TableCell>
                                                            {linkedFieldName ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline">{linkedFieldName}</Badge>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); navigate(createFieldDeepLink(test.field_id)); }}>
                                                                                    <MapPin className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent><p>View on Map</p></TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
                                                            ) : <span className="text-gray-400">—</span>}
                                                        </TableCell>
                                                        <TableCell>{test.test_date ? format(new Date(test.test_date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                                        <TableCell>{test.crop_type || 'N/A'}</TableCell>
                                                        <TableCell><Badge>{test.soil_health_index || 'N/A'}</Badge></TableCell>
                                                        <TableCell>{formatLastUpdated(test.updated_date)}</TableCell>
                                                        <TableCell className="space-x-2">
                                                            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl(`Recommendations?test_id=${test.id}`))}><Eye className="w-4 h-4" /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => setTestToEdit(test)}><Edit className="w-4 h-4" /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => setTestToDelete(test)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedRows.has(test.id) && (
                                                        <TableRow>
                                                            <TableCell colSpan={8} className="p-0 bg-gray-50/50"><ExpandableRow test={test} /></TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <Tabs value={viewMode} onValueChange={setViewMode}>
                    <TabsContent value="list">
                        <div className="hidden md:block">
                            {/* This wrapper div makes the table scrollable on smaller viewports */}
                            <div className="overflow-x-auto border rounded-lg bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Field</TableHead>
                                            <TableHead>Linked Field</TableHead> {/* New Column */}
                                            <TableHead>Test Date</TableHead>
                                            <TableHead>Crop</TableHead>
                                            <TableHead>SHI</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tests.map(test => {
                                            const linkedFieldName = fieldsMap.get(test.field_id);
                                            return (
                                                <React.Fragment key={test.id}>
                                                    <TableRow className="hover:bg-green-50/50 cursor-pointer">
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => toggleRowExpansion(test.id)}
                                                                className="p-1 h-6 w-6"
                                                            >
                                                                {expandedRows.has(test.id) ? '−' : '+'}
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{test.field_name}</TableCell>
                                                        {/* New Cell Renderer */}
                                                        <TableCell>
                                                            {linkedFieldName ? (
                                                              <div className="flex items-center gap-2">
                                                                <Badge variant="outline">{linkedFieldName}</Badge>
                                                                <TooltipProvider>
                                                                  <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                      <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-7 w-7 text-gray-500 hover:text-blue-600"
                                                                        onClick={(e) => {
                                                                          e.stopPropagation();
                                                                          navigate(createFieldDeepLink(test.field_id)); // Use utility function
                                                                        }}
                                                                      >
                                                                        <MapPin className="h-4 w-4" />
                                                                      </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                      <p>View on Map</p>
                                                                    </TooltipContent>
                                                                  </Tooltip>
                                                                </TooltipProvider>
                                                              </div>
                                                            ) : (
                                                              <span className="text-gray-400">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{test.test_date ? format(new Date(test.test_date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                                        <TableCell>{test.crop_type || 'N/A'}</TableCell>
                                                        <TableCell><Badge>{test.soil_health_index || 'N/A'}</Badge></TableCell>
                                                        <TableCell>{formatLastUpdated(test.updated_date)}</TableCell>
                                                        <TableCell className="space-x-2">
                                                            <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl(`Recommendations?test_id=${test.id}`))}>
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => setTestToEdit(test)}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => setTestToDelete(test)}>
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedRows.has(test.id) && (
                                                        <TableRow>
                                                            <TableCell colSpan={8} className="p-0 bg-gray-50/50"> {/* Colspan updated to 8 */}
                                                                <ExpandableRow test={test} />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="md:hidden space-y-3">
                            {tests.map(test => {
                                const linkedFieldName = fieldsMap.get(test.field_id);
                                return (
                                <Card key={test.id} className="shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {/* Header row */}
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 flex-1 mr-3">
                                                    <h3 className="font-bold text-lg text-gray-900 truncate">{test.field_name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {test.test_date ? format(new Date(test.test_date), 'MMM d, yyyy') : 'N/A'}
                                                    </p>
                                                </div>
                                                <Badge className="flex-shrink-0">{test.soil_health_index || 'N/A'}</Badge>
                                            </div>
                                            
                                            {/* Details grid */}
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Crop:</span>
                                                    <div className="font-medium text-gray-900">{test.crop_type || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Updated:</span>
                                                    <div className="font-medium text-gray-900 text-xs">{formatLastUpdated(test.updated_date)}</div>
                                                </div>
                                            </div>

                                            {/* Mobile Linked Field Info */}
                                            {linkedFieldName && (
                                                <div className="flex items-center gap-2 pt-2 border-t">
                                                    <span className="text-gray-500 text-sm">Linked to:</span>
                                                    <Badge variant="outline" className="text-xs">{linkedFieldName}</Badge>
                                                </div>
                                            )}
                                            
                                            {/* Action buttons */}
                                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                                                {linkedFieldName && (
                                                    <Button variant="outline" size="sm" onClick={() => navigate(createFieldDeepLink(test.field_id))} className="flex-1 min-w-0">
                                                        <MapPin className="w-3 h-3 mr-1" /> 
                                                        <span className="truncate">Map</span>
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl(`Recommendations?test_id=${test.id}`))} className="flex-1 min-w-0">
                                                    <Eye className="w-3 h-3 mr-1" /> 
                                                    <span className="truncate">View</span>
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => setTestToEdit(test)} className="flex-1 min-w-0">
                                                    <Edit className="w-3 h-3 mr-1" /> 
                                                    <span className="truncate">Edit</span>
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => setTestToDelete(test)} className="flex-1 min-w-0">
                                                    <Trash2 className="w-3 h-3 mr-1" /> 
                                                    <span className="truncate">Delete</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                )
                            })}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="grid">
                        <GridView
                            tests={tests}
                            onEdit={handleUpdateTest}
                            onDelete={(test) => setTestToDelete(test)}
                            isDemo={isDemo || isAnonymousUser}
                        />
                    </TabsContent>
                </Tabs>
            )}

            <ConfirmationModal
                isOpen={!!testToDelete}
                onClose={() => setTestToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Permanently delete this record?"
                description={isAnonymousUser ? "This will remove the demo record from your current session." : "This will delete the soil test and all its associated analysis. This action cannot be undone."}
            />

            <EditSoilTestModal
                isOpen={!!testToEdit}
                onClose={() => setTestToEdit(null)}
                onSave={(updatedData) => handleUpdateTest(testToEdit, updatedData)}
                test={testToEdit}
            />
        </div>
    );
}
