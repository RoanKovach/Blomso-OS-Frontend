import React from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';

export default function FieldRenderer({ fields, selectedField, onFieldSelect }) {
  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => onFieldSelect(feature.properties),
    });
  };

  const styleFeature = (feature) => {
    const isSelected = selectedField?.id === feature.properties.id;
    return {
      fillColor: isSelected ? '#3b82f6' : '#93c5fd',
      weight: 2,
      opacity: 1,
      color: isSelected ? '#1d4ed8' : '#3b82f6',
      fillOpacity: isSelected ? 0.6 : 0.3,
    };
  };

  const fieldFeatures = fields
    .filter(field => field.geometry)
    .map(field => ({
        type: 'Feature',
        properties: { ...field },
        geometry: field.geometry,
    }));
    
  if (fieldFeatures.length === 0) return null;

  return (
    <GeoJSON
      key={selectedField?.id || 'geojson-layer'} // Re-render when selection changes to apply new styles
      data={{ type: 'FeatureCollection', features: fieldFeatures }}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}