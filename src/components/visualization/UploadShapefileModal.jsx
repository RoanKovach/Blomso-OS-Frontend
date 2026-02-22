import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadFile } from "@/api/integrations";
import { processShapefile } from "@/api/functions";
import { Upload, Loader2, CheckCircle2, AlertCircle, FileUp } from "lucide-react";

export default function UploadShapefileModal({ isOpen, onClose, onComplete }) {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete, error
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const resetState = () => {
        setFile(null);
        setStatus('idle');
        setError('');
        setResult(null);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/zip') {
                setError('Invalid file type. Please upload a .zip file.');
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus('uploading');
        setError('');

        try {
            // Step 1: Upload the file
            const { file_url } = await UploadFile({ file });
            if (!file_url) throw new Error("File upload failed to return a URL.");

            // Step 2: Process the file
            setStatus('processing');
            const { data: processResult, error: processError } = await processShapefile({ file_url });
            
            if (processError) throw new Error(processError.details || 'Processing failed.');
            
            setResult(processResult);
            setStatus('complete');
            onComplete(); // Trigger refetch in parent

        } catch (err) {
            setError(err.message || "An unknown error occurred.");
            setStatus('error');
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="z-[2000]">
                <DialogHeader>
                    <DialogTitle>Upload Shapefile (.zip)</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {status === 'idle' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Upload a single .zip file containing your shapefile (.shp, .shx, .dbf, .prj). The system will automatically create fields for each polygon found.
                            </p>
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".zip"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">
                                    {file ? file.name : 'Click to select a .zip file'}
                                </p>
                            </div>
                        </div>
                    )}

                    {(status === 'uploading' || status === 'processing') && (
                        <div className="flex flex-col items-center justify-center space-y-4 p-8">
                            <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                            <p className="text-lg font-medium">
                                {status === 'uploading' ? 'Uploading file...' : 'Processing shapefile...'}
                            </p>
                            <p className="text-sm text-gray-500">Please wait, this may take a moment.</p>
                        </div>
                    )}
                    
                    {status === 'complete' && result && (
                        <Alert variant="success">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Upload Successful!</AlertTitle>
                            <AlertDescription>
                                Successfully created {result.created} new field(s). The field list will now update.
                            </AlertDescription>
                        </Alert>
                    )}

                    {status === 'error' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Upload Failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        {status === 'complete' ? 'Close' : 'Cancel'}
                    </Button>
                    {status === 'idle' && file && (
                        <Button onClick={handleUpload}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload and Process
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}