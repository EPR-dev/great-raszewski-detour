import { useEffect, useMemo, useRef, useState } from "react";
import type { Place, StatusFilter } from "../types";
import { distanceKm, formatDistance, type MapPoint } from "../lib/distance";
import { matchesPlaceName, matchesStatus, matchesType } from "../lib/places";
import { regionLabel } from "../lib/regions";
import { CategoryMark } from "./CategoryLegend";
import { EmptyBeen, EmptyCopy } from "./EmptyState";

export function PlaceList({
  places,
  filter,
  typeFilter,
  query,
  selectedId,
  onSelect,
  onMemory,
  origin,
  closest,
  locationNote,
  onClosest,
}: {
  places: Place[];
  filter: StatusFilter;
  typeFilter: string | null;
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMemory: (id: string, memory: string | null) => void;
  origin: MapPoint | null;
  closest: boolean;
  locationNote: string | null;
  onClosest: () => void;
}) {
  const filtered = useMemo(() => {
    return places
      .filter((place) => matchesStatus(place, filter))
      .filter((place) => matchesType(place, typeFilter))
      .filter((place) => matchesPlaceName(place, query))
      .slice()
      .sort((a, b) => {
        if (closest && origin) return distanceKm(origin, a) - distanceKm(origin, b);
        if (a.isStarter && b.isStarter) return a.id.localeCompare(b.id);
        if (a.isStarter) return -1;
        if (b.isStarter) return 1;
        return a.name.localeCompare(b.name, "en");
      });
  }, [closest, filter, origin, places, query, typeFilter]);

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`place-row-${selectedId}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <div className="list-panel">
      <div className="closest-row">
        <button type="button" data-testid="closest" aria-pressed={closest} onClick={onClosest}>
          Closest to us
        </button>
        {locationNote ? (
          <p className="hint" data-testid="location-note">
            {locationNote}
          </p>
        ) : null}
      </div>
      {filtered.length === 0 ? (
        filter === "been" && !query && !typeFilter ? (
          <EmptyBeen />
        ) : (
          <EmptyCopy>
            {filter === "next" && !query && !typeFilter
              ? "Nothing is next up. Open a detour and tap Next up."
              : typeFilter
                ? `No ${typeFilter} detours in this view.`
                : query
                  ? "Nothing matches that. Try a shorter word, or add a detour."
                  : "The map is blank. Add a detour."}
          </EmptyCopy>
        )
      ) : (
        <ul className="place-list">
          {filtered.map((place) => (
            <li key={place.id} id={`place-row-${place.id}`}>
              <div className={place.id === selectedId ? "place-row is-selected" : "place-row"}>
                <button
                  type="button"
                  className="row-open"
                  aria-current={place.id === selectedId ? "true" : undefined}
                  onClick={() => onSelect(place.id)}
                >
                  <span
                    className={place.status === "been" ? "status-pin been" : "status-pin want"}
                    aria-hidden="true"
                  >
                    <CategoryMark category={place.category} />
                    {place.status === "been" ? <span className="status-tick">✓</span> : null}
                  </span>
                  <span className="row-copy">
                    <span className="row-name">
                      {place.name}
                      {place.nextUp ? <span className="next-pill">Next up</span> : null}
                    </span>
                    <span className="row-meta">
                      {regionLabel(place.region)}
                      {place.category ? ` · ${place.category}` : " · Detour"}
                      {place.isStarter ? "" : " · Added by the family"}
                    {origin ? ` · ${formatDistance(distanceKm(origin, place))}` : ""}
                    </span>
                  </span>
                </button>
                <RowMemory place={place} onMemory={onMemory} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RowMemory({
  place,
  onMemory,
}: {
  place: Place;
  onMemory: (id: string, memory: string | null) => void;
}) {
  const [value, setValue] = useState(place.visitMemory ?? "");
  const focused = useRef(false);
  const saved = place.visitMemory ?? "";

  useEffect(() => {
    if (!focused.current) setValue(saved);
  }, [place.id, saved]);

  function commit(next: string) {
    const trimmed = next.trim();
    if (trimmed === saved) return;
    onMemory(place.id, trimmed || null);
  }

  return (
    <label className="field row-memory">
      <span>Field notes from the back seat</span>
      <input
        value={value}
        maxLength={280}
        enterKeyHint="done"
        placeholder="One line from the drive"
        data-testid={`row-memory-${place.id}`}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          commit(next);
        }}
        onBlur={() => {
          focused.current = false;
          const trimmed = value.trim();
          setValue(trimmed);
          commit(trimmed);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}
