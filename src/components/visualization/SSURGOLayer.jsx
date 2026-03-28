import React, { useState, useEffect, useCallback, useRef } from "react";
import maplibregl from "maplibre-gl";
import { getSsurgoData } from "@/api/functions";

const SSURGO_SOURCE = "ssurgo-soil";
const SSURGO_FILL = "ssurgo-soil-fill";
const SSURGO_LINE = "ssurgo-soil-line";

export default function SSURGOLayer({
    map,
    mapReady,
    selectedField,
    isVisible,
    onLegendUpdate,
    onLoadingUpdate,
}) {
    const [ssurgoData, setSsurgoData] = useState(null);
    const popupRef = useRef(null);

    const loadSsurgoData = useCallback(async () => {
        if (!selectedField || !selectedField.geometry || !isVisible) {
            setSsurgoData(null);
            onLegendUpdate({ legend: [], isDemo: false });
            return;
        }

        onLoadingUpdate(true);

        try {
            const response = await getSsurgoData({ geometry: selectedField.geometry });

            if (response.data?.success) {
                setSsurgoData(response.data.data);
                onLegendUpdate({
                    legend: response.data.legend || [],
                    isDemo: response.data.isDemo || false,
                });
            } else {
                throw new Error(response.data?.error || "Failed to load soil data");
            }
        } catch (err) {
            console.error("Error loading SSURGO data:", err);
            onLegendUpdate({ legend: [], isDemo: false });
            setSsurgoData(null);
        } finally {
            onLoadingUpdate(false);
        }
    }, [selectedField, isVisible, onLegendUpdate, onLoadingUpdate]);

    useEffect(() => {
        loadSsurgoData();
    }, [loadSsurgoData]);

    useEffect(() => {
        if (!map || !mapReady || !map.loaded()) return;

        const removePopup = () => {
            if (popupRef.current) {
                popupRef.current.remove();
                popupRef.current = null;
            }
        };

        const removeSsurgo = () => {
            removePopup();
            if (map.getLayer(SSURGO_LINE)) map.removeLayer(SSURGO_LINE);
            if (map.getLayer(SSURGO_FILL)) map.removeLayer(SSURGO_FILL);
            if (map.getSource(SSURGO_SOURCE)) map.removeSource(SSURGO_SOURCE);
        };

        if (!isVisible || !ssurgoData?.features?.length) {
            removeSsurgo();
            return;
        }

        const fc = {
            type: "FeatureCollection",
            features: ssurgoData.features,
        };

        const onClick = (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const p = f.properties || {};
            removePopup();
            const html = `
              <div class="p-2">
                <h3 class="font-semibold text-sm">${p.MUNAME ?? ""}</h3>
                <div class="text-xs text-gray-600 mt-1">
                  <p><strong>Symbol:</strong> ${p.MUSYM ?? ""}</p>
                  <p><strong>Acres:</strong> ${Math.round((p.MUACRES ?? 0) * 10) / 10}</p>
                  <p><strong>Drainage:</strong> ${p.drainageClass ?? ""}</p>
                  <p><strong>Classification:</strong> ${p.farmlandClass ?? ""}</p>
                </div>
              </div>`;
            popupRef.current = new maplibregl.Popup({ closeButton: true })
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        };

        const onEnter = () => {
            map.getCanvas().style.cursor = "pointer";
        };
        const onLeave = () => {
            map.getCanvas().style.cursor = "";
        };

        map.addSource(SSURGO_SOURCE, { type: "geojson", data: fc });
        map.addLayer({
            id: SSURGO_FILL,
            type: "fill",
            source: SSURGO_SOURCE,
            paint: {
                "fill-color": ["get", "color"],
                "fill-opacity": 0.8,
            },
        });
        map.addLayer({
            id: SSURGO_LINE,
            type: "line",
            source: SSURGO_SOURCE,
            paint: {
                "line-color": "#ffffff",
                "line-width": 1.5,
                "line-opacity": 0.9,
            },
        });
        map.on("click", SSURGO_FILL, onClick);
        map.on("mouseenter", SSURGO_FILL, onEnter);
        map.on("mouseleave", SSURGO_FILL, onLeave);

        return () => {
            map.off("click", SSURGO_FILL, onClick);
            map.off("mouseenter", SSURGO_FILL, onEnter);
            map.off("mouseleave", SSURGO_FILL, onLeave);
            removeSsurgo();
        };
    }, [map, mapReady, isVisible, ssurgoData]);

    return null;
}
