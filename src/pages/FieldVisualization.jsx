import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTracking } from "@/components/analytics/useTracking";
import { useToasts } from "@/components/hooks/useToasts";
import { useAuth } from "@/contexts/AuthContext";
import DemoGate from "@/components/DemoGate";
import { apiGet } from "@/api/client";

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

const FIELD_SOURCE = "fields-src";
const FIELDS_FILL = "fields-fill";
const FIELDS_LINE = "fields-line";
const DRAW_POLY_SOURCE = "draw-poly";
const DRAW_POLY_FILL = "draw-poly-fill";
const DRAW_POLY_LINE = "draw-poly-line";
const DRAW_DASH_SOURCE = "draw-dash";
const DRAW_DASH_LINE = "draw-dash-line";

const SAT_LAYER = "satellite-layer";
const NDVI_LAYER = "ndvi-layer";
const PARCELS_LAYER = "parcels-layer";

function boundsFromPolygonGeometry(geometry) {
    if (!geometry || geometry.type !== "Polygon") return null;
    const ring = geometry.coordinates[0];
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const pair of ring) {
        const lng = pair[0];
        const lat = pair[1];
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
    }
    return [
        [minLng, minLat],
        [maxLng, maxLat],
    ];
}

function FieldHighlighter({ fieldToHighlight, fields, onHighlightComplete, map }) {
    useEffect(() => {
        if (!fieldToHighlight || !fields.length || !map?.loaded?.()) return;

        const field = fields.find((f) => f.id === fieldToHighlight);
        if (!field?.geometry) return;

        const b = boundsFromPolygonGeometry(field.geometry);
        if (!b) return;

        map.fitBounds(b, { padding: 30, maxZoom: 17 });

        const timeout = setTimeout(() => {
            if (onHighlightComplete) onHighlightComplete();
        }, 3000);

        return () => clearTimeout(timeout);
    }, [map, fieldToHighlight, fields, onHighlightComplete]);

    return null;
}

function FieldVisualizationContent() {
    const location = useLocation();

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const drawingMarkersRef = useRef([]);

    const [mapConfig, setMapConfig] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    /** MapLibre instance for children that must re-render when the map exists */
    const [mapInstance, setMapInstance] = useState(null);
    const [mapInitError, setMapInitError] = useState(null);

    const [center, setCenter] = useState([40.0, -82.5]);
    const [zoom, setZoom] = useState(7);

    const [mode, setMode] = useState("view");
    const [drawingPoints, setDrawingPoints] = useState([]);
    const [selectedField, setSelectedField] = useState(null);

    const [showCreationModal, setShowCreationModal] = useState(false);
    const [showShapefileModal, setShowShapefileModal] = useState(false);

    const [fieldToHighlight, setFieldToHighlight] = useState(null);
    const [hasProcessedDeepLink, setHasProcessedDeepLink] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const { fields, isLoading, error, createField, deleteField, refetch, isCreating } = useFieldOperations();
    const fieldsList = Array.isArray(fields) ? fields : [];
    const { searchResults: searchedFields } = useFieldSearch(fieldsList, searchTerm);

    const { trackFieldCreation, trackUserAction, trackError } = useTracking();
    const { toast } = useToasts();

    const [showSSURGO, setShowSSURGO] = useState(false);
    const [ssurgoLayerInfo, setSsurgoLayerInfo] = useState({ legend: [], isDemo: false });
    const [ssurgoLoading, setSsurgoLoading] = useState(false);

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [layerToggle, setLayerToggle] = useState({
        satellite: false,
        ndvi: false,
        parcels: false,
    });

    useEffect(() => {
        let cancelled = false;
        setMapInitError(null);
        apiGet("/map/layers")
            .then((data) => {
                if (!cancelled) setMapConfig(data);
            })
            .catch((err) => {
                console.error(err);
                if (!cancelled) {
                    setMapInitError(err?.message || "Failed to load map configuration");
                    toast.error("Could not load map layers. Check API configuration.");
                }
            });
        return () => {
            cancelled = true;
        };
    }, [toast]);

    useEffect(() => {
        if (mapConfig?.defaults) {
            setLayerToggle({
                satellite: !!mapConfig.defaults.showSatellite,
                ndvi: !!mapConfig.defaults.showNdvi,
                parcels: !!mapConfig.defaults.showParcels,
            });
        }
    }, [mapConfig]);

    useEffect(() => {
        if (!mapConfig || !mapContainerRef.current || mapRef.current) return;

        const view = mapConfig.view || {};
        const lat =
            view.defaultCenter?.lat ??
            (Array.isArray(center) ? center[0] : 40);
        const lon = view.defaultCenter?.lon ?? view.defaultCenter?.lng ?? (Array.isArray(center) ? center[1] : -82.5);
        const z = view.defaultZoom ?? zoom;

        const styleUrl = mapConfig.layers?.basemap?.styleUrl;
        if (!styleUrl) {
            setMapInitError("Map basemap styleUrl missing from /map/layers");
            toast.error("Invalid map configuration: missing basemap style.");
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: styleUrl,
            center: [lon, lat],
            zoom: z,
        });

        mapRef.current = map;

        map.once("load", () => {
            const { layers: L } = mapConfig;
            if (!L) {
                setMapInstance(map);
                setMapReady(true);
                return;
            }

            const addRaster = (id, sourceId, spec, layerId, defaultVisible, opacity) => {
                if (!spec?.tiles?.length) return;
                const tileSize = spec.tileSize ?? 256;
                map.addSource(sourceId, {
                    type: "raster",
                    tiles: spec.tiles,
                    tileSize,
                    ...(spec.minzoom != null ? { minzoom: spec.minzoom } : {}),
                    ...(spec.maxzoom != null ? { maxzoom: spec.maxzoom } : {}),
                });
                const layout = {
                    visibility: defaultVisible ? "visible" : "none",
                };
                const paint = {};
                if (opacity != null && Number.isFinite(Number(opacity))) {
                    paint["raster-opacity"] = Number(opacity);
                }
                const layerDef = {
                    id: layerId,
                    type: "raster",
                    source: sourceId,
                    layout,
                    paint,
                };
                if (spec.minzoom != null) layerDef.minzoom = spec.minzoom;
                if (spec.maxzoom != null) layerDef.maxzoom = spec.maxzoom;
                map.addLayer(layerDef);
            };

            const defs = mapConfig.defaults || {};

            addRaster("sat", "satellite-src", L.satellite, SAT_LAYER, !!defs.showSatellite, null);
            addRaster("ndvi", "ndvi-src", L.ndvi, NDVI_LAYER, !!defs.showNdvi, L.ndvi?.opacity);
            addRaster("parcels", "parcels-src", L.parcels, PARCELS_LAYER, !!defs.showParcels, null);

            map.addSource(FIELD_SOURCE, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });
            map.addLayer({
                id: FIELDS_FILL,
                type: "fill",
                source: FIELD_SOURCE,
                paint: {
                    "fill-color": [
                        "case",
                        ["==", ["get", "selected"], true],
                        "#3b82f6",
                        "#93c5fd",
                    ],
                    "fill-opacity": [
                        "case",
                        ["==", ["get", "selected"], true],
                        0.6,
                        0.3,
                    ],
                },
            });
            map.addLayer({
                id: FIELDS_LINE,
                type: "line",
                source: FIELD_SOURCE,
                paint: {
                    "line-color": [
                        "case",
                        ["==", ["get", "selected"], true],
                        "#1d4ed8",
                        "#3b82f6",
                    ],
                    "line-width": 2,
                },
            });

            map.addSource(DRAW_POLY_SOURCE, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });
            map.addLayer({
                id: DRAW_POLY_FILL,
                type: "fill",
                source: DRAW_POLY_SOURCE,
                paint: {
                    "fill-color": "#3b82f6",
                    "fill-opacity": 0.2,
                },
            });
            map.addLayer({
                id: DRAW_POLY_LINE,
                type: "line",
                source: DRAW_POLY_SOURCE,
                paint: {
                    "line-color": "#3b82f6",
                    "line-width": 2,
                },
            });

            map.addSource(DRAW_DASH_SOURCE, {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });
            map.addLayer({
                id: DRAW_DASH_LINE,
                type: "line",
                source: DRAW_DASH_SOURCE,
                paint: {
                    "line-color": "#2563eb",
                    "line-width": 2,
                    "line-dasharray": [2, 2],
                },
            });

            setMapInstance(map);
            setMapReady(true);
        });

        return () => {
            setMapReady(false);
            setMapInstance(null);
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapConfig, toast]);

    const buildFieldsGeoJSON = useCallback(() => {
        const features = fieldsList
            .filter((f) => f.geometry)
            .map((f) => ({
                type: "Feature",
                id: f.id,
                properties: {
                    id: f.id,
                    selected: selectedField?.id === f.id,
                },
                geometry: f.geometry,
            }));
        return { type: "FeatureCollection", features };
    }, [fieldsList, selectedField]);

    useEffect(() => {
        const map = mapRef.current;
        if (!mapReady || !map?.loaded?.()) return;
        const src = map.getSource(FIELD_SOURCE);
        if (!src) return;
        src.setData(buildFieldsGeoJSON());
    }, [mapReady, buildFieldsGeoJSON]);

    useEffect(() => {
        const map = mapRef.current;
        if (!mapReady || !map?.loaded?.()) return;

        drawingMarkersRef.current.forEach((m) => m.remove());
        drawingMarkersRef.current = [];

        drawingPoints.forEach((pt) => {
            const el = document.createElement("div");
            el.style.cssText =
                "background-color:#3b82f6;border:2px solid white;border-radius:50%;width:12px;height:12px;";
            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([pt.lng, pt.lat])
                .addTo(map);
            drawingMarkersRef.current.push(marker);
        });

        return () => {
            drawingMarkersRef.current.forEach((m) => m.remove());
            drawingMarkersRef.current = [];
        };
    }, [drawingPoints, mapReady]);

    useEffect(() => {
        const map = mapRef.current;
        if (!mapReady || !map?.loaded?.()) return;
        const src = map.getSource(DRAW_POLY_SOURCE);
        const dashSrc = map.getSource(DRAW_DASH_SOURCE);
        if (!src || !dashSrc) return;

        if (drawingPoints.length >= 3) {
            const ring = [
                ...drawingPoints.map((p) => [p.lng, p.lat]),
                [drawingPoints[0].lng, drawingPoints[0].lat],
            ];
            src.setData({
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [ring],
                },
            });
        } else {
            src.setData({ type: "FeatureCollection", features: [] });
        }

        if (mode === "draw" && drawingPoints.length >= 2) {
            const last = drawingPoints[drawingPoints.length - 1];
            const first = drawingPoints[0];
            dashSrc.setData({
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [last.lng, last.lat],
                        [first.lng, first.lat],
                    ],
                },
            });
        } else {
            dashSrc.setData({ type: "FeatureCollection", features: [] });
        }
    }, [drawingPoints, mode, mapReady]);

    const handleFieldSelect = useCallback(
        (field) => {
            setSelectedField(field);
            setFieldToHighlight(field?.id ?? null);
            trackUserAction("field_selected", { field_id: field.id });
        },
        [trackUserAction]
    );

    const handleMapClick = useCallback(
        (event) => {
            if (mode === "draw" && !showCreationModal) {
                const { lng, lat } = event.lngLat;
                setDrawingPoints((prev) => [...prev, { lng, lat }]);
                trackUserAction("drawing_point_added", { point_count: drawingPoints.length + 1 });
            }
        },
        [mode, showCreationModal, drawingPoints.length, trackUserAction]
    );

    useEffect(() => {
        if (hasProcessedDeepLink) return;

        const params = new URLSearchParams(location.search);
        const fieldIdToSelect = params.get("fieldId") || params.get("field_id");

        if (fieldIdToSelect && fieldsList.length > 0 && !isLoading) {
            const field = fieldsList.find((f) => f.id === fieldIdToSelect);
            if (field) {
                handleFieldSelect(field);
                setFieldToHighlight(fieldIdToSelect);
                trackUserAction("deep_link_field_view", { field_id: fieldIdToSelect });
            } else {
                toast.error("Field not found or you do not have access to it.");
            }
            setHasProcessedDeepLink(true);
        } else if (!fieldIdToSelect) {
            setHasProcessedDeepLink(true);
        }
    }, [location.search, fieldsList, isLoading, handleFieldSelect, toast, trackUserAction, hasProcessedDeepLink]);

    useEffect(() => {
        setHasProcessedDeepLink(false);
    }, [location.search]);

    useEffect(() => {
        if (!isLoading && fieldsList.length > 0 && center[0] === 40.0 && !fieldToHighlight && mapRef.current?.loaded?.()) {
            const fieldWithCenter = fieldsList.find((f) => f.center_point);
            if (fieldWithCenter) {
                const la = fieldWithCenter.center_point.latitude;
                const lo = fieldWithCenter.center_point.longitude;
                setCenter([la, lo]);
                setZoom(12);
                mapRef.current.flyTo({ center: [lo, la], zoom: 12 });
            }
        }
    }, [fieldsList, isLoading, center, fieldToHighlight]);

    useEffect(() => {
        const map = mapRef.current;
        if (!mapReady || !map?.loaded?.()) return;

        const onClick = (e) => {
            const fieldFeats = map.queryRenderedFeatures(e.point, { layers: [FIELDS_FILL] });
            if (fieldFeats.length) {
                const id = fieldFeats[0].properties?.id;
                const field = fieldsList.find((f) => f.id === id);
                if (field) handleFieldSelect(field);
                return;
            }
            if (mode === "draw" && !showCreationModal) {
                handleMapClick({
                    lngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat },
                });
            }
        };

        const onMove = (e) => {
            const feats = map.queryRenderedFeatures(e.point, { layers: [FIELDS_FILL] });
            map.getCanvas().style.cursor = feats.length ? "pointer" : "";
        };

        map.on("click", onClick);
        map.on("mousemove", onMove);

        return () => {
            map.off("click", onClick);
            map.off("mousemove", onMove);
        };
    }, [mapReady, mode, showCreationModal, fieldsList, handleFieldSelect, handleMapClick]);

    const handleModeChange = (newMode) => {
        if (newMode === "view" && mode === "draw") {
            handleCancelDrawing();
        }
        setMode(newMode);
    };

    const handleFinishDrawing = () => {
        setShowCreationModal(true);
        trackUserAction("drawing_finished", { point_count: drawingPoints.length });
    };

    const handleCancelDrawing = () => {
        setDrawingPoints([]);
        setShowCreationModal(false);
        setMode("view");
        trackUserAction("drawing_cancelled", { point_count: drawingPoints.length });
    };

    const handleSaveField = async (fieldData) => {
        const centerPoint = {
            latitude:
                drawingPoints.length > 0
                    ? drawingPoints.reduce((sum, p) => sum + p.lat, 0) / drawingPoints.length
                    : 0,
            longitude:
                drawingPoints.length > 0
                    ? drawingPoints.reduce((sum, p) => sum + p.lng, 0) / drawingPoints.length
                    : 0,
        };

        const payload = {
            ...fieldData,
            center_point: centerPoint,
            data_source: "user_drawn",
            auto_update_enabled: true,
            geometry:
                drawingPoints.length > 0
                    ? {
                          type: "Polygon",
                          coordinates: [
                              [
                                  ...drawingPoints.map((p) => [p.lng, p.lat]),
                                  [drawingPoints[0].lng, drawingPoints[0].lat],
                              ],
                          ],
                      }
                    : null,
        };

        if (!payload.geometry || payload.geometry.coordinates[0].length < 4) {
            toast.error("A field requires at least 3 unique points to form a polygon.");
            return;
        }

        trackUserAction("field_creation_attempt", { acres: payload.acres, method: "drawn" });

        try {
            const newField = await createField(payload);
            trackFieldCreation("drawn", newField.acres);
            toast.success(`Field "${newField.field_name}" created successfully!`);
            setShowCreationModal(false);
            setDrawingPoints([]);
            setMode("view");
            setSelectedField(newField);
        } catch (err) {
            trackError("field_creation_failed", err.message, { payload_sent: payload });
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
            trackUserAction("field_deleted", { field_id: fieldToDelete.id });
            toast.success("Field deleted successfully");
        } catch (err) {
            toast.error(`Failed to delete field: ${err.message}`);
        }
    };

    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    const handleModalClose = () => {
        if (!isCreating) {
            setShowCreationModal(false);
            setDrawingPoints([]);
            setMode("view");
        }
    };

    const handleSoilTestLinked = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleHighlightComplete = useCallback(() => {
        setFieldToHighlight(null);
    }, []);

    const handleSSURGOToggle = useCallback(
        (enabled) => {
            setShowSSURGO(enabled);
            if (!enabled) {
                setSsurgoLayerInfo({ legend: [], isDemo: false });
            }
            trackUserAction("ssurgo_layer_toggled", { enabled });
        },
        [trackUserAction]
    );

    const handleSSURGOLegendUpdate = useCallback((layerInfo) => {
        setSsurgoLayerInfo(layerInfo || { legend: [], isDemo: false });
    }, []);

    const toggleRasterLayer = (layerId, key) => {
        const map = mapRef.current;
        if (!map?.loaded?.() || !map.getLayer(layerId)) return;
        const vis = map.getLayoutProperty(layerId, "visibility");
        const next = vis === "visible" ? "none" : "visible";
        map.setLayoutProperty(layerId, "visibility", next);
        setLayerToggle((prev) => ({ ...prev, [key]: next === "visible" }));
    };

    return (
        <div className="flex h-screen bg-gray-50 relative">
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

            <div className="flex-1 md:ml-80 lg:ml-96 relative min-h-0">
                <div className="md:hidden absolute top-4 left-4 z-[1000]">
                    <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button
                                size="icon"
                                className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border"
                            >
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
                                    setIsMobileSidebarOpen(false);
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

                {mapInitError && (
                    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/90 p-4 text-center text-sm text-red-700">
                        {mapInitError}
                    </div>
                )}

                <div
                    ref={mapContainerRef}
                    className="z-0 h-screen w-full"
                    style={{ width: "100%", height: "100vh", minHeight: "100vh" }}
                />

                {mapReady && mapInstance && (
                    <div className="pointer-events-none absolute bottom-6 right-4 z-[900] flex flex-col gap-2">
                        <div className="pointer-events-auto flex flex-col gap-1 rounded-md border border-gray-200 bg-white/95 p-2 shadow-md">
                            <button
                                type="button"
                                className={`rounded px-3 py-1.5 text-left text-sm font-medium ${
                                    layerToggle.satellite ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
                                }`}
                                onClick={() => toggleRasterLayer(SAT_LAYER, "satellite")}
                            >
                                Satellite
                            </button>
                            <button
                                type="button"
                                className={`rounded px-3 py-1.5 text-left text-sm font-medium ${
                                    layerToggle.ndvi ? "bg-emerald-800 text-white" : "bg-gray-100 text-gray-800"
                                }`}
                                onClick={() => toggleRasterLayer(NDVI_LAYER, "ndvi")}
                            >
                                NDVI
                            </button>
                            <button
                                type="button"
                                className={`rounded px-3 py-1.5 text-left text-sm font-medium ${
                                    layerToggle.parcels ? "bg-amber-800 text-white" : "bg-gray-100 text-gray-800"
                                }`}
                                onClick={() => toggleRasterLayer(PARCELS_LAYER, "parcels")}
                            >
                                Parcels
                            </button>
                        </div>
                    </div>
                )}

                <SSURGOLayer
                    map={mapInstance}
                    mapReady={mapReady}
                    selectedField={selectedField}
                    isVisible={showSSURGO}
                    onLegendUpdate={handleSSURGOLegendUpdate}
                    onLoadingUpdate={setSsurgoLoading}
                />

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
                    map={mapInstance}
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
