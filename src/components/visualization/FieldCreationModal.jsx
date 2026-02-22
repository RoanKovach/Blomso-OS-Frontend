
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Native area calculation using the Shoelace formula
const calculatePolygonArea = (points) => {
  if (points.length < 3) return 0;
  
  // Convert lat/lng points to approximate meters using Web Mercator projection
  const toMeters = (lat, lng) => {
    const R = 6378137; // Earth's radius in meters
    const x = lng * Math.PI / 180 * R;
    const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) * R;
    return { x, y };
  };
  
  // Convert all points to meter coordinates
  const meterPoints = points.map(p => toMeters(p.lat, p.lng));
  
  // Close the polygon by adding the first point at the end
  const closedPoints = [...meterPoints, meterPoints[0]];
  
  // Apply Shoelace formula
  let area = 0;
  for (let i = 0; i < closedPoints.length - 1; i++) {
    area += closedPoints[i].x * closedPoints[i + 1].y;
    area -= closedPoints[i + 1].x * closedPoints[i].y;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert square meters to acres (1 acre = 4046.86 square meters)
  return area / 4046.86;
};

export default function FieldCreationModal({ isOpen, onClose, onSave, drawingPoints, isLoading }) {
  const [fieldName, setFieldName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [calculatedAcres, setCalculatedAcres] = useState(0);
  const [validationError, setValidationError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFieldName('');
      setFarmName('');
      setValidationError('');
      setCalculatedAcres(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (drawingPoints && drawingPoints.length >= 3) {
      try {
        const acres = calculatePolygonArea(drawingPoints);
        setCalculatedAcres(acres.toFixed(2));
        setValidationError('');
      } catch (e) {
        console.error("Could not calculate area:", e);
        setCalculatedAcres(0);
        setValidationError('Unable to calculate field area. Please redraw the field.');
      }
    } else if (drawingPoints && drawingPoints.length > 0) {
      setCalculatedAcres(0);
      setValidationError('');
    } else {
      setValidationError('');
    }
  }, [drawingPoints]);

  const handleSave = () => {
    // Validation
    if (!fieldName.trim()) {
      setValidationError('Please enter a field name');
      return;
    }
    
    if (!drawingPoints || drawingPoints.length < 3) {
      setValidationError('Need at least 3 points to create a field');
      return;
    }
    
    if (calculatedAcres <= 0) {
      setValidationError('Invalid field area calculated');
      return;
    }

    // Clear any previous validation errors
    setValidationError('');

    // Create GeoJSON geometry
    const coordinates = [
      [...drawingPoints.map(p => [p.lng, p.lat]), [drawingPoints[0].lng, drawingPoints[0].lat]]
    ];
    
    const geometry = {
      type: 'Polygon',
      coordinates: coordinates
    };

    // Prepare field data
    const fieldData = {
      field_name: fieldName.trim(),
      farm_name: farmName.trim(),
      geometry: geometry,
      acres: parseFloat(calculatedAcres),
    };

    console.log('Field data prepared for save:', fieldData);
    onSave(fieldData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="z-[2000] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save New Field</DialogTitle>
        </DialogHeader>
        
        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name *</Label>
            <Input
              id="field-name"
              value={fieldName}
              onChange={(e) => {
                setFieldName(e.target.value);
                if (validationError.includes('field name')) {
                  setValidationError('');
                }
              }}
              placeholder="e.g., North Pasture"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="farm-name">Farm Name (Optional)</Label>
            <Input
              id="farm-name"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="e.g., Green Acres Farm"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label>Calculated Area</Label>
            <p className="text-lg font-semibold text-green-600">
              {calculatedAcres} acres
            </p>
            {drawingPoints && (
              <p className="text-sm text-gray-500">
                Based on {drawingPoints.length} boundary points
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!fieldName.trim() || isLoading || calculatedAcres <= 0}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Saving...' : 'Save Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
