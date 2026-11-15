import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { LatLng, Place } from "../types";
import { categoryClass, categorySvg } from "../lib/categories";
import { flySeconds } from "../lib/motion";
import { tileConfig } from "../lib/tiles";

type DetourMarkerOptions = L.MarkerOptions & { detourStatus?: Place["status"] };

const AUSTRALIA: L.LatLngBoundsExpression = [
  [-44.0, 112.8],
  [-10.2, 154.0],
];

function placeIcon(place: Place, selected: boolean): L.DivIcon {
  const been = place.status === "been";
  const cat = categoryClass(place.category);
  const glyph = categorySvg(place.category);
  const selectedClass = selected ? " is-selected" : "";
  const flag = place.nextUp ? `<span class="next-flag">Next</span>` : "";
  const pin = been
    ? `<div class="pin pin-been ${cat}${selectedClass}" data-category="${place.category ?? ""}">${glyph}<span class="pin-tick">✓</span></div>`
    : `<div class="pin pin-want ${cat}${selectedClass}" data-category="${place.category ?? ""}"><span class="pin-glyph">${glyph}</span></div>`;
  return L.divIcon({
    className: "pin-wrap",
    html: `<div class="pin-stack${place.nextUp ? " is-next" : ""}" data-next="${place.nextUp ? "1" : "0"}">${pin}${flag}</div>`,
    iconSize: been ? [52, 52] : [52, 58],
    iconAnchor: been ? [26, 26] : [26, 52],
    tooltipAnchor: [0, been ? -28 : -48],
  });
}

function draftIcon(): L.DivIcon {
  return L.divIcon({
    className: "pin-wrap",
    html: `<div class="pin pin-draft"><span>+</span></div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 48],
  });
}

function FitAustralia() {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    map.fitBounds(AUSTRALIA, { padding: [18, 18] });
  }, [map]);
  return null;
}

function RobertsonFly({ token }: { token: number }) {
  const map = useMap();
  const seen = useRef(0);
  useEffect(() => {
    if (token === 0 || token === seen.current) return;
    seen.current = token;
    map.flyTo([-34.62, 150.52], 10, { duration: flySeconds(1.15) });
  }, [map, token]);
  return null;
}

function FocusPoint({ token, point }: { token: number; point: LatLng | null }) {
  const map = useMap();
  const seen = useRef(0);
  useEffect(() => {
    if (!point || token === 0 || token === seen.current) return;
    seen.current = token;
    map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 11), { duration: flySeconds(0.8) });
  }, [map, point, token]);
  return null;
}

function FocusPlace({ token, place }: { token: number; place: Place | null }) {
  const map = useMap();
  const seen = useRef(0);
  useEffect(() => {
    if (!place || token === 0 || token === seen.current) return;
    seen.current = token;
    const zoom = Math.max(map.getZoom(), 8);
    map.flyTo([place.lat, place.lng], zoom, { duration: flySeconds(0.8) });
  }, [map, place, token]);
  return null;
}

function MapClicks({
  armed,
  onPick,
}: {
  armed: boolean;
  onPick: (point: LatLng) => void;
}) {
  useMapEvents({
    click(event) {
      if (!armed) return;
      const target = event.originalEvent?.target;
      if (target instanceof Element && target.closest(".leaflet-marker-icon, .pin-cluster")) return;
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function DetourLayer({
  places,
  selectedId,
  draft,
  onSelect,
}: {
  places: Place[];
  selectedId: string | null;
  draft: LatLng | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 48,
      disableClusteringAtZoom: 11,
      spiderfyDistanceMultiplier: 1.4,
      iconCreateFunction(cluster) {
        const markers = cluster.getAllChildMarkers();
        let been = 0;
        let want = 0;
        for (const marker of markers) {
          const status = (marker.options as DetourMarkerOptions).detourStatus;
          if (status === "been") been += 1;
          else want += 1;
        }
        const tone = been === 0 ? "want" : want === 0 ? "been" : "mixed";
        return L.divIcon({
          className: `pin-cluster tone-${tone}`,
          html: `<span>${cluster.getChildCount()}</span>`,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });
      },
    });

    for (const place of places) {
      const selected = place.id === selectedId;
      const marker = L.marker([place.lat, place.lng], {
        icon: placeIcon(place, selected),
        title: `${place.name}${place.category ? ` · ${place.category}` : ""}${place.nextUp ? " · Next up" : ""}`,
        zIndexOffset: selected ? 600 : 0,
        detourStatus: place.status,
      } as DetourMarkerOptions);
      marker.on("click", () => onSelect(place.id));
      group.addLayer(marker);
    }

    map.addLayer(group);
    let draftMarker: L.Marker | null = null;
    if (draft) {
      draftMarker = L.marker([draft.lat, draft.lng], { icon: draftIcon(), zIndexOffset: 800 });
      map.addLayer(draftMarker);
    }
    return () => {
      map.removeLayer(group);
      if (draftMarker) map.removeLayer(draftMarker);
    };
  }, [draft, map, onSelect, places, selectedId]);

  return null;
}

export function MapView({
  places,
  selectedId,
  draft,
  draftFly,
  pickArmed,
  robertsonToken,
  focusToken,
  focusPlace,
  onSelect,
  onPick,
  onRobertson,
}: {
  places: Place[];
  selectedId: string | null;
  draft: LatLng | null;
  draftFly: number;
  pickArmed: boolean;
  robertsonToken: number;
  focusToken: number;
  focusPlace: Place | null;
  onSelect: (id: string) => void;
  onPick: (point: LatLng) => void;
  onRobertson: () => void;
}) {
  const tiles = tileConfig();
  return (
    <div className={`map-wrap${pickArmed ? " is-picking" : ""}`}>
      <MapContainer
        center={[-25.8, 133.8]}
        zoom={4}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        maxBounds={[
          [-48, 104],
          [-8, 164],
        ]}
        maxBoundsViscosity={0.65}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution={tiles.attribution}
          url={tiles.url}
          {...(tiles.url.includes("{s}") ? { subdomains: "abcd" } : {})}
        />
        <ZoomControl position="topleft" />
        <FitAustralia />
        <RobertsonFly token={robertsonToken} />
        <FocusPoint token={draftFly} point={draft} />
        <FocusPlace token={focusToken} place={focusPlace} />
        <MapClicks armed={pickArmed} onPick={onPick} />
        <DetourLayer places={places} selectedId={selectedId} draft={draft} onSelect={onSelect} />
      </MapContainer>
      <button type="button" className="robertson-chip" onClick={onRobertson}>
        Start from Robertson
      </button>
      {pickArmed ? <p className="pick-hint">Tap the map to drop a pin.</p> : null}
    </div>
  );
}
