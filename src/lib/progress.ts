import type { Place } from "../types";

/** The original challenge stays out of 100. Custom places never change this. */
export const ORIGINAL_GOAL = 100;

export function originalVisited(places: Place[]): number {
  return places.reduce(
    (count, place) => count + (place.isStarter && place.status === "been" ? 1 : 0),
    0,
  );
}
