
import React, { useState, useEffect, useCallback } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getSsurgoData } from '@/api/functions';

export default function SSURGOLayer({ selectedField, isVisible, onLegendUpdate, onLoadingUpdate }) {
  const [ssurgoData, setSsurgoData] = useState(null);
  const [error, setError] = useState(null);

  const loadSsurgoData = useCallback(async () => {
    if (!selectedField || !selectedField.geometry || !isVisible) {
      setSsurgoData(null);
      onLegendUpdate({ legend: [], isDemo: false }); // Pass full object
      return;
    }

    onLoadingUpdate(true);
    setError(null);

    try {
      const response = await getSsurgoData({ geometry: selectedField.geometry });

      if (response.data?.success) {
        setSsurgoData(response.data.data);
        // Pass the entire relevant info object up, not just the legend array
        onLegendUpdate({ 
          legend: response.data.legend || [], 
          isDemo: response.data.isDemo || false 
        });
      } else {
        throw new Error(response.data?.error || 'Failed to load soil data');
      }
    } catch (err) {
      console.error('Error loading SSURGO data:', err);
      setError(err.message);
      onLegendUpdate({ legend: [], isDemo: false }); // Pass full object on error
    } finally {
      onLoadingUpdate(false);
    }
  }, [selectedField, isVisible, onLegendUpdate, onLoadingUpdate]);

  useEffect(() => {
    loadSsurgoData();
  }, [loadSsurgoData]);

  if (!isVisible || !ssurgoData || !ssurgoData.features || ssurgoData.features.length === 0) {
    return null;
  }

  // Enhanced style function for beautiful soil polygons
  const getSsurgoStyle = (feature) => ({
    fillColor: feature.properties.color,
    fillOpacity: 0.8, // Increased opacity for more vibrant colors
    color: '#ffffff', // White borders like Granular
    weight: 1.5, // Thinner, cleaner borders
    opacity: 0.9,
    // Add subtle shadow effect
    shadowBlur: 2,
    shadowColor: 'rgba(0,0,0,0.3)'
  });

  return (
    <>
      {ssurgoData.features.map((feature, index) => (
        <GeoJSON
          key={`ssurgo-${index}`}
          data={feature}
          style={getSsurgoStyle}
          onEachFeature={(feature, layer) => {
            // Add hover effects and popup information
            layer.on({
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  fillOpacity: 0.9,
                  weight: 2,
                  color: '#2563eb'
                });
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle(getSsurgoStyle(feature));
              }
            });
            
            // Bind popup with soil information
            layer.bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-sm">${feature.properties.MUNAME}</h3>
                <div class="text-xs text-gray-600 mt-1">
                  <p><strong>Symbol:</strong> ${feature.properties.MUSYM}</p>
                  <p><strong>Acres:</strong> ${Math.round(feature.properties.MUACRES * 10) / 10}</p>
                  <p><strong>Drainage:</strong> ${feature.properties.drainageClass}</p>
                  <p><strong>Classification:</strong> ${feature.properties.farmlandClass}</p>
                </div>
              </div>
            `);
          }}
        />
      ))}
    </>
  );
}
