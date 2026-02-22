
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";
import { ClipboardList, AlertTriangle } from "lucide-react";
import PracticeItem from "./PracticeItem";

export default function PracticeList({ practices, isLoading, onStatusChange, onDelete, onEdit, soilTests }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          <ClipboardList className="w-6 h-6 text-green-600" />
          Logged Practices ({practices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {practices.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Your Practice Log is Empty</h3>
            <p className="text-green-700 max-w-md mx-auto">Log a new practice to get started, or add recommended practices from your AI Soil Analysis reports.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {practices.map((practice) => (
                <PracticeItem
                  key={practice.id}
                  practice={practice}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  soilTests={soilTests}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
