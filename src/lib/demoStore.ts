import { refreshStarterCatalogue, seedPlaces } from "./places";
import type { Place } from "../types";

const PLACES_KEY = "grd.places.v1";
const SEEDED_KEY = "grd.seeded.v1";

export function loadDemoPlaces(): Place[] {
  const alreadySeeded = localStorage.getItem(SEEDED_KEY) === "1";
  const raw = localStorage.getItem(PLACES_KEY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const refreshed = normalizeNext(refreshStarterCatalogue(parsed as Place[]));
        localStorage.setItem(SEEDED_KEY, "1");
        if (refreshed !== parsed) {
          localStorage.setItem(PLACES_KEY, JSON.stringify(refreshed));
        }
        return refreshed;
      }
    } catch {
      // A broken save should not silently recreate removed starters.
    }
  }
  if (alreadySeeded) return [];
  const seeded = seedPlaces();
  localStorage.setItem(PLACES_KEY, JSON.stringify(seeded));
  localStorage.setItem(SEEDED_KEY, "1");
  return seeded;
}

function normalizeNext(places: Place[]): Place[] {
  let changed = false;
  const next = places.map((place) => {
    if (typeof place.nextUp === "boolean") return place;
    changed = true;
    return { ...place, nextUp: false };
  });
  return changed ? next : places;
}

export function saveDemoPlaces(places: Place[]): void {
  localStorage.setItem(PLACES_KEY, JSON.stringify(places));
  localStorage.setItem(SEEDED_KEY, "1");
}
