import React, { useRef } from 'react';
import { UploadCloud, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FileUploadZone({ onFileSelect, dragActive, selectedFile }) {
  const fileInputRef = useRef(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file) => {
    if (file.type === "application/pdf") return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className={`transition-all duration-200 ${dragActive ? "bg-green-50" : "bg-white"}`}>
      <div className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={onFileSelect}
          className="hidden"
        />
        
        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive 
                ? "border-green-400 bg-green-50" 
                : "border-green-200 hover:border-green-300"
            }`}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Upload Your Soil Test</h3>
            <p className="text-green-700 mb-6">
              Drag & drop your soil test report, or click to browse
            </p>
            <Button
              type="button"
              onClick={handleBrowseClick}
              className="bg-green-600 hover:bg-green-700 shadow-lg mb-4"
            >
              <UploadCloud className="w-5 h-5 mr-2" />
              Choose File
            </Button>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Badge variant="outline" className="border-green-200 text-green-700">PDF</Badge>
            </div>
          </div>
        ) : (
          <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50">
            <div className="flex items-center gap-4">
              {getFileIcon(selectedFile)}
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">{selectedFile.name}</h4>
                <p className="text-sm text-green-700">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Ready to Process
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}