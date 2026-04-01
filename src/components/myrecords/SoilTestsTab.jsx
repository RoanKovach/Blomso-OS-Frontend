
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import SavedRecordsDataSheet from "./SavedRecordsDataSheet";
import { SHEET_SOIL, SHEET_YIELD, SHEET_FIELDS, DEFAULT_SHEET_TYPE } from "./dataSheetConfig";
import {
    getCanonicalFieldContextForSoilTest,
    getCanonicalFieldContextForYieldRecord,
} from "./fieldDisplayUtils";
import FieldSummaryDrawer from "./FieldSummaryDrawer";
import { blobFromExportSoilTestsResponse } from "./exportSoilTestsResponse";
import { formatDateOnlySafe } from "./dateUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function YieldExpandableRow({ rec, fieldContext, onOpenMap }) {
    const ticketNumber = rec.ticket_number ?? rec.ticketNumber ?? "—";
    const cropRaw = rec.crop ?? rec.crop_type ?? "—";
    const crop =
        cropRaw && cropRaw !== "—"
            ? cropRaw.charAt(0).toUpperCase() + cropRaw.slice(1).toLowerCase()
            : cropRaw;
    const ticketDateRaw = rec.ticket_date ?? rec.ticketDate ?? null;
    const ticketDate = ticketDateRaw ? formatDateOnlySafe(ticketDateRaw) || "—" : "—";
    const net =
        rec.net_bushels ??
        rec.netBushels ??
        rec.quantity_bushels ??
        rec.quantityBushels ??
        null;
    const price =
        rec.price_per_bu ?? rec.pricePerBushel ?? rec.price_per_bushel ?? null;

    const displayFieldName = fieldContext?.displayFieldName ?? "—";
    const sourceFieldLabel = fieldContext?.sourceFieldLabel ?? null;

    const rows = [
        { label: "Ticket #", value: ticketNumber },
        { label: "Linked field", value: displayFieldName },
        ...(sourceFieldLabel && sourceFieldLabel !== displayFieldName
            ? [{ label: "Document / source field", value: sourceFieldLabel }]
            : []),
        { label: "Crop", value: crop },
        { label: "Ticket date", value: ticketDate },
        { label: "Net bushels", value: net != null && net !== "" ? String(net) : "—" },
        { label: "Price / bu", value: price != null && price !== "" ? String(price) : "—" },
    ];

    return (
        <div className="space-y-4 p-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">Yield ticket</h4>
                    {fieldContext?.canonicalFieldId && (
                        <Button type="button" variant="outline" size="sm" className="h-8" onClick={onOpenMap}>
                            <MapPin className="mr-1 h-4 w-4" />
                            Open field
                        </Button>
                    )}
                </div>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {rows.map(({ label, value }) => (
                        <div key={label} className="rounded-md border bg-gray-50/60 p-3">
                            <dt className="text-xs font-medium text-gray-500">{label}</dt>
                            <dd className="mt-1 break-words text-sm font-semibold text-gray-900">
                                {value}
                            </dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-3 text-xs text-slate-500">
                    Field reassignment for saved yield tickets isn’t available yet in v1 (requires backend support).
                </p>
            </div>
        </div>
    );
}

function SoilFieldLinkControl({ test, canonicalFields = [], onPatched }) {
    const currentFieldId = test?.field_id ?? null;
    const [value, setValue] = useState(currentFieldId || "none");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setValue(currentFieldId || "none");
    }, [currentFieldId]);

    const canSave = value && value !== "none" && value !== currentFieldId;

    if (!Array.isArray(canonicalFields) || canonicalFields.length === 0) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Linked field</div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                    {test?.field_id ? (test?.field_name || "Linked") : "Unlinked"}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                    Create fields first to reassign this record.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Linked field</div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                    {test?.field_id ? (test?.field_name || "Linked") : "Unlinked"}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
                <div className="md:col-span-2">
                    <Label className="text-sm text-slate-700">Change field</Label>
                    <Select value={value} onValueChange={setValue}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select a field" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Select…</SelectItem>
                            {canonicalFields.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                    {f.field_name ?? f.name ?? f.fieldName ?? f.id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="default"
                        disabled={!canSave || saving}
                        onClick={async () => {
                            const nextField = canonicalFields.find((f) => f.id === value);
                            if (!nextField) return;
                            setSaving(true);
                            try {
                                const name = nextField.field_name ?? nextField.name ?? nextField.fieldName ?? null;
                                const res = await updateRecord(test.id, {
                                    field_id: nextField.id,
                                    field_name: name,
                                });
                                if (!res.ok) throw new Error(res.error || "Update failed");
                                toast.success("Linked field updated.");
                                onPatched?.({ field_id: nextField.id, field_name: name });
                            } catch (e) {
                                toast.error(e?.message || "Failed to update linked field.");
                            } finally {
                                setSaving(false);
                            }
                        }}
                        className="flex-1"
                    >
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
                This updates the field link for this saved soil test record.
            </p>
        </div>
    );
}

export default function SoilTestsTab() {
    const [tests, setTests] = useState([]);
    const [yieldRecords, setYieldRecords] = useState([]);
    const [fieldsMap, setFieldsMap] = useState(new Map()); // State for Field ID -> Name mapping
    /** Field id -> acres when Field.list() provides it */
    const [fieldAcresMap, setFieldAcresMap] = useState(new Map());
    const [canonicalFields, setCanonicalFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [testToDelete, setTestToDelete] = useState(null);
    const [testToEdit, setTestToEdit] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [user, setUser] = useState(null);
    const [isDemo, setIsDemo] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [expandedYieldRows, setExpandedYieldRows] = useState(new Set());
    const [loadError, setLoadError] = useState(null);
    const [isAnonymousUser, setIsAnonymousUser] = useState(false);
    /** True when signed-in and data came from GET /records (upload placeholders), not from /soil-tests */
    const [backendRecordsMode, setBackendRecordsMode] = useState(false);
    /** Upload records (soil_upload) for status-driven table; when backendRecordsMode we also have normalized in tests or separate list */
    const [uploadRecords, setUploadRecords] = useState([]);
    const [extractingId, setExtractingId] = useState(null);
    const [recordFilters, setRecordFilters] = useState({
        field: "all",
        family: "all",
        crop: "all",
        status: "all",
    });
    /** Signed-in Saved Records only: Standard tables vs Data Sheet modeling view */
    const [savedRecordsViewMode, setSavedRecordsViewMode] = useState("standard");
    /** Data Sheet: soil tests | yield tickets | field summary (one grain per sheet) */
    const [dataSheetType, setDataSheetType] = useState(DEFAULT_SHEET_TYPE);
    const savedRecordsDataSheetRef = useRef(null);
    const [fieldSummary, setFieldSummary] = useState(null);
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
                const yieldNormalized = (records || []).filter((r) => r.type === 'normalized_yield_ticket');
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
                setYieldRecords(yieldNormalized || []);
                setBackendRecordsMode(true);
                try {
                    const raw = await Field.list();
                    const fieldList = Array.isArray(raw) ? raw : (raw?.fields ?? raw?.items ?? raw?.data ?? []);
                    const list = fieldList || [];
                    setCanonicalFields(list);
                    setFieldsMap(new Map(list.map((f) => [f.id, f.field_name ?? f.name ?? f.fieldName ?? f.id])));
                    setFieldAcresMap(
                        new Map(
                            list.map((f) => [
                                f.id,
                                f.acres ?? f.field_size_acres ?? f.fieldSizeAcres ?? f.field_acres ?? null,
                            ])
                        )
                    );
                } catch (_) {
                    setCanonicalFields([]);
                    setFieldsMap(new Map());
                    setFieldAcresMap(new Map());
                }
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

    useEffect(() => {
        if (isLoading) return;
        if (location.hash !== "#export") return;
        requestAnimationFrame(() => {
            document.getElementById("export")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }, [isLoading, location.hash]);

    const NON_TERMINAL_STATUSES = ['uploaded', 'extracting', 'processing', 'needs_review'];
    const hasNonTerminalUploads = useMemo(() => {
        if (!backendRecordsMode || !uploadRecords.length) return false;
        return uploadRecords.some((rec) => {
            const status = rec.extractionStatus ?? rec.status ?? 'uploaded';
            const hasSaved = tests.some((t) => t.sourceUploadId === rec.id);
            return (NON_TERMINAL_STATUSES.includes(status) || (status === 'needs_review' && !hasSaved));
        });
    }, [backendRecordsMode, uploadRecords, tests]);

    useEffect(() => {
        if (!hasNonTerminalUploads) return;
        const POLL_INTERVAL_MS = 10000;
        const MAX_POLL_MS = 5 * 60 * 1000;
        const startedAt = Date.now();
        const intervalId = setInterval(() => {
            loadTests();
        }, POLL_INTERVAL_MS);
        const timeoutId = setTimeout(() => clearInterval(intervalId), MAX_POLL_MS);
        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [hasNonTerminalUploads, loadTests]);

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

    const getContext = useCallback((rec) => {
        const cs = rec?.contextSnapshot;
        if (!cs) return null;
        if (typeof cs === "string") {
            try {
                return JSON.parse(cs);
            } catch {
                return null;
            }
        }
        return cs;
    }, []);

    const getFamilyLabel = (family) => {
        if (!family || family === 'soil_test') return 'Soil Test';
        if (family === 'yield_scale_ticket') return 'Yield Ticket';
        const formatted = String(family).replace(/_/g, ' ');
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const sourceUploadMap = useMemo(
        () => new Map((uploadRecords || []).map((u) => [u.id, u])),
        [uploadRecords]
    );

    const getSavedSoilDisplay = useCallback(
        (test) => {
            const fc = getCanonicalFieldContextForSoilTest(test, fieldsMap, sourceUploadMap, getContext);
            const upload = test.sourceUploadId ? sourceUploadMap.get(test.sourceUploadId) : null;
            const ctx = upload ? getContext(upload) : null;
            const displayCrop = test.crop_type ?? ctx?.intended_crop ?? null;
            const displayAcres =
                test.field_size_acres != null
                    ? test.field_size_acres
                    : ctx?.field_size_acres != null
                      ? ctx.field_size_acres
                      : null;
            return {
                ...fc,
                displayFieldName: fc.displayFieldName,
                displayCrop,
                displayAcres,
            };
        },
        [fieldsMap, sourceUploadMap, getContext]
    );

    const getUploadDisplayStatus = useCallback((rec) => {
        const rawStatus = rec.extractionStatus ?? rec.status ?? 'uploaded';
        const hasSavedNormalized = tests.some((t) => t.sourceUploadId === rec.id);
        return hasSavedNormalized && rawStatus === 'needs_review' ? 'saved' : rawStatus;
    }, [tests]);

    const filterOptions = useMemo(() => {
        if (!backendRecordsMode) {
            return { fields: [], crops: [], statuses: [] };
        }

        const fields = new Set();
        const crops = new Set();
        const statuses = new Set();

        uploadRecords.forEach((rec) => {
            const ctx = getContext(rec);
            const fieldName =
                (rec.linkedFieldId && fieldsMap.get(rec.linkedFieldId)) ||
                rec.linkedFieldName ||
                rec.field_name ||
                rec.enteredFieldLabel ||
                ctx?.field_name;
            const crop = ctx?.intended_crop;
            const status = getUploadDisplayStatus(rec);
            if (fieldName) fields.add(fieldName);
            if (crop) crops.add(crop);
            if (status) statuses.add(status);
        });

        tests.forEach((test) => {
            const { displayFieldName, displayCrop } = getSavedSoilDisplay(test);
            if (displayFieldName) fields.add(displayFieldName);
            if (displayCrop) crops.add(displayCrop);
        });

        yieldRecords.forEach((rec) => {
            const fc = getCanonicalFieldContextForYieldRecord(rec, fieldsMap, sourceUploadMap, getContext);
            const crop = rec.crop ?? rec.crop_type ?? null;
            if (fc.displayFieldName) fields.add(fc.displayFieldName);
            if (crop) crops.add(crop);
        });

        return {
            fields: Array.from(fields).sort((a, b) => String(a).localeCompare(String(b))),
            crops: Array.from(crops).sort((a, b) => String(a).localeCompare(String(b))),
            statuses: Array.from(statuses).sort((a, b) => String(a).localeCompare(String(b))),
        };
    }, [backendRecordsMode, uploadRecords, tests, yieldRecords, fieldsMap, sourceUploadMap, getSavedSoilDisplay, getUploadDisplayStatus, getContext]);

    const filteredUploadRecords = useMemo(() => {
        if (!backendRecordsMode) return uploadRecords;
        return uploadRecords.filter((rec) => {
            const ctx = getContext(rec);
            const displayFieldName =
                (rec.linkedFieldId && fieldsMap.get(rec.linkedFieldId)) ||
                rec.linkedFieldName ||
                rec.field_name ||
                rec.enteredFieldLabel ||
                ctx?.field_name ||
                "";
            const displayCrop = ctx?.intended_crop || "";
            const displayStatus = getUploadDisplayStatus(rec);
            const family = rec.documentFamily === 'yield_scale_ticket' ? 'yield' : 'soil';

            if (recordFilters.field !== "all" && displayFieldName !== recordFilters.field) return false;
            if (recordFilters.crop !== "all" && displayCrop !== recordFilters.crop) return false;
            if (recordFilters.status !== "all" && displayStatus !== recordFilters.status) return false;
            if (recordFilters.family !== "all" && family !== recordFilters.family) return false;
            return true;
        });
    }, [backendRecordsMode, uploadRecords, recordFilters, getUploadDisplayStatus, fieldsMap, getContext]);

    const filteredSavedSoil = useMemo(() => {
        if (!backendRecordsMode) return tests;
        return tests.filter((test) => {
            const { displayFieldName, displayCrop } = getSavedSoilDisplay(test);
            if (recordFilters.family === "yield") return false;
            if (recordFilters.field !== "all" && displayFieldName !== recordFilters.field) return false;
            if (recordFilters.crop !== "all" && (displayCrop || "") !== recordFilters.crop) return false;
            return true;
        });
    }, [backendRecordsMode, tests, recordFilters, getSavedSoilDisplay]);

    const filteredSavedYield = useMemo(() => {
        if (!backendRecordsMode) return yieldRecords;
        return yieldRecords.filter((rec) => {
            const fc = getCanonicalFieldContextForYieldRecord(rec, fieldsMap, sourceUploadMap, getContext);
            const crop = rec.crop ?? rec.crop_type ?? "";
            if (recordFilters.family === "soil") return false;
            if (recordFilters.field !== "all" && fc.displayFieldName !== recordFilters.field) return false;
            if (recordFilters.crop !== "all" && crop !== recordFilters.crop) return false;
            return true;
        });
    }, [backendRecordsMode, yieldRecords, fieldsMap, sourceUploadMap, recordFilters, getContext]);

    const dataSheetRows = useMemo(() => {
        if (!backendRecordsMode) return [];

        const soilRows = filteredSavedSoil.map((test) => {
            const { displayFieldName, displayCrop, displayAcres, sourceFieldLabel } = getSavedSoilDisplay(test);
            const sd = test.soil_data || {};
            return {
                id: test.id,
                rowKind: "soil",
                family: "Soil Test",
                fieldName: displayFieldName,
                sourceFieldLabel: sourceFieldLabel || "",
                crop: displayCrop ?? "",
                acres: displayAcres ?? test.field_size_acres ?? null,
                shi: test.soil_health_index ?? null,
                recordDateRaw: test.test_date,
                lastUpdatedRaw: test.updated_date,
                ph: sd.ph ?? null,
                organicMatter: sd.organic_matter ?? null,
                nitrogen: sd.nitrogen ?? null,
                phosphorus: sd.phosphorus ?? null,
                potassium: sd.potassium ?? null,
                calcium: sd.calcium ?? null,
                magnesium: sd.magnesium ?? null,
                sulfur: sd.sulfur ?? null,
                cec: sd.cec ?? null,
                zinc: sd.zinc ?? null,
                copper: sd.copper ?? null,
                iron: sd.iron ?? null,
            };
        });

        const yieldRows = filteredSavedYield.map((rec) => {
            const fc = getCanonicalFieldContextForYieldRecord(rec, fieldsMap, sourceUploadMap, getContext);
            const fieldName = fc.displayFieldName;
            const cropRaw = rec.crop ?? rec.crop_type ?? "—";
            const crop =
                cropRaw && cropRaw !== "—"
                    ? cropRaw.charAt(0).toUpperCase() + cropRaw.slice(1).toLowerCase()
                    : cropRaw;
            const netBushelsValue =
                rec.net_bushels ??
                rec.netBushels ??
                rec.quantity_bushels ??
                rec.quantityBushels ??
                null;
            const priceValue =
                rec.price_per_bu ?? rec.pricePerBushel ?? rec.price_per_bushel ?? null;
            const moisture =
                rec.moisture ?? rec.moisture_pct ?? rec.moisture_percent ?? rec.moisturePct ?? null;
            const testWeight = rec.test_weight ?? rec.testWeight ?? null;
            const truckVehicle =
                rec.truck ??
                rec.vehicle ??
                rec.truck_id ??
                rec.truck_number ??
                rec.truckNumber ??
                null;
            const grossWeight = rec.gross_weight ?? rec.grossWeight ?? null;
            const tareWeight = rec.tare_weight ?? rec.tareWeight ?? null;
            const netWeight = rec.net_weight ?? rec.netWeight ?? null;
            const grossBushels = rec.gross_bushels ?? rec.grossBushels ?? null;
            const shrink = rec.shrink ?? rec.shrink_percent ?? rec.shrinkPct ?? null;
            return {
                id: rec.id,
                rowKind: "yield",
                family: "Yield Ticket",
                fieldName,
                sourceFieldLabel: fc.sourceFieldLabel || "",
                crop: crop === "—" ? "" : crop,
                recordDateRaw: rec.ticket_date ?? rec.ticketDate,
                lastUpdatedRaw: rec.updatedAt ?? rec.createdAt,
                ticketNumber: rec.ticket_number ?? rec.ticketNumber ?? null,
                truckVehicle,
                grossWeight,
                tareWeight,
                netWeight,
                moisture,
                testWeight,
                grossBushels,
                shrink,
                netBushels: netBushelsValue,
                pricePerBu: priceValue,
            };
        });

        if (dataSheetType === SHEET_YIELD) return yieldRows;
        if (dataSheetType === SHEET_FIELDS) {
            const groups = new Map();

            const ensure = (groupKey, fieldId, fieldLabel) => {
                if (!groups.has(groupKey)) {
                    groups.set(groupKey, {
                        fieldId: fieldId ?? null,
                        fieldLabel: fieldLabel || "Unnamed",
                        soilTests: [],
                        yields: [],
                    });
                }
                return groups.get(groupKey);
            };

            filteredSavedSoil.forEach((test) => {
                const fc = getCanonicalFieldContextForSoilTest(test, fieldsMap, sourceUploadMap, getContext);
                const g = ensure(fc.groupKey, fc.canonicalFieldId, fc.displayFieldName);
                g.soilTests.push(test);
            });

            filteredSavedYield.forEach((rec) => {
                const fc = getCanonicalFieldContextForYieldRecord(rec, fieldsMap, sourceUploadMap, getContext);
                const g = ensure(fc.groupKey, fc.canonicalFieldId, fc.displayFieldName);
                g.yields.push(rec);
            });

            const parseMs = (v) => {
                if (v == null || v === "") return null;
                try {
                    const d = typeof v === "string" ? parseISO(v) : new Date(v);
                    return isValid(d) ? d.getTime() : null;
                } catch {
                    return null;
                }
            };

            const out = [];
            groups.forEach((g, groupKey) => {
                const fieldId = g.fieldId;
                const fieldName = fieldId ? fieldsMap.get(fieldId) || g.fieldLabel : g.fieldLabel;
                const acres = fieldId ? fieldAcresMap.get(fieldId) ?? null : null;

                const soilTests = g.soilTests;
                const yields = g.yields;

                const soilLatest = [...soilTests].sort((a, b) => {
                    const ta = parseMs(a.test_date) ?? 0;
                    const tb = parseMs(b.test_date) ?? 0;
                    return tb - ta;
                })[0];
                const sdLatest = soilLatest?.soil_data || {};

                const latestSoilDates = soilTests.map((t) => parseMs(t.test_date)).filter(Boolean);
                const latestYieldDates = yields.map((r) =>
                    parseMs(r.ticket_date ?? r.ticketDate)
                ).filter(Boolean);

                const latestSoilDateMs = latestSoilDates.length ? Math.max(...latestSoilDates) : null;
                const latestYieldDateMs = latestYieldDates.length ? Math.max(...latestYieldDates) : null;

                let totalNet = 0;
                let hasNet = false;
                yields.forEach((r) => {
                    const n =
                        r.net_bushels ??
                        r.netBushels ??
                        r.quantity_bushels ??
                        r.quantityBushels ??
                        null;
                    if (n != null && Number.isFinite(Number(n))) {
                        totalNet += Number(n);
                        hasNet = true;
                    }
                });

                const allUpdates = [
                    ...soilTests.map((t) => parseMs(t.updated_date)),
                    ...yields.map((r) => parseMs(r.updatedAt ?? r.createdAt)),
                ].filter(Boolean);
                const lastUpdatedMs = allUpdates.length ? Math.max(...allUpdates) : null;

                const yLatest = yields.length
                    ? [...yields].sort(
                          (a, b) =>
                              (parseMs(b.ticket_date ?? b.ticketDate) ?? 0) -
                              (parseMs(a.ticket_date ?? a.ticketDate) ?? 0)
                      )[0]
                    : null;
                const tSoil = soilLatest ? parseMs(soilLatest.test_date) : 0;
                const tYield = yLatest ? parseMs(yLatest.ticket_date ?? yLatest.ticketDate) : 0;
                let latestCrop = "";
                if (yLatest && (!soilLatest || tYield > tSoil)) {
                    const c = yLatest.crop ?? yLatest.crop_type;
                    latestCrop = c != null && c !== "" ? String(c) : "";
                } else if (soilLatest?.crop_type) {
                    latestCrop = String(soilLatest.crop_type);
                }

                out.push({
                    id: `field-${groupKey}`,
                    rowKind: "field",
                    groupKey,
                    fieldId: fieldId || null,
                    fieldName: fieldName || "—",
                    acres,
                    latestCrop,
                    soilTestCount: soilTests.length,
                    yieldTicketCount: yields.length,
                    latestSoilDate: latestSoilDateMs ? new Date(latestSoilDateMs).toISOString() : null,
                    latestPh: sdLatest.ph ?? null,
                    latestP: sdLatest.phosphorus ?? null,
                    latestK: sdLatest.potassium ?? null,
                    latestYieldDate: latestYieldDateMs ? new Date(latestYieldDateMs).toISOString() : null,
                    totalNetBushels: hasNet ? totalNet : null,
                    lastUpdatedRaw: lastUpdatedMs ? new Date(lastUpdatedMs).toISOString() : null,
                });
            });

            return out.sort((a, b) => String(a.fieldName).localeCompare(String(b.fieldName)));
        }

        return soilRows;
    }, [
        backendRecordsMode,
        dataSheetType,
        fieldAcresMap,
        fieldsMap,
        filteredSavedSoil,
        filteredSavedYield,
        getSavedSoilDisplay,
        sourceUploadMap,
        getContext,
    ]);

    const openSoilView = useCallback(
        (test) => {
            // Guest / legacy path only: saved records still lead to a report page.
            navigate(createPageUrl(`Recommendations?test_id=${test.id}`));
        },
        [navigate]
    );

    const handleDataSheetView = useCallback(
        (row) => {
            if (row.rowKind === "field") {
                const gk = row.groupKey;
                if (!gk) {
                    toast.info("Missing field grouping for this row.");
                    return;
                }
                const soilTests = filteredSavedSoil.filter(
                    (t) =>
                        getCanonicalFieldContextForSoilTest(t, fieldsMap, sourceUploadMap, getContext).groupKey ===
                        gk
                );
                const yieldRecords = filteredSavedYield.filter(
                    (r) =>
                        getCanonicalFieldContextForYieldRecord(r, fieldsMap, sourceUploadMap, getContext).groupKey ===
                        gk
                );
                setFieldSummary({
                    open: true,
                    fieldId: row.fieldId ?? null,
                    fieldName: row.fieldName ?? "—",
                    soilTests,
                    yieldRecords,
                });
                return;
            }
            // Saved records: keep one consistent pattern (expand inline in Standard view).
            if (row.rowKind === "soil") {
                setSavedRecordsViewMode("standard");
                setExpandedRows((prev) => new Set(prev).add(row.id));
                requestAnimationFrame(() => {
                    document.getElementById(`soil-row-${row.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
            } else if (row.rowKind === "yield") {
                setSavedRecordsViewMode("standard");
                setExpandedYieldRows((prev) => new Set(prev).add(row.id));
                requestAnimationFrame(() => {
                    document.getElementById(`yield-row-${row.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
            }
        },
        [filteredSavedSoil, filteredSavedYield, fieldsMap, sourceUploadMap, getContext]
    );

    const handleExport = async () => {
        if (backendRecordsMode && savedRecordsViewMode === "datasheet" && savedRecordsDataSheetRef.current) {
            setIsExporting(true);
            try {
                savedRecordsDataSheetRef.current.exportCsv();
            } finally {
                setIsExporting(false);
            }
            return;
        }
        setIsExporting(true);
        try {
            const body = await exportSoilTests();
            const blob = blobFromExportSoilTestsResponse(body);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `soiltests-export-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Export complete – downloading file...");
        } catch (error) {
            console.error("Failed to export data:", error);
            toast.error(`Failed to export data: ${error.message || "Unknown error"}`);
        } finally {
            setIsExporting(false);
        }
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

    const toggleYieldRowExpansion = (recId) => {
        setExpandedYieldRows((prev) => {
            const next = new Set(prev);
            if (next.has(recId)) next.delete(recId);
            else next.add(recId);
            return next;
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
                                You are viewing temporary records. Create an account to get access and save your data permanently.
                                <Button 
                                    variant="link" 
                                    className="p-0 h-auto text-blue-800 underline ml-1"
                                    onClick={() => User.login()}
                                >
                                    Create an account
                                </Button>
                            </>
                        ) : (
                            "You're in demo mode. Any records you create will be automatically deleted after 24 hours."
                        )}
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="space-y-3">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-lg font-semibold text-green-900">
                            {backendRecordsMode ? "Evidence across fields" : "Records"}
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
                                        id="export"
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

                {backendRecordsMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <Select value={recordFilters.field} onValueChange={(value) => setRecordFilters((prev) => ({ ...prev, field: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Field" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All fields</SelectItem>
                                {filterOptions.fields.map((fieldName) => (
                                    <SelectItem key={fieldName} value={fieldName}>{fieldName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={recordFilters.family} onValueChange={(value) => setRecordFilters((prev) => ({ ...prev, family: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Family" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All families</SelectItem>
                                <SelectItem value="soil">Soil tests</SelectItem>
                                <SelectItem value="yield">Yield tickets</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={recordFilters.crop} onValueChange={(value) => setRecordFilters((prev) => ({ ...prev, crop: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Crop" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All crops</SelectItem>
                                {filterOptions.crops.map((crop) => (
                                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={recordFilters.status} onValueChange={(value) => setRecordFilters((prev) => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {filterOptions.statuses.map((status) => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {!backendRecordsMode && tests.length === 0 ? (
                <Card className="text-center p-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800">No Records Yet</h3>
                    <p className="text-gray-600">Upload a document to start building your Workbench records.</p>
                    <Button onClick={() => navigate(createPageUrl("Upload"))} className="mt-4 bg-green-600 hover:bg-green-700">
                        Add data
                    </Button>
                </Card>
            ) : backendRecordsMode ? (
                <>
                    {/* Upload records: backend status and extraction status drive UI */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-green-900">Incoming documents & evidence</h3>
                            <p className="text-sm text-slate-600">
                                PDFs and uploads land here first. Review and fix until status is ready — then they appear
                                as structured records below.
                            </p>
                        </div>
                        {filteredUploadRecords.length === 0 ? (
                            <Card className="text-center p-6">
                                <p className="text-gray-600">
                                    {uploadRecords.length === 0
                                        ? 'No uploads yet. Upload a PDF to see it here.'
                                        : 'No uploads match the selected filters.'}
                                </p>
                                <Button onClick={() => navigate(createPageUrl("Upload"))} className="mt-3 bg-green-600 hover:bg-green-700">Add data</Button>
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
                                        {filteredUploadRecords.map((rec) => {
                                            const ctx = getContext(rec);
                                            const rawStatus = rec.extractionStatus ?? rec.status ?? 'uploaded';
                                            const displayStatus = getUploadDisplayStatus(rec);
                                            return (
                                                <TableRow key={rec.id} className="hover:bg-green-50/50">
                                                    <TableCell className="font-medium">{rec.filename || '—'}</TableCell>
                                                    <TableCell>
                                                        {rec.documentFamily === 'yield_scale_ticket'
                                                            ? 'Yield Ticket'
                                                            : 'Soil Test'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {rec.linkedFieldName || rec.field_name || rec.enteredFieldLabel || ctx?.field_name || '—'}
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
                                                            <Badge variant="secondary">{displayStatus}</Badge>
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
                                                                state: {
                                                                    backendReviewUploadId: rec.id,
                                                                    backendReviewFilename: rec.filename || '',
                                                                    backendReviewDocumentFamily: rec.documentFamily || null,
                                                                }
                                                            })}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Review
                                                        </Button>
                                                        {displayStatus !== 'saved' && (rawStatus === 'extraction_failed' || rawStatus === 'extracted' || rawStatus === 'needs_review' || rawStatus === 'failed') && (
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
                    {/* Saved records (normalized soil + yield) */}
                    <div className="mt-10 space-y-6 border-t border-slate-200 pt-8">
                        <p className="text-sm text-slate-600">
                            Reviewed evidence becomes structured records. Use <strong>Standard</strong> for tables, or{" "}
                            <strong>Data Sheet</strong> to customize columns — then export CSV from this section.
                        </p>
                        <div
                            id="export"
                            className="flex flex-col gap-4 rounded-lg border border-slate-200/80 bg-white/60 p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between"
                        >
                            <div className="min-w-0 flex-1 space-y-1">
                                <h3 className="text-lg font-semibold text-green-900">Saved records, data sheet & export</h3>
                                {savedRecordsViewMode === "datasheet" && (
                                    <p className="text-sm text-green-800/90">
                                        Use the <strong>Family</strong> filter above to show all families, soil tests only, or yield tickets only.
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button onClick={handleExport} disabled={isExporting} variant="default">
                                                <Download className="mr-2 h-4 w-4" />
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
                                <Tabs
                                    value={savedRecordsViewMode}
                                    onValueChange={setSavedRecordsViewMode}
                                    className="w-full sm:w-auto"
                                >
                                    <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                                        <TabsTrigger value="standard">Standard</TabsTrigger>
                                        <TabsTrigger value="datasheet">Data Sheet</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>

                            {savedRecordsViewMode === "datasheet" ? (
                                <>
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950 md:hidden">
                                        Data Sheet is optimized for desktop. Switch to Standard or use a wider screen for the full spreadsheet.
                                    </div>
                                    <div className="hidden md:block">
                                        <SavedRecordsDataSheet
                                            ref={savedRecordsDataSheetRef}
                                            rows={dataSheetRows}
                                            sheetType={dataSheetType}
                                            onSheetTypeChange={setDataSheetType}
                                            onViewRecord={handleDataSheetView}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                            {filteredSavedSoil.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-md font-semibold text-green-800">Saved Soil Tests</h4>
                                    <div className="overflow-x-auto border rounded-lg bg-white">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12"></TableHead>
                                                    <TableHead>Field</TableHead>
                                                    <TableHead>Test Date</TableHead>
                                                    <TableHead>Crop</TableHead>
                                                    <TableHead>SHI</TableHead>
                                                    <TableHead>Last Updated</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredSavedSoil.map(test => {
                                                    const { displayFieldName, displayCrop, displayAcres, sourceFieldLabel, canonicalFieldId } = getSavedSoilDisplay(test);
                                                    const testDateStr = formatDateOnlySafe(test.test_date) || 'N/A';
                                                    return (
                                                        <React.Fragment key={test.id}>
                                                            <TableRow id={`soil-row-${test.id}`} className="hover:bg-green-50/50 cursor-pointer">
                                                                <TableCell>
                                                                    <Button variant="ghost" size="sm" onClick={() => toggleRowExpansion(test.id)} className="p-1 h-6 w-6">
                                                                        {expandedRows.has(test.id) ? '−' : '+'}
                                                                    </Button>
                                                                </TableCell>
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <div>{displayFieldName}</div>
                                                                            {sourceFieldLabel && sourceFieldLabel !== displayFieldName && (
                                                                                <div className="text-xs font-normal text-gray-500">Source: {sourceFieldLabel}</div>
                                                                            )}
                                                                        </div>
                                                                        {canonicalFieldId && (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-gray-500 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); navigate(createFieldDeepLink(canonicalFieldId)); }}>
                                                                                            <MapPin className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent><p>View on Map</p></TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{testDateStr}</TableCell>
                                                                <TableCell>{displayCrop ?? 'N/A'}</TableCell>
                                                                <TableCell><Badge>{test.soil_health_index || 'N/A'}</Badge></TableCell>
                                                                <TableCell>{formatLastUpdated(test.updated_date)}</TableCell>
                                                                <TableCell className="space-x-2">
                                                                    <Button variant="ghost" size="icon" onClick={() => setTestToEdit(test)}><Edit className="w-4 h-4" /></Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => setTestToDelete(test)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                                </TableCell>
                                                            </TableRow>
                                                            {expandedRows.has(test.id) && (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} className="p-0 bg-gray-50/50">
                                                                        <div className="space-y-4 p-4">
                                                                            <SoilFieldLinkControl
                                                                                test={test}
                                                                                canonicalFields={canonicalFields}
                                                                                onPatched={(patch) => {
                                                                                    setTests((prev) =>
                                                                                        prev.map((t) =>
                                                                                            t.id === test.id ? { ...t, ...patch } : t
                                                                                        )
                                                                                    );
                                                                                }}
                                                                            />
                                                                            <div className="rounded-lg border border-slate-200 bg-white">
                                                                                <ExpandableRow
                                                                                    test={test}
                                                                                    displayFieldName={displayFieldName}
                                                                                    displayCrop={displayCrop}
                                                                                    displayAcres={displayAcres}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
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

                            {filteredSavedYield.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-md font-semibold text-green-800">Saved Yield Tickets</h4>
                                    <div className="overflow-x-auto border rounded-lg bg-white">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12"></TableHead>
                                                    <TableHead>Ticket Number</TableHead>
                                                    <TableHead>Field</TableHead>
                                                    <TableHead>Crop</TableHead>
                                                    <TableHead>Ticket Date</TableHead>
                                                    <TableHead>Net Bushels</TableHead>
                                                    <TableHead>Price/Bu</TableHead>
                                                    <TableHead>Last Updated</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredSavedYield.map((rec) => {
                                                    const fc = getCanonicalFieldContextForYieldRecord(rec, fieldsMap, sourceUploadMap, getContext);
                                                    const ticketNumber = rec.ticket_number ?? rec.ticketNumber ?? '—';
                                                    const fieldName = fc.displayFieldName;
                                                    const cropRaw = rec.crop ?? rec.crop_type ?? '—';
                                                    const crop = cropRaw && cropRaw !== '—'
                                                        ? cropRaw.charAt(0).toUpperCase() + cropRaw.slice(1).toLowerCase()
                                                        : cropRaw;
                                                    const ticketDateRaw = rec.ticket_date ?? rec.ticketDate ?? null;
                                                    const ticketDate = ticketDateRaw
                                                        ? (formatDateOnlySafe(ticketDateRaw) || format(new Date(ticketDateRaw), 'MMM d, yyyy'))
                                                        : '—';
                                                    const netBushelsValue =
                                                        rec.net_bushels ??
                                                        rec.netBushels ??
                                                        rec.quantity_bushels ??
                                                        rec.quantityBushels ??
                                                        null;
                                                    const netBushels = netBushelsValue ?? '—';
                                                    const priceValue =
                                                        rec.price_per_bu ??
                                                        rec.pricePerBushel ??
                                                        rec.price_per_bushel ??
                                                        null;
                                                    const price = priceValue ?? '—';
                                                    const lastUpdated = formatLastUpdated(rec.updatedAt ?? rec.createdAt);

                                                    return (
                                                        <React.Fragment key={rec.id}>
                                                            <TableRow id={`yield-row-${rec.id}`} className="hover:bg-green-50/50">
                                                                <TableCell className="w-12">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => toggleYieldRowExpansion(rec.id)}
                                                                        className="h-6 w-6 p-1"
                                                                    >
                                                                        {expandedYieldRows.has(rec.id) ? '−' : '+'}
                                                                    </Button>
                                                                </TableCell>
                                                                <TableCell className="font-medium">{ticketNumber}</TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <div>{fieldName}</div>
                                                                            {fc.sourceFieldLabel && fc.sourceFieldLabel !== fieldName && (
                                                                                <div className="text-xs text-gray-500">Source: {fc.sourceFieldLabel}</div>
                                                                            )}
                                                                        </div>
                                                                        {fc.canonicalFieldId && (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-7 w-7 shrink-0 text-gray-500 hover:text-blue-600"
                                                                                            onClick={() => navigate(createFieldDeepLink(fc.canonicalFieldId))}
                                                                                        >
                                                                                            <MapPin className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent><p>Open field</p></TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{crop}</TableCell>
                                                                <TableCell>{ticketDate}</TableCell>
                                                                <TableCell>{netBushels}</TableCell>
                                                                <TableCell>{price}</TableCell>
                                                                <TableCell>{lastUpdated}</TableCell>
                                                                <TableCell />
                                                            </TableRow>
                                                            {expandedYieldRows.has(rec.id) && (
                                                                <TableRow>
                                                                    <TableCell colSpan={9} className="p-0 bg-gray-50/50">
                                                                        <YieldExpandableRow
                                                                            rec={rec}
                                                                            fieldContext={fc}
                                                                            onOpenMap={
                                                                                fc?.canonicalFieldId
                                                                                    ? () => navigate(createFieldDeepLink(fc.canonicalFieldId))
                                                                                    : undefined
                                                                            }
                                                                        />
                                                                    </TableCell>
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
                            {filteredSavedSoil.length === 0 && filteredSavedYield.length === 0 && (
                                <Card className="mt-4 p-6 text-center">
                                    <p className="text-gray-600">
                                        {(tests.length > 0 || yieldRecords.length > 0)
                                            ? "No saved records match the selected filters."
                                            : "Uploads can be reviewed and normalized into saved records here once extraction is complete."}
                                    </p>
                                </Card>
                            )}
                                </>
                            )}
                    </div>
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
                                            <TableHead>Test Date</TableHead>
                                            <TableHead>Crop</TableHead>
                                            <TableHead>SHI</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tests.map(test => {
                                            const { displayFieldName, displayCrop, sourceFieldLabel, canonicalFieldId } = getSavedSoilDisplay(test);
                                            const testDateStr = formatDateOnlySafe(test.test_date) || 'N/A';
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
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-start gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <div>{displayFieldName}</div>
                                                                    {sourceFieldLabel && sourceFieldLabel !== displayFieldName && (
                                                                        <div className="text-xs font-normal text-gray-500">Source: {sourceFieldLabel}</div>
                                                                    )}
                                                                </div>
                                                                {canonicalFieldId && (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7 shrink-0 text-gray-500 hover:text-blue-600"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigate(createFieldDeepLink(canonicalFieldId));
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
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{testDateStr}</TableCell>
                                                        <TableCell>{displayCrop ?? 'N/A'}</TableCell>
                                                        <TableCell><Badge>{test.soil_health_index || 'N/A'}</Badge></TableCell>
                                                        <TableCell>{formatLastUpdated(test.updated_date)}</TableCell>
                                                        <TableCell className="space-x-2">
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
                                                            <TableCell colSpan={7} className="p-0 bg-gray-50/50">
                                                                <ExpandableRow
                                                                    test={test}
                                                                    displayFieldName={displayFieldName}
                                                                    displayCrop={displayCrop}
                                                                    displayAcres={getSavedSoilDisplay(test).displayAcres}
                                                                />
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
                                const { displayFieldName, displayCrop, sourceFieldLabel, canonicalFieldId } = getSavedSoilDisplay(test);
                                const testDateStr = formatDateOnlySafe(test.test_date) || 'N/A';
                                return (
                                <Card key={test.id} className="shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {/* Header row */}
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 flex-1 mr-3">
                                                    <h3 className="font-bold text-lg text-gray-900 truncate">{displayFieldName}</h3>
                                                    {sourceFieldLabel && sourceFieldLabel !== displayFieldName && (
                                                        <p className="text-xs text-gray-500">Source: {sourceFieldLabel}</p>
                                                    )}
                                                    <p className="text-sm text-gray-500">
                                                        {testDateStr}
                                                    </p>
                                                </div>
                                                <Badge className="flex-shrink-0">{test.soil_health_index || 'N/A'}</Badge>
                                            </div>
                                            
                                            {/* Details grid */}
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Crop:</span>
                                                    <div className="font-medium text-gray-900">{displayCrop ?? 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Updated:</span>
                                                    <div className="font-medium text-gray-900 text-xs">{formatLastUpdated(test.updated_date)}</div>
                                                </div>
                                            </div>
                                            
                                            {/* Action buttons */}
                                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                                                {canonicalFieldId && (
                                                    <Button variant="outline" size="sm" onClick={() => navigate(createFieldDeepLink(canonicalFieldId))} className="flex-1 min-w-0">
                                                        <MapPin className="w-3 h-3 mr-1" /> 
                                                        <span className="truncate">Map</span>
                                                    </Button>
                                                )}
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

            <FieldSummaryDrawer
                open={!!fieldSummary}
                onOpenChange={(v) => {
                    if (!v) setFieldSummary(null);
                }}
                fieldName={fieldSummary?.fieldName}
                fieldId={fieldSummary?.fieldId}
                soilTests={fieldSummary?.soilTests ?? []}
                yieldRecords={fieldSummary?.yieldRecords ?? []}
                onOpenMap={
                    fieldSummary?.fieldId
                        ? () => navigate(createFieldDeepLink(fieldSummary.fieldId))
                        : undefined
                }
                formatLastUpdated={formatLastUpdated}
            />

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
