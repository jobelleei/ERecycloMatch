import * as Location from "expo-location";

/*
 * Address search and pin-to-address that work on every Android phone.
 *
 * The phone's built-in geocoder (Location.geocodeAsync) depends on the phone
 * brand and Google services; on some phones it throws or finds nothing. When
 * that happens, these helpers ask free online services instead:
 * - Search: Photon (komoot), then Nominatim (OpenStreetMap)
 * - Pin to address: Nominatim
 * Both are free and need no API key.
 *
 * They return the same shapes as expo-location, so screens can swap them in.
 */

type Coordinates = { latitude: number; longitude: number };

export type GeocodedAddress = {
  name: string | null;
  street: string | null;
  streetNumber: string | null;
  district: string | null;
  subregion: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
};

// Results are biased toward Bacolod / Negros Occidental
const BIAS = { latitude: 10.6765, longitude: 122.9509 };

const HEADERS = {
  "User-Agent": "ERecycloMatch/1.0 (school project)",
  "Accept-Language": "en",
};

const fetchJson = async (url: string, timeoutMs = 8000): Promise<any> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const searchPhoton = async (query: string): Promise<Coordinates[]> => {
  const url =
    "https://photon.komoot.io/api/?limit=1" +
    `&lat=${BIAS.latitude}&lon=${BIAS.longitude}` +
    `&q=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const feature = data?.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords)) return [];
  return [{ latitude: Number(coords[1]), longitude: Number(coords[0]) }];
};

const searchNominatim = async (query: string): Promise<Coordinates[]> => {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph" +
    `&q=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const first = Array.isArray(data) ? data[0] : null;
  if (!first) return [];
  return [{ latitude: Number(first.lat), longitude: Number(first.lon) }];
};

const isValid = (c: Coordinates) =>
  Number.isFinite(c.latitude) && Number.isFinite(c.longitude);

// Drop-in replacement for Location.geocodeAsync
export async function geocodeAddress(query: string): Promise<Coordinates[]> {
  const text = String(query || "").trim();
  if (!text) return [];

  // 1. The phone's own geocoder
  try {
    const results = await Location.geocodeAsync(text);
    const valid = (results || []).filter(isValid);
    if (valid.length > 0) return valid;
  } catch (error) {
    console.log("PHONE GEOCODER FAILED, USING ONLINE SEARCH:", error);
  }

  // 2. Online services: the full text first, then just the first part
  //    (e.g. "SM City Bacolod" from "SM City Bacolod, Barangay 1, Bacolod, ...")
  const firstPart = text.split(",")[0].trim();
  const attempts = firstPart && firstPart !== text ? [text, firstPart] : [text];

  for (const attempt of attempts) {
    for (const search of [searchPhoton, searchNominatim]) {
      try {
        const results = (await search(attempt)).filter(isValid);
        if (results.length > 0) return results;
      } catch (error) {
        console.log("ONLINE GEOCODER FAILED:", error);
      }
    }
  }

  return [];
}

const reverseNominatim = async ({
  latitude,
  longitude,
}: Coordinates): Promise<GeocodedAddress[]> => {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1" +
    `&lat=${latitude}&lon=${longitude}`;
  const data = await fetchJson(url);
  const a = data?.address;
  if (!a) return [];

  return [
    {
      name: a.amenity || a.shop || a.building || a.office || null,
      street: a.road || null,
      streetNumber: a.house_number || null,
      district: a.suburb || a.quarter || a.neighbourhood || a.village || null,
      subregion: a.city || a.town || a.municipality || null,
      city: a.city || a.town || a.municipality || null,
      region: a.state || a.region || null,
      postalCode: a.postcode || null,
      country: a.country || null,
    },
  ];
};

// Drop-in replacement for Location.reverseGeocodeAsync
export async function reverseGeocode(
  coords: Coordinates,
): Promise<GeocodedAddress[]> {
  // 1. The phone's own geocoder
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    if (results && results.length > 0) {
      return results as unknown as GeocodedAddress[];
    }
  } catch (error) {
    console.log("PHONE REVERSE GEOCODER FAILED, USING ONLINE LOOKUP:", error);
  }

  // 2. Nominatim
  try {
    return await reverseNominatim(coords);
  } catch (error) {
    console.log("ONLINE REVERSE GEOCODER FAILED:", error);
    return [];
  }
}
