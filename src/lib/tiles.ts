const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function tileConfig(): { url: string; attribution: string } {
  const url = import.meta.env.VITE_TILE_URL?.trim();
  const attribution = import.meta.env.VITE_TILE_ATTRIBUTION?.trim();
  return {
    url: url || DEFAULT_TILE_URL,
    attribution: attribution || DEFAULT_ATTRIBUTION,
  };
}
