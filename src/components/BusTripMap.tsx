import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { GeoJsonFeatureCollection } from "../api/busApi";
import L from "leaflet";

type BusTripMapProps = {
    data: GeoJsonFeatureCollection | null;
    isTripLoading: boolean;
    overlay?: React.ReactNode;
};

// Custom icon for bus points (clickable marker)
const busPointIcon = L.divIcon({
    className: "bus-point-icon",
    iconSize: [14, 14],
});

function TripLayer({ data }: { data: GeoJsonFeatureCollection | null }) {
    const map = useMap();
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        if (!map) return;

        // lazily create the layer once and reuse it
        if (!geoJsonLayerRef.current) {
            geoJsonLayerRef.current = L.geoJSON(undefined, {
                // Use a proper marker for points so they stand out more
                pointToLayer: (_feature, latlng) =>
                    L.marker(latlng, {
                        icon: busPointIcon,
                    }),
                style: () => ({
                    weight: 3,
                }),
            }).addTo(map);
        }

        const layer = geoJsonLayerRef.current;
        layer.clearLayers();

        if (!data) return;

        layer.addData(data as any);

        // Attach a popup to each feature so clicking on a
        // point or line shows its main properties.
        layer.eachLayer((leafletLayer: any) => {
            const feature = leafletLayer.feature as any;
            const props = feature?.properties || {};

            const infoLines: string[] = [];
            const add = (label: string, key: string) => {
                const value = props[key];
                if (value !== undefined && value !== null && value !== "") {
                    infoLines.push(
                        `<strong>${label}:</strong> ${String(value)}`
                    );
                }
            };

            add("Vehicle", "VehicleRef");
            add("Line", "PublishedLineName");
            add("Direction", "DirectionRef");
            add("From", "OriginName");
            add("To", "DestinationName");
            add("Start", "StartTime");
            add("End", "EndTime");

            const html =
                infoLines.length > 0
                    ? infoLines.join("<br/>")
                    : "<em>No feature properties available</em>";

            leafletLayer.bindPopup(html);
        });

        const bounds = layer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [map, data]);

    // This component only manipulates the Leaflet layer, nothing to render
    return null;
}

export function BusTripMap({ data, isTripLoading, overlay }: BusTripMapProps) {
    const defaultCenter: [number, number] = [40.7128, -74.006];

    return (
        <div className="map-wrapper">
            <MapContainer
                center={defaultCenter}
                zoom={11}
                scrollWheelZoom={true}
                className="map-root"
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <TripLayer data={data} />
            </MapContainer>

            {overlay && <div className="overlay-panel">{overlay}</div>}

            {!data && !isTripLoading && (
                <div className="map-empty-overlay">
                    <p>Select a vehicle or line to view its trip.</p>
                </div>
            )}

            {isTripLoading && (
                <div className="map-loading-overlay">
                    <p>Loading trip data…</p>
                </div>
            )}
        </div>
    );
}
