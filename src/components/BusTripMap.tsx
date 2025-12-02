import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { GeoJsonFeatureCollection } from "../api/busApi";
import L from "leaflet";

type BusTripMapProps = {
    data: GeoJsonFeatureCollection | null;
    isTripLoading: boolean;
};

function TripLayer({ data }: { data: GeoJsonFeatureCollection | null }) {
    const map = useMap();
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

    useEffect(() => {
        if (!map) return;

        // lazily create the layer once and reuse it
        if (!geoJsonLayerRef.current) {
            geoJsonLayerRef.current = L.geoJSON(undefined, {
                pointToLayer: (_feature, latlng) =>
                    L.circleMarker(latlng, {
                        radius: 4,
                        weight: 1,
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

        const bounds = layer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [map, data]);

    // This component only manipulates the Leaflet layer, nothing to render
    return null;
}

export function BusTripMap({ data, isTripLoading }: BusTripMapProps) {
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
