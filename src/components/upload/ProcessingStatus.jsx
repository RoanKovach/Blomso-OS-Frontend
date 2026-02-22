import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, FileText, TrendingUp, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProcessingStatus({ step }) {
  const steps = [
    { id: 1, title: "Uploading file...", icon: FileText },
    { id: 2, title: "Extracting soil data...", icon: Brain },
    { id: 3, title: "Analyzing soil health...", icon: TrendingUp },
    { id:4, title: "Preparing results...", icon: CheckCircle2 },
    { id: 5, title: "Analysis complete!", icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.title === step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          <Brain className="w-6 h-6 text-green-600" />
          AI Processing Your Soil Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-8 h-8 text-green-600" />
            </motion.div>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">{step}</h3>
          <p className="text-green-700">Our AI is analyzing your soil data using advanced agricultural algorithms...</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-700">Progress</span>
            <span className="text-green-900 font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((stepItem, index) => {
            const StepIcon = stepItem.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div
                key={stepItem.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isCompleted 
                    ? "bg-green-100 border border-green-200" 
                    : isCurrent 
                    ? "bg-blue-100 border border-blue-200" 
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <StepIcon className={`w-5 h-5 ${
                  isCompleted 
                    ? "text-green-600" 
                    : isCurrent 
                    ? "text-blue-600" 
                    : "text-gray-400"
                }`} />
                <span className={`font-medium ${
                  isCompleted 
                    ? "text-green-900" 
                    : isCurrent 
                    ? "text-blue-900" 
                    : "text-gray-500"
                }`}>
                  {stepItem.title}
                </span>
                {isCompleted && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}