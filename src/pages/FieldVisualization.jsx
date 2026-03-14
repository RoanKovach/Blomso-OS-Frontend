import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useTracking } from '@/components/analytics/useTracking';
import { useToasts } from '@/components/hooks/useToasts';
import { useAuth } from '@/contexts/AuthContext';
import DemoGate from '@/components/DemoGate';

import FieldSidebar from "../components/visualization/FieldSidebar";
import FieldCreationModal from "../components/visualization/FieldCreationModal";
import UploadShapefileModal from "../components/visualization/UploadShapefileModal";
import { useFieldOperations } from "../components/hooks/useFieldOperations";
import { useFieldSearch } from "../components/hooks/useFieldSearch";
import SSURGOLayer from "../components/visualization/SSURGOLayer";
import SSURGOLegend from "../components/visualization/SSURGOLegend";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Mapbox tile layer (when token is set)
const MAPBOX_SATELLITE_URL = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN || ''}`;
const MAPBOX_ATTRIBUTION = '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Fallback when Mapbox token is missing so draw/save remains usable
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const hasMapboxToken = Boolean(MAPBOX_TOKEN && MAPBOX_TOKEN !== 'undefined');
const TILE_URL = hasMapboxToken ? MAPBOX_SATELLITE_URL : OSM_TILE_URL;
const TILE_ATTRIBUTION = hasMapboxToken ? MAPBOX_ATTRIBUTION : OSM_ATTRIBUTION;

// Component to handle field highlighting
function FieldHighlighter({ fieldToHighlight, fields, onHighlightComplete, map }) {
  useEffect(() => {
    if (!fieldToHighlight || !fields.length || !map) return;
    
    const field = fields.find(f => f.id === fieldToHighlight);
    if (!field || !field.geometry) return;
    
    // Fit bounds to the field using Leaflet
    const coordinates = field.geometry.coordinates[0];
    const latLngs = coordinates.map(coord => [coord[1], coord[0]]); // Convert lng,lat to lat,lng
    const bounds = L.latLngBounds(latLngs);
    
    map.fitBounds(bounds, { 
      padding: [30, 30],
      maxZoom: 17
    });
    
    // Remove highlight after 3 seconds
    const timeout = setTimeout(() => {
      if (onHighlightComplete) onHighlightComplete();
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [map, fieldToHighlight, fields, onHighlightComplete]);
  
  return null;
}

// Map event handler component
function MapEventHandler({ mode, showCreationModal, onMapClick, mapRef }) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e) => {
      if (mode === 'draw' && !showCreationModal) {
        onMapClick({
          lngLat: {
            lng: e.latlng.lng,
            lat: e.latlng.lat
          }
        });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mode, showCreationModal, onMapClick, mapRef]);

  return null;
}

function FieldVisualizationContent() {
  const location = useLocation();

  // Map state
  const [center, setCenter] = useState([40.0, -82.5]);
  const [zoom, setZoom] = useState(7);
  const mapRef = useRef(null);

  // Drawing and interaction state
  const [mode, setMode] = useState('view');
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  
  // Modal state
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showShapefileModal, setShowShapefileModal] = useState(false);

  // Deep-linking state
  const [fieldToHighlight, setFieldToHighlight] = useState(null);
  const [hasProcessedDeepLink, setHasProcessedDeepLink] = useState(false);

  // Search and field management
  const [searchTerm, setSearchTerm] = useState('');
  const { fields, isLoading, error, createField, deleteField, refetch, isCreating } = useFieldOperations();
  const fieldsList = Array.isArray(fields) ? fields : [];
  const { searchResults: searchedFields } = useFieldSearch(fieldsList, searchTerm);

  // Tracking and notifications
  const { trackFieldCreation, trackUserAction, trackError } = useTracking();
  const { toast } = useToasts();

  // SSURGO layer state
  const [showSSURGO, setShowSSURGO] = useState(false);
  const [ssurgoLayerInfo, setSsurgoLayerInfo] = useState({ legend: [], isDemo: false });
  const [ssurgoLoading, setSsurgoLoading] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleFieldSelect = useCallback((field) => {
    setSelectedField(field);
    trackUserAction('field_selected', { field_id: field.id });
  }, [trackUserAction]);

  // Handle deep-linking
  useEffect(() => {
    if (hasProcessedDeepLink) return;
    
    const params = new URLSearchParams(location.search);
    const fieldIdToSelect = params.get('fieldId') || params.get('field_id');

    if (fieldIdToSelect && fieldsList.length > 0 && !isLoading) {
      const field = fieldsList.find(f => f.id === fieldIdToSelect);
      if (field) {
        handleFieldSelect(field);
        setFieldToHighlight(fieldIdToSelect);
        trackUserAction('deep_link_field_view', { field_id: fieldIdToSelect });
      } else {
        toast.error('Field not found or you do not have access to it.');
      }
      setHasProcessedDeepLink(true); 
    } else if (!fieldIdToSelect) {
      setHasProcessedDeepLink(true);
    }
  }, [location.search, fieldsList, isLoading, handleFieldSelect, toast, trackUserAction, hasProcessedDeepLink]);

  useEffect(() => {
    setHasProcessedDeepLink(false);
  }, [location.search]);

  // Auto-center on first field
  useEffect(() => {
    if (!isLoading && fieldsList.length > 0 && center[0] === 40.0 && !fieldToHighlight) {
      const fieldWithCenter = fieldsList.find(f => f.center_point);
      if (fieldWithCenter) {
        setCenter([fieldWithCenter.center_point.latitude, fieldWithCenter.center_point.longitude]);
        setZoom(12);
      }
    }
  }, [fieldsList, isLoading, center, fieldToHighlight]);

  const handleModeChange = (newMode) => {
    if (newMode === 'view' && mode === 'draw') {
      handleCancelDrawing();
    }
    setMode(newMode);
  };

  const handleMapClick = useCallback((event) => {
    if (mode === 'draw' && !showCreationModal) {
      const { lng, lat } = event.lngLat;
      const newPoint = { lng, lat };
      setDrawingPoints(prev => [...prev, newPoint]);
      trackUserAction('drawing_point_added', { point_count: drawingPoints.length + 1 });
    }
  }, [mode, showCreationModal, drawingPoints.length, trackUserAction]);

  const handleFinishDrawing = () => {
    // Removed the 3-point minimum restriction
    setShowCreationModal(true);
    trackUserAction('drawing_finished', { point_count: drawingPoints.length });
  };

  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    setShowCreationModal(false);
    setMode('view');
    trackUserAction('drawing_cancelled', { point_count: drawingPoints.length });
  };

  const handleSaveField = async (fieldData) => {
    if (!drawingPoints || drawingPoints.length < 3) {
      // While drawing is allowed with fewer than 3 points,
      // a polygon technically requires 3 vertices.
      // We'll proceed with creating the field, but if there are
      // fewer than 3 points, it won't form a valid polygon on the map.
      // The backend should ideally handle this or a frontend warning
      // might be appropriate if the user can't select < 3 points.
      // For now, we allow the modal to open even with < 3 points,
      // and the backend might handle geometry validation.
    }
    
    const centerPoint = {
      latitude: drawingPoints.length > 0 ? drawingPoints.reduce((sum, p) => sum + p.lat, 0) / drawingPoints.length : 0,
      longitude: drawingPoints.length > 0 ? drawingPoints.reduce((sum, p) => sum + p.lng, 0) / drawingPoints.length : 0,
    };
    
    const payload = {
      ...fieldData,
      center_point: centerPoint,
      data_source: 'user_drawn',
      auto_update_enabled: true,
      geometry: drawingPoints.length > 0 ? {
        type: 'Polygon',
        coordinates: [[...drawingPoints.map(p => [p.lng, p.lat]), drawingPoints.length > 0 ? [drawingPoints[0].lng, drawingPoints[0].lat] : []]]
      } : null // Handle case where drawingPoints might be empty
    };

    if (!payload.geometry || payload.geometry.coordinates[0].length < 4) { // Polygon requires at least 4 points (3 unique + closing point)
      toast.error('A field requires at least 3 unique points to form a polygon.');
      return;
    }
    
    trackUserAction('field_creation_attempt', { acres: payload.acres, method: 'drawn' });
    
    try {
      const newField = await createField(payload);
      trackFieldCreation('drawn', newField.acres);
      toast.success(`Field "${newField.field_name}" created successfully!`);
      setShowCreationModal(false);
      setDrawingPoints([]);
      setMode('view');
      setSelectedField(newField);
    } catch (err) {
      trackError('field_creation_failed', err.message, { payload_sent: payload });
      toast.error(`Failed to create field: ${err.message}`);
    }
  };

  const handleDeleteField = async (fieldToDelete) => {
    if (!confirm(`Are you sure you want to delete "${fieldToDelete.field_name}"?`)) return;
    try {
      await deleteField(fieldToDelete.id);
      if (selectedField?.id === fieldToDelete.id) {
        setSelectedField(null);
      }
      trackUserAction('field_deleted', { field_id: fieldToDelete.id });
      toast.success('Field deleted successfully');
    } catch (err) {
      toast.error(`Failed to delete field: ${err.message}`);
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleModalClose = () => {
    if (!isCreating) {
      setShowCreationModal(false);
      setDrawingPoints([]);
      setMode('view');
    }
  };

  const handleSoilTestLinked = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleHighlightComplete = useCallback(() => {
    setFieldToHighlight(null);
  }, []);

  const handleSSURGOToggle = useCallback((enabled) => {
    setShowSSURGO(enabled);
    if (!enabled) {
      setSsurgoLayerInfo({ legend: [], isDemo: false });
    }
    trackUserAction('ssurgo_layer_toggled', { enabled });
  }, [trackUserAction]);

  const handleSSURGOLegendUpdate = useCallback((layerInfo) => {
    setSsurgoLayerInfo(layerInfo || { legend: [], isDemo: false });
  }, []);

  // Style functions for field polygons
  const getFieldStyle = (field) => ({
    fillColor: selectedField?.id === field.id ? '#3b82f6' : '#93c5fd',
    fillOpacity: selectedField?.id === field.id ? 0.6 : 0.3,
    color: selectedField?.id === field.id ? '#1d4ed8' : '#3b82f6',
    weight: 2,
    opacity: 1
  });

  // Drawing polygon style
  const drawingStyle = {
    fillColor: 'blue',
    fillOpacity: 0.2,
    color: 'blue',
    weight: 2
  };

  // Create drawing polygon GeoJSON
  const drawingGeoJSON = drawingPoints.length >= 3 ? { // Still requires 3 points for a valid polygon geometry
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[...drawingPoints.map(p => [p.lng, p.lat]), [drawingPoints[0].lng, drawingPoints[0].lat]]]
    }
  } : null;

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Desktop Sidebar - visible on medium screens and up */}
      <div className="hidden md:block md:w-80 lg:w-96 absolute left-0 top-0 h-full z-[1000] bg-white border-r border-gray-200 shadow-lg">
        <FieldSidebar
          fields={searchedFields}
          isLoading={isLoading}
          selectedField={selectedField}
          onFieldSelect={handleFieldSelect}
          onDeleteField={handleDeleteField}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          mode={mode}
          onModeChange={handleModeChange}
          drawingPoints={drawingPoints}
          onFinishDrawing={handleFinishDrawing}
          onCancelDrawing={handleCancelDrawing}
          canFinishDrawing={drawingPoints.length >= 1}
          onUploadShapefile={() => setShowShapefileModal(true)}
          onSoilTestLinked={handleSoilTestLinked}
          showSSURGO={showSSURGO}
          onSSURGOToggle={handleSSURGOToggle}
          ssurgoLoading={ssurgoLoading}
        />
      </div>

      <div className="flex-1 md:ml-80 lg:ml-96">
        {/* Mobile Sidebar Trigger - visible on small screens */}
        <div className="md:hidden absolute top-4 left-4 z-[1000]">
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button size="icon" className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border">
                <PanelLeft className="w-5 h-5 text-gray-800" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 z-[1001]">
              <FieldSidebar
                fields={searchedFields}
                isLoading={isLoading}
                selectedField={selectedField}
                onFieldSelect={(field) => {
                  handleFieldSelect(field);
                  setIsMobileSidebarOpen(false); // Close sidebar on selection
                }}
                onDeleteField={handleDeleteField}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                mode={mode}
                onModeChange={handleModeChange}
                drawingPoints={drawingPoints}
                onFinishDrawing={handleFinishDrawing}
                onCancelDrawing={handleCancelDrawing}
                canFinishDrawing={drawingPoints.length >= 1}
                onUploadShapefile={() => {
                  setShowShapefileModal(true);
                  setIsMobileSidebarOpen(false);
                }}
                onSoilTestLinked={handleSoilTestLinked}
                showSSURGO={showSSURGO}
                onSSURGOToggle={handleSSURGOToggle}
                ssurgoLoading={ssurgoLoading}
              />
            </SheetContent>
          </Sheet>
        </div>

        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100vh", width: "100%" }}
          className="z-0"
          ref={mapRef}
        >
          {/* Tiles: Mapbox when token set, else OSM so map stays usable for draw/save */}
          <TileLayer
            url={TILE_URL}
            attribution={TILE_ATTRIBUTION}
            maxZoom={hasMapboxToken ? 22 : 19}
            {...(hasMapboxToken ? { tileSize: 512, zoomOffset: -1 } : {})}
          />

          {/* Map Event Handler */}
          <MapEventHandler
            mode={mode}
            showCreationModal={showCreationModal}
            onMapClick={handleMapClick}
            mapRef={mapRef}
          />

          {/* Field Polygons */}
          {fieldsList.filter(field => field.geometry).map(field => (
            <GeoJSON
              key={field.id}
              data={field.geometry}
              style={() => getFieldStyle(field)}
              eventHandlers={{
                click: () => handleFieldSelect(field)
              }}
            />
          ))}

          {/* Drawing Points */}
          {drawingPoints.map((point, index) => (
            <Marker
              key={index}
              position={[point.lat, point.lng]}
              icon={L.divIcon({
                className: 'drawing-point',
                html: '<div style="background-color: #3b82f6; border: 2px solid white; border-radius: 50%; width: 12px; height: 12px;"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              })}
            />
          ))}

          {/* Drawing Polygon Preview (force re-mount with dynamic key to refresh geometry) */}
          {drawingGeoJSON && (
            <GeoJSON
              key={`drawing-${drawingPoints.length}-${drawingPoints[drawingPoints.length - 1]?.lat ?? ''}-${drawingPoints[drawingPoints.length - 1]?.lng ?? ''}`}
              data={drawingGeoJSON}
              style={drawingStyle}
            />
          )}

          {/* Visual hint: connect last to first while drawing */}
          {mode === 'draw' && drawingPoints.length >= 2 && (
            <Polyline
              positions={[
                [drawingPoints[drawingPoints.length - 1].lat, drawingPoints[drawingPoints.length - 1].lng],
                [drawingPoints[0].lat, drawingPoints[0].lng]
              ]}
              color="blue"
              weight={2}
              dashArray="6,6"
            />
          )}

          {/* SSURGO Layer */}
          <SSURGOLayer
            selectedField={selectedField}
            isVisible={showSSURGO}
            onLegendUpdate={handleSSURGOLegendUpdate}
            onLoadingUpdate={setSsurgoLoading}
          />
        </MapContainer>

        {/* SSURGO Legend */}
        <SSURGOLegend
          legendData={ssurgoLayerInfo.legend}
          isVisible={showSSURGO && ssurgoLayerInfo.legend.length > 0}
          isDemo={ssurgoLayerInfo.isDemo}
          onClose={() => setShowSSURGO(false)}
        />

        <FieldHighlighter
          fieldToHighlight={fieldToHighlight}
          fields={fieldsList}
          onHighlightComplete={handleHighlightComplete}
          map={mapRef.current}
        />
      </div>

      <FieldCreationModal
        isOpen={showCreationModal}
        onClose={handleModalClose}
        onSave={handleSaveField}
        drawingPoints={drawingPoints}
        isLoading={isCreating}
      />
      
      <UploadShapefileModal
        isOpen={showShapefileModal}
        onClose={() => setShowShapefileModal(false)}
        onComplete={() => {
          toast.info("Refreshing field list...");
          refetch();
        }}
      />
    </div>
  );
}

export default function FieldVisualizationPage() {
  const { isDemoMode } = useAuth();
  if (isDemoMode) {
    return (
      <DemoGate
        title="Field visualization"
        message="Field visualization is available for full accounts. Create an account to get access."
      />
    );
  }
  return <FieldVisualizationContent />;
}
