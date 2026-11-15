export type MapPoint = { lat: number; lng: number };

export function distanceKm(from: MapPoint, to: MapPoint): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return "About as far as the map goes";
  if (km < 1) return `About ${Math.max(1, Math.round(km * 1000))} m`;
  if (km < 10) return `About ${km.toFixed(1)} km`;
  return `About ${Math.round(km).toLocaleString("en-AU")} km`;
}

export const LOCATION_OFF = "Location stayed off, so the list stays as it is.";

export function askBrowserLocation(): Promise<MapPoint | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  });
}
