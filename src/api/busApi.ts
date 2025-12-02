// src/api/busApi.ts

export type GeoJsonFeatureCollection = {
    type: "FeatureCollection";
    features: any[];
};

const BASE_URL =
    "https://nyc-bus-engine-k3q4yvzczq-an.a.run.app/api/bus_trip";

async function getJson<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            text || `Request failed: ${res.status} ${res.statusText}`
        );
    }
    return res.json() as Promise<T>;
}

export async function checkReady(): Promise<boolean> {
    const data = await getJson<{ status: string }>("/ready");
    return data.status === "Ready";
}

export async function getVehRefs(): Promise<string[]> {
    return getJson<string[]>("/getVehRef");
}

export async function getPubLineNames(): Promise<string[]> {
    return getJson<string[]>("/getPubLineName");
}

export async function getTripByVehRef(
    vehRef: string
): Promise<GeoJsonFeatureCollection> {
    return getJson<GeoJsonFeatureCollection>(
        `/getBusTripByVehRef/${encodeURIComponent(vehRef)}`
    );
}

export async function getTripByPubLineName(
    pubLineName: string
): Promise<GeoJsonFeatureCollection> {
    return getJson<GeoJsonFeatureCollection>(
        `/getBusTripByPubLineName/${encodeURIComponent(pubLineName)}`
    );
}
