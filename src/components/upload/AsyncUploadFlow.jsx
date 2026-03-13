import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { User } from "@/api/entities";

/**
 * Component for displaying async upload progress and results.
 * When backendUploadOnly is true, copy reflects backend reality: upload complete, extraction started (no implied AI success).
 * When isDemoUser and error are set, shows a create-account CTA instead of a raw error so demo users are guided to sign up.
 */
export default function AsyncUploadFlow({ 
  isProcessing, 
  progress, 
  currentStep, 
  result, 
  error, 
  onRetry, 
  onContinue,
  canRetry = false,
  backendUploadOnly = false,
  isDemoUser = false,
}) {
  if (!isProcessing && !result && !error) {
    return null;
  }

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          {isProcessing && <Brain className="w-6 h-6 text-green-600" />}
          {result && <CheckCircle2 className="w-6 h-6 text-green-600" />}
          {error && !isDemoUser && <AlertCircle className="w-6 h-6 text-red-600" />}
          {error && isDemoUser && <AlertCircle className="w-6 h-6 text-amber-600" />}
          
          {isProcessing && (backendUploadOnly ? "Uploading…" : "Processing Your Soil Test")}
          {result && (backendUploadOnly ? "Upload complete" : "Processing Complete!")}
          {error && (isDemoUser ? "Create an account to continue" : "Processing Failed")}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Processing State */}
        {isProcessing && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-8 h-8 text-green-600" />
                </motion.div>
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">{currentStep || (backendUploadOnly ? 'Uploading file' : 'Analyzing')}</h3>
              <p className="text-green-700">
                {backendUploadOnly ? 'Uploading your file and starting extraction…' : 'Our AI is analyzing your soil data using advanced algorithms...'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Progress</span>
                <span className="text-green-900 font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>
        )}

        {/* Success State */}
        {result && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                {backendUploadOnly ? 'Upload complete' : `Successfully Processed ${result.count} Record${result.count !== 1 ? 's' : ''}!`}
              </h3>
              <p className="text-green-700">
                {backendUploadOnly
                  ? 'Extraction has been started. Continue to review when it’s ready (you can also open this upload from My Records).'
                  : 'Your soil test data has been analyzed and saved. You can now review the extracted zones.'}
              </p>
            </div>
            {onContinue && (
              <Button 
                onClick={onContinue} 
                className="bg-green-600 hover:bg-green-700"
              >
                Continue to Review
              </Button>
            )}
          </motion.div>
        )}

        {/* Error State */}
        {error && !isProcessing && (
          <div className="space-y-4">
            {isDemoUser ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-6 text-center space-y-4">
                <p className="text-amber-900 font-medium">
                  Processing requires an account. Create an account to upload and analyze documents with the full pipeline.
                </p>
                <Button
                  onClick={() => User.login()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create an account
                </Button>
              </div>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Processing Failed:</strong> {error}
                  </AlertDescription>
                </Alert>
                {canRetry && onRetry && (
                  <div className="text-center">
                    <Button 
                      onClick={onRetry} 
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry Processing
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}