/*
 * Road route between two points, for the map's "Go to this Facility" button.
 *
 * Tries, in order:
 * 1. OpenRouteService (the project's API key)
 * 2. OSRM public server (free, no key)
 * 3. A straight line, so the map always shows something
 */

export type Coord = { latitude: number; longitude: number };

export type RouteResult = {
  coordinates: Coord[];
  // Road distance in km (straight-line distance for the last fallback)
  distanceKm: number;
  source: "openrouteservice" | "osrm" | "straight";
};

const ORS_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjI3ZjcxZTNkNDM1YzQxN2U4ZjNkNjgyNTA3YmJiZDk5IiwiaCI6Im11cm11cjY0In0=";

const fetchJson = async (
  url: string,
  init: RequestInit = {},
  timeoutMs = 10000,
): Promise<any> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const toCoords = (lngLat: number[][]): Coord[] =>
  lngLat.map((p) => ({ latitude: p[1], longitude: p[0] }));

const fromOpenRouteService = async (
  origin: Coord,
  destination: Coord,
): Promise<RouteResult | null> => {
  const data = await fetchJson(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [origin.longitude, origin.latitude],
          [destination.longitude, destination.latitude],
        ],
      }),
    },
  );

  const feature = data?.features?.[0];
  const line = feature?.geometry?.coordinates;
  if (!Array.isArray(line) || line.length < 2) return null;

  return {
    coordinates: toCoords(line),
    distanceKm: Number(feature?.properties?.summary?.distance || 0) / 1000,
    source: "openrouteservice",
  };
};

const fromOsrm = async (
  origin: Coord,
  destination: Coord,
): Promise<RouteResult | null> => {
  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
    "?overview=full&geometries=geojson";
  const data = await fetchJson(url);

  const route = data?.routes?.[0];
  const line = route?.geometry?.coordinates;
  if (!Array.isArray(line) || line.length < 2) return null;

  return {
    coordinates: toCoords(line),
    distanceKm: Number(route?.distance || 0) / 1000,
    source: "osrm",
  };
};

const straightLineKm = (a: Coord, b: Coord) => {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export async function getRoadRoute(
  origin: Coord,
  destination: Coord,
): Promise<RouteResult> {
  for (const provider of [fromOpenRouteService, fromOsrm]) {
    try {
      const result = await provider(origin, destination);
      if (result) return result;
    } catch (error) {
      console.log("ROUTE PROVIDER FAILED:", error);
    }
  }

  return {
    coordinates: [origin, destination],
    distanceKm: straightLineKm(origin, destination),
    source: "straight",
  };
}
