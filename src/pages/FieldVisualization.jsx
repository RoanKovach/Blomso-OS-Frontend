import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import FieldWorkbenchPanel from "../components/visualization/FieldWorkbenchPanel";
import { useFieldStory } from "../components/hooks/useFieldStory";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Layers, PanelLeft, MapPinned, Loader2 } from "lucide-react";
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

/** User-toggleable overlay defaults. Satellite is always the base map (not toggled here). */
const PRODUCT_LAYER_DEFAULTS = {
    parcels: false,
};

const OUR_MAP_LAYER_IDS = new Set([
    SAT_LAYER,
    NDVI_LAYER,
    PARCELS_LAYER,
    FIELDS_FILL,
    FIELDS_LINE,
    DRAW_POLY_FILL,
    DRAW_POLY_LINE,
    DRAW_DASH_LINE,
]);

function isOurOrExtensionLayer(id) {
    if (!id) return false;
    if (OUR_MAP_LAYER_IDS.has(id)) return true;
    return id.startsWith("ssurgo-");
}

/**
 * Hide built-in style layers (cartoon vector basemap) so satellite / overlays read as the base experience.
 */
function suppressCartoonBasemap(map, hiddenIdsRef) {
    hiddenIdsRef.current = [];
    const style = map.getStyle();
    if (!style?.layers) return;
    for (const layer of style.layers) {
        if (isOurOrExtensionLayer(layer.id)) continue;
        try {
            map.setLayoutProperty(layer.id, "visibility", "none");
            hiddenIdsRef.current.push(layer.id);
        } catch {
            /* layer may not support visibility */
        }
    }
}

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

function FieldVisualizationContent() {
    const location = useLocation();
    const navigate = useNavigate();

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const drawingMarkersRef = useRef([]);
    const basemapHiddenLayerIdsRef = useRef([]);

    const [mapConfig, setMapConfig] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapInitError, setMapInitError] = useState(null);
    const [mapZoom, setMapZoom] = useState(0);

    const [center, setCenter] = useState([40.0, -82.5]);
    const [zoom, setZoom] = useState(7);

    const [mode, setMode] = useState("view");
    const [drawingPoints, setDrawingPoints] = useState([]);
    const [selectedField, setSelectedField] = useState(null);

    const [showCreationModal, setShowCreationModal] = useState(false);
    const [showShapefileModal, setShowShapefileModal] = useState(false);

    const [hasProcessedDeepLink, setHasProcessedDeepLink] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const { fields, isLoading, createField, deleteField, refetch, isCreating } = useFieldOperations();
    const fieldsList = Array.isArray(fields) ? fields : [];
    const { searchResults: searchedFields } = useFieldSearch(fieldsList, searchTerm);

    const { trackFieldCreation, trackUserAction, trackError } = useTracking();
    const { toast } = useToasts();

    const [showSSURGO, setShowSSURGO] = useState(false);
    const [ssurgoLayerInfo, setSsurgoLayerInfo] = useState({ legend: [], isDemo: false });
    const [ssurgoLoading, setSsurgoLoading] = useState(false);

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [layerToggle, setLayerToggle] = useState({ ...PRODUCT_LAYER_DEFAULTS });
    /** Increments on every field select (including re-clicking the same field) so fitBounds always runs */
    const [fieldSelectionSeq, setFieldSelectionSeq] = useState(0);
    /** Bumps field story refetch when linking completes */
    const [evidenceRefreshKey, setEvidenceRefreshKey] = useState(0);
    /** After upload save: navigation state asks for a one-time story reload */
    const [storyRefreshNonce, setStoryRefreshNonce] = useState(0);

    const storyRefetchSignal = `${evidenceRefreshKey}:${storyRefreshNonce}`;
    const fieldStory = useFieldStory(selectedField?.id, storyRefetchSignal);

    useEffect(() => {
        if (!location.state?.refreshFieldStory) return;
        setStoryRefreshNonce((n) => n + 1);
        navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
    }, [location.state?.refreshFieldStory, location.pathname, location.search, navigate]);

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
                setMapZoom(map.getZoom());
                return;
            }

            const defs = PRODUCT_LAYER_DEFAULTS;

            /** Satellite is the fixed base imagery layer (not exposed as an optional overlay toggle). */
            const addRaster = (sourceId, spec, layerId, defaultVisible, opacity) => {
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

            addRaster("satellite-src", L.satellite, SAT_LAYER, true, null);

            const satTiles = L.satellite?.tiles;
            const ndviTiles = L.ndvi?.tiles;
            const ndviDuplicateOrMissing =
                !ndviTiles?.length ||
                (satTiles?.length &&
                    ndviTiles.length === satTiles.length &&
                    JSON.stringify(satTiles) === JSON.stringify(ndviTiles));
            if (!ndviDuplicateOrMissing) {
                addRaster("ndvi-src", L.ndvi, NDVI_LAYER, false, L.ndvi?.opacity);
            }

            addRaster("parcels-src", L.parcels, PARCELS_LAYER, defs.parcels, null);

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
                        "#2563eb",
                        "#93c5fd",
                    ],
                    "fill-opacity": [
                        "case",
                        ["==", ["get", "selected"], true],
                        0.22,
                        0.12,
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
                        "#ffffff",
                        "#60a5fa",
                    ],
                    "line-width": ["case", ["==", ["get", "selected"], true], 3, 2],
                    "line-opacity": 1,
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

            if (map.getLayer(SAT_LAYER)) {
                suppressCartoonBasemap(map, basemapHiddenLayerIdsRef);
            }

            setLayerToggle({ ...defs });
            setMapInstance(map);
            setMapReady(true);
            setMapZoom(map.getZoom());
        });

        const onZoomEnd = () => setMapZoom(map.getZoom());
        map.on("zoomend", onZoomEnd);

        return () => {
            map.off("zoomend", onZoomEnd);
            setMapReady(false);
            setMapInstance(null);
            basemapHiddenLayerIdsRef.current = [];
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

    /** Prefer list row geometry so refetches/async geometry updates still fit correctly */
    const selectedFieldMerged = useMemo(() => {
        if (!selectedField?.id) return null;
        return fieldsList.find((f) => f.id === selectedField.id) ?? selectedField;
    }, [fieldsList, selectedField]);

    const mergedGeometryKey = useMemo(
        () =>
            selectedFieldMerged?.geometry ? JSON.stringify(selectedFieldMerged.geometry) : null,
        [selectedFieldMerged?.geometry]
    );

    /** Fit map to selected field when selection, geometry, or explicit re-select changes; skip during draw mode */
    useEffect(() => {
        const map = mapRef.current;
        if (!mapReady || !map?.loaded?.()) return;
        if (mode === "draw") return;
        if (!selectedField?.id || !selectedFieldMerged?.geometry) return;
        const b = boundsFromPolygonGeometry(selectedFieldMerged.geometry);
        if (!b) return;

        const isLg = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
        const isMd = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
        let padding;
        if (isLg) {
            padding = { top: 40, bottom: 120, left: 320, right: 40 };
        } else if (isMd) {
            padding = { top: 40, bottom: 120, left: 288, right: 40 };
        } else {
            padding = { top: 40, bottom: 140, left: 16, right: 16 };
        }

        map.fitBounds(b, {
            padding,
            maxZoom: 16,
            duration: 450,
        });
        setMapZoom(map.getZoom());
    }, [mapReady, selectedField?.id, mergedGeometryKey, mode, fieldSelectionSeq]);

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
            setFieldSelectionSeq((n) => n + 1);
            setSelectedField(field);
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

    /** When no field is selected, gently frame the first field with geometry (or center_point) */
    useEffect(() => {
        if (!mapReady) return;
        if (!isLoading && fieldsList.length > 0 && !selectedField && mapRef.current?.loaded?.()) {
            const withGeom = fieldsList.find((f) => f.geometry);
            if (withGeom) {
                const b = boundsFromPolygonGeometry(withGeom.geometry);
                if (b) {
                    const isLg = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
                    const isMd = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
                    let padding;
                    if (isLg) {
                        padding = { top: 48, bottom: 112, left: 320, right: 24 };
                    } else if (isMd) {
                        padding = { top: 48, bottom: 112, left: 288, right: 24 };
                    } else {
                        padding = { top: 40, bottom: 120, left: 16, right: 16 };
                    }
                    mapRef.current.fitBounds(b, {
                        padding,
                        maxZoom: 14,
                        duration: 600,
                    });
                    setMapZoom(mapRef.current.getZoom());
                    return;
                }
            }
            const withCenter = fieldsList.find((f) => f.center_point);
            if (withCenter && center[0] === 40.0) {
                const la = withCenter.center_point.latitude;
                const lo = withCenter.center_point.longitude;
                setCenter([la, lo]);
                setZoom(12);
                mapRef.current.flyTo({ center: [lo, la], zoom: 12 });
                setMapZoom(12);
            }
        }
    }, [fieldsList, isLoading, selectedField, center, mapReady]);

    useEffect(() => {
        const map = mapRef.current;
        if (!mapReady || !map?.loaded?.()) return;

        const onClick = (e) => {
            // In draw mode, map clicks must add vertices — not select fields underneath.
            if (mode === "draw" && !showCreationModal) {
                handleMapClick({
                    lngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat },
                });
                return;
            }
            const fieldFeats = map.queryRenderedFeatures(e.point, { layers: [FIELDS_FILL] });
            if (fieldFeats.length) {
                const id = fieldFeats[0].properties?.id;
                const field = fieldsList.find((f) => f.id === id);
                if (field) handleFieldSelect(field);
            }
        };

        const onMove = (e) => {
            if (mode === "draw" && !showCreationModal) {
                map.getCanvas().style.cursor = "crosshair";
                return;
            }
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
        setEvidenceRefreshKey((k) => k + 1);
    }, [refetch]);

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

    const parcelMinZoom = mapConfig?.layers?.parcels?.minzoom ?? 11;

    const toggleRasterLayer = (layerId, key) => {
        const map = mapRef.current;
        if (!map?.loaded?.() || !map.getLayer(layerId)) return;
        const vis = map.getLayoutProperty(layerId, "visibility");
        const next = vis === "visible" ? "none" : "visible";
        map.setLayoutProperty(layerId, "visibility", next);
        setLayerToggle((prev) => ({ ...prev, [key]: next === "visible" }));
    };

    const layerControlBtn =
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2";

    return (
        <div className="flex h-screen bg-gray-50 relative">
            <div className="hidden md:block md:w-72 lg:w-80 absolute left-0 top-0 h-full z-[1000] border-r border-slate-200/80 bg-white shadow-md">
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
                    canFinishDrawing={drawingPoints.length >= 3}
                    onUploadShapefile={() => setShowShapefileModal(true)}
                    onSoilTestLinked={handleSoilTestLinked}
                />
            </div>

            <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col md:ml-72 lg:ml-80">
                {selectedField && mode === "view" && selectedFieldMerged && (
                    <FieldWorkbenchPanel
                        field={selectedFieldMerged}
                        story={{
                            loading: fieldStory.loading,
                            error: fieldStory.error,
                            refetch: fieldStory.refetch,
                            summary: fieldStory.summary,
                            latest: fieldStory.latest,
                            timeline: fieldStory.timeline,
                            events: fieldStory.events,
                            counts: fieldStory.counts,
                        }}
                    />
                )}

                <div className="relative flex min-h-0 flex-1 flex-col">
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
                        <SheetContent side="left" className="w-72 p-0 z-[1001]">
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
                                canFinishDrawing={drawingPoints.length >= 3}
                                onUploadShapefile={() => {
                                    setShowShapefileModal(true);
                                    setIsMobileSidebarOpen(false);
                                }}
                                onSoilTestLinked={handleSoilTestLinked}
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
                    className="z-0 min-h-0 w-full flex-1 bg-slate-950"
                    style={{ width: "100%", minHeight: "min(100vh, 100%)" }}
                />

                {mapReady && mapInstance && (
                    <div className="pointer-events-none absolute right-4 top-4 z-[900] max-w-[min(100vw-2rem,16rem)] md:right-4 md:top-4">
                        <div
                            className="pointer-events-auto max-h-[min(420px,calc(100vh-7rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-lg shadow-slate-900/15 backdrop-blur-md"
                            role="group"
                            aria-label="Map overlays"
                        >
                            <div className="border-b border-slate-100 bg-slate-50/90 px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Layers
                                    </span>
                                </div>
                                <p className="mt-1 text-[10px] leading-snug text-slate-500">
                                    Satellite imagery is the base map. Optional overlays below.
                                </p>
                            </div>
                            <div className="flex flex-col gap-0.5 p-1.5">
                                <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="layers-ssurgo"
                                                checked={showSSURGO}
                                                onChange={(e) => handleSSURGOToggle(e.target.checked)}
                                                className="rounded border-gray-300"
                                                disabled={ssurgoLoading}
                                                aria-label="SSURGO soil types overlay"
                                            />
                                            <label
                                                htmlFor="layers-ssurgo"
                                                className="cursor-pointer text-xs text-slate-800"
                                                title="USDA soil-series polygons (reference overlay)"
                                            >
                                                SSURGO soil types
                                            </label>
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 border-amber-200 bg-amber-50 text-[10px] text-amber-800"
                                            >
                                                Demo
                                            </Badge>
                                        </div>
                                        {ssurgoLoading && (
                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" />
                                        )}
                                    </div>
                                    <p className="mt-1 text-[10px] leading-snug text-slate-500">
                                        Reference only — not a substitute for uploaded soil test evidence.
                                    </p>
                                </div>
                                <p
                                    className="rounded-lg px-2.5 py-2 text-[11px] leading-snug text-slate-500"
                                    role="note"
                                >
                                    NDVI (vegetation index): not available yet — coming later.
                                </p>
                                <button
                                    type="button"
                                    className={`${layerControlBtn} ${
                                        layerToggle.parcels
                                            ? "bg-amber-800 text-white shadow-sm"
                                            : "bg-slate-100/80 text-slate-800 hover:bg-slate-200/90"
                                    }`}
                                    onClick={() => toggleRasterLayer(PARCELS_LAYER, "parcels")}
                                >
                                    <MapPinned className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                    <span>Parcels</span>
                                </button>
                            </div>
                            {layerToggle.parcels &&
                                mapZoom > 0 &&
                                mapZoom < parcelMinZoom &&
                                mapConfig?.layers?.parcels?.tiles?.length > 0 && (
                                    <p className="border-t border-slate-100 px-3 py-2 text-[11px] leading-snug text-slate-500">
                                        Zoom in for clearer parcel lines (current maps often sharpen
                                        above zoom {parcelMinZoom}).
                                    </p>
                                )}
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
                </div>
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
                title="Fields"
                message="The field workbench is available for full accounts. Create an account to get access."
            />
        );
    }
    return <FieldVisualizationContent />;
}
