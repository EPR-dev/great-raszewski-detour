import type { Place } from "../types";
import { regionFromStateName } from "./regions";

export type SearchMode = "autocomplete" | "submit" | "off";

export type SearchHit = {
  name: string;
  label: string;
  lat: number;
  lng: number;
  region: string;
};

const DEFAULT_URL = "https://photon.komoot.io/api/";
const cache = new Map<string, SearchHit[]>();

export function geocodeConfig(): { url: string | null; mode: SearchMode } {
  const raw = import.meta.env.VITE_GEOCODE_URL?.trim();
  if (raw === "off") return { url: null, mode: "off" };
  const url = raw || DEFAULT_URL;
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return { url: null, mode: "off" };
  }
  if (host === "nominatim.openstreetmap.org") {
    return { url, mode: "submit" };
  }
  return { url, mode: "autocomplete" };
}

export async function searchPlaces(query: string, signal: AbortSignal): Promise<SearchHit[]> {
  const config = geocodeConfig();
  if (!config.url) return [];
  const key = `${config.mode}|${query.trim().toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const hits =
    config.mode === "submit" && isNominatim(config.url)
      ? await searchNominatim(config.url, query, signal)
      : await searchPhoton(config.url, query, signal);
  cache.set(key, hits);
  return hits;
}

function isNominatim(url: string): boolean {
  try {
    return new URL(url).hostname === "nominatim.openstreetmap.org";
  } catch {
    return false;
  }
}

async function searchPhoton(base: string, query: string, signal: AbortSignal): Promise<SearchHit[]> {
  const url = new URL(base);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", "-25.5");
  url.searchParams.set("lon", "134");
  url.searchParams.set("bbox", "112,-44.2,154,-10.2");
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Search did not answer");
  const body = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        name?: string;
        street?: string;
        city?: string;
        locality?: string;
        county?: string;
        state?: string;
        country?: string;
      };
    }>;
  };
  const hits: SearchHit[] = [];
  for (const feature of body.features ?? []) {
    const coords = feature.geometry?.coordinates;
    const props = feature.properties ?? {};
    if (!coords || (props.country && props.country !== "Australia")) continue;
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const name = props.name || props.street || "Unnamed place";
    const place = props.city || props.locality || props.county;
    const label = [name, place, props.state].filter(Boolean).join(", ");
    hits.push({
      name,
      label,
      lat,
      lng,
      region: regionFromStateName(props.state, lat, lng),
    });
  }
  return dedupe(hits);
}

async function searchNominatim(
  base: string,
  query: string,
  signal: AbortSignal,
): Promise<SearchHit[]> {
  const url = new URL(base.includes("/search") ? base : `${base.replace(/\/$/, "")}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "au");
  url.searchParams.set("addressdetails", "1");
  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Search did not answer");
  const body = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
    name?: string;
    address?: { state?: string; country_code?: string };
  }>;
  const hits: SearchHit[] = [];
  for (const row of body) {
    if (row.address?.country_code && row.address.country_code !== "au") continue;
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const name = row.name || row.display_name?.split(",")[0] || "Unnamed place";
    hits.push({
      name,
      label: row.display_name || name,
      lat,
      lng,
      region: regionFromStateName(row.address?.state, lat, lng),
    });
  }
  return dedupe(hits);
}

/** Directory hits that are already a pin on the map stay out of the new-place list. */
export function isAlreadyOnTheMap(
  hit: Pick<SearchHit, "name" | "lat" | "lng">,
  places: Array<Pick<Place, "name" | "lat" | "lng">>,
): boolean {
  const hitName = hit.name.trim().toLowerCase();
  return places.some((place) => {
    const placeName = place.name.trim().toLowerCase();
    const sameName = placeName === hitName || placeName.includes(hitName) || hitName.includes(placeName);
    if (!sameName) return false;
    const dLat = (place.lat - hit.lat) * 111;
    const dLng = (place.lng - hit.lng) * 111 * Math.cos((place.lat * Math.PI) / 180);
    return dLat * dLat + dLng * dLng <= 4;
  });
}

function dedupe(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const unique: SearchHit[] = [];
  for (const hit of hits) {
    const key = `${hit.name}|${hit.lat.toFixed(3)}|${hit.lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hit);
  }
  return unique;
}

export function messageOf(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Something went sideways.";
}
