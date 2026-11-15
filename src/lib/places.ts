import starters from "../data/starters.json";
import type { Place, Starter } from "../types";

export const STARTERS = starters as Starter[];

const SEEDED_AT = "2026-01-01T00:00:00.000Z";

export function starterToPlace(starter: Starter): Place {
  return {
    id: starter.id,
    name: starter.name,
    lat: starter.lat,
    lng: starter.lng,
    region: starter.region,
    category: starter.category,
    note: starter.note,
    status: "want",
    nextUp: false,
    visitDate: null,
    visitMemory: null,
    isStarter: true,
    sourceUrl: starter.sourceUrl,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  };
}

export function seedPlaces(): Place[] {
  return STARTERS.map(starterToPlace);
}

export function matchesStatus(place: Pick<Place, "status" | "nextUp">, filter: "all" | "next" | "been"): boolean {
  if (filter === "been") return place.status === "been";
  if (filter === "next") return place.nextUp;
  return true;
}

export function matchesType(place: Pick<Place, "category">, type: string | null): boolean {
  if (!type) return true;
  return place.category === type;
}

export function matchesPlaceName(place: Pick<Place, "name">, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return place.name.toLowerCase().includes(q);
}

const GENERIC_WORDS = new Set([
  "and",
  "base",
  "bay",
  "beach",
  "falls",
  "island",
  "lake",
  "mount",
  "national",
  "of",
  "park",
  "pie",
  "point",
  "shop",
  "the",
  "walk",
]);

/** Starters that match the typed name come first, then other places already on the map. */
export function placesMatchingQuery(places: Place[], query: string): Place[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return places
    .filter((place) => place.name.toLowerCase().includes(q))
    .sort((a, b) => placeMatchScore(b, q) - placeMatchScore(a, q) || a.name.localeCompare(b.name, "en"))
    .slice(0, 4);
}

function placeMatchScore(place: Place, q: string): number {
  const name = place.name.toLowerCase();
  let score = place.isStarter ? 100 : 0;
  if (name === q) score += 40;
  else if (name.startsWith(q)) score += 25;
  if (name.split(/[^a-z0-9]+/).some((word) => word.startsWith(q))) score += 15;
  return score;
}

/** "Robertson Pie Shop" searched as Robertson reads "Robertson NSW". */
export function knownPlaceLine(name: string, region: string, query: string): string {
  const q = query.trim().toLowerCase();
  const words = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const matched = words.find((word) => word.toLowerCase().startsWith(q));
  const distinctive =
    matched && !GENERIC_WORDS.has(matched.toLowerCase())
      ? matched
      : words.find((word) => !GENERIC_WORDS.has(word.toLowerCase()));
  return distinctive ? `${distinctive} ${region}` : region;
}

/** Refresh catalogue fields on starters that are still on the map. Visits, memories, and removed places stay as they are. */
export function refreshStarterCatalogue(places: Place[]): Place[] {
  const byId = new Map(STARTERS.map((starter) => [starter.id, starter]));
  let changed = false;
  const next = places.map((place) => {
    if (!place?.isStarter) return place;
    const starter = byId.get(place.id);
    if (!starter) return place;
    const same =
      place.name === starter.name &&
      place.lat === starter.lat &&
      place.lng === starter.lng &&
      place.region === starter.region &&
      place.category === starter.category &&
      place.note === starter.note &&
      place.sourceUrl === starter.sourceUrl;
    if (same) return place;
    changed = true;
    return {
      ...place,
      name: starter.name,
      lat: starter.lat,
      lng: starter.lng,
      region: starter.region,
      category: starter.category,
      note: starter.note,
      sourceUrl: starter.sourceUrl,
    };
  });
  return changed ? next : places;
}

export function newCustomPlace(input: {
  name: string;
  lat: number;
  lng: number;
  region: string;
  category: string | null;
  note: string | null;
}): Place {
  const now = new Date().toISOString();
  return {
    id: `custom-${crypto.randomUUID()}`,
    name: input.name.trim(),
    lat: input.lat,
    lng: input.lng,
    region: input.region,
    category: input.category,
    note: input.note,
    status: "want",
    nextUp: false,
    visitDate: null,
    visitMemory: null,
    isStarter: false,
    sourceUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}
