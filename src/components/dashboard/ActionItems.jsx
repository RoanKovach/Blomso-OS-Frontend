import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ListTodo, Sprout, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActionItems({ practices, soilTests }) {
  const pendingPractices = practices.filter(p => !p.completed).slice(0, 3);
  const priorityActions = soilTests.length > 0 ? soilTests[0].ai_recommendations?.priority_actions?.slice(0, 2) || [] : [];

  const hasContent = pendingPractices.length > 0 || priorityActions.length > 0;

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-green-100">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
          <ListTodo className="w-6 h-6 text-green-600" />
          Action Items
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasContent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Info className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">No Actions Yet</h3>
            <p className="text-green-700">Upload a soil test to get AI-powered recommendations and log your practices.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {priorityActions.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-amber-500" />
                  AI-Recommended Priorities
                </h4>
                <div className="space-y-3">
                  {priorityActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="w-1.5 h-1.5 mt-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                      <p className="text-amber-800 text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingPractices.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Pending Practices
                </h4>
                <div className="space-y-2">
                  {pendingPractices.map((practice) => (
                    <div key={practice.id} className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="font-medium text-blue-900 text-sm">{practice.practice_name}</span>
                      <Badge variant="outline">{practice.practice_type.replace('_', ' ')}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Link to={createPageUrl("Practices")}>
              <Button variant="outline" className="w-full mt-4 border-green-200 hover:bg-green-100">
                View All Practices
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}