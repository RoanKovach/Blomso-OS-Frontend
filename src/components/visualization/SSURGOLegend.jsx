import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers3, ChevronDown, ChevronUp, X, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SSURGOLegend({ legendData, isVisible, onClose, isDemo }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !legendData || legendData.length === 0) {
    return null;
  }

  const totalAcres = legendData.reduce((sum, item) => sum + (item.acres || 0), 0);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-3xl px-4">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg rounded-lg">
        <CardHeader className="py-3 px-4 flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers3 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-gray-800">
              SSURGO Soil Types
            </CardTitle>
            {isDemo && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                <Info className="w-3 h-3 mr-1" />
                Demo Render
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        {!isCollapsed && (
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {legendData.map((item) => {
                const percentage = totalAcres > 0 ? ((item.acres || 0) / totalAcres * 100) : 0;
                return (
                  <div key={item.muKey} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div 
                      className="w-5 h-5 rounded border border-gray-300 flex-shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate" title={item.muName}>
                        {item.muSymbol} - {item.muName}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">{Math.round(item.acres * 10) / 10} ac</span>
                        <span className="text-gray-500 ml-1">({Math.round(percentage)}%)</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.drainageClass} • {item.farmlandClass}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t text-sm">
              <div className="text-gray-600">
                <strong>{legendData.length}</strong> soil types identified
              </div>
              <div className="text-gray-600">
                Total Coverage: <strong>{Math.round(totalAcres * 10) / 10} acres</strong>
              </div>
            </div>
            
            {isDemo && (
              <div className="mt-3 pt-2 border-t">
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  <Info className="w-3 h-3 inline mr-1" />
                  This is a demo visualization. Actual SSURGO data integration coming soon.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}