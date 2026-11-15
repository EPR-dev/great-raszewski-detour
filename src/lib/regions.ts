const STATE_NAMES: Record<string, string> = {
  "new south wales": "NSW",
  victoria: "VIC",
  queensland: "QLD",
  "south australia": "SA",
  "western australia": "WA",
  tasmania: "TAS",
  "northern territory": "NT",
  "australian capital territory": "ACT",
  "jervis bay territory": "JBT",
  "jervis bay": "JBT",
};

export function regionLabel(code: string): string {
  if (code === "JBT") return "Jervis Bay";
  return code;
}

/** Best-effort label for a pin dropped by hand. Seed places carry their own region. */
export function regionFromPoint(lat: number, lng: number): string {
  if (lat < -40.6 && lng > 143.5 && lng < 149.2) return "TAS";
  if (lat <= -39.4 && lat >= -40.3 && lng >= 143.6 && lng <= 144.3) return "TAS";
  if (lat <= -35.11 && lat >= -35.18 && lng >= 150.72 && lng <= 150.84) return "JBT";
  if (lat <= -35.12 && lat >= -35.95 && lng >= 148.75 && lng <= 149.45) return "ACT";
  if (lng < 129.05) return "WA";
  if (lat > -25.95 && lng >= 129.05 && lng < 138.05) return "NT";
  if (lng < 140.97 && lat <= -25.95) return "SA";
  if (lat > -28.15 && lng >= 153.05) return "QLD";
  if (lat > -29.02 && lng >= 140.97 && lng < 153.05) return "QLD";
  if (lat < -36.15 && lat > -39.7 && lng >= 140.97 && lng < 150.15) return "VIC";
  if (lng >= 140.97) return "NSW";
  return "Australia";
}

export function regionFromStateName(
  state: string | undefined,
  lat: number,
  lng: number,
): string {
  if (state) {
    const hit = STATE_NAMES[state.trim().toLowerCase()];
    if (hit) return hit;
  }
  return regionFromPoint(lat, lng);
}

export function isOnTheMap(lat: number, lng: number): boolean {
  return lat <= -10.2 && lat >= -44.2 && lng >= 112.2 && lng <= 154.2;
}
