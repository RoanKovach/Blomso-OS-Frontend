
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  MapPin,
  Trash2,
  Eye,
  Edit3,
  Check,
  X,
  Info,
  Pencil,
  FileUp
} from 'lucide-react';

// Import the linking panel component
import SoilTestLinkingPanel from './SoilTestLinkingPanel';

export default function FieldSidebar({ 
  // Field data and operations
  fields,
  isLoading,
  selectedField,
  onFieldSelect,
  onDeleteField,
  searchTerm,
  onSearchChange,
  
  // Drawing state and controls
  mode,
  onModeChange,
  drawingPoints,
  onFinishDrawing,
  onCancelDrawing,
  canFinishDrawing,
  drawInteraction = 'place',
  onDrawInteractionChange,
  
  // Upload functionality
  onUploadShapefile,
  
  // New prop for linking callback
  onSoilTestLinked
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200/90 p-3">
        <h2 className="mb-2 text-base font-semibold text-gray-800">Fields</h2>
        
        {/* Mode Controls */}
        <div className="mb-2 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={mode === 'view' ? 'default' : 'outline'}
            onClick={() => onModeChange('view')}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant={mode === 'draw' ? 'default' : 'outline'}
            onClick={() => onModeChange('draw')}
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Draw
          </Button>
        </div>

        {/* Actions - Upload Shapefile Button */}
        <Button size="sm" variant="outline" className="mb-2 w-full" onClick={onUploadShapefile}>
          <FileUp className="w-4 h-4 mr-2" />
          Upload Shapefile
        </Button>

        {/* Drawing Controls - Only show when in draw mode */}
        {mode === 'draw' && (
          <Card className="mb-2">
            <CardContent className="p-2.5">
              {typeof onDrawInteractionChange === 'function' && (
                <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={drawInteraction === 'place' ? 'default' : 'ghost'}
                    className="h-8 text-xs"
                    onClick={() => onDrawInteractionChange('place')}
                  >
                    Place points
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={drawInteraction === 'pan' ? 'default' : 'ghost'}
                    className="h-8 text-xs"
                    onClick={() => onDrawInteractionChange('pan')}
                  >
                    Pan map
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-sm text-gray-600">
                  {drawInteraction === 'pan' && (
                    <>Drag the map to move. Choose <strong>Place points</strong> to add corners.</>
                  )}
                  {drawInteraction === 'place' && drawingPoints.length === 0 && (
                    <>Click the map to place corners (drag-to-pan is off so clicks stay precise).</>
                  )}
                  {drawInteraction === 'place' && drawingPoints.length === 1 && "Add more points to define boundary"}
                  {drawInteraction === 'place' && drawingPoints.length === 2 && "Add more points to define boundary"}
                  {drawInteraction === 'place' && drawingPoints.length >= 3 && `${drawingPoints.length} points — click Finish when done`}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={onFinishDrawing} 
                  disabled={!canFinishDrawing}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Finish
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={onCancelDrawing}
                  disabled={drawingPoints.length === 0}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar - Only show in view mode */}
        {mode === 'view' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search fields..."
              value={searchTerm}
              onChange={onSearchChange}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {/* Fields List */}
          <div>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No fields yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Use Draw mode to create your first field
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map(field => (
                  <Card 
                    key={field.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedField?.id === field.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => onFieldSelect(field)}
                  >
                    <CardContent className="p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-800 truncate">
                          {field.field_name ?? field.name ?? field.normalizedName ?? field.id}
                        </h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteField(field);
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {field.acres ? `${Math.round(field.acres)} acres` : 'N/A'}
                        </Badge>
                        {field.current_crop && (
                          <Badge variant="secondary" className="text-xs">
                            {field.current_crop}
                          </Badge>
                        )}
                      </div>
                      
                      {field.current_metrics?.health_score && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Health:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${field.current_metrics.health_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {field.current_metrics.health_score}%
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {selectedField && mode === 'view' && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <SoilTestLinkingPanel
                selectedField={selectedField}
                registryFields={fields}
                fieldsLoading={isLoading}
                onLinked={onSoilTestLinked}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
