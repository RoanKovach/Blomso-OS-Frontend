import React from 'react';
import { Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export default function PolygonDrawer({ 
  isDrawing, 
  disabled = false, 
  onMapClick, 
  drawingPoints, 
  onFinishPolygon, 
  onCancelDrawing 
}) {
  // Fix for default icon issue in Leaflet with bundlers
  const icon = L.divIcon({
    className: 'bg-blue-500 border-2 border-white rounded-full w-3 h-3',
    iconSize: [12, 12],
  });

  useMapEvents({
    click(e) {
      // Only handle clicks if drawing is active and not disabled
      if (isDrawing && !disabled) {
        onMapClick(e.latlng);
      }
    },
  });
  
  // Don't render anything if not drawing and no points
  if (!isDrawing && drawingPoints.length === 0) return null;

  return (
    <>
      {/* Render drawing points */}
      {drawingPoints.map((point, index) => (
        <Marker key={index} position={point} icon={icon} />
      ))}
      
      {/* Render polygon preview if we have enough points */}
      {drawingPoints.length > 2 && (
        <Polygon 
          positions={drawingPoints} 
          color="blue" 
          fillColor="blue"
          fillOpacity={0.2}
          weight={2}
        />
      )}
    </>
  );
}