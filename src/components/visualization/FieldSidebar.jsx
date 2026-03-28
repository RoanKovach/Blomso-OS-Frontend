
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  MapPin, 
  Trash2, 
  Eye, 
  Edit3,
  Check,
  X,
  Info,
  Pencil,
  FileUp, // Added FileUp icon
  Layers3, // Added Layers3 icon for map layers
  Loader2 // Added for loading state
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
  
  // Upload functionality
  onUploadShapefile,
  
  // New prop for linking callback
  onSoilTestLinked,

  // New SSURGO props
  showSSURGO,
  onSSURGOToggle,
  ssurgoLoading
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200/90 p-3">
        <h2 className="mb-2 text-base font-semibold text-gray-800">Field Management</h2>
        
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
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">
                  {drawingPoints.length === 0 && "Click on map to start drawing"}
                  {drawingPoints.length === 1 && "Add more points to define boundary"}
                  {drawingPoints.length === 2 && "Add more points to define boundary"}
                  {drawingPoints.length >= 3 && `${drawingPoints.length} points - click Finish when done`}
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
          {/* Smart Soil Test Linking Panel - Only show when a field is selected */}
          {selectedField && mode === 'view' && (
            <div className="mb-3">
              <SoilTestLinkingPanel
                selectedField={selectedField}
                onLinked={onSoilTestLinked}
              />
            </div>
          )}

          {/* Map Layers Section - Only show when in view mode and field is selected */}
          {selectedField && mode === 'view' && (
            <Card className="mb-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers3 className="w-4 h-4 text-blue-600" />
                  Map Layers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ssurgo-layer"
                      checked={showSSURGO}
                      onChange={(e) => onSSURGOToggle(e.target.checked)}
                      className="rounded border-gray-300"
                      disabled={ssurgoLoading}
                    />
                    <label
                      htmlFor="ssurgo-layer"
                      className="text-sm text-gray-700 cursor-pointer"
                      title="Show USDA soil-series polygons for the selected field"
                    >
                      SSURGO Soil Types
                    </label>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">Demo</Badge>
                  </div>
                  {ssurgoLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Example visualization of soil series polygons within your field boundaries.
                </p>
              </CardContent>
            </Card>
          )}

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
                          {field.field_name}
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
        </div>
      </ScrollArea>
    </div>
  );
}
